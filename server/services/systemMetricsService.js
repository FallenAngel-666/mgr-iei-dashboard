/**
 * IEI MGR Student Chapter — Real-Time System Telemetry & Load State Engine
 * Monitors CPU, RAM, Event Loop, DB Pool, and Traffic Rates
 */

import os from 'os';
import { TRAFFIC_CONFIG } from '../config/trafficConfig.js';
import { dbService } from './dbService.js';
import { redisService } from './redisService.js';

class SystemMetricsService {
  constructor() {
    this.prevCpuTimes = this.getCpuTimes();
    this.currentCpuPercent = 0;
    this.requestsThisMinute = 0;
    this.rateLimitedThisMinute = 0;
    this.requestsLastMinute = 0;
    this.rateLimitedLastMinute = 0;
    this.recentLatenciesMs = [];
    this.activeHttpRequests = 0;
    this.activeSocketConnections = 0;
    this.admittedCount = 0;

    // Start background sampling interval (every 2 seconds)
    setInterval(() => this.sampleCpu(), 2000);

    // Roll per-minute counters
    setInterval(() => {
      this.requestsLastMinute = this.requestsThisMinute;
      this.rateLimitedLastMinute = this.rateLimitedThisMinute;
      this.requestsThisMinute = 0;
      this.rateLimitedThisMinute = 0;
      if (this.recentLatenciesMs.length > 500) {
        this.recentLatenciesMs = this.recentLatenciesMs.slice(-100);
      }
    }, 60000);
  }

  getCpuTimes() {
    const cpus = os.cpus();
    let user = 0;
    let nice = 0;
    let sys = 0;
    let idle = 0;
    let irq = 0;

    for (const cpu of cpus) {
      user += cpu.times.user;
      nice += cpu.times.nice;
      sys += cpu.times.sys;
      idle += cpu.times.idle;
      irq += cpu.times.irq;
    }

    const total = user + nice + sys + idle + irq;
    return { idle, total };
  }

  sampleCpu() {
    const current = this.getCpuTimes();
    const idleDiff = current.idle - this.prevCpuTimes.idle;
    const totalDiff = current.total - this.prevCpuTimes.total;

    if (totalDiff > 0) {
      const busyDiff = totalDiff - idleDiff;
      this.currentCpuPercent = Math.min(100, Math.max(0, Math.round((busyDiff / totalDiff) * 100)));
    }
    this.prevCpuTimes = current;
  }

  recordRequestStart() {
    this.activeHttpRequests++;
    this.requestsThisMinute++;
  }

  recordRequestEnd(durationMs) {
    this.activeHttpRequests = Math.max(0, this.activeHttpRequests - 1);
    this.recentLatenciesMs.push(durationMs);
    if (this.recentLatenciesMs.length > 200) {
      this.recentLatenciesMs.shift();
    }
  }

  recordRateLimitHit() {
    this.rateLimitedThisMinute++;
  }

  recordAdmission() {
    this.admittedCount++;
  }

  setSocketCount(count) {
    this.activeSocketConnections = count;
  }

