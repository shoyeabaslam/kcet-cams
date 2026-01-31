-- V3: Seed Data for College Admission Management System
-- Created: 2026-01-29

-- =====================================================
-- SEED: Roles (V1 Only)
-- =====================================================

INSERT INTO roles (name, description) VALUES
('SuperAdmin', 'System administrator with full access to user and master data management'),
('Admin', 'Administrator who can manage users and configure master data'),
('AdmissionStaff', 'Staff who create and manage student profiles and course assignments'),
('DocumentOfficer', 'Officer who declares document submissions (declarative only)'),
('AccountsOfficer', 'Officer who records fee payments and generates receipts'),
('Principal', 'Read-only monitoring role for daily admission summaries'),
('Director', 'Read-only institutional oversight for metrics and audit logs')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SEED: Document Types
-- =====================================================

INSERT INTO document_types (code, name, is_required, display_order) VALUES
('SSC', 'SSC/10th Certificate', true, 1),
('INTER', 'Intermediate/12th Certificate', true, 2),
('TC', 'Transfer Certificate', true, 3),
('MC', 'Migration Certificate', false, 4),
('CC', 'Character Certificate', true, 5),
('CASTE', 'Caste Certificate', false, 6),
('INCOME', 'Income Certificate', false, 7),
('AADHAR', 'Aadhar Card Copy', true, 8),
('PHOTO', 'Passport Size Photos', true, 9),
('EAMCET', 'EAMCET/Entrance Rank Card', false, 10)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SEED: Academic Year
-- =====================================================

INSERT INTO academic_years (year_label, start_date, end_date, is_active) VALUES
('2025-2026', '2025-08-01', '2026-07-31', true),
('2024-2025', '2024-08-01', '2025-07-31', false)
ON CONFLICT (year_label) DO NOTHING;

-- =====================================================
-- SEED: Courses (Indian Engineering College)
-- =====================================================

INSERT INTO courses (course_code, course_name, department, duration_years, is_active) VALUES
('CSE', 'Computer Science and Engineering', 'CSE', 4, true),
('ECE', 'Electronics and Communication Engineering', 'ECE', 4, true),
('EEE', 'Electrical and Electronics Engineering', 'EEE', 4, true),
('MECH', 'Mechanical Engineering', 'MECH', 4, true),
('CIVIL', 'Civil Engineering', 'CIVIL', 4, true),
('IT', 'Information Technology', 'IT', 4, true),
('AI-ML', 'Artificial Intelligence and Machine Learning', 'CSE', 4, true),
('DS', 'Data Science', 'CSE', 4, true)
ON CONFLICT (course_code) DO NOTHING;

-- =====================================================
-- SEED: Course Offerings (2025-2026)
-- =====================================================

DO $$
DECLARE
    v_academic_year_id INT;
    v_course_id UUID;
BEGIN
    -- Get the active academic year
    SELECT id INTO v_academic_year_id FROM academic_years WHERE year_label = '2025-2026';

    -- Create course offerings for all active courses
    FOR v_course_id IN SELECT id FROM courses WHERE is_active = true
    LOOP
        INSERT INTO course_offerings (course_id, academic_year_id, intake_capacity, is_open)
        VALUES (v_course_id, v_academic_year_id, 60, true)
        ON CONFLICT (course_id, academic_year_id) DO NOTHING;
    END LOOP;
END $$;

-- =====================================================
-- SEED: Fee Structures (2025-2026)
-- =====================================================

DO $$
DECLARE
    v_offering RECORD;
    v_fee_amount NUMERIC(10,2);
BEGIN
    FOR v_offering IN
        SELECT co.id as offering_id, c.course_code
        FROM course_offerings co
        JOIN courses c ON co.course_id = c.id
        JOIN academic_years ay ON co.academic_year_id = ay.id
        WHERE ay.year_label = '2025-2026'
    LOOP
        -- Set different fees based on course popularity (realistic Indian college fees)
        CASE v_offering.course_code
            WHEN 'CSE' THEN v_fee_amount := 85000.00;
            WHEN 'AI-ML' THEN v_fee_amount := 85000.00;
            WHEN 'DS' THEN v_fee_amount := 85000.00;
            WHEN 'IT' THEN v_fee_amount := 80000.00;
            WHEN 'ECE' THEN v_fee_amount := 75000.00;
            WHEN 'EEE' THEN v_fee_amount := 75000.00;
            WHEN 'MECH' THEN v_fee_amount := 70000.00;
            WHEN 'CIVIL' THEN v_fee_amount := 70000.00;
            ELSE v_fee_amount := 75000.00;
        END CASE;

        INSERT INTO fee_structures (course_offering_id, total_fee, currency, is_active)
        VALUES (v_offering.offering_id, v_fee_amount, 'INR', true);
    END LOOP;
