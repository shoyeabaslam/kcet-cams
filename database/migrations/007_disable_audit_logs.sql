-- V7: Disable audit log triggers (to be implemented later)
-- Created: 2026-01-31
-- Reason: Simplify initial implementation, will add comprehensive audit logging later

-- =====================================================
-- Drop audit log triggers
-- =====================================================

DROP TRIGGER IF EXISTS trg_audit_students ON students;
DROP TRIGGER IF EXISTS trg_audit_fee_payments ON fee_payments;
DROP TRIGGER IF EXISTS trg_audit_student_documents ON student_documents;

-- Note: Keeping audit_logs table structure for future use
-- Note: Keeping create_audit_log() function for future use
-- Note: API endpoints have been updated to not insert into audit_logs manually

COMMENT ON TABLE audit_logs IS 'Audit trail table - triggers disabled, to be implemented later';
