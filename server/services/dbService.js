/**
 * IEI MGR Student Chapter — MySQL Connection Pooling & Database Resilience
 * Optimized for Hostinger KVM 2 VPS (2 vCPU, 8 GB RAM)
 */

import mysql from 'mysql2/promise';
import { TRAFFIC_CONFIG } from '../config/trafficConfig.js';

class DatabaseService {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.activeQueries = 0;
    this.initPool();
  }

  initPool() {
    const config = {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'iei_mgr_platform',
      connectionLimit: TRAFFIC_CONFIG.dbPool.connectionLimit,
      queueLimit: TRAFFIC_CONFIG.dbPool.queueLimit,
      waitForConnections: TRAFFIC_CONFIG.dbPool.waitForConnections,
      connectTimeout: 5000,
      timezone: '+05:30',
      charset: 'utf8mb4'
    };

    try {
      this.pool = mysql.createPool(config);
      this.isConnected = true;
    } catch (err) {
      console.warn('[Database] Initial pool configuration error:', err.message);
      this.isConnected = false;
    }
  }

  /**
   * Execute parameterized query with strict timeout protection
   */
  async query(sql, params = []) {
    if (!this.pool) {
      throw new Error('Database pool uninitialized');
    }

    this.activeQueries++;
    const timeoutMs = TRAFFIC_CONFIG.dbPool.queryTimeoutMs;

    try {
      const queryPromise = this.pool.execute(sql, params);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Query execution timed out after ${timeoutMs}ms`)), timeoutMs);
      });

      const [rows, fields] = await Promise.race([queryPromise, timeoutPromise]);
      this.isConnected = true;
      return [rows, fields];
    } catch (err) {
      if (err.message.includes('timed out') || err.code === 'PROTOCOL_CONNECTION_LOST') {
        this.isConnected = false;
      }
      throw err;
    } finally {
      this.activeQueries = Math.max(0, this.activeQueries - 1);
    }
  }

  /**
   * Safe transaction wrapper with automatic commit/rollback
   */
  async withTransaction(workFn) {
    if (!this.pool) throw new Error('Database pool uninitialized');
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();

    try {
      const result = await workFn(connection);
      await connection.commit();
      return result;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Get real-time connection pool saturation telemetry
   */
  getPoolMetrics() {
    const totalConfigured = TRAFFIC_CONFIG.dbPool.connectionLimit;
    const active = this.activeQueries;
    const saturation = totalConfigured > 0 ? Number((active / totalConfigured).toFixed(2)) : 0;

    return {
      totalConfigured,
      activeQueries: active,
      saturationRatio: saturation,
      status: saturation >= 0.9 ? 'CRITICAL' : saturation >= 0.7 ? 'WARNING' : 'HEALTHY',
      connected: this.isConnected
    };
  }

  async healthCheck() {
    try {
      if (!this.pool) return { ok: false, error: 'No pool' };
      await this.query('SELECT 1 AS health');
      return { ok: true, pool: this.getPoolMetrics() };
    } catch (e) {
      return { ok: false, error: e.message, pool: this.getPoolMetrics() };
    }
  }
}

export const dbService = new DatabaseService();
