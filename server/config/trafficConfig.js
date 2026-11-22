/**
 * IEI MGR Student Chapter — Traffic Management & Rate Limiting Configuration
 * Production-tuned for Hostinger KVM 2 VPS (2 vCPU, 8 GB RAM, 100 GB NVMe)
 * Supporting ~1,500 Registered Chapter Members
 */

import crypto from 'crypto';

export const TRAFFIC_CONFIG = {
  // System identification & tokens
  appName: 'MGR IEI Student Chapter Traffic Engine',
  version: '2.0.0',
  tokenSecret: process.env.WAITING_ROOM_SECRET || process.env.APP_SECRET || crypto.randomBytes(32).toString('hex'),

  // Rate Limiting Policy (sliding rolling windows in seconds)
  rateLimits: {
    generalApi: {
      windowSec: 60,
      maxRequests: 120, // 120 req / user / minute
      ipMaxRequests: 60 // 60 req / IP / minute for unauthenticated
    },
    login: {
      windowSec: 900, // 15 minutes
      maxFailedAttempts: 5, // 5 failed attempts per account / 15m
      ipMaxFailedAttempts: 15,
      progressiveDelayBaseSec: 2,
      maxProgressiveDelaySec: 30
    },
    passwordReset: {
      windowSec: 3600, // 1 hour
      maxRequests: 3 // 3 requests per account / hour
    },
    fileUpload: {
      windowSec: 600, // 10 minutes
      maxUploads: 10,
      maxSizeBytes: 15 * 1024 * 1024, // 15 MB
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    },
    workSubmission: {
      windowSec: 3600, // 1 hour
      maxSubmissions: 30 // 30 submissions per user / hour
    },
    chatMessage: {
      windowSec: 60, // 1 minute
      maxMessages: 20, // 20 messages per user / minute
      burstMax: 2 // Max 2 messages in 1 second window
    },
    adminOperation: {
      windowSec: 60,
      maxRequests: 300 // Higher quota for legitimate admin telemetry
    }
  },

  // Virtual Waiting Room Policies
  waitingRoom: {
    enabled: true,
    emergencyMaintenanceMode: false,
    maxActiveSessions: 350, // Safe concurrency limit for 2 vCPU / 8 GB RAM
    officerCapacityReserve: 35, // 10% reserve for officers & staff
    admissionBatchSize: 20, // Admitted per interval
    admissionIntervalMs: 5000, // Every 5 seconds
    sessionTtlSeconds: 900, // 15 minutes of inactivity before queue re-entry
    heartbeatIntervalMs: 30000, // 30-second client heartbeat
    queueTimeoutSeconds: 1800, // 30 minutes max wait in queue
    thresholds: {
      cpuWarningPercent: 65,
      cpuHighPercent: 78,
      cpuCriticalPercent: 90,
      ramWarningPercent: 70,
      ramHighPercent: 82,
      ramCriticalPercent: 92,
      dbSaturationWarning: 0.65,
      dbSaturationHigh: 0.80,
      dbSaturationCritical: 0.95
    }
  },

  // WebSocket / Socket.IO Protections
  socketLimits: {
    maxTotalConnections: 800,
    maxPerUser: 3, // Multi-tab or mobile + desktop
    maxPerIp: 10,
    pingTimeoutMs: 20000,
    pingIntervalMs: 25000,
    messageRateLimit: {
      windowSec: 10,
      maxEvents: 10
    }
  },

  // MySQL Connection Pool Configuration
  dbPool: {
    connectionLimit: 50,
    queueLimit: 100,
    waitForConnections: true,
    queryTimeoutMs: 5000,
    idleTimeoutMs: 60000
  }
};
