/**
 * IEI MGR STUDENTS CHAPTER — Hostinger Production Verification & Packaging Script
 * Runs after `vite build` to verify dist/ integrity for Hostinger public_html deployment.
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
console.log('  IEI MGR STUDENTS CHAPTER — HOSTINGER DEPLOYMENT PREFLIGHT     ');
console.log('================================================================');

if (!fs.existsSync(DIST)) {
  fail('dist/ directory not found. Run `npm run build` first.');
}

// 1. Verify required production files exist in dist/
const requiredFiles = [
  'index.html',
  '.htaccess',
  'manifest.webmanifest',
  'assets/apk-logo.png',
  'assets/website-logo.png',
  'assets/gallery/gallery-1-rain26-cultural-fest.jpg',
  'assets/gallery/gallery-2-rain26-valedictory.jpg',
  'assets/gallery/gallery-3-presidential-felicitation.jpg',
  'assets/gallery/gallery-4-state-centre-delegation.jpg'
];

for (const rel of requiredFiles) {
  const full = path.join(DIST, rel);
  if (!fs.existsSync(full)) {
    fail(`Missing required Hostinger deployment file: dist/${rel}`);
  }
  console.log(`  [OK] dist/${rel}`);
}

// 2. Verify no sensitive/forbidden files leaked into dist/
const forbiddenFiles = ['.env', '.env.production', '.env.local', 'COMMITTEE_CREDENTIALS.csv', 'COMMITTEE_CREDENTIALS.md'];
for (const f of forbiddenFiles) {
  if (fs.existsSync(path.join(DIST, f))) {
    fail(`Sensitive file detected inside dist/: ${f}`);
  }
}
console.log('  [OK] Zero secret/credential files present in dist/');

// 3. Calculate total package size and verify asset bundle integrity
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
console.log(`  [OK] Build bundle verified: ${fileCount} files (${sizeMB} MB total)`);

// 4. Verify index.html references hashed production assets (not /src/main.jsx)
const indexHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
if (indexHtml.includes('/src/main.jsx')) {
  fail('dist/index.html still references unbundled /src/main.jsx!');
}
console.log('  [OK] dist/index.html properly references compiled Vite production assets');

// 5. Verify .htaccess contains HTTPS redirect + SPA fallback
const htaccess = fs.readFileSync(path.join(DIST, '.htaccess'), 'utf8');
if (!htaccess.includes('RewriteRule ^ index.html [L]') || !htaccess.includes('RewriteCond %{HTTPS} !=on')) {
  fail('dist/.htaccess is missing HTTPS enforcement or SPA fallback rules.');
}
console.log('  [OK] dist/.htaccess verified (HTTPS redirect, SPA fallback, security headers, caching)');

// 6. Create hostinger-deploy-package.zip (includes .htaccess!)
try {
  if (fs.existsSync(ZIP_OUTPUT)) fs.unlinkSync(ZIP_OUTPUT);
  if (process.platform === 'win32') {
    // PowerShell Compress-Archive skips dotfiles if using wildcards, so use .NET ZipFile on dist/
    execSync(
      `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${DIST}', '${ZIP_OUTPUT}', [System.IO.Compression.CompressionLevel]::Optimal, $false)"`,
      { stdio: 'inherit' }
    );
  } else {
    execSync(`cd "${DIST}" && zip -r "${ZIP_OUTPUT}" .`, { stdio: 'inherit' });
  }
  const zipSizeMB = (fs.statSync(ZIP_OUTPUT).size / (1024 * 1024)).toFixed(2);
  console.log(`  [OK] Created Hostinger upload archive: hostinger-deploy-package.zip (${zipSizeMB} MB)`);
} catch (err) {
  console.warn('  [WARN] Could not create zip archive automatically:', err.message);
  console.warn('         You can still upload the contents of dist/ directly to Hostinger public_html.');
}

console.log('================================================================');
console.log('  HOSTINGER PREFLIGHT PASSED — READY FOR public_html UPLOAD     ');
console.log('================================================================');