END $$;

-- =====================================================
-- SEED: Default Users (for development/testing)
-- Note: In production, these should be created via admin interface
-- Password: 'password123' (hashed using bcrypt)
-- =====================================================

-- Sample password hash for 'password123' (bcrypt)
-- In production, use proper password hashing library
DO $$
DECLARE
    v_superadmin_role_id INT;
    v_admin_role_id INT;
    v_admission_role_id INT;
    v_document_role_id INT;
    v_accounts_role_id INT;
    v_principal_role_id INT;
    v_director_role_id INT;
BEGIN
    -- Get role IDs
    SELECT id INTO v_superadmin_role_id FROM roles WHERE name = 'SuperAdmin';
    SELECT id INTO v_admin_role_id FROM roles WHERE name = 'Admin';
    SELECT id INTO v_admission_role_id FROM roles WHERE name = 'AdmissionStaff';
    SELECT id INTO v_document_role_id FROM roles WHERE name = 'DocumentOfficer';
    SELECT id INTO v_accounts_role_id FROM roles WHERE name = 'AccountsOfficer';
    SELECT id INTO v_principal_role_id FROM roles WHERE name = 'Principal';
    SELECT id INTO v_director_role_id FROM roles WHERE name = 'Director';

    -- Insert sample users (only for development)
    -- TODO: Replace with proper password hashing in production
    INSERT INTO users (username, email, password_hash, role_id, is_active) VALUES
    ('superadmin', 'superadmin@college.edu', '$2b$10$./WbutGeXUM6EdRAFAhr9uN7y7E/sjA78j7diMX4.5BWD6/40fdFe', v_superadmin_role_id, true),
    ('admin', 'admin@college.edu', '$2b$10$./WbutGeXUM6EdRAFAhr9uN7y7E/sjA78j7diMX4.5BWD6/40fdFe', v_admin_role_id, true),
    ('admission_staff', 'admission@college.edu', '$2b$10$./WbutGeXUM6EdRAFAhr9uN7y7E/sjA78j7diMX4.5BWD6/40fdFe', v_admission_role_id, true),
    ('doc_officer', 'documents@college.edu', '$2b$10$./WbutGeXUM6EdRAFAhr9uN7y7E/sjA78j7diMX4.5BWD6/40fdFe', v_document_role_id, true),
    ('accounts_officer', 'accounts@college.edu', '$2b$10$./WbutGeXUM6EdRAFAhr9uN7y7E/sjA78j7diMX4.5BWD6/40fdFe', v_accounts_role_id, true),
    ('principal', 'principal@college.edu', '$2b$10$./WbutGeXUM6EdRAFAhr9uN7y7E/sjA78j7diMX4.5BWD6/40fdFe', v_principal_role_id, true),
    ('director', 'director@college.edu', '$2b$10$./WbutGeXUM6EdRAFAhr9uN7y7E/sjA78j7diMX4.5BWD6/40fdFe', v_director_role_id, true)
    ON CONFLICT (username) DO NOTHING;
END $$;

-- =====================================================
-- INFORMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Seed data completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Default users created (password: password123):';
    RAISE NOTICE '  - superadmin@college.edu';
    RAISE NOTICE '  - admin@college.edu';
    RAISE NOTICE '  - admission@college.edu';
    RAISE NOTICE '  - documents@college.edu';
    RAISE NOTICE '  - accounts@college.edu';
    RAISE NOTICE '  - principal@college.edu';
    RAISE NOTICE '  - director@college.edu';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Academic Year: 2025-2026';
    RAISE NOTICE 'Courses: 8 (CSE, ECE, EEE, MECH, CIVIL, IT, AI-ML, DS)';
    RAISE NOTICE 'Document Types: 10';
    RAISE NOTICE '========================================';
END $$;
