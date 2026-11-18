import { recordActivity, AUDIT_MODULES } from '../services/auditService.js';

let errorCountThisWindow = 0;
let windowStart = Date.now();
const MAX_ERRORS_PER_MINUTE = 10;

function isErrorLoggingEnabled() {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.VITE_ENABLE_ERROR_LOGGING !== 'false';
    }
  } catch {
    // ignore
  }
  return true;
}

/**
 * Log a production runtime error safely to console and the immutable audit stream.
 * Rate-limited to prevent log flooding and never exposes sensitive credentials.
 */
export function logProductionError(error, context = 'RUNTIME') {
  const now = Date.now();
  if (now - windowStart > 60000) {
    windowStart = now;
    errorCountThisWindow = 0;
  }

  const message =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === 'string'
      ? error
      : 'Unexpected runtime error';

  console.error(`[IEI Production Error][${context}]`, message);

  if (!isErrorLoggingEnabled() || errorCountThisWindow >= MAX_ERRORS_PER_MINUTE) {
    return;
  }

  errorCountThisWindow += 1;

  try {
    const safeUrl =
      typeof window !== 'undefined' && window.location
        ? `${window.location.pathname}${window.location.hash}`
        : 'unknown';

    recordActivity({
      action: 'SYSTEM_RUNTIME_ERROR',
      module: AUDIT_MODULES.SECURITY,
      status: 'FAILED',
      details: `[${context}] ${message.slice(0, 300)} (route: ${safeUrl})`,
      targetId: context
    });
  } catch {
    // Never let telemetry throw inside an error handler
  }
}

/**
 * Attach global browser error listeners once at application startup.
 */
export function initGlobalErrorLogging() {
  if (typeof window === 'undefined' || window.__ieiErrorLoggerInitialized) return;
  window.__ieiErrorLoggerInitialized = true;

  window.addEventListener('error', (event) => {
    logProductionError(event.error || event.message, 'WINDOW_ERROR');
  });

  window.addEventListener('unhandledrejection', (event) => {
    logProductionError(event.reason, 'UNHANDLED_PROMISE');
  });
}
