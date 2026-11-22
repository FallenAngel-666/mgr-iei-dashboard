/**
 * IEI MGR Student Chapter — Enterprise FIFO Virtual Waiting Room Engine
 * Cryptographic Admission Tokens, Fair Queue Ordering & Session Lifecycle
 */

import crypto from 'crypto';
import { TRAFFIC_CONFIG } from '../config/trafficConfig.js';
import { redisService } from './redisService.js';
import { systemMetrics } from './systemMetricsService.js';

const QUEUE_KEY = 'iei:queue:waitlist';
const ADMITTED_SET_KEY = 'iei:queue:admissions';

class WaitingRoomService {
  constructor() {
    this.workerInterval = null;
    this.startAdmissionWorker();
  }

  hashIp(ip) {
    return crypto.createHash('sha256').update(ip || '0.0.0.0').digest('hex').substring(0, 16);
  }

  /**
   * Generate cryptographically signed admission token
   */
  generateAdmissionToken(sessionId, ip) {
    const now = Date.now();
    const expiresAt = now + (TRAFFIC_CONFIG.waitingRoom.sessionTtlSeconds * 1000);
    const payload = {
      sid: sessionId,
      iph: this.hashIp(ip),
      iat: now,
      exp: expiresAt,
      nonce: crypto.randomBytes(8).toString('hex')
    };

    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', TRAFFIC_CONFIG.tokenSecret)
      .update(payloadB64)
      .digest('base64url');

    return `iei_qtok_${payloadB64}.${signature}`;
  }

  /**
   * Validate cryptographically signed admission token
   */
  validateAdmissionToken(tokenString, clientIp) {
    if (!tokenString || !tokenString.startsWith('iei_qtok_')) {
      return { valid: false, reason: 'Malformed token structure' };
    }

    const parts = tokenString.substring(9).split('.');
    if (parts.length !== 2) {
      return { valid: false, reason: 'Invalid token format' };
    }

    const [payloadB64, signature] = parts;

    // Verify HMAC signature
    const expectedSig = crypto
      .createHmac('sha256', TRAFFIC_CONFIG.tokenSecret)
      .update(payloadB64)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return { valid: false, reason: 'Tampered token signature' };
    }