  getAverageResponseTime() {
    if (this.recentLatenciesMs.length === 0) return 0;
    const sum = this.recentLatenciesMs.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.recentLatenciesMs.length);
  }

  getRamMetrics() {
    const totalBytes = os.totalmem();
    const freeBytes = os.freemem();
    const usedBytes = totalBytes - freeBytes;
    const percent = Math.round((usedBytes / totalBytes) * 100);
    const processMem = process.memoryUsage();

    return {
      systemUsedPercent: percent,
      totalMb: Math.round(totalBytes / (1024 * 1024)),
      usedMb: Math.round(usedBytes / (1024 * 1024)),
      freeMb: Math.round(freeBytes / (1024 * 1024)),
      processRssMb: Math.round(processMem.rss / (1024 * 1024)),
      heapUsedMb: Math.round(processMem.heapUsed / (1024 * 1024))
    };
  }

  /**
   * Determine overall system load state based on CPU, RAM, and DB Saturation
   */
  async evaluateLoadState(activeSessionsCount = 0, overrideMetrics = null) {
    const thresholds = TRAFFIC_CONFIG.waitingRoom.thresholds;
    const maxSessions = TRAFFIC_CONFIG.waitingRoom.maxActiveSessions;
    const ram = this.getRamMetrics();
    const dbMetrics = dbService.getPoolMetrics();

    const cpuVal = overrideMetrics?.cpuPercent !== undefined ? overrideMetrics.cpuPercent : this.currentCpuPercent;
    const ramVal = overrideMetrics?.ramPercent !== undefined ? overrideMetrics.ramPercent : ram.systemUsedPercent;
    const dbSatVal = overrideMetrics?.dbSaturation !== undefined ? overrideMetrics.dbSaturation : dbMetrics.saturationRatio;

    // Check emergency maintenance override
    if (TRAFFIC_CONFIG.waitingRoom.emergencyMaintenanceMode) {
      return {
        state: 'CRITICAL LOAD',
        reason: 'Emergency Maintenance Mode active',
        admitAllowed: false
      };
    }

    // Critical conditions
    if (
      cpuVal >= thresholds.cpuCriticalPercent ||
      ramVal >= thresholds.ramCriticalPercent ||
      dbSatVal >= thresholds.dbSaturationCritical ||
      (maxSessions > 0 && activeSessionsCount >= maxSessions * 1.2)
    ) {
      return {
        state: 'CRITICAL LOAD',
        reason: `Exceeded critical thresholds (CPU: ${cpuVal}%, RAM: ${ramVal}%, DB: ${(dbSatVal * 100).toFixed(0)}%)`,
        admitAllowed: false
      };
    }

    // High load conditions
    if (
      cpuVal >= thresholds.cpuHighPercent ||
      ramVal >= thresholds.ramHighPercent ||
      dbSatVal >= thresholds.dbSaturationHigh ||
      (maxSessions > 0 && activeSessionsCount >= maxSessions)
    ) {
      return {
        state: 'HIGH LOAD',
        reason: `High load active (Sessions: ${activeSessionsCount}/${maxSessions}, CPU: ${cpuVal}%, RAM: ${ramVal}%)`,
        admitAllowed: true
      };
    }

    // Warning conditions
    if (
      cpuVal >= thresholds.cpuWarningPercent ||
      ramVal >= thresholds.ramWarningPercent ||
      dbSatVal >= thresholds.dbSaturationWarning
    ) {
      return {
        state: 'WARNING',
        reason: 'Elevated traffic or resource utilization detected',
        admitAllowed: true
      };
    }

    return {
      state: 'NORMAL',
      reason: 'Optimal capacity headroom',
      admitAllowed: true
    };
  }

  /**
   * Complete telemetry snapshot for the Traffic Management Dashboard
   */
  async getSnapshot() {
    const activeSessions = await redisService.countActiveSessions();
    const queueLength = await redisService.getQueueLength('iei:queue:waitlist');
    const loadEvaluation = await this.evaluateLoadState(activeSessions);
    const dbMetrics = dbService.getPoolMetrics();
    const redisHealth = redisService.isHealthy();
    const ram = this.getRamMetrics();

    return {
      timestamp: new Date().toISOString(),
      loadState: loadEvaluation.state,
      loadReason: loadEvaluation.reason,
      activeSessions,
      maxActiveSessions: TRAFFIC_CONFIG.waitingRoom.maxActiveSessions,
      queuedVisitors: queueLength,
      concurrentRequests: this.activeHttpRequests,
      activeSocketConnections: this.activeSocketConnections,
      requestsPerMinute: this.requestsLastMinute || this.requestsThisMinute,
      rateLimitedPerMinute: this.rateLimitedLastMinute || this.rateLimitedThisMinute,
      averageResponseTimeMs: this.getAverageResponseTime(),
      totalAdmissions: this.admittedCount,
      waitingRoomEnabled: TRAFFIC_CONFIG.waitingRoom.enabled,
      emergencyMaintenanceMode: TRAFFIC_CONFIG.waitingRoom.emergencyMaintenanceMode,
      admissionBatchSize: TRAFFIC_CONFIG.waitingRoom.admissionBatchSize,
      officerReserveSlots: TRAFFIC_CONFIG.waitingRoom.officerCapacityReserve,
      cpu: {
        percent: this.currentCpuPercent,
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'VPS vCPU'
      },
      ram,
      database: dbMetrics,
      redis: redisHealth
    };
  }
}

export const systemMetrics = new SystemMetricsService();
