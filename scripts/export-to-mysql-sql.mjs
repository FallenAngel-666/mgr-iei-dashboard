/**
 * IEI MGR STUDENTS CHAPTER — Export Live Data to Hostinger MySQL Import File
 * Generates `database/seed-from-firestore.sql` (git-ignored) ready to import in Hostinger phpMyAdmin.
 *
 * Usage:
 *   npm run migrate:mysql
 */
import fs from 'node:fs';
import path from 'node:path';
import { INITIAL_MEMBERS } from '../src/config/seedData.js';
import { DEFAULT_PUBLIC_PROFILE } from '../src/services/publicProfileService.js';

function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r') + "'";
}

const outPath = path.join(process.cwd(), 'database', 'seed-from-firestore.sql');
const lines = [
  '-- ============================================================================',
  '-- IEI MGR STUDENTS CHAPTER — HOSTINGER MYSQL INITIAL SEED IMPORT',
  `-- Generated at: ${new Date().toISOString()}`,
  '-- Import AFTER database/schema.sql inside Hostinger phpMyAdmin.',
  '-- Note: Passwords automatically upgrade to bcrypt on each user\'s first login.',
  '-- ============================================================================',
  'SET NAMES utf8mb4;',
  ''
];

// 1. Seed 23 official committee members
for (const m of INITIAL_MEMBERS) {
  const json = JSON.stringify(m);
  lines.push(
    `INSERT INTO iei_members (id, name, role, username, secondary_username, email, secondary_email, phone, department, membership_id, year, status, is_master_admin, password_hash, data_json) VALUES (` +
    [
      sqlEscape(m.id),
      sqlEscape(m.name),
      sqlEscape(m.role),
      sqlEscape(m.username),
      sqlEscape(m.secondaryUsername || null),
      sqlEscape(m.email),
      sqlEscape(m.secondaryEmail || null),
      sqlEscape(m.phone || null),
      sqlEscape(m.department || 'Engineering'),
      sqlEscape(m.membershipId || null),
      sqlEscape(m.year || null),
      sqlEscape(m.status || 'Active'),
      m.isMasterAdmin ? '1' : '0',
      sqlEscape(m.password),
      sqlEscape(json)
    ].join(', ') +
    `) ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), email=VALUES(email), data_json=VALUES(data_json);`
  );
}

lines.push('');

// 2. Seed Public Welcome Page Profile (Mentor, Faculty Advisor, Official Email, Gallery, Contacts)
const profileJson = JSON.stringify(DEFAULT_PUBLIC_PROFILE);
lines.push(
  `INSERT INTO iei_public_profile (id, official_email, data_json) VALUES (` +
  `'main_config', ${sqlEscape(DEFAULT_PUBLIC_PROFILE.officialEmail || 'iei@drmgrdu.ac.in')}, ${sqlEscape(profileJson)}` +
  `) ON DUPLICATE KEY UPDATE official_email=VALUES(official_email), data_json=VALUES(data_json);`
);

lines.push('');
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`[SUCCESS] Generated Hostinger MySQL seed file: ${outPath}`);
console.log(`          Contains ${INITIAL_MEMBERS.length} official committee accounts + public profile config.`);
process.exit(0);
