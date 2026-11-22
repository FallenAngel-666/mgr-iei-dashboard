/**
 * IEI MGR Student Chapter — Enterprise Redis-Backed Rate Limiting Middlewares
 * Sliding-window tier policies with progressive login defense and Retry-After headers
 */

import { TRAFFIC_CONFIG } from '../config/trafficConfig.js';
import { redisService } from '../services/redisService.js';
import { systemMetrics } from '../services/systemMetricsService.js';

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

/**
 * Core rate limiting factory for arbitrary rolling windows
 */
export function createRateLimiter({ tierName, windowSec, maxRequests, keyExtractor }) {
  return async (req, res, next) => {
    try {
      const clientIp = getClientIp(req);
      const identifier = keyExtractor ? keyExtractor(req, clientIp) : (req.user?.id || req.user?.username || `ip:${clientIp}`);
      const rateLimitKey = `iei:ratelimit:${tierName}:${identifier}`;

      const { allowed, remaining, retryAfterSec } = await redisService.checkRateLimit(
        rateLimitKey,
        windowSec,
        maxRequests
      );

      // Set standard RFC rate-limiting headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + (retryAfterSec || windowSec));

      if (!allowed) {
        systemMetrics.recordRateLimitHit();
        res.setHeader('Retry-After', retryAfterSec || 1);
        return res.status(429).json({
          status: 'RATE_LIMITED',
          error: 'Too Many Requests',
          message: `Too many requests for ${tierName}. Please wait ${retryAfterSec} seconds before retrying.`,
          retryAfter: retryAfterSec || 1,
          tier: tierName
        });
      }

      next();
    } catch (err) {
      console.error(`[RateLimiter:${tierName}] Error:`, err.message);
      // Fail-open for general traffic if rate limiter errors to prevent full outage
      next();
    }
  };
}

// 1. General API requests (120 req/user/min, 60 req/IP/min)
export const generalApiLimiter = (req, res, next) => {
  const isAuth = !!(req.user?.id || req.user?.username);
  const cfg = TRAFFIC_CONFIG.rateLimits.generalApi;
  const max = isAuth ? cfg.maxRequests : cfg.ipMaxRequests;

  return createRateLimiter({
    tierName: 'general_api',
    windowSec: cfg.windowSec,
    maxRequests: max,
    keyExtractor: (r, ip) => (isAuth ? `user:${r.user.id || r.user.username}` : `ip:${ip}`)
  })(req, res, next);
};

// 2. Login rate limiter (5 failed attempts per account / 15 mins + IP defense)
export const loginRateLimiter = async (req, res, next) => {
  const clientIp = getClientIp(req);
  const rawTarget = req.body?.username || req.body?.email || '';
  const accountIdentifier = rawTarget.toLowerCase().trim() || 'unknown';
  const cfg = TRAFFIC_CONFIG.rateLimits.login;

  const accountKey = `iei:ratelimit:login_acc:${accountIdentifier}`;
  const ipKey = `iei:ratelimit:login_ip:${clientIp}`;

  // Check IP-level brute force protection
  const ipCheck = await redisService.checkRateLimit(ipKey, cfg.windowSec, cfg.ipMaxFailedAttempts);
  if (!ipCheck.allowed) {
    systemMetrics.recordRateLimitHit();
    res.setHeader('Retry-After', ipCheck.retryAfterSec || 15);
    return res.status(429).json({
      status: 'RATE_LIMITED',
      error: 'Too Many Login Attempts',
      message: `Too many failed login attempts from this network. Please wait ${ipCheck.retryAfterSec}s.`,
      retryAfter: ipCheck.retryAfterSec
    });
  }

  // Attach login failure tracking helper to response
  res.onLoginFailure = async () => {
    // Record failure against account
    const accCheck = await redisService.checkRateLimit(accountKey, cfg.windowSec, cfg.maxFailedAttempts);
    if (!accCheck.allowed) {
      // Progressive delay calculation
      const failures = (cfg.maxFailedAttempts - accCheck.remaining);
      const delaySec = Math.min(
        cfg.maxProgressiveDelaySec,
        Math.pow(cfg.progressiveDelayBaseSec, failures)
      );
      return delaySec;
    }
    return 0;
  };

  next();
};

// 3. Password reset limiter (3 requests per account per hour)
export const passwordResetLimiter = createRateLimiter({
  tierName: 'pwd_reset',
  windowSec: TRAFFIC_CONFIG.rateLimits.passwordReset.windowSec,
  maxRequests: TRAFFIC_CONFIG.rateLimits.passwordReset.maxRequests,
  keyExtractor: (req, ip) => {
    const email = (req.body?.email || req.body?.username || '').toLowerCase().trim();
    return email ? `target:${email}` : `ip:${ip}`;
  }
});

// 4. File uploads limiter (10 uploads per user / 10 minutes)
export const fileUploadLimiter = (req, res, next) => {
  const cfg = TRAFFIC_CONFIG.rateLimits.fileUpload;

  // Enforce content-length limit
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > cfg.maxSizeBytes) {
    return res.status(413).json({
      status: 'PAYLOAD_TOO_LARGE',
      error: 'Payload Too Large',
      message: `Uploaded file exceeds maximum allowed size of ${(cfg.maxSizeBytes / (1024 * 1024))} MB.`
    });
  }

  return createRateLimiter({
    tierName: 'file_upload',
    windowSec: cfg.windowSec,
    maxRequests: cfg.maxUploads
  })(req, res, next);
};

// 5. Work submissions limiter (30 submissions / hour)
export const workSubmissionLimiter = createRateLimiter({
  tierName: 'work_submission',
  windowSec: TRAFFIC_CONFIG.rateLimits.workSubmission.windowSec,
  maxRequests: TRAFFIC_CONFIG.rateLimits.workSubmission.maxSubmissions
});

// 6. Chat and messaging limiter (20 messages / min)
export const chatMessageLimiter = createRateLimiter({
  tierName: 'chat_msg',
  windowSec: TRAFFIC_CONFIG.rateLimits.chatMessage.windowSec,
  maxRequests: TRAFFIC_CONFIG.rateLimits.chatMessage.maxMessages
});

// 7. Admin operations limiter (300 req / min)
export const adminOperationLimiter = createRateLimiter({
  tierName: 'admin_ops',
  windowSec: TRAFFIC_CONFIG.rateLimits.adminOperation.windowSec,
  maxRequests: TRAFFIC_CONFIG.rateLimits.adminOperation.maxRequests,
  keyExtractor: (req, ip) => `admin:${req.user?.username || req.user?.id || ip}`
});
