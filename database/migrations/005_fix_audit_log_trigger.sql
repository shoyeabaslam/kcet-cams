-- V5: Fix audit log trigger to handle non-UUID entity IDs
-- Created: 2026-01-31
-- Issue: student_documents.id is SERIAL (integer) but audit_logs.entity_id is UUID
-- Solution: Cast entity_id to text in trigger function to support both UUID and integer IDs

-- =====================================================
-- FUNCTION: Create audit log (FIXED)
-- =====================================================

CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_action VARCHAR(100);
    v_entity VARCHAR(50);
BEGIN
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        v_action := 'CREATE';
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
    END IF;

    -- Get entity name
    v_entity := TG_TABLE_NAME;

    -- Insert audit log with entity_id cast to text
    -- This allows both UUID (students, fee_payments) and SERIAL (student_documents) IDs to be stored
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (action, entity, entity_id, old_value, created_at)
        VALUES (v_action, v_entity, OLD.id::text, row_to_json(OLD), NOW());
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (action, entity, entity_id, new_value, created_at)
        VALUES (v_action, v_entity, NEW.id::text, row_to_json(NEW), NOW());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (action, entity, entity_id, old_value, new_value, created_at)
        VALUES (v_action, v_entity, NEW.id::text, row_to_json(OLD), row_to_json(NEW), NOW());
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- No need to recreate triggers - they automatically use the updated function
-- The existing triggers (trg_audit_students, trg_audit_fee_payments, trg_audit_student_documents)
-- will now work correctly with the fixed function
