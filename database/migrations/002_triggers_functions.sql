-- V2: Triggers and Functions for Automatic Status Updates
-- Created: 2026-01-29

-- =====================================================
-- FUNCTION: Update student status based on documents
-- =====================================================

CREATE OR REPLACE FUNCTION update_student_document_status()
RETURNS TRIGGER AS $$
DECLARE
    required_count INT;
    declared_count INT;
    student_status VARCHAR(50);
BEGIN
    -- Count required documents
    SELECT COUNT(*) INTO required_count
    FROM document_types
    WHERE is_required = TRUE;

    -- Count declared documents for this student
    SELECT COUNT(*) INTO declared_count
    FROM student_documents sd
    JOIN document_types dt ON sd.document_type_id = dt.id
    WHERE sd.student_id = COALESCE(NEW.student_id, OLD.student_id)
      AND dt.is_required = TRUE
      AND sd.declared = TRUE;

    -- Get current student status
    SELECT status INTO student_status
    FROM students
    WHERE id = COALESCE(NEW.student_id, OLD.student_id);

    -- Update status based on document completion
    IF declared_count >= required_count THEN
        UPDATE students
        SET status = 'DOCUMENTS_DECLARED',
            updated_at = NOW()
        WHERE id = COALESCE(NEW.student_id, OLD.student_id)
          AND status = 'APPLICATION_ENTERED';
    ELSIF declared_count > 0 AND declared_count < required_count THEN
        UPDATE students
        SET status = 'DOCUMENTS_INCOMPLETE',
            updated_at = NOW()
        WHERE id = COALESCE(NEW.student_id, OLD.student_id)
          AND status IN ('APPLICATION_ENTERED', 'DOCUMENTS_DECLARED');
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for document status updates
DROP TRIGGER IF EXISTS trg_update_document_status ON student_documents;
CREATE TRIGGER trg_update_document_status
AFTER INSERT OR UPDATE OR DELETE ON student_documents
FOR EACH ROW
EXECUTE FUNCTION update_student_document_status();

-- =====================================================
-- FUNCTION: Update fee summary after payment
-- =====================================================

CREATE OR REPLACE FUNCTION update_fee_summary_after_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_total_paid NUMERIC(10,2);
    v_total_fee NUMERIC(10,2);
    v_fee_status VARCHAR(30);
    v_student_status VARCHAR(50);
    v_documents_complete BOOLEAN;
