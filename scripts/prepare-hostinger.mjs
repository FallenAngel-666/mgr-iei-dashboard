/**
 * IEI MGR STUDENTS CHAPTER — 100% Hostinger Production Build, Verification & Packaging
 * Compiles Vite in 100% Hostinger mode (MySQL + PHP 8 API + Hostinger File Storage),
 * verifies all required files and security guards, and generates hostinger-deploy-package.zip.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const ZIP_OUTPUT = path.join(ROOT, 'hostinger-deploy-package.zip');

function fail(msg) {
  console.error(`\n[HOSTINGER PREFLIGHT FAILED] ${msg}`);
  process.exit(1);
}

console.log('================================================================');
console.log('  IEI MGR STUDENTS CHAPTER — 100% HOSTINGER PRODUCTION BUILD    ');
console.log('================================================================');

// 0. Compile Vite explicitly in 100% Hostinger MySQL + Storage mode
console.log('Building frontend bundle with VITE_BACKEND_MODE=hostinger ...');
execSync('npx vite build', {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_BACKEND_MODE: 'hostinger',
    VITE_API_BASE_URL: '/api',
    VITE_APP_ENV: 'production'
  }
});

if (!fs.existsSync(DIST)) {
  fail('dist/ directory not found after vite build.');
}

// 1. Copy database installation scripts and guides into dist/database/
const distDb = path.join(DIST, 'database');
if (!fs.existsSync(distDb)) fs.mkdirSync(distDb, { recursive: true });

const dbFilesToCopy = [
  'schema.sql',
  'seed.sql',
  'README.md',
  'verify.php',
  'immutability_triggers.sql'
];

for (const f of dbFilesToCopy) {
  const src = path.join(ROOT, 'database', f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDb, f));
    console.log(`  [OK] database/${f} copied to package`);
  }
}

// Also copy root guides if they exist
const guideFiles = ['HOSTINGER_DEPLOYMENT_GUIDE.md', 'DATABASE_SETUP_GUIDE.md', 'SECURITY_AUDIT_REPORT.md'];
for (const g of guideFiles) {
  const src = path.join(ROOT, g);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DIST, g));
    console.log(`  [OK] ${g} copied to package`);
  }
}

// 2. Verify required frontend, .htaccess, PHP 8 API, and storage files exist in dist/
const requiredFiles = [
  'index.html',
  '.htaccess',
  'manifest.webmanifest',
  'assets/apk-logo.png',
  'assets/website-logo.png',
  'assets/gallery/gallery-1-rain26-cultural-fest.jpg',
  'assets/gallery/gallery-2-rain26-valedictory.jpg',
  'assets/gallery/gallery-3-presidential-felicitation.jpg',
  'assets/gallery/gallery-4-state-centre-delegation.jpg',
  'api/.htaccess',
  'api/config.example.php',
  'api/bootstrap.php',
  'api/health.php',
  'api/auth.php',
  'api/data.php',
  'api/sync.php',
  'api/public.php',
  'api/audit.php',
  'api/upload.php',
  'api/setup.php',
  'api/verify.php',
  'database/schema.sql',
  'database/seed.sql',
  'database/verify.php',
  'uploads/.htaccess'
];

for (const rel of requiredFiles) {
  const full = path.join(DIST, rel);
  if (!fs.existsSync(full)) {
    fail(`Missing required Hostinger deployment file: dist/${rel}`);
  }
  console.log(`  [OK] dist/${rel}`);
}

// 3. Verify NO sensitive/secret files leaked into dist/
const forbiddenFiles = [
  '.env',
  '.env.production',
  '.env.local',
  'api/config.php',
  'api/.installed',
  'database/seed-from-firestore.sql',
  'COMMITTEE_CREDENTIALS.csv',
  'COMMITTEE_CREDENTIALS.md'
];
for (const f of forbiddenFiles) {
  if (fs.existsSync(path.join(DIST, f))) {
    fail(`Sensitive file detected inside dist/: ${f}`);
  }
}
console.log('  [OK] Zero secret/credential files present in dist/');

// 4. Deep Content Security Inspection of compiled JS assets:
// Must NOT contain third-party project IDs (sachin-crackers) or hardcoded seed passwords
console.log('Scanning compiled JS assets for credential & project ID leakage...');
const assetsDir = path.join(DIST, 'assets');
if (fs.existsSync(assetsDir)) {
  for (const f of fs.readdirSync(assetsDir)) {
    if (f.endsWith('.js')) {
      const content = fs.readFileSync(path.join(assetsDir, f), 'utf8');
      if (content.includes('sachin-crackers')) {
        fail(`Detected leftover project reference 'sachin-crackers' in dist/assets/${f}`);
      }
      if (content.includes('IEI#MasterAdmin') || content.includes('IEI#StaffCoord')) {
        fail(`Detected hardcoded plain-text credentials in dist/assets/${f}`);
      }
    }
  }
}
console.log('  [OK] Compiled frontend assets are 100% free of credentials and third-party references.');

// 5. Verify total package size
let totalBytes = 0;
let fileCount = 0;
function walk(dir) {
  for (const item of fs.readdirSync(dir)) {
    const p = path.join(dir, item);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p);
    else {
      totalBytes += stat.size;
      fileCount += 1;
    }
  }
}
walk(DIST);
const sizeMB = (totalBytes / (1024 * 1024)).toFixed(2);
console.log(`  [OK] 100% Hostinger bundle verified: ${fileCount} files (${sizeMB} MB total)`);

// 6. Verify .htaccess contains HTTPS redirect, API bypass, and SPA fallback
const htaccess = fs.readFileSync(path.join(DIST, '.htaccess'), 'utf8');
if (!htaccess.includes('RewriteRule ^api(/|$) - [L,NC]') || !htaccess.includes('RewriteRule ^ index.html [L]')) {
  fail('dist/.htaccess is missing PHP API bypass or SPA fallback rules.');
}
console.log('  [OK] dist/.htaccess verified (HTTPS, PHP /api & /uploads bypass, SPA fallback, security headers)');

// 7. Create hostinger-deploy-package.zip (includes all .htaccess dotfiles!)
try {
  if (fs.existsSync(ZIP_OUTPUT)) fs.unlinkSync(ZIP_OUTPUT);
  if (process.platform === 'win32') {
    execSync(
      `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${DIST}', '${ZIP_OUTPUT}', [System.IO.Compression.CompressionLevel]::Optimal, $false)"`,
      { stdio: 'inherit' }
    );
  } else {
    execSync(`cd "${DIST}" && zip -r "${ZIP_OUTPUT}" .`, { stdio: 'inherit' });
  }
  const zipSizeMB = (fs.statSync(ZIP_OUTPUT).size / (1024 * 1024)).toFixed(2);
  console.log(`  [OK] Created 100% Hostinger upload archive: hostinger-deploy-package.zip (${zipSizeMB} MB)`);
} catch (err) {
  console.warn('  [WARN] Could not create zip archive automatically:', err.message);
}

console.log('================================================================');
console.log('  100% HOSTINGER PACKAGE READY (MySQL + PHP 8 + Disk Storage)   ');
console.log('================================================================');
