-- Quick Reference SQL Queries
-- College Admission Management System V1

-- =====================================================
-- USEFUL QUERIES FOR DEVELOPMENT & TESTING
-- =====================================================

-- View all roles and their users
SELECT 
    r.name as role_name,
    u.username,
    u.email,
    u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id
ORDER BY r.id, u.username;

-- View all courses with offerings
SELECT 
    c.course_code,
    c.course_name,
    c.department,
    ay.year_label,
    co.intake_capacity,
    co.is_open,
    fs.total_fee
FROM courses c
JOIN course_offerings co ON c.id = co.course_id
JOIN academic_years ay ON co.academic_year_id = ay.id
LEFT JOIN fee_structures fs ON co.id = fs.course_offering_id
WHERE c.is_active = true
ORDER BY c.course_code;

-- View students by status
SELECT 
    status,
    COUNT(*) as count
FROM students
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'APPLICATION_ENTERED' THEN 1
        WHEN 'DOCUMENTS_INCOMPLETE' THEN 2
        WHEN 'DOCUMENTS_DECLARED' THEN 3
        WHEN 'FEE_PENDING' THEN 4
        WHEN 'FEE_PARTIAL' THEN 5
        WHEN 'FEE_RECEIVED' THEN 6
        WHEN 'ADMITTED' THEN 7
        ELSE 99
    END;

-- View student details with course and fee info
SELECT 
    s.application_number,
    s.full_name,
    s.status,
    c.course_code,
    ay.year_label,
    sfs.total_fee,
    sfs.total_paid,
    sfs.balance,
    sfs.fee_status
FROM students s
LEFT JOIN course_offerings co ON s.course_offering_id = co.id
LEFT JOIN courses c ON co.course_id = c.id
LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
LEFT JOIN student_fee_summary sfs ON s.id = sfs.student_id
ORDER BY s.created_at DESC;

-- View document completion status
SELECT 
    s.application_number,
    s.full_name,
    s.status,
    COUNT(sd.id) as documents_submitted,
    (SELECT COUNT(*) FROM document_types WHERE is_required = true) as required_documents
FROM students s
LEFT JOIN student_documents sd ON s.id = sd.student_id
GROUP BY s.id, s.application_number, s.full_name, s.status
ORDER BY s.created_at DESC;

-- View fee payment history for a student
-- Replace 'APP2025001' with actual application number
SELECT 
    fp.receipt_number,
    fp.amount_paid,
    fp.payment_mode,
    fp.payment_date,
    fp.payment_reference,
    u.username as recorded_by,
    fp.recorded_at
FROM fee_payments fp
JOIN students s ON fp.student_id = s.id
JOIN users u ON fp.recorded_by = u.id
WHERE s.application_number = 'APP2025001'
ORDER BY fp.payment_date DESC;

-- Daily admission summary
SELECT 
    DATE(created_at) as admission_date,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN status = 'ADMITTED' THEN 1 END) as admitted_count,
    COUNT(CASE WHEN status = 'FEE_PENDING' THEN 1 END) as pending_fee,
    COUNT(CASE WHEN status = 'DOCUMENTS_INCOMPLETE' THEN 1 END) as pending_documents
FROM students
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY admission_date DESC;

-- Fee collection summary by course
SELECT 
    c.course_code,
    c.course_name,
    COUNT(DISTINCT s.id) as total_students,
    SUM(sfs.total_fee) as total_fee_expected,
    SUM(sfs.total_paid) as total_collected,
    SUM(sfs.balance) as total_pending
FROM courses c
JOIN course_offerings co ON c.id = co.course_id
JOIN students s ON co.id = s.course_offering_id
LEFT JOIN student_fee_summary sfs ON s.id = sfs.student_id
GROUP BY c.id, c.course_code, c.course_name
ORDER BY total_collected DESC;

-- Recent audit activities
SELECT 
    al.action,
    al.entity,
    u.username,
    al.created_at
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 50;

-- Student status change history
-- Replace 'APP2025001' with actual application number
SELECT 
    sh.old_status,
    sh.new_status,
    sh.reason,
    u.username as changed_by,
    sh.changed_at
FROM status_history sh
JOIN students s ON sh.student_id = s.id
LEFT JOIN users u ON sh.changed_by = u.id
WHERE s.application_number = 'APP2025001'
ORDER BY sh.changed_at ASC;

-- =====================================================
-- ADMIN QUERIES
-- =====================================================

-- Create a new user (example)
-- Note: Password hash should be generated using bcrypt
/*
INSERT INTO users (username, email, password_hash, role_id, is_active)
VALUES (
    'new_staff',
    'newstaff@college.edu',
    '$2a$10$hashedpassword',
    (SELECT id FROM roles WHERE name = 'AdmissionStaff'),
    true
);
*/

-- Deactivate a user
/*
UPDATE users 
SET is_active = false 
WHERE username = 'old_staff';
*/

-- View all migrations
SELECT * FROM schema_migrations ORDER BY executed_at;

-- Check database size
SELECT 
    pg_size_pretty(pg_database_size('ams_db')) as database_size;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- DASHBOARD QUERIES (Principal/Director Views)
-- =====================================================

-- Today's admission summary
SELECT 
    COUNT(*) as total_applications_today,
    COUNT(CASE WHEN status = 'ADMITTED' THEN 1 END) as admitted_today,
    SUM(CASE 
        WHEN status = 'ADMITTED' THEN 
            (SELECT total_paid FROM student_fee_summary WHERE student_id = students.id)
        ELSE 0 
    END) as fees_collected_today
FROM students
WHERE DATE(created_at) = CURRENT_DATE;

-- Course-wise admission status
SELECT 
    c.course_code,
    c.course_name,
    co.intake_capacity,
    COUNT(s.id) as total_applications,
    COUNT(CASE WHEN s.status = 'ADMITTED' THEN 1 END) as admitted,
    co.intake_capacity - COUNT(CASE WHEN s.status = 'ADMITTED' THEN 1 END) as seats_available
FROM courses c
JOIN course_offerings co ON c.id = co.course_id
JOIN academic_years ay ON co.academic_year_id = ay.id
LEFT JOIN students s ON co.id = s.course_offering_id
WHERE ay.is_active = true
GROUP BY c.id, c.course_code, c.course_name, co.intake_capacity
ORDER BY c.course_code;

-- Fee collection overview
SELECT 
    COUNT(*) as total_students_with_fees,
    SUM(total_fee) as total_expected,
    SUM(total_paid) as total_collected,
    SUM(balance) as total_pending,
    ROUND((SUM(total_paid) / NULLIF(SUM(total_fee), 0) * 100), 2) as collection_percentage
FROM student_fee_summary;

-- Document completion rate
SELECT 
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT CASE 
        WHEN s.status IN ('DOCUMENTS_DECLARED', 'FEE_RECEIVED', 'ADMITTED') 
        THEN s.id 
    END) as students_with_complete_docs,
    ROUND(
        COUNT(DISTINCT CASE 
            WHEN s.status IN ('DOCUMENTS_DECLARED', 'FEE_RECEIVED', 'ADMITTED') 
            THEN s.id 
        END)::NUMERIC / NULLIF(COUNT(DISTINCT s.id), 0) * 100, 
    2) as completion_percentage
FROM students s;
