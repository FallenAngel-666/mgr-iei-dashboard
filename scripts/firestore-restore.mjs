/**
 * IEI MGR STUDENTS CHAPTER — Cloud Firestore Restoration Utility
 * Restores a JSON backup exported by scripts/firestore-backup.mjs
 *
 * Usage:
 *   node scripts/firestore-restore.mjs backups/iei-firestore-backup-<timestamp>.json
 *
 * Note: system_audit_logs is skipped by default to preserve absolute audit immutability.
 */
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';

const backupFile = process.argv[2];
if (!backupFile) {
  console.error('Usage: node scripts/firestore-restore.mjs <path-to-backup.json>');
  process.exit(1);
}

const resolvedBackup = path.resolve(process.cwd(), backupFile);
if (!fs.existsSync(resolvedBackup)) {
  console.error(`[RESTORE ERROR] Backup file not found: ${resolvedBackup}`);
  process.exit(1);
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq > 0) {
      out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
  }
  return out;
}

const fileEnv = {
  ...loadEnvFile(path.join(process.cwd(), '.env.production')),
  ...loadEnvFile(path.join(process.cwd(), '.env.local'))
};

const env = { ...fileEnv, ...process.env };
if (!env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_PROJECT_ID) {
  console.error('[RESTORE ERROR] Missing VITE_FIREBASE_* environment variables.');
  process.exit(1);
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
});

const db = getFirestore(app);

async function runRestore() {
  const payload = JSON.parse(fs.readFileSync(resolvedBackup, 'utf8'));
  const data = payload.data || {};
  console.log(`Restoring backup exported at: ${payload.meta?.exportedAt || 'unknown'}`);

  let totalRestored = 0;

  for (const [colName, docsMap] of Object.entries(data)) {
    if (colName === 'system_audit_logs') {
      console.log(`  [SKIP] ${colName}: skipped to preserve immutable audit log integrity`);
      continue;
    }

    const entries = Object.entries(docsMap || {});
    if (entries.length === 0) {
      console.log(`  [EMPTY] ${colName}: 0 documents`);
      continue;
    }

    // Batch write in chunks of 400 (Firestore max batch limit is 500)
    for (let i = 0; i < entries.length; i += 400) {
      const chunk = entries.slice(i, i + 400);
      const batch = writeBatch(db);
      for (const [docId, docData] of chunk) {
        batch.set(doc(db, colName, docId), docData, { merge: true });
      }
      await batch.commit();
      totalRestored += chunk.length;
    }
    console.log(`  [RESTORED] ${colName}: ${entries.length} documents`);
  }

  console.log(`\n[SUCCESS] Restored ${totalRestored} documents cleanly.`);
  process.exit(0);
}

runRestore().catch((err) => {
  console.error('[RESTORE FAILED]', err.message);
  process.exit(1);
});
