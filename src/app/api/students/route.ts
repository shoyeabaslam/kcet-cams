import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import pool from '@/database/db';

// GET /api/students - Get all students with filters
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const course = searchParams.get('course');
    const academicYear = searchParams.get('academicYear');
    const paymentStatus = searchParams.get('paymentStatus');
    const search = searchParams.get('search');
    const limit = Number.parseInt(searchParams.get('limit') || '100');
    const offset = Number.parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT 
        s.id as student_id,
        s.application_number,
        s.full_name,
        s.email,
        s.phone,
        s.status,
        s.date_of_birth,
        s.gender,
        s.category,
        s.address,
        s.created_at,
        c.course_name,
        c.course_code,
        co.academic_year_id,
        ay.year_label as year_name,
        sfs.total_fee,
        sfs.total_paid as paid_amount,
        sfs.balance as pending_amount,
        sfs.fee_status as payment_status,
        (SELECT COUNT(*) FROM student_documents sd WHERE sd.student_id = s.id AND sd.declared = false) as pending_docs,
        (SELECT COUNT(*) FROM student_documents sd WHERE sd.student_id = s.id) as total_docs
      FROM students s
      LEFT JOIN course_offerings co ON s.course_offering_id = co.id
      LEFT JOIN courses c ON co.course_id = c.id
      LEFT JOIN academic_years ay ON co.academic_year_id = ay.id
      LEFT JOIN student_fee_summary sfs ON s.id = sfs.student_id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND s.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (course) {
      query += ` AND c.id = $${paramIndex}`;
      params.push(course);
      paramIndex++;
    }

    if (academicYear) {
      query += ` AND ay.id = $${paramIndex}`;
      params.push(academicYear);
      paramIndex++;
    }

    if (paymentStatus) {
      query += ` AND sfs.fee_status = $${paramIndex}`;
      params.push(paymentStatus);
      paramIndex++;
    }

    if (search) {
      query += ` AND (
        s.full_name ILIKE $${paramIndex} OR 
        s.email ILIKE $${paramIndex} OR
        s.phone ILIKE $${paramIndex} OR
        s.application_number ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM students s WHERE 1=1';
    const countParams: (string | number)[] = [];
    let countParamIndex = 1;

    if (status) {
      countQuery += ` AND s.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (course) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM course_offerings co 
        WHERE co.id = s.course_offering_id 
        AND co.course_id = $${countParamIndex}
      )`;
      countParams.push(course);
      countParamIndex++;
    }

    if (academicYear) {
      countQuery += ` AND s.academic_year_id = $${countParamIndex}`;
      countParams.push(academicYear);
      countParamIndex++;
    }

    if (paymentStatus) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM student_fee_summary sfs 
        WHERE sfs.student_id = s.id 
        AND sfs.fee_status = $${countParamIndex}
      )`;
      countParams.push(paymentStatus);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (
        s.full_name ILIKE $${countParamIndex} OR 
        s.email ILIKE $${countParamIndex} OR
        s.phone ILIKE $${countParamIndex} OR
        s.application_number ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = Number.parseInt(countResult.rows[0].count);

    return NextResponse.json({
      students: result.rows,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST /api/students - Create new student
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Only Admission Staff, Admin, and SuperAdmin can create students
    const allowedRoles = ['AdmissionStaff', 'Admin', 'SuperAdmin'];
    if (!allowedRoles.includes(authResult.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      fullName,
      dateOfBirth,
      gender,
      category,
      email,
      phone,
      address,
      previousSchool,
      previousBoard,
      previousPercentage,
      courseOfferingId,
    } = body;

    // Get academic year from course offering
    const offeringResult = await pool.query(
      'SELECT academic_year_id FROM course_offerings WHERE id = $1',
      [courseOfferingId]
    );

    if (offeringResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid course offering' },
        { status: 400 }
      );
    }

    const academicYearId = offeringResult.rows[0].academic_year_id;

    // Generate application number
    const year = new Date().getFullYear();
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM students WHERE EXTRACT(YEAR FROM created_at) = $1',
      [year]
    );
    const count = Number.parseInt(countResult.rows[0].count) + 1;
    const applicationNumber = `APP${year}${String(count).padStart(4, '0')}`;

    const result = await pool.query(
      `INSERT INTO students (
        application_number, full_name, date_of_birth, gender, category,
        email, phone, address,
        previous_school, previous_board, previous_percentage,
        course_offering_id, academic_year_id,
        status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        applicationNumber,
        fullName,
        dateOfBirth,
        gender,
        category || 'General',
        email,
        phone,
        address,
        previousSchool,
        previousBoard,
        previousPercentage ? Number.parseFloat(previousPercentage) : null,
        courseOfferingId,
        academicYearId,
        'APPLICATION_ENTERED',
        authResult.user.id,
      ]
    );

    return NextResponse.json({
      message: 'Student created successfully',
      student: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