    try {
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
      const now = Date.now();

      if (now > payload.exp) {
        return { valid: false, reason: 'Admission token expired' };
      }

      // Check IP match
      const currentIpHash = this.hashIp(clientIp);
      if (payload.iph !== currentIpHash) {
        return { valid: false, reason: 'Token IP mismatch (anti-hijack enforcement)' };
      }

      return {
        valid: true,
        sessionId: payload.sid,
        expiresAt: payload.exp,
        admittedAt: payload.iat
      };
    } catch (e) {
      return { valid: false, reason: 'Invalid payload decoding' };
    }
  }

  /**
   * Join or query status in the FIFO waiting room
   */
  async joinQueue(visitorId, clientIp, userRole = 'GUEST') {
    const isOfficer = ['Administrator', 'Staff Coordinator', 'Chairman', 'Vice Chairman', 'Secretary', 'Joint Secretary'].includes(userRole);
    const activeSessions = await redisService.countActiveSessions();
    const loadEval = await systemMetrics.evaluateLoadState(activeSessions);

    // 1. If Waiting Room is disabled or system is NORMAL, admit immediately
    if (!TRAFFIC_CONFIG.waitingRoom.enabled || (loadEval.state === 'NORMAL' && activeSessions < TRAFFIC_CONFIG.waitingRoom.maxActiveSessions)) {
      const token = this.generateAdmissionToken(visitorId, clientIp);
      await redisService.registerActiveSession(visitorId, { role: userRole, ip: clientIp, isOfficer }, TRAFFIC_CONFIG.waitingRoom.sessionTtlSeconds);
      systemMetrics.recordAdmission();
      return {
        status: 'ADMITTED',
        queueRequired: false,
        token,
        loadState: loadEval.state
      };
    }

    // 2. Check Officer Capacity Reserve
    if (isOfficer && activeSessions < (TRAFFIC_CONFIG.waitingRoom.maxActiveSessions + TRAFFIC_CONFIG.waitingRoom.officerCapacityReserve)) {
      const token = this.generateAdmissionToken(visitorId, clientIp);
      await redisService.registerActiveSession(visitorId, { role: userRole, ip: clientIp, isOfficer: true }, TRAFFIC_CONFIG.waitingRoom.sessionTtlSeconds);
      systemMetrics.recordAdmission();
      return {
        status: 'ADMITTED',
        queueRequired: false,
        token,
        officerBypass: true,
        loadState: loadEval.state
      };
    }

    // 3. Check if already active
    const existingSession = await redisService.getActiveSession(visitorId);
    if (existingSession) {
      const token = this.generateAdmissionToken(visitorId, clientIp);
      await redisService.refreshActiveSession(visitorId, TRAFFIC_CONFIG.waitingRoom.sessionTtlSeconds);
      return {
        status: 'ADMITTED',
        queueRequired: false,
        token,
        loadState: loadEval.state
      };
    }

    // 4. Check if already queued
    let rank = await redisService.getQueuePosition(QUEUE_KEY, visitorId);
    if (rank === null) {
      // Add to FIFO queue scored by millisecond timestamp
      const score = Date.now();
      await redisService.enqueueVisitor(QUEUE_KEY, visitorId, score);
      rank = await redisService.getQueuePosition(QUEUE_KEY, visitorId) || 1;
    }

    const totalWaiting = await redisService.getQueueLength(QUEUE_KEY);
    const batchSize = TRAFFIC_CONFIG.waitingRoom.admissionBatchSize;
    const intervalSec = TRAFFIC_CONFIG.waitingRoom.admissionIntervalMs / 1000;
    
    // Accurate estimated wait time calculation
    const batchesAhead = Math.ceil(rank / Math.max(1, batchSize));
    const estimatedWaitSeconds = Math.max(5, batchesAhead * intervalSec);

    return {
      status: 'QUEUED',
      queueRequired: true,
      visitorId,
      position: rank,
      totalWaiting,
      estimatedWaitSeconds,
      loadState: loadEval.state,
      retryAfterSec: Math.min(10, Math.max(3, Math.round(intervalSec)))
    };
  }

  /**
   * Check visitor's current status while in queue
   */
  async checkQueueStatus(visitorId, clientIp, userRole = 'GUEST') {
    // Check if admitted by background worker
    const admissionData = await redisService.getActiveSession(`admitted:${visitorId}`);
    if (admissionData) {
      const token = this.generateAdmissionToken(visitorId, clientIp);
      await redisService.removeActiveSession(`admitted:${visitorId}`);
      await redisService.registerActiveSession(visitorId, { role: userRole, ip: clientIp }, TRAFFIC_CONFIG.waitingRoom.sessionTtlSeconds);
      systemMetrics.recordAdmission();

      return {
        status: 'ADMITTED',
        queueRequired: false,
        token
      };
    }

    // Still in queue
    const rank = await redisService.getQueuePosition(QUEUE_KEY, visitorId);
    if (rank === null) {
      // Not in queue, re-evaluate or admit
      return this.joinQueue(visitorId, clientIp, userRole);
    }

    const totalWaiting = await redisService.getQueueLength(QUEUE_KEY);
    const batchSize = TRAFFIC_CONFIG.waitingRoom.admissionBatchSize;
    const intervalSec = TRAFFIC_CONFIG.waitingRoom.admissionIntervalMs / 1000;
    const batchesAhead = Math.ceil(rank / Math.max(1, batchSize));
    const estimatedWaitSeconds = Math.max(5, batchesAhead * intervalSec);

    return {
      status: 'QUEUED',
      queueRequired: true,
      visitorId,
      position: rank,
      totalWaiting,
      estimatedWaitSeconds,
      retryAfterSec: Math.min(10, Math.max(3, Math.round(intervalSec)))
    };
  }

  /**
   * Background Admission Worker
   * Runs periodically to admit visitors from the FIFO queue
   */
  startAdmissionWorker() {
    if (this.workerInterval) clearInterval(this.workerInterval);

    this.workerInterval = setInterval(async () => {
      try {
        const queueLength = await redisService.getQueueLength(QUEUE_KEY);
        if (queueLength === 0) return;

        const activeSessions = await redisService.countActiveSessions();
        const loadEval = await systemMetrics.evaluateLoadState(activeSessions);

        if (!loadEval.admitAllowed) {
          // CRITICAL LOAD: Halt admissions to protect active sessions
          return;
        }

        const maxAllowed = TRAFFIC_CONFIG.waitingRoom.maxActiveSessions;
        const availableSlots = Math.max(0, maxAllowed - activeSessions);

        if (availableSlots > 0 || !TRAFFIC_CONFIG.waitingRoom.enabled) {
          const admitCount = Math.min(
            availableSlots,
            TRAFFIC_CONFIG.waitingRoom.admissionBatchSize,
            queueLength
          );

          if (admitCount > 0) {
            const admittedIds = await redisService.popNextAdmissions(QUEUE_KEY, admitCount);
            for (const visitorId of admittedIds) {
              // Store temporary admission signal (valid for 60 seconds for visitor to pick up)
              await redisService.registerActiveSession(`admitted:${visitorId}`, { admittedAt: Date.now() }, 60);
            }
          }
        }
      } catch (err) {
        console.error('[WaitingRoomWorker] Error processing admission queue:', err.message);
      }
    }, TRAFFIC_CONFIG.waitingRoom.admissionIntervalMs);
  }

  stopAdmissionWorker() {
    if (this.workerInterval) clearInterval(this.workerInterval);
  }
}

export const waitingRoomService = new WaitingRoomService();
