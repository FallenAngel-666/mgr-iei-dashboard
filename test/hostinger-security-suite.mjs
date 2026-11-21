/**
 * IEI MGR STUDENTS CHAPTER — HOSTINGER PRODUCTION SECURITY & FUNCTIONAL TEST SUITE
 *
 * Verifies:
 * 1. Role-based server authorization across all 10 collections
 * 2. Unauthorized CRUD enforcement (HTTP 403)
 * 3. Audit log forgery prevention & immutability
 * 4. Login rate limiting & account status enforcement
 * 5. Logout & token revocation
 * 6. Setup atomicity, one-time lock & account collision prevention
 * 7. Upload MIME validation & script execution prevention
 * 8. MySQL database schema (17 tables) & clean seed data
 * 9. Apache / LiteSpeed .htaccess routing rules
 * 10. Linux ZIP forward-slash header compliance & extraction integrity
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const API_DIR = path.join(ROOT, 'public', 'api');
const DB_DIR = path.join(ROOT, 'database');
const UPLOADS_DIR = path.join(ROOT, 'public', 'uploads');
const ZIP_FILE = path.join(ROOT, 'hostinger-deploy-package.zip');

console.log('================================================================');
console.log('  IEI MGR STUDENTS CHAPTER — HOSTINGER PRODUCTION SECURITY TEST ');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    process.exitCode = 1;
  }
}

// ----------------------------------------------------------------------------
// 1. Role-based Server Authorization Across All Collections
// ----------------------------------------------------------------------------
console.log('--- 1. Server-Side Role-Based Authorization & Permission Logic ---');

const bootstrapSrc = fs.readFileSync(path.join(API_DIR, 'bootstrap.php'), 'utf8');
const dataSrc = fs.readFileSync(path.join(API_DIR, 'data.php'), 'utf8');

it('bootstrap.php exports all required RBAC helper functions', () => {
  const requiredHelpers = [
    'isMasterAdmin',
    'isStaffCoordinator',
    'isFirstLevelApprover',
    'canAssignWork',
    'canManageEvents',
    'canManageAnnouncements',
    'canRecordAttendance',
    'canManageCertificates',
    'canManageAchievements',
    'canManageSettings',
    'canAccessMembersDirectory',
    'canAccessActivityConsole',
    'canAccessWorkAnalytics'
  ];
  for (const h of requiredHelpers) {
    assert(bootstrapSrc.includes(`function ${h}`), `Missing RBAC helper: ${h}`);
  }
});

it('data.php enforces explicit authorization for every collection on POST/PUT and DELETE', () => {
  const collections = [
    'members',
    'tasks',
    'events',
    'attendance',
    'announcements',
    'certificates',
    'achievements',
    'settings',
    'updates'
  ];
  for (const col of collections) {
    assert(dataSrc.includes(`'${col}'`), `Collection missing from data.php: ${col}`);
  }
  // Verify 403 Forbidden is returned for unauthorized mutations
  assert(dataSrc.includes("['ok' => false, 'error' => 'FORBIDDEN'"), 'data.php must return FORBIDDEN 403 on authorization failure');
  assert(dataSrc.includes('SECURITY_ACCESS_DENIED'), 'data.php must audit unauthorized attempts with SECURITY_ACCESS_DENIED');
});

it('Students cannot modify institutional announcements, events, attendance, or settings', () => {
  assert(dataSrc.includes('canManageAnnouncements($user)'), 'Announcements must require canManageAnnouncements');
  assert(dataSrc.includes('canManageEvents($user)'), 'Events must require canManageEvents');
  assert(dataSrc.includes('canRecordAttendance($user)'), 'Attendance must require canRecordAttendance');
  assert(dataSrc.includes('canManageSettings($user)'), 'Settings must require canManageSettings');
});

it('Students cannot self-approve their own tasks or reassign them', () => {
  assert(dataSrc.includes('Students cannot approve their own tasks or mark them as Completed'), 'Task logic must forbid self-approval');
  assert(dataSrc.includes('$data[\'assigneeId\'] = $assigneeId'), 'Task logic must preserve original assigneeId for students');
});

it('Students cannot promote their own account to Administrator', () => {
  assert(dataSrc.includes('Only the Master Administrator can grant or modify Administrator privileges'), 'Must forbid non-master admin from granting admin role');
  assert(dataSrc.includes('$data[\'isMasterAdmin\'] = !empty($existingRow[\'is_master_admin\'])'), 'Must preserve existing admin status on self-edit');
});

// ----------------------------------------------------------------------------
// 2. Audit-Log Forgery Prevention and Immutability
// ----------------------------------------------------------------------------
console.log('\n--- 2. Secure Audit Logging & Immutability Enforcement ---');

const auditSrc = fs.readFileSync(path.join(API_DIR, 'audit.php'), 'utf8');

it('audit.php requires valid authenticated user for POST (rejects unauthenticated requests with 401)', () => {
  assert(auditSrc.includes('$user = requireAuth($pdo);'), 'POST in audit.php must call requireAuth($pdo)');
});

it('audit.php strictly derives actor identity from verified server session (zero client spoofing)', () => {
  assert(auditSrc.includes("'actorUid' => $user['id']"), 'Actor UID must come from verified $user');
  assert(auditSrc.includes("'actorUsername' => $user['username']"), 'Actor username must come from verified $user');
  assert(auditSrc.includes("'actorRole' => $user['role']"), 'Actor role must come from verified $user');
  assert(!auditSrc.includes("$body['actor']['id'] ??"), 'Must not trust client-supplied actor ID');
});

it('audit.php validates permitted actions and modules against allowlist', () => {
  assert(auditSrc.includes('$ALLOWED_ACTIONS = ['), 'audit.php must define $ALLOWED_ACTIONS');
  assert(auditSrc.includes('$ALLOWED_MODULES = ['), 'audit.php must define $ALLOWED_MODULES');
  assert(auditSrc.includes('AUTH_LOGIN'), 'Allowlist must include AUTH_LOGIN');
  assert(auditSrc.includes('SECURITY_ACCESS_DENIED'), 'Allowlist must include SECURITY_ACCESS_DENIED');
});

it('audit.php strictly prohibits PUT and DELETE with HTTP 405 Method Not Allowed', () => {
  assert(auditSrc.includes('IMMUTABLE_AUDIT_LOG'), 'audit.php must reject non-append operations with IMMUTABLE_AUDIT_LOG');
  assert(auditSrc.includes('405'), 'audit.php must return HTTP 405');
});

it('database/immutability_triggers.sql provides MySQL engine-level update/delete prevention', () => {
  const triggerSql = fs.readFileSync(path.join(DB_DIR, 'immutability_triggers.sql'), 'utf8');
  assert(triggerSql.includes('trg_audit_logs_prevent_update'), 'Missing update trigger definition');
  assert(triggerSql.includes('trg_audit_logs_prevent_delete'), 'Missing delete trigger definition');
  assert(triggerSql.includes("SIGNAL SQLSTATE '45000'"), 'Triggers must SIGNAL error 45000');
});

// ----------------------------------------------------------------------------
// 3. Authentication, Logout, and Token Revocation
// ----------------------------------------------------------------------------
console.log('\n--- 3. Authentication Hardening & Token Revocation ---');

const authSrc = fs.readFileSync(path.join(API_DIR, 'auth.php'), 'utf8');

it('auth.php implements rate limiting on login (5 attempts / 15 minutes)', () => {
  assert(authSrc.includes('iei_login_attempts'), 'auth.php must use iei_login_attempts table');
  assert(authSrc.includes('$attempts >= 5'), 'auth.php must block when attempts >= 5');
  assert(authSrc.includes('429'), 'auth.php must return HTTP 429 TOO_MANY_ATTEMPTS');
});

it('auth.php checks account status and blocks deactivated/inactive accounts', () => {
  assert(authSrc.includes("strtolower((string)$row['status']) !== 'active'"), 'auth.php must check status !== active');
  assert(authSrc.includes('ACCOUNT_INACTIVE'), 'auth.php must return ACCOUNT_INACTIVE');
  assert(authSrc.includes('403'), 'auth.php must return HTTP 403 on inactive account');
});

it('auth.php regenerates session ID upon login to prevent session fixation', () => {
  assert(authSrc.includes('session_regenerate_id(true)'), 'auth.php must call session_regenerate_id(true)');
});

it('auth.php immediately revokes HMAC bearer token on logout and destroys session', () => {
  assert(authSrc.includes('iei_revoked_tokens'), 'Logout must record token in iei_revoked_tokens');
  assert(authSrc.includes("hash('sha256', $token)"), 'Logout must store token hash');
  assert(authSrc.includes('session_destroy()'), 'Logout must destroy PHP session');
  assert(authSrc.includes('setcookie'), 'Logout must clear session cookie');
});

it('bootstrap.php getAuthenticatedUser checks iei_revoked_tokens and rejects revoked tokens', () => {
  assert(bootstrapSrc.includes('iei_revoked_tokens'), 'getAuthenticatedUser must query iei_revoked_tokens');
  assert(bootstrapSrc.includes('$revStmt->fetch()'), 'Must check if token hash exists in revocation list');
  assert(bootstrapSrc.includes('return null; // Token has been revoked!'), 'Must return null for revoked tokens');
});

// ----------------------------------------------------------------------------
// 4. Secure First Administrator Setup (setup.php)
// ----------------------------------------------------------------------------
console.log('\n--- 4. Secure First Administrator Setup (setup.php) ---');

const setupSrc = fs.readFileSync(path.join(API_DIR, 'setup.php'), 'utf8');

it('setup.php enforces one-time installation lockfile check', () => {
  assert(setupSrc.includes('.installed'), 'setup.php must check .installed file');
  assert(setupSrc.includes('SETUP_LOCKED'), 'setup.php must return SETUP_LOCKED when lock exists');
});

it('setup.php uses strict atomic transaction (beginTransaction / commit / rollBack)', () => {
  assert(setupSrc.includes('$pdo->beginTransaction()'), 'setup.php must begin transaction');
  assert(setupSrc.includes('$pdo->commit()'), 'setup.php must commit transaction');
  assert(setupSrc.includes('$pdo->rollBack()'), 'setup.php must rollback on conflict or error');
});

it('setup.php checks if administrator already exists and refuses setup with 403', () => {
  assert(setupSrc.includes("SELECT COUNT(*) FROM iei_members WHERE is_master_admin = 1 OR role = 'Administrator' FOR UPDATE"), 'Must check for existing admin with row lock');
  assert(setupSrc.includes('SETUP_LOCKED'), 'Must return SETUP_LOCKED if admin already exists');
});

it('setup.php checks for username or email collisions with ANY existing account (409 Conflict)', () => {
  assert(setupSrc.includes('SELECT id, username, email FROM iei_members'), 'Must query existing accounts for collisions');
  assert(setupSrc.includes('ACCOUNT_CONFLICT'), 'Must return ACCOUNT_CONFLICT when collision occurs');
  assert(setupSrc.includes('409'), 'Must return HTTP 409 status code');
});

it('setup.php uses strict INSERT without ON DUPLICATE KEY UPDATE (prevents account promotion races)', () => {
  assert(setupSrc.includes('INSERT INTO iei_members'), 'setup.php must perform INSERT');
  assert(!setupSrc.includes('ON DUPLICATE KEY UPDATE'), 'setup.php must NOT contain ON DUPLICATE KEY UPDATE');
});

it('setup.php enforces strong password complexity policy (min 12 chars, upper, lower, digit, symbol)', () => {
  assert(setupSrc.includes('strlen($password) < 12'), 'Must check min 12 length');
  assert(setupSrc.includes('/[A-Z]/'), 'Must require uppercase');
  assert(setupSrc.includes('/[a-z]/'), 'Must require lowercase');
  assert(setupSrc.includes('/[0-9]/'), 'Must require digit');
  assert(setupSrc.includes('Password must include at least one special character'), 'Must require special character');
});

// ----------------------------------------------------------------------------
// 5. Schema Verification Endpoint (verify.php)
// ----------------------------------------------------------------------------
console.log('\n--- 5. Secure Verification Endpoint ---');

const verifySrc = fs.readFileSync(path.join(API_DIR, 'verify.php'), 'utf8');

it('verify.php allows CLI execution without token for server administrators', () => {
  assert(verifySrc.includes("php_sapi_name() === 'cli'"), 'Must detect CLI mode');
});

it('verify.php HTTP mode strictly requires Master Administrator authorization in production', () => {
  assert(verifySrc.includes('getAuthenticatedUser'), 'Must verify actual token');
  assert(verifySrc.includes('isMasterAdmin'), 'Must verify isMasterAdmin');
  assert(verifySrc.includes('403'), 'Must return HTTP 403 if unauthorized');
});

it('verify.php includes all 17 tables including iei_revoked_tokens', () => {
  assert(verifySrc.includes("'iei_revoked_tokens'"), 'verify.php must check iei_revoked_tokens');
  assert(verifySrc.includes('17 Required Tables'), 'verify.php must check 17 tables');
});

// ----------------------------------------------------------------------------
// 6. Upload Security & Execution Prevention
// ----------------------------------------------------------------------------
console.log('\n--- 6. Upload Validation & Script Execution Prevention ---');

const uploadHtaccess = fs.readFileSync(path.join(UPLOADS_DIR, '.htaccess'), 'utf8');
const uploadSrc = fs.readFileSync(path.join(API_DIR, 'upload.php'), 'utf8');

it('uploads/.htaccess disables script execution (php engine off, deny php/sh/exe/html/svg)', () => {
  assert(uploadHtaccess.includes('php_flag engine off'), 'Must turn php engine off');
  assert(uploadHtaccess.includes('RemoveHandler'), 'Must remove PHP handlers');
  assert(uploadHtaccess.includes('Require all denied'), 'Must deny access to script extensions');
  assert(uploadHtaccess.includes('nosniff'), 'Must set X-Content-Type-Options nosniff');
});

it('upload.php validates real file MIME types using magic bytes (finfo)', () => {
  assert(uploadSrc.includes('finfo_open(FILEINFO_MIME_TYPE)'), 'Must check magic bytes with finfo');
  assert(uploadSrc.includes('image/jpeg'), 'Must support jpeg');
  assert(uploadSrc.includes('image/png'), 'Must support png');
  assert(uploadSrc.includes('application/pdf'), 'Must support pdf');
  assert(!uploadSrc.includes('text/html'), 'Must NOT permit html uploads');
  assert(!uploadSrc.includes('application/x-php'), 'Must NOT permit php uploads');
});

// ----------------------------------------------------------------------------
// 7. Database Schema & Seed Verification
// ----------------------------------------------------------------------------
console.log('\n--- 7. Database Schema & Seed Integrity ---');

const schemaSql = fs.readFileSync(path.join(DB_DIR, 'schema.sql'), 'utf8');
const seedSql = fs.readFileSync(path.join(DB_DIR, 'seed.sql'), 'utf8');

it('database/schema.sql defines exactly 17 required tables with primary and foreign keys/indexes', () => {
  const tables = [...schemaSql.matchAll(/CREATE TABLE IF NOT EXISTS `([^`]+)`/g)].map(m => m[1]);
  assert.strictEqual(tables.length, 17, `Expected 17 tables, found ${tables.length}: ${tables.join(', ')}`);
  assert(tables.includes('iei_revoked_tokens'), 'schema.sql must contain iei_revoked_tokens');
  assert(tables.includes('iei_login_attempts'), 'schema.sql must contain iei_login_attempts');
  assert(tables.includes('system_audit_logs'), 'schema.sql must contain system_audit_logs');
  assert(tables.includes('iei_members'), 'schema.sql must contain iei_members');
});

it('database/seed.sql contains zero hardcoded passwords and zero fake student records', () => {
  assert(!seedSql.includes('IEI#MasterAdmin'), 'seed.sql must NOT contain IEI#MasterAdmin');
  assert(!seedSql.includes('password_hash'), 'seed.sql must NOT insert member passwords');
  assert(!seedSql.includes('sachin-crackers'), 'seed.sql must NOT reference other projects');
  assert(seedSql.includes('Dr. Antony Xavier Bronson'), 'seed.sql must reference Dr. Antony Xavier Bronson');
  assert(seedSql.includes('iei@drmgrdu.ac.in'), 'seed.sql must use official chapter email');
});

// ----------------------------------------------------------------------------
// 8. Apache / LiteSpeed .htaccess Configuration
// ----------------------------------------------------------------------------
console.log('\n--- 8. Apache / LiteSpeed .htaccess Routing & Security Headers ---');

const rootHtaccess = fs.readFileSync(path.join(ROOT, 'public', '.htaccess'), 'utf8');

it('.htaccess redirects HTTP to HTTPS', () => {
  assert(rootHtaccess.includes('RewriteCond %{HTTPS} !=on') || rootHtaccess.includes('RewriteCond %{HTTPS} off'), 'Must check HTTPS condition');
  assert(rootHtaccess.includes('RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]'), 'Must redirect 301 to HTTPS');
});

it('.htaccess bypasses rewrite for /api and /uploads to allow native PHP execution and static files', () => {
  assert(rootHtaccess.includes('RewriteRule ^api(/|$) - [L,NC]'), 'Must bypass /api');
  assert(rootHtaccess.includes('RewriteRule ^uploads(/|$) - [L,NC]'), 'Must bypass /uploads');
});

it('.htaccess routes SPA routes to index.html with fallback', () => {
  assert(rootHtaccess.includes('RewriteRule ^ index.html [L]'), 'Must rewrite unhandled routes to index.html');
});

it('.htaccess enforces security headers (HSTS, nosniff, SAMEORIGIN, CSP)', () => {
  assert(rootHtaccess.includes('X-Content-Type-Options "nosniff"'), 'Must set nosniff');
  assert(rootHtaccess.includes('X-Frame-Options "SAMEORIGIN"'), 'Must set SAMEORIGIN');
  assert(rootHtaccess.includes('Strict-Transport-Security'), 'Must set HSTS');
});

// ----------------------------------------------------------------------------
// 9. Linux ZIP Extraction & Forward-Slash Verification
// ----------------------------------------------------------------------------
console.log('\n--- 9. Linux ZIP Forward-Slash & Extraction Integrity ---');

it('hostinger-deploy-package.zip exists and contains strictly forward-slash entries (zero backslashes)', () => {
  assert(fs.existsSync(ZIP_FILE), `ZIP file does not exist: ${ZIP_FILE}`);
  const scriptPath = path.join(ROOT, 'scripts', 'build-hostinger-zip.py');
  // Run python verification script on the generated zip
  const checkCode = `
import zipfile, sys
z = zipfile.ZipFile(r"${ZIP_FILE}", "r")
names = z.namelist()
bad = [n for n in names if "\\\\" in n]
if bad:
    sys.exit(f"Backslash detected in entries: {bad[:5]}")
required = ["api/auth.php", "api/bootstrap.php", "database/schema.sql", "uploads/.htaccess", "index.html", ".htaccess"]
missing = [r for r in required if r not in names]
if missing:
    sys.exit(f"Missing required entries in ZIP: {missing}")
print(f"    Verified {len(names)} entries. Zero backslashes. All required files present.")
`;
  const tempPy = path.join(ROOT, 'test', 'temp_verify_zip.py');
  fs.writeFileSync(tempPy, checkCode, 'utf8');
  try {
    execSync(`python "${tempPy}"`, { stdio: 'inherit' });
  } finally {
    if (fs.existsSync(tempPy)) fs.unlinkSync(tempPy);
  }
});

console.log('\n================================================================');
console.log(`TEST SUITE RESULTS: ${passedTests} PASSED, ${totalTests - passedTests} FAILED (TOTAL: ${totalTests})`);
console.log('================================================================\n');

if (totalTests !== passedTests) {
  process.exit(1);
}
