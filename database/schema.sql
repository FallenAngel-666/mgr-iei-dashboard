-- ============================================================================
-- IEI MGR STUDENTS CHAPTER — HOSTINGER MYSQL PRODUCTION DATABASE SCHEMA
-- Compatible with Hostinger MySQL 8.0+ and MariaDB 10.6+ (phpMyAdmin import)
-- Scales cleanly past 1,500+ registered student members with full indexing
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+05:30';
SET foreign_key_checks = 1;

-- ----------------------------------------------------------------------------
-- 1. SYNC METADATA
-- Tracks version sequence per collection for multi-user delta synchronization
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `iei_sync_meta` (
  `collection_name` VARCHAR(64) NOT NULL,
  `version` BIGINT UNSIGNED NOT NULL DEFAULT 1,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`collection_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. MEMBERS & COMMITTEE DIRECTORY
-- Authoritative user registry storing credentials strictly as secure password hashes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `iei_members` (
  `id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `role` VARCHAR(100) NOT NULL,
  `username` VARCHAR(120) NOT NULL,
  `secondary_username` VARCHAR(120) DEFAULT NULL,
  `email` VARCHAR(200) NOT NULL,
  `secondary_email` VARCHAR(200) DEFAULT NULL,
  `phone` VARCHAR(40) DEFAULT NULL,
  `department` VARCHAR(160) DEFAULT 'Engineering',
  `membership_id` VARCHAR(80) DEFAULT NULL,
  `year` VARCHAR(80) DEFAULT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'Active',
  `is_master_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `password_hash` VARCHAR(255) NOT NULL,
  `data_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_iei_members_username` (`username`),
  KEY `idx_iei_members_secondary_user` (`secondary_username`),
  KEY `idx_iei_members_email` (`email`),
  KEY `idx_iei_members_role_status` (`role`, `status`),
  KEY `idx_iei_members_membership_id` (`membership_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. WORK TASKS & SUBMISSIONS
-- Tracks assigned initiatives, progress reports, working duration, and 2-level approvals
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `iei_tasks` (
  `id` VARCHAR(100) NOT NULL,
  `title` VARCHAR(300) NOT NULL,
  `status` VARCHAR(80) NOT NULL DEFAULT 'Assigned',
  `week_id` VARCHAR(32) DEFAULT NULL,
  `assignee_id` VARCHAR(100) DEFAULT NULL,
  `assigned_by_id` VARCHAR(100) DEFAULT NULL,
  `data_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_iei_tasks_week_status` (`week_id`, `status`),
  KEY `idx_iei_tasks_assignee` (`assignee_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. COMMUNITY WORK UPDATES & CHAT STREAM
-- Private institutional stream where committee members post updates and media
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `iei_updates` (
  `id` VARCHAR(100) NOT NULL,
  `author_id` VARCHAR(100) DEFAULT NULL,
  `author_name` VARCHAR(200) DEFAULT NULL,
  `data_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_iei_updates_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. CHAPTER EVENTS & OFFICIAL MEETINGS
-- Scheduled symposia, general body meetings, workshops, and conclaves
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `iei_events` (
  `id` VARCHAR(100) NOT NULL,
  `title` VARCHAR(300) NOT NULL,
  `event_date` VARCHAR(40) DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `data_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_iei_events_date` (`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. MEETING ATTENDANCE REGISTERS
-- Verification logs of member attendance for official scheduled events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `iei_attendance` (
  `id` VARCHAR(100) NOT NULL,
  `event_id` VARCHAR(100) DEFAULT NULL,
  `event_date` VARCHAR(40) DEFAULT NULL,
  `data_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_iei_attendance_event` (`event_id`, `event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. CIRCULARS & ANNOUNCEMENTS
-- Official chapter notices, circulars, and executive directives
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `iei_announcements` (
  `id` VARCHAR(100) NOT NULL,
  `title` VARCHAR(300) NOT NULL,
  `priority` VARCHAR(40) DEFAULT 'Normal',
  `data_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_iei_announcements_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. CERTIFICATES REGISTER
-- Verified certificates issued for workshops, webinars, and competitions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `iei_certificates` (
  `id` VARCHAR(100) NOT NULL,
  `title` VARCHAR(300) DEFAULT NULL,
  `data_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. ACHIEVEMENTS & HONORS
-- Institutional accolades, symposium awards, and member recognitions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `iei_achievements` (
  `id` VARCHAR(100) NOT NULL,
  `title` VARCHAR(300) DEFAULT NULL,
  `data_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. NOTIFICATIONS DISPATCH
-- Alert queue for assigned work, review approvals, and broadcast notices
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `iei_notifications` (
  `id` VARCHAR(100) NOT NULL,
  `recipient_id` VARCHAR(100) NOT NULL DEFAULT 'all',
  `recipient_role` VARCHAR(100) DEFAULT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `data_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_iei_notifications_recipient` (`recipient_id`, `is_read`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. PUBLIC WELCOME PAGE CONFIGURATION
-- Public landing page branding, Faculty Advisor, Mentor, and verified contacts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `iei_public_profile` (
  `id` VARCHAR(64) NOT NULL,
  `official_email` VARCHAR(200) NOT NULL DEFAULT 'iei@drmgrdu.ac.in',
  `data_json` LONGTEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. PUBLIC UPCOMING EVENTS & POSTERS
-- Publicly visible event listings and promotional posters for visitors
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `iei_public_events` (
  `id` VARCHAR(100) NOT NULL,
  `title` VARCHAR(300) NOT NULL,
  `event_date` VARCHAR(40) DEFAULT NULL,
  `poster_url` VARCHAR(500) DEFAULT NULL,
  `data_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_iei_public_events_date` (`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. HOSTINGER FILE STORAGE REGISTRY
-- Indexes files stored on Hostinger disk (report PDFs, photos, posters)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `iei_uploads` (
  `id` VARCHAR(100) NOT NULL,
  `folder` VARCHAR(64) NOT NULL DEFAULT 'general',
  `original_name` VARCHAR(255) NOT NULL,
  `stored_name` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(120) NOT NULL,
  `file_size` INT UNSIGNED NOT NULL,
  `public_url` VARCHAR(500) NOT NULL,
  `uploaded_by_id` VARCHAR(100) DEFAULT NULL,
  `uploaded_by_name` VARCHAR(200) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_iei_uploads_folder` (`folder`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. IMMUTABLE SYSTEM ACTIVITY AUDIT LOGS (APPEND-ONLY)
-- Tamper-evident institutional activity records; no UPDATE or DELETE permitted
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_audit_logs` (
  `id` VARCHAR(120) NOT NULL,
  `event_timestamp` VARCHAR(64) NOT NULL,
  `actor_uid` VARCHAR(100) DEFAULT NULL,
  `actor_name` VARCHAR(200) DEFAULT NULL,
  `actor_username` VARCHAR(120) DEFAULT NULL,
  `actor_role` VARCHAR(100) DEFAULT NULL,
  `action` VARCHAR(120) NOT NULL,
  `module` VARCHAR(80) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
  `target_id` VARCHAR(120) DEFAULT NULL,
  `data_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_module_time` (`module`, `created_at`),
  KEY `idx_audit_status_time` (`status`, `created_at`),
  KEY `idx_audit_actor` (`actor_username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. SYSTEM SETTINGS & GOVERNANCE RULES
-- Central configuration including weekly work submission restriction rules
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `iei_system_settings` (
  `id` VARCHAR(100) NOT NULL,
  `data_json` LONGTEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. LOGIN ATTEMPTS & RATE LIMITING
-- Protects against brute-force password guessing attacks (5 attempts / 15 min)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `iei_login_attempts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip_address` VARCHAR(45) NOT NULL,
  `identifier` VARCHAR(120) NOT NULL,
  `attempt_time` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_login_ip_time` (`ip_address`, `attempt_time`),
  KEY `idx_login_ident_time` (`identifier`, `attempt_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
