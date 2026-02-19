import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import pool from '@/database/db';

// GET /api/students/[id] - Get single student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT 
        s.id as student_id,
        s.application_number,
        s.full_name,
        s.date_of_birth,
        s.gender,
        s.category,
        s.email,
        s.phone,
        s.address,
        s.previous_school,
        s.previous_board,
        s.previous_percentage,
        s.course_offering_id,
        s.status,
        s.created_at,
        s.updated_at,
        c.course_name,
        c.course_code,
        c.duration_years,
        co.academic_year_id,
        co.intake_capacity as total_seats,
        ay.year_label as year_name,
        ay.start_date,
        ay.end_date,
        sfs.total_fee,
        sfs.total_paid as paid_amount,
        sfs.balance as pending_amount,
        sfs.fee_status as payment_status,
        u.username as created_by_name
      FROM students s
      LEFT JOIN course_offerings co ON s.course_offering_id = co.id
      LEFT JOIN courses c ON co.course_id = c.id
      LEFT JOIN academic_years ay ON co.academic_year_id = ay.id
      LEFT JOIN student_fee_summary sfs ON s.id = sfs.student_id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get documents
    const docsResult = await pool.query(
      `SELECT 
        sd.id,
        sd.student_id,
        sd.document_type_id,
        sd.declared,
        sd.notes,
        sd.added_at,
        dt.name as document_name,
        dt.is_required as is_mandatory
      FROM student_documents sd
      JOIN document_types dt ON sd.document_type_id = dt.id
      WHERE sd.student_id = $1
      ORDER BY dt.is_required DESC, dt.name`,
      [id]
    );

    // Get fee payments
    const paymentsResult = await pool.query(
      `SELECT 
        fp.id,
        fp.student_id,
        fp.amount_paid,
        fp.payment_mode,
        fp.payment_reference,
        fp.receipt_number,
        fp.payment_date,
        fp.notes,
        fp.recorded_at
      FROM fee_payments fp
      WHERE fp.student_id = $1
      ORDER BY fp.payment_date DESC`,
      [id]
    );

    // Get status history
    const historyResult = await pool.query(
      `SELECT 
        sh.id,
        sh.student_id,
        sh.old_status,
        sh.new_status,
        sh.reason,
        sh.changed_at,
        u.username as changed_by_name
      FROM status_history sh
      LEFT JOIN users u ON sh.changed_by = u.id
      WHERE sh.student_id = $1
      ORDER BY sh.changed_at DESC`,
      [id]
    );

    return NextResponse.json({
      student: result.rows[0],
      documents: docsResult.rows,
      payments: paymentsResult.rows,
      statusHistory: historyResult.rows,
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

// PUT /api/students/[id] - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Only Admission Staff, Admin, and SuperAdmin can update students
    const allowedRoles = ['AdmissionStaff', 'Admin', 'SuperAdmin'];
    if (!allowedRoles.includes(authResult.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;
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
      status,
    } = body;

    // AdmissionStaff cannot update status - only Admin and SuperAdmin can
    const canUpdateStatus = ['Admin', 'SuperAdmin'].includes(authResult.user.role);
    
    let result;
    
    if (canUpdateStatus && status) {
      // Admin/SuperAdmin can update all fields including status
      result = await pool.query(
        `UPDATE students SET
          full_name = $1,
          date_of_birth = $2,
          gender = $3,
          category = $4,
          email = $5,
          phone = $6,
          address = $7,
          previous_school = $8,
          previous_board = $9,
          previous_percentage = $10,
          course_offering_id = $11,
          status = $12,
          updated_at = NOW()
        WHERE id = $13
        RETURNING *`,
        [
          fullName,
          dateOfBirth,
          gender,
          category,
          email,
          phone,
          address,
          previousSchool,
          previousBoard,
          previousPercentage ? Number.parseFloat(previousPercentage) : null,
          courseOfferingId,
          status,
          id,
        ]
      );
    } else {
      // AdmissionStaff can update all fields EXCEPT status
      result = await pool.query(
        `UPDATE students SET
          full_name = $1,
          date_of_birth = $2,
          gender = $3,
          category = $4,
          email = $5,
          phone = $6,
          address = $7,
          previous_school = $8,
          previous_board = $9,
          previous_percentage = $10,
          course_offering_id = $11,
          updated_at = NOW()
        WHERE id = $12
        RETURNING *`,
        [
          fullName,
          dateOfBirth,
          gender,
          category,
          email,
          phone,
          address,
          previousSchool,
          previousBoard,
          previousPercentage ? Number.parseFloat(previousPercentage) : null,
          courseOfferingId,
          id,
        ]
      );
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Student updated successfully',
      student: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

// DELETE /api/students/[id] - Delete student (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;

    // Check if user has permission to delete
    // Admin and SuperAdmin can always delete
    // AdmissionStaff can only delete if status is APPLICATION_ENTERED
    const allowedRoles = ['Admin', 'SuperAdmin', 'AdmissionStaff'];
    if (!allowedRoles.includes(authResult.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete students' },
        { status: 403 }
      );
    }

    // If AdmissionStaff, check the student status first
    if (authResult.user.role === 'AdmissionStaff') {
      const statusCheck = await pool.query(
        'SELECT status FROM students WHERE id = $1',
        [id]
      );

      if (statusCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      const studentStatus = statusCheck.rows[0].status;
      if (studentStatus !== 'APPLICATION_ENTERED') {
        return NextResponse.json(
          { error: 'AdmissionStaff can only delete students in APPLICATION_ENTERED status' },
          { status: 403 }
        );
      }
    }

    // Delete related records first (due to foreign keys)
    await pool.query('DELETE FROM student_documents WHERE student_id = $1', [id]);
    await pool.query('DELETE FROM fee_payments WHERE student_id = $1', [id]);
    await pool.query('DELETE FROM student_fee_summary WHERE student_id = $1', [id]);
    await pool.query('DELETE FROM status_history WHERE student_id = $1', [id]);

    const result = await pool.query(
      'DELETE FROM students WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Student deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}
