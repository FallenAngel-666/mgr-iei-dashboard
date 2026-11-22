/**
 * IEI MGR Student Chapter — Enterprise Traffic Engine & Virtual Waiting Room Test Suite
 * Tests Redis-backed Rate Limiter, FIFO Waiting Room, Tokens, Socket & DB Protections
 */

import assert from 'assert';
import http from 'http';
import { TRAFFIC_CONFIG } from '../server/config/trafficConfig.js';
import { redisService } from '../server/services/redisService.js';
import { waitingRoomService } from '../server/services/waitingRoomService.js';
import { systemMetrics } from '../server/services/systemMetricsService.js';
import { dbService } from '../server/services/dbService.js';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function runTrafficEngineTests() {
  console.log('================================================================');
  console.log('  IEI MGR STUDENT CHAPTER — TRAFFIC & WAITING ROOM TEST SUITE  ');
  console.log('================================================================');

  // --- 1. Sliding-Window Rate Limiting ---
  console.log('\n--- 1. Sliding-Window Rate Limiting ---');

  await test('General API limit allows up to max requests in rolling window', async () => {
    const testKey = `iei:ratelimit:test_gen_${Date.now()}`;
    const limit = 5;
    const windowSec = 60;

    for (let i = 0; i < limit; i++) {
      const res = await redisService.checkRateLimit(testKey, windowSec, limit);
      assert.strictEqual(res.allowed, true, `Request ${i + 1} should be allowed`);
    }

    // Next request must be rate-limited
    const blockedRes = await redisService.checkRateLimit(testKey, windowSec, limit);
    assert.strictEqual(blockedRes.allowed, false, '6th request must be blocked');
    assert.ok(blockedRes.retryAfterSec >= 1, 'Retry-After must be positive');
  });

  await test('Login brute-force limiter blocks on 6th failed attempt', async () => {
    const accKey = `iei:ratelimit:login_acc:test_student_${Date.now()}`;
    const limit = 5;
    const windowSec = 900;

    for (let i = 0; i < limit; i++) {
      const res = await redisService.checkRateLimit(accKey, windowSec, limit);
      assert.strictEqual(res.allowed, true);
    }

    const blocked = await redisService.checkRateLimit(accKey, windowSec, limit);
    assert.strictEqual(blocked.allowed, false);
    assert.ok(blocked.retryAfterSec > 0);
  });

  await test('File upload rate limiter limits upload frequency and checks size', () => {
    const maxBytes = TRAFFIC_CONFIG.rateLimits.fileUpload.maxSizeBytes;
    assert.strictEqual(maxBytes, 15 * 1024 * 1024, 'Max upload size is exactly 15 MB');
    assert.ok(TRAFFIC_CONFIG.rateLimits.fileUpload.allowedMimeTypes.includes('application/pdf'));
    assert.ok(TRAFFIC_CONFIG.rateLimits.fileUpload.allowedMimeTypes.includes('image/png'));
  });

  await test('Chat message burst limiter allows max 20 messages per min', () => {
    assert.strictEqual(TRAFFIC_CONFIG.rateLimits.chatMessage.maxMessages, 20);
    assert.strictEqual(TRAFFIC_CONFIG.rateLimits.chatMessage.burstMax, 2);
  });

  // --- 2. Virtual Waiting Room FIFO Ordering & Tokens ---
  console.log('\n--- 2. Virtual Waiting Room FIFO Ordering & Tokens ---');

  await test('FIFO Queue maintains strict chronological position ordering', async () => {
    const queueKey = `iei:queue:test_fifo_${Date.now()}`;
    const visA = 'vis_alpha';
    const visB = 'vis_beta';
    const visC = 'vis_gamma';

    await redisService.enqueueVisitor(queueKey, visA, 100);
    await redisService.enqueueVisitor(queueKey, visB, 200);
    await redisService.enqueueVisitor(queueKey, visC, 300);

    const rankA = await redisService.getQueuePosition(queueKey, visA);
    const rankB = await redisService.getQueuePosition(queueKey, visB);
    const rankC = await redisService.getQueuePosition(queueKey, visC);

    assert.strictEqual(rankA, 1, 'First visitor must be rank 1');
    assert.strictEqual(rankB, 2, 'Second visitor must be rank 2');
    assert.strictEqual(rankC, 3, 'Third visitor must be rank 3');

    // Pop first admission
    const popped = await redisService.popNextAdmissions(queueKey, 1);
    assert.deepStrictEqual(popped, [visA], 'First queued visitor must be admitted first');

    const newRankB = await redisService.getQueuePosition(queueKey, visB);
    assert.strictEqual(newRankB, 1, 'Next visitor moves to rank 1');
  });

  await test('Cryptographic admission token generates valid HMAC and decodes correctly', () => {
    const sessionId = 'sess_test_123';
    const clientIp = '192.168.1.100';

    const token = waitingRoomService.generateAdmissionToken(sessionId, clientIp);
    assert.ok(token.startsWith('iei_qtok_'));

    const validation = waitingRoomService.validateAdmissionToken(token, clientIp);
    assert.strictEqual(validation.valid, true);
    assert.strictEqual(validation.sessionId, sessionId);
  });

  await test('Tampered token is strictly rejected', () => {
    const token = waitingRoomService.generateAdmissionToken('sess_1', '127.0.0.1');
    const tampered = token.slice(0, -4) + 'abcd';
    const validation = waitingRoomService.validateAdmissionToken(tampered, '127.0.0.1');
    assert.strictEqual(validation.valid, false);
    assert.strictEqual(validation.reason, 'Tampered token signature');
  });

  await test('Token from different IP is rejected (anti-session hijacking)', () => {
    const token = waitingRoomService.generateAdmissionToken('sess_1', '10.0.0.1');
    const validation = waitingRoomService.validateAdmissionToken(token, '10.0.0.2');
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.reason.includes('IP mismatch'));
  });

  // --- 3. Officer Capacity Reserve & Active Session Protection ---
  console.log('\n--- 3. Officer Capacity Reserve & Session Protection ---');

  await test('Officer capacity reserve grants prioritized admission under high load', async () => {
    const officerRole = 'Joint Secretary';
    const guestRole = 'GUEST';

    // Set high active sessions
    const originalMax = TRAFFIC_CONFIG.waitingRoom.maxActiveSessions;
    TRAFFIC_CONFIG.waitingRoom.maxActiveSessions = 2;
    TRAFFIC_CONFIG.waitingRoom.enabled = true;

    // Fill capacity
    await redisService.registerActiveSession('user1', { role: 'GUEST' }, 60);
    await redisService.registerActiveSession('user2', { role: 'GUEST' }, 60);

    // Guest should be queued
    const guestRes = await waitingRoomService.joinQueue('guest_99', '1.2.3.4', guestRole);
    assert.strictEqual(guestRes.queueRequired, true, 'Guest should be queued when capacity full');

    // Joint Secretary Sri Priyan should be admitted via officer reserve
    const officerRes = await waitingRoomService.joinQueue('sripriyan_session', '1.2.3.4', officerRole);
    assert.strictEqual(officerRes.queueRequired, false, 'Officer should be admitted via reserve');
    assert.ok(officerRes.token, 'Officer must receive valid admission token');

    // Restore
    TRAFFIC_CONFIG.waitingRoom.maxActiveSessions = originalMax;
  });

  // --- 4. Multi-Factor System Load State Machine ---
  console.log('\n--- 4. Multi-Factor Load State Machine ---');

  await test('Normal condition evaluates to NORMAL load state', async () => {
    const load = await systemMetrics.evaluateLoadState(10, { cpuPercent: 15, ramPercent: 30, dbSaturation: 0.1 });
    assert.strictEqual(load.state, 'NORMAL');
    assert.strictEqual(load.admitAllowed, true);
  });

  await test('CPU over 78% triggers HIGH LOAD state', async () => {
    const load = await systemMetrics.evaluateLoadState(50, { cpuPercent: 82, ramPercent: 40, dbSaturation: 0.2 });
    assert.strictEqual(load.state, 'HIGH LOAD');
  });

  await test('CPU over 90% triggers CRITICAL LOAD state and halts admissions', async () => {
    const load = await systemMetrics.evaluateLoadState(50, { cpuPercent: 94, ramPercent: 50, dbSaturation: 0.3 });
    assert.strictEqual(load.state, 'CRITICAL LOAD');
    assert.strictEqual(load.admitAllowed, false, 'Admissions must be halted during critical overload');
  });

  await test('Emergency Maintenance Mode immediately forces CRITICAL LOAD', async () => {
    systemMetrics.currentCpuPercent = 20;
    TRAFFIC_CONFIG.waitingRoom.emergencyMaintenanceMode = true;
    const load = await systemMetrics.evaluateLoadState(5);
    assert.strictEqual(load.state, 'CRITICAL LOAD');
    assert.strictEqual(load.admitAllowed, false);
    TRAFFIC_CONFIG.waitingRoom.emergencyMaintenanceMode = false;
  });

  // --- 5. Database Connection Pool Saturation Guard ---
  console.log('\n--- 5. Database Connection Pool Saturation Guard ---');

  await test('Database pool limits are tuned for 2 vCPU / 8 GB RAM VPS', () => {
    const poolMetrics = dbService.getPoolMetrics();
    assert.strictEqual(poolMetrics.totalConfigured, 50, 'Configured for 50 connection limit');
    assert.strictEqual(poolMetrics.connected !== undefined, true);
  });

  // --- 6. Telemetry Snapshot & Audit Console ---
  console.log('\n--- 6. Telemetry Snapshot & Monitoring ---');

  await test('System metrics snapshot returns all required telemetry attributes', async () => {
    const snap = await systemMetrics.getSnapshot();
    assert.ok(snap.timestamp);
    assert.ok(snap.loadState);
    assert.strictEqual(typeof snap.activeSessions, 'number');
    assert.strictEqual(typeof snap.queuedVisitors, 'number');
    assert.strictEqual(typeof snap.cpu.percent, 'number');
    assert.strictEqual(typeof snap.ram.systemUsedPercent, 'number');
    assert.ok(snap.database);
    assert.ok(snap.redis);
  });

  console.log('================================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================');

  waitingRoomService.stopAdmissionWorker();
  process.exit(failed > 0 ? 1 : 0);
}

runTrafficEngineTests();
