/**
 * IEI MGR Student Chapter — Virtual Waiting Room API Endpoints
 * Provides queue joining, status polling, and token retrieval
 */

import express from 'express';
import { waitingRoomService } from '../services/waitingRoomService.js';
import { getClientIp } from '../middleware/rateLimiter.js';
import { redisService } from '../services/redisService.js';
import { TRAFFIC_CONFIG } from '../config/trafficConfig.js';

export const queueRouter = express.Router();

// Join Waiting Room Queue
queueRouter.post('/join', async (req, res) => {
  try {
    const clientIp = getClientIp(req);
    const visitorId = req.body?.visitorId || `vis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userRole = req.body?.role || 'GUEST';

    const result = await waitingRoomService.joinQueue(visitorId, clientIp, userRole);
    return res.json(result);
  } catch (err) {
    console.error('[QueueRouter] Join error:', err);
    return res.status(500).json({ error: 'Failed to join queue', message: err.message });
  }
});

// Check Queue Status
queueRouter.get('/status', async (req, res) => {
  try {
    const clientIp = getClientIp(req);
    const visitorId = req.query?.visitorId;
    const userRole = req.query?.role || 'GUEST';

    if (!visitorId) {
      return res.status(400).json({ error: 'visitorId is required' });
    }

    const result = await waitingRoomService.checkQueueStatus(visitorId, clientIp, userRole);
    return res.json(result);
  } catch (err) {
    console.error('[QueueRouter] Status check error:', err);
    return res.status(500).json({ error: 'Failed to verify queue status', message: err.message });
  }
});

// Active Session Heartbeat
queueRouter.post('/heartbeat', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : req.body?.token;
    const clientIp = getClientIp(req);

    const validation = waitingRoomService.validateAdmissionToken(token, clientIp);
    if (!validation.valid) {
      return res.status(401).json({ valid: false, error: validation.reason });
    }

    await redisService.refreshActiveSession(validation.sessionId, TRAFFIC_CONFIG.waitingRoom.sessionTtlSeconds);
    return res.json({ valid: true, expiresAt: validation.expiresAt });
  } catch (err) {
    return res.status(500).json({ error: 'Heartbeat error', message: err.message });
  }
});
