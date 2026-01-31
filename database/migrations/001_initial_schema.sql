-- V1: Initial Schema for College Admission Management System
-- Created: 2026-01-29

-- =====================================================
-- ROLES & USERS
-- =====================================================

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    password_hash TEXT NOT NULL,
    role_id INT NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ACADEMIC SETUP
-- =====================================================

CREATE TABLE IF NOT EXISTS academic_years (
    id SERIAL PRIMARY KEY,
    year_label VARCHAR(20) UNIQUE NOT NULL, -- e.g. 2025-2026
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(150) NOT NULL,
    department VARCHAR(100),
    duration_years INT NOT NULL DEFAULT 4,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    academic_year_id INT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    intake_capacity INT NOT NULL DEFAULT 60,
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(course_id, academic_year_id)
);

-- =====================================================
-- FEE MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
    total_fee NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- STUDENT MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    category VARCHAR(50), -- General, OBC, SC, ST
    email VARCHAR(150),
    phone VARCHAR(15),
    address TEXT,
    
    -- Academic Details
    previous_school VARCHAR(200),
    previous_board VARCHAR(100),
    previous_percentage NUMERIC(5,2),
    
    -- Course Assignment
    course_offering_id UUID REFERENCES course_offerings(id) ON DELETE SET NULL,
    academic_year_id INT REFERENCES academic_years(id) ON DELETE SET NULL,

    -- Status Management
    status VARCHAR(50) NOT NULL DEFAULT 'APPLICATION_ENTERED',
    -- Allowed: APPLICATION_ENTERED, DOCUMENTS_DECLARED, DOCUMENTS_INCOMPLETE, 
    --          FEE_PENDING, FEE_PARTIAL, FEE_RECEIVED, ADMITTED

    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- DOCUMENT MANAGEMENT (Declarative Only)
-- =====================================================

CREATE TABLE IF NOT EXISTS document_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_documents (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    document_type_id INT NOT NULL REFERENCES document_types(id) ON DELETE CASCADE,
    declared BOOLEAN DEFAULT TRUE,
    notes TEXT,
    added_by UUID REFERENCES users(id),
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, document_type_id)
);

-- =====================================================
-- FEE PAYMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount_paid NUMERIC(10,2) NOT NULL CHECK (amount_paid > 0),
    payment_mode VARCHAR(50) NOT NULL, -- Cash, Cheque, Online, DD
    payment_reference VARCHAR(100), -- Cheque no, transaction ID
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- FEE SUMMARY (Computed Table)
-- =====================================================

CREATE TABLE IF NOT EXISTS student_fee_summary (
    student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
    total_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_paid NUMERIC(10,2) DEFAULT 0,
    balance NUMERIC(10,2) GENERATED ALWAYS AS (total_fee - total_paid) STORED,
    fee_status VARCHAR(30) NOT NULL DEFAULT 'FEE_PENDING',
    -- Allowed: FEE_PENDING, FEE_PARTIAL, FEE_RECEIVED
    last_payment_date DATE,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- AUDIT & COMPLIANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, etc.
    entity VARCHAR(50) NOT NULL, -- students, fee_payments, documents, etc.
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS status_history (
    id BIGSERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    reason TEXT,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Student queries
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_course ON students(course_offering_id);
CREATE INDEX IF NOT EXISTS idx_students_academic_year ON students(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at);

-- Fee queries
CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_date ON fee_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_fee_summary_status ON student_fee_summary(fee_status);

-- Document queries
CREATE INDEX IF NOT EXISTS idx_student_documents_student ON student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_type ON student_documents(document_type_id);

-- Audit queries
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);

-- Status history
CREATE INDEX IF NOT EXISTS idx_status_history_student ON status_history(student_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_at ON status_history(changed_at);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE roles IS 'System roles: SuperAdmin, Admin, AdmissionStaff, DocumentOfficer, AccountsOfficer, Principal, Director';
COMMENT ON TABLE students IS 'Main student admission records - status automatically updated based on documents and fees';
COMMENT ON TABLE student_documents IS 'Declarative only - no file storage, just declaration that document was submitted';
COMMENT ON TABLE fee_payments IS 'Immutable fee payment records - no updates/deletes allowed';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for compliance';
COMMENT ON COLUMN students.status IS 'Auto-updated based on document and fee status - no manual approval';