BEGIN
    -- Calculate total paid
    SELECT COALESCE(SUM(amount_paid), 0) INTO v_total_paid
    FROM fee_payments
    WHERE student_id = NEW.student_id;

    -- Get total fee
    SELECT fs.total_fee INTO v_total_fee
    FROM students s
    JOIN course_offerings co ON s.course_offering_id = co.id
    JOIN fee_structures fs ON fs.course_offering_id = co.id
    WHERE s.id = NEW.student_id
      AND fs.is_active = TRUE
    LIMIT 1;

    -- Default if no fee structure found
    v_total_fee := COALESCE(v_total_fee, 0);

    -- Determine fee status
    IF v_total_paid = 0 THEN
        v_fee_status := 'FEE_PENDING';
    ELSIF v_total_paid >= v_total_fee THEN
        v_fee_status := 'FEE_RECEIVED';
    ELSE
        v_fee_status := 'FEE_PARTIAL';
    END IF;

    -- Update or insert fee summary
    INSERT INTO student_fee_summary (student_id, total_fee, total_paid, fee_status, last_payment_date, updated_at)
    VALUES (NEW.student_id, v_total_fee, v_total_paid, v_fee_status, NEW.payment_date, NOW())
    ON CONFLICT (student_id)
    DO UPDATE SET
        total_paid = v_total_paid,
        fee_status = v_fee_status,
        last_payment_date = NEW.payment_date,
        updated_at = NOW();

    -- Check if documents are complete
    SELECT EXISTS(
        SELECT 1 FROM students
        WHERE id = NEW.student_id
          AND status IN ('DOCUMENTS_DECLARED', 'DOCUMENTS_INCOMPLETE', 'FEE_PENDING', 'FEE_PARTIAL', 'FEE_RECEIVED')
    ) INTO v_documents_complete;

    -- Update student status based on fee status
    SELECT status INTO v_student_status FROM students WHERE id = NEW.student_id;

    IF v_fee_status = 'FEE_RECEIVED' AND v_student_status IN ('DOCUMENTS_DECLARED', 'FEE_PARTIAL', 'FEE_RECEIVED') THEN
        -- Mark as ADMITTED if fee fully paid and documents declared
        UPDATE students
        SET status = 'ADMITTED',
            updated_at = NOW()
        WHERE id = NEW.student_id;
    ELSIF v_fee_status = 'FEE_PARTIAL' AND v_student_status NOT IN ('ADMITTED') THEN
        UPDATE students
        SET status = 'FEE_PARTIAL',
            updated_at = NOW()
        WHERE id = NEW.student_id;
    ELSIF v_fee_status = 'FEE_PENDING' AND v_student_status IN ('APPLICATION_ENTERED', 'DOCUMENTS_DECLARED', 'DOCUMENTS_INCOMPLETE') THEN
        UPDATE students
        SET status = CASE
            WHEN status = 'DOCUMENTS_DECLARED' THEN 'FEE_PENDING'
            WHEN status = 'DOCUMENTS_INCOMPLETE' THEN 'DOCUMENTS_INCOMPLETE'
            ELSE status
        END,
        updated_at = NOW()
        WHERE id = NEW.student_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for fee payment updates
DROP TRIGGER IF EXISTS trg_update_fee_summary ON fee_payments;
CREATE TRIGGER trg_update_fee_summary
AFTER INSERT ON fee_payments
FOR EACH ROW
EXECUTE FUNCTION update_fee_summary_after_payment();

-- =====================================================
-- FUNCTION: Log status changes
-- =====================================================

CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO status_history (student_id, old_status, new_status, changed_at)
        VALUES (NEW.id, OLD.status, NEW.status, NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for status history
DROP TRIGGER IF EXISTS trg_log_status_change ON students;
CREATE TRIGGER trg_log_status_change
AFTER UPDATE ON students
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_status_change();

-- =====================================================
-- FUNCTION: Create audit log
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

    -- Insert audit log
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (action, entity, entity_id, old_value, created_at)
        VALUES (v_action, v_entity, OLD.id, row_to_json(OLD), NOW());
        RETURN OLD;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (action, entity, entity_id, new_value, created_at)
        VALUES (v_action, v_entity, NEW.id, row_to_json(NEW), NOW());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (action, entity, entity_id, old_value, new_value, created_at)
        VALUES (v_action, v_entity, NEW.id, row_to_json(OLD), row_to_json(NEW), NOW());
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Audit triggers for critical tables
DROP TRIGGER IF EXISTS trg_audit_students ON students;
CREATE TRIGGER trg_audit_students
AFTER INSERT OR UPDATE OR DELETE ON students
FOR EACH ROW
EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS trg_audit_fee_payments ON fee_payments;
CREATE TRIGGER trg_audit_fee_payments
AFTER INSERT OR UPDATE OR DELETE ON fee_payments
FOR EACH ROW
EXECUTE FUNCTION create_audit_log();

DROP TRIGGER IF EXISTS trg_audit_student_documents ON student_documents;
CREATE TRIGGER trg_audit_student_documents
AFTER INSERT OR UPDATE OR DELETE ON student_documents
FOR EACH ROW
EXECUTE FUNCTION create_audit_log();

-- =====================================================
-- FUNCTION: Auto-update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
CREATE TRIGGER trg_students_updated_at
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_courses_updated_at ON courses;
CREATE TRIGGER trg_courses_updated_at
BEFORE UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
