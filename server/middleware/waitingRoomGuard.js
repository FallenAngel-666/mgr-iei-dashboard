/**
 * IEI MGR Student Chapter — Backend Virtual Waiting Room Gatekeeper
 * Strictly protects API endpoints from being bypassed during traffic spikes
 */

import { TRAFFIC_CONFIG } from '../config/trafficConfig.js';
import { waitingRoomService } from '../services/waitingRoomService.js';
import { systemMetrics } from '../services/systemMetricsService.js';
import { redisService } from '../services/redisService.js';
import { getClientIp } from './rateLimiter.js';

export const waitingRoomGuard = async (req, res, next) => {
  // Always permit static assets, health, and queue status endpoints
  const path = req.path;
  if (
    path.startsWith('/api/queue') ||
    path.startsWith('/api/public') ||
    path === '/health' ||
    path === '/favicon.ico' ||
    path.startsWith('/assets') ||
    path.startsWith('/uploads')
  ) {
    return next();
  }

  // If waiting room is turned OFF by admin, permit traffic
  if (!TRAFFIC_CONFIG.waitingRoom.enabled) {
    return next();
  }

  const clientIp = getClientIp(req);
  const activeSessions = await redisService.countActiveSessions();
  const loadEval = await systemMetrics.evaluateLoadState(activeSessions);

  // If load is NORMAL and active sessions within safe capacity, pass immediately
  if (loadEval.state === 'NORMAL' && activeSessions < TRAFFIC_CONFIG.waitingRoom.maxActiveSessions) {
    return next();
  }

  // Check for admission token in Authorization header, cookie, or query parameter
  const authHeader = req.headers['authorization'] || '';
  const tokenCandidate = authHeader.startsWith('Bearer iei_qtok_')
    ? authHeader.substring(7)
    : req.headers['x-waiting-room-token'] || req.cookies?.iei_qtoken;

  if (tokenCandidate) {
    const tokenResult = waitingRoomService.validateAdmissionToken(tokenCandidate, clientIp);
    if (tokenResult.valid) {
      // Refresh session activity TTL
      await redisService.refreshActiveSession(tokenResult.sessionId, TRAFFIC_CONFIG.waitingRoom.sessionTtlSeconds);
      req.waitingRoomSessionId = tokenResult.sessionId;
      res.setHeader('X-Waiting-Room', 'Admitted');
      return next();
    }
  }

  // Check if request is authenticated as an Officer / Staff / Master Admin with reserve capacity
  if (req.user && ['Administrator', 'Staff Coordinator', 'Chairman', 'Vice Chairman', 'Secretary', 'Joint Secretary'].includes(req.user.role)) {
    if (activeSessions < (TRAFFIC_CONFIG.waitingRoom.maxActiveSessions + TRAFFIC_CONFIG.waitingRoom.officerCapacityReserve)) {
      res.setHeader('X-Waiting-Room', 'Officer-Reserve');
      return next();
    }
  }

  // Request is NOT admitted and server is under load. Block with HTTP 429 and queue instructions.
  res.setHeader('X-Waiting-Room', 'Active');
  res.setHeader('Retry-After', 5);

  return res.status(429).json({
    status: 'QUEUED',
    queueRequired: true,
    error: 'Traffic Capacity Exceeded',
    message: 'MGR IEI Student Chapter platform is experiencing high demand. Please wait in the virtual waiting room.',
    loadState: loadEval.state,
    waitingRoomUrl: '/#/waiting-room'
  });
};
