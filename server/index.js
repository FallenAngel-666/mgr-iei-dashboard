/**
 * IEI MGR Student Chapter — Enterprise Application & Traffic Management Server
 * Node.js 20+ / Express / Socket.IO / Redis / MySQL / Virtual Waiting Room
 * Hostinger KVM 2 VPS Production Configuration
 */

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import { TRAFFIC_CONFIG } from './config/trafficConfig.js';
import { redisService } from './services/redisService.js';
import { dbService } from './services/dbService.js';
import { systemMetrics } from './services/systemMetricsService.js';
import { socketService } from './services/socketService.js';
import { waitingRoomGuard } from './middleware/waitingRoomGuard.js';
import { generalApiLimiter } from './middleware/rateLimiter.js';
import { queueRouter } from './routes/queueRoutes.js';
import { trafficRouter } from './routes/trafficRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with connection protections
socketService.initialize(server);

// Security & Header Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Telemetry & Latency Profiling Middleware
app.use((req, res, next) => {
  const start = Date.now();
  systemMetrics.recordRequestStart();

  res.on('finish', () => {
    const duration = Date.now() - start;
    systemMetrics.recordRequestEnd(duration);
  });

  next();
});

// Authentication Extractor Middleware
app.use((req, res, next) => {
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.substring(7);
    try {
      // Decode user if present in standard base64/JSON token
      if (rawToken.includes('.')) {
        const parts = rawToken.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          req.user = payload.user || payload;
        }
      }
    } catch (e) {}
  }
  next();
});

// Virtual Waiting Room Gatekeeper (Checks load state & validates admission tokens)
app.use(waitingRoomGuard);

// Global General API Rate Limiter
app.use('/api', generalApiLimiter);

// Mount Subsystem Routes
app.use('/api/queue', queueRouter);
app.use('/api/traffic', trafficRouter);

// Health Check Endpoint
app.get('/health', async (req, res) => {
  const dbHealth = await dbService.healthCheck();
  const redisHealth = redisService.isHealthy();
  const snapshot = await systemMetrics.getSnapshot();

  const isHealthy = redisHealth.connected || redisHealth.engine.includes('Fallback');
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    version: TRAFFIC_CONFIG.version,
    loadState: snapshot.loadState,
    activeSessions: snapshot.activeSessions,
    queuedVisitors: snapshot.queuedVisitors,
    system: {
      cpuPercent: snapshot.cpu.percent,
      ramUsedPercent: snapshot.ram.systemUsedPercent
    },
    database: dbHealth,
    redis: redisHealth
  });
});

// Serve frontend static files if available in dist/
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA routing
app.use((req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('MGR IEI Student Chapter Traffic Engine & Backend is running.');
    }
  });
});

// Graceful Shutdown
function gracefulShutdown(signal) {
  console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    console.log('[Server] HTTP and WebSocket connections closed.');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('[Server] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, HOST, () => {
    console.log(`================================================================`);
    console.log(`  MGR IEI STUDENT CHAPTER — ENTERPRISE TRAFFIC ENGINE & BACKEND `);
    console.log(`================================================================`);
    console.log(`  Listening on: http://${HOST}:${PORT}`);
    console.log(`  Environment:  Hostinger KVM 2 VPS (2 vCPU, 8 GB RAM)`);
    console.log(`  Waiting Room: ${TRAFFIC_CONFIG.waitingRoom.enabled ? 'ENABLED' : 'DISABLED'} (Capacity: ${TRAFFIC_CONFIG.waitingRoom.maxActiveSessions} active sessions)`);
    console.log(`  Rate Limiter: ACTIVE (Sliding-window Redis distributed store)`);
    console.log(`================================================================`);
  });
}

export { app, server };
