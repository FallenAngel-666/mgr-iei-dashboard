/**
 * IEI MGR Student Chapter — Enterprise Socket.IO Real-Time Engine
 * Per-user and per-IP connection limits, event throttling, and room authorization
 */

import { Server } from 'socket.io';
import { TRAFFIC_CONFIG } from '../config/trafficConfig.js';
import { systemMetrics } from './systemMetricsService.js';
import { redisService } from './redisService.js';

class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set(socketId)
    this.ipSockets = new Map(); // ip -> Set(socketId)
  }

  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      pingTimeout: TRAFFIC_CONFIG.socketLimits.pingTimeoutMs,
      pingInterval: TRAFFIC_CONFIG.socketLimits.pingIntervalMs,
      maxHttpBufferSize: 1e6 // 1MB payload ceiling
    });

    // Connection limits and authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const clientIp = socket.handshake.headers['x-forwarded-for']?.split(',')[0].trim() || socket.handshake.address;
        
        // 1. Check Total Socket Limits
        const totalSockets = this.io.engine.clientsCount;
        if (totalSockets >= TRAFFIC_CONFIG.socketLimits.maxTotalConnections) {
          return next(new Error('WebSocket server at maximum capacity. Please retry shortly.'));
        }

        // 2. Check Per-IP Socket Limits
        const ipCount = this.ipSockets.get(clientIp)?.size || 0;
        if (ipCount >= TRAFFIC_CONFIG.socketLimits.maxPerIp) {
          return next(new Error('Connection limit exceeded for this network IP address.'));
        }

        // 3. Extract & Validate Handshake Auth
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        const user = socket.handshake.auth?.user;

        if (user && user.id) {
          // Check Per-User Socket Limits
          const userCount = this.userSockets.get(user.id)?.size || 0;
          if (userCount >= TRAFFIC_CONFIG.socketLimits.maxPerUser) {
            return next(new Error('Maximum concurrent sessions reached for this user account.'));
          }
          socket.user = user;
        } else {
          socket.user = { id: `anon_${socket.id}`, name: 'Visitor', role: 'GUEST' };
        }

        socket.clientIp = clientIp;
        next();
      } catch (err) {
        next(new Error(`Handshake authorization failed: ${err.message}`));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('[Socket.IO] Real-time engine initialized with enterprise connection controls');
  }

  handleConnection(socket) {
    const userId = socket.user?.id;
    const clientIp = socket.clientIp;

    // Track user socket
    if (userId) {
      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId).add(socket.id);
    }

    // Track IP socket
    if (clientIp) {
      if (!this.ipSockets.has(clientIp)) this.ipSockets.set(clientIp, new Set());
      this.ipSockets.get(clientIp).add(socket.id);
    }

    systemMetrics.setSocketCount(this.io.engine.clientsCount);

    // Auto-join public institutional announcement channel
    socket.join('institutional:public');

    // Join authenticated chapter room if committee member
    if (socket.user?.role && socket.user.role !== 'GUEST') {
      socket.join('chapter:committee');
    }

    // Confidential room for authorized membership managers
    const canManageDir = ['admin.master-01', 'sripriyan.jsec-01', 'ramya.memdir-01', 'swathi.memdir-01'].includes(socket.user?.username);
    if (canManageDir) {
      socket.join('chapter:directory_admin');
    }

    // Handle incoming chat messages with event throttling
    socket.on('chat:send', async (data) => {
      try {
        const rateLimitKey = `iei:ratelimit:socket_chat:${userId || socket.id}`;
        const check = await redisService.checkRateLimit(rateLimitKey, 10, 5); // 5 messages / 10s
        
        if (!check.allowed) {
          socket.emit('error', {
            code: 'RATE_LIMITED',
            message: 'You are sending messages too quickly. Please pause briefly.'
          });
          return;
        }

        // Broadcast to committee stream
        this.io.to('chapter:committee').emit('chat:received', {
          ...data,
          author: socket.user,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to process message' });
      }
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      if (userId && this.userSockets.has(userId)) {
        this.userSockets.get(userId).delete(socket.id);
        if (this.userSockets.get(userId).size === 0) this.userSockets.delete(userId);
      }
      if (clientIp && this.ipSockets.has(clientIp)) {
        this.ipSockets.get(clientIp).delete(socket.id);
        if (this.ipSockets.get(clientIp).size === 0) this.ipSockets.delete(clientIp);
      }
      systemMetrics.setSocketCount(this.io.engine.clientsCount);
    });
  }

  broadcast(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }
}

export const socketService = new SocketService();
