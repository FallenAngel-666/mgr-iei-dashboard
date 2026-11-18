-- ============================================================================
-- OPTIONAL: SQL-ENGINE LEVEL IMMUTABILITY TRIGGERS FOR system_audit_logs
-- Import this after database/schema.sql if your Hostinger MySQL user has TRIGGER privilege.
-- ============================================================================

DROP TRIGGER IF EXISTS `trg_audit_logs_prevent_update`;
DROP TRIGGER IF EXISTS `trg_audit_logs_prevent_delete`;

DELIMITER //
CREATE TRIGGER `trg_audit_logs_prevent_update`
BEFORE UPDATE ON `system_audit_logs`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'IMMUTABLE_AUDIT_LOG: Updates to system_audit_logs are prohibited.';
END//

CREATE TRIGGER `trg_audit_logs_prevent_delete`
BEFORE DELETE ON `system_audit_logs`
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'IMMUTABLE_AUDIT_LOG: Deletion of system_audit_logs is prohibited.';
END//
DELIMITER ;
