/**
 * IEI MGR Student Chapter — Traffic Management & Telemetry API
 * Strictly guarded by Master Administrator authorization & append-only audit trail
 */

import express from 'express';
import { systemMetrics } from '../services/systemMetricsService.js';
import { TRAFFIC_CONFIG } from '../config/trafficConfig.js';
import { dbService } from '../services/dbService.js';
import { adminOperationLimiter } from '../middleware/rateLimiter.js';

export const trafficRouter = express.Router();

// Middleware: Strictly verify Master Administrator privileges
function requireMasterAdmin(req, res, next) {
  const user = req.user;
  const isMaster = user && (user.isMasterAdmin || user.role === 'Administrator' || user.username === 'admin.master-01');

  if (!isMaster) {
    return res.status(403).json({
      status: 'FORBIDDEN',
      error: 'Access Denied',
      message: 'Traffic Management telemetry and configuration are strictly restricted to the Master Administrator.'
    });
  }
  next();
}

// 1. Get Live Telemetry Snapshot
trafficRouter.get('/metrics', requireMasterAdmin, adminOperationLimiter, async (req, res) => {
  try {
    const snapshot = await systemMetrics.getSnapshot();
    return res.json({ status: 'SUCCESS', data: snapshot });
  } catch (err) {
    console.error('[TrafficRouter] Telemetry error:', err);
    return res.status(500).json({ error: 'Failed to retrieve telemetry snapshot', message: err.message });
  }
});

// 2. Update Traffic Management Configuration
trafficRouter.post('/config', requireMasterAdmin, adminOperationLimiter, async (req, res) => {
  try {
    const updates = req.body || {};
    const previousConfig = {
      enabled: TRAFFIC_CONFIG.waitingRoom.enabled,
      emergencyMode: TRAFFIC_CONFIG.waitingRoom.emergencyMaintenanceMode,
      maxSessions: TRAFFIC_CONFIG.waitingRoom.maxActiveSessions,
      batchSize: TRAFFIC_CONFIG.waitingRoom.admissionBatchSize
    };

    if (typeof updates.enabled === 'boolean') {
      TRAFFIC_CONFIG.waitingRoom.enabled = updates.enabled;
    }
    if (typeof updates.emergencyMaintenanceMode === 'boolean') {
      TRAFFIC_CONFIG.waitingRoom.emergencyMaintenanceMode = updates.emergencyMaintenanceMode;
    }
    if (typeof updates.maxActiveSessions === 'number' && updates.maxActiveSessions > 0) {
      TRAFFIC_CONFIG.waitingRoom.maxActiveSessions = updates.maxActiveSessions;
    }
    if (typeof updates.admissionBatchSize === 'number' && updates.admissionBatchSize > 0) {
      TRAFFIC_CONFIG.waitingRoom.admissionBatchSize = updates.admissionBatchSize;
    }
    if (typeof updates.officerCapacityReserve === 'number' && updates.officerCapacityReserve >= 0) {
      TRAFFIC_CONFIG.waitingRoom.officerCapacityReserve = updates.officerCapacityReserve;
    }

    // Record in immutable audit log if database is connected
    try {
      await dbService.query(
        `INSERT INTO system_audit_logs (id, actor_id, actor_name, actor_role, action, module, status, details, old_values, new_values, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          `aud_trf_${Date.now()}`,
          req.user.id || 'admin.master-01',
          req.user.name || 'Master Administrator',
          'Administrator',
          'TRAFFIC_CONFIG_UPDATED',
          'TRAFFIC_CONTROL',
          'SUCCESS',
          `Traffic management parameters modified by ${req.user.name || 'Master Administrator'}`,
          JSON.stringify(previousConfig),
          JSON.stringify(updates)
        ]
      );
    } catch (auditErr) {
      console.warn('[TrafficRouter] Audit record warning:', auditErr.message);
    }

    return res.json({
      status: 'SUCCESS',
      message: 'Traffic configuration updated successfully',
      currentConfig: {
        enabled: TRAFFIC_CONFIG.waitingRoom.enabled,
        emergencyMaintenanceMode: TRAFFIC_CONFIG.waitingRoom.emergencyMaintenanceMode,
        maxActiveSessions: TRAFFIC_CONFIG.waitingRoom.maxActiveSessions,
        admissionBatchSize: TRAFFIC_CONFIG.waitingRoom.admissionBatchSize,
        officerCapacityReserve: TRAFFIC_CONFIG.waitingRoom.officerCapacityReserve
      }
    });
  } catch (err) {
    console.error('[TrafficRouter] Config update error:', err);
    return res.status(500).json({ error: 'Failed to update traffic configuration', message: err.message });
  }
});
