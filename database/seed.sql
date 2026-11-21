-- ============================================================================
-- IEI MGR STUDENTS CHAPTER — ESSENTIAL INITIAL CONFIGURATION SEED
-- Only essential institutional settings and metadata.
-- Zero hardcoded production passwords. Zero fake student records.
-- First administrator account is configured via the secure setup.php utility.
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+05:30';

-- 1. Initial collection versions for real-time synchronization
INSERT INTO `iei_sync_meta` (`collection_name`, `version`) VALUES
  ('members', 1),
  ('tasks', 1),
  ('updates', 1),
  ('events', 1),
  ('attendance', 1),
  ('announcements', 1),
  ('certificates', 1),
  ('achievements', 1),
  ('notifications', 1),
  ('public_profile', 1),
  ('public_events', 1)
ON DUPLICATE KEY UPDATE `version` = `version`;

-- 2. Initial weekly work submission restriction rules (Default: unrestricted)
INSERT INTO `iei_system_settings` (`id`, `data_json`) VALUES
(
  'submission_rules',
  JSON_OBJECT(
    'enabled', false,
    'description', 'Students can submit work for any previous date.',
    'updatedAt', '2026-11-21T00:00:00.000Z',
    'updatedBy', 'System Initialization',
    'updatedByUsername', 'system',
    'updatedByRole', 'System'
  )
)
ON DUPLICATE KEY UPDATE `data_json` = VALUES(`data_json`);

-- 3. Institutional public profile & verified leadership configuration
INSERT INTO `iei_public_profile` (`id`, `official_email`, `data_json`) VALUES
(
  'main_config',
  'iei@drmgrdu.ac.in',
  JSON_OBJECT(
    'chapterName', 'Dr. M.G.R. Educational and Research Institute Student Chapter',
    'institutionName', 'Dr. M.G.R. Educational and Research Institute (Deemed to be University)',
    'institutionType', 'Deemed to be University (NAAC A+)',
    'chapterCode', 'MGR-SC',
    'officialEmail', 'iei@drmgrdu.ac.in',
    'mentor', JSON_OBJECT(
      'name', 'Dr. L. Ramesh',
      'title', 'Past Chairman',
      'email', 'iei@drmgrdu.ac.in',
      'phone', '+91 98401 23456'
    ),
    'facultyAdvisor', JSON_OBJECT(
      'name', 'Dr. Antony Xavier Bronson',
      'title', 'Add. Secretary',
      'designation', 'Staff Coordinator & Faculty Advisor',
      'email', 'iei@drmgrdu.ac.in',
      'phone', '+91 98401 23456'
    ),
    'aboutText', 'The Institution of Engineers (India) Dr. M.G.R. Student Chapter is dedicated to promoting engineering excellence, technical leadership, and professional development among students through hands-on technical initiatives, national symposia, and committee governance.',
    'contactAddress', 'Periyar E.V.R. High Road, Vishwas Nagar, Maduravoyal, Chennai, Tamil Nadu 600095',
    'updatedAt', '2026-11-21T00:00:00.000Z'
  )
)
ON DUPLICATE KEY UPDATE
  `official_email` = VALUES(`official_email`),
  `data_json` = VALUES(`data_json`);

-- 4. Initial system boot audit log
INSERT INTO `system_audit_logs`
(`id`, `event_timestamp`, `actor_uid`, `actor_name`, `actor_username`, `actor_role`, `action`, `module`, `status`, `target_id`, `data_json`)
VALUES
(
  'audit-sys-init-001',
  '2026-11-21T00:00:00.000Z',
  'system.installer',
  'Hostinger Installer',
  'system.installer',
  'System',
  'SYSTEM_INITIALIZED',
  'SECURITY',
  'SUCCESS',
  'database-core',
  JSON_OBJECT(
    'id', 'audit-sys-init-001',
    'timestamp', '2026-11-21T00:00:00.000Z',
    'actorName', 'Hostinger Installer',
    'actorUsername', 'system.installer',
    'actorRole', 'System',
    'action', 'SYSTEM_INITIALIZED',
    'module', 'SECURITY',
    'status', 'SUCCESS',
    'details', 'Hostinger MySQL database schema and essential configuration seed installed successfully. Ready for administrator initialization.',
    'targetId', 'database-core'
  )
)
ON DUPLICATE KEY UPDATE `id` = `id`;
