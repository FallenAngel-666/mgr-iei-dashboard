/**
 * IEI MGR STUDENTS CHAPTER — Cloud Firestore Production Backup Utility
 * Exports all institutional collections to backups/iei-firestore-backup-<timestamp>.json
 *
 * Usage:
 *   npm run backup:db
 *   (Reads Firebase config from environment variables or local .env.production)
 */
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

const required = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID'];
for (const key of required) {
  if (!env[key] || env[key].includes('your_')) {
    console.error(`[BACKUP ERROR] Missing required environment variable: ${key}`);
    console.error('Configure .env.production or export VITE_FIREBASE_* variables first.');
    process.exit(1);
  }
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

const COLLECTIONS = [
  'iei_members',
  'iei_public_profile',
  'iei_public_events',
  'iei_tasks',
  'iei_updates',
  'iei_events',
  'iei_attendance',
  'iei_announcements',
  'iei_certificates',
  'iei_achievements',
  'iei_notifications',
  'system_audit_logs'
];

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const snapshotData = {
    meta: {
      system: 'IEI MGR STUDENTS CHAPTER',
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      exportedAt: new Date().toISOString(),
      collections: COLLECTIONS
    },
    data: {}
  };

  let totalDocs = 0;
  for (const colName of COLLECTIONS) {
    const snap = await getDocs(collection(db, colName));
    const records = {};
    snap.forEach((docSnap) => {
      records[docSnap.id] = docSnap.data();
      totalDocs += 1;
    });
    snapshotData.data[colName] = records;
    console.log(`  [BACKUP] ${colName}: ${snap.size} documents`);
  }

  const outPath = path.join(backupDir, `iei-firestore-backup-${timestamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(snapshotData, null, 2), 'utf8');
  console.log(`\n[SUCCESS] Exported ${totalDocs} documents to ${outPath}`);
  process.exit(0);
}

runBackup().catch((err) => {
  console.error('[BACKUP FAILED]', err.message);
  process.exit(1);
});
