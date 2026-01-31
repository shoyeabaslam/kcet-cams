import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/api-auth';
import pool from '@/database/db';

// GET /api/payments - Get all fee payments across all students
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Only AccountsOfficer, Admin, SuperAdmin, Principal, Director can view all payments
    const allowedRoles = ['AccountsOfficer', 'Admin', 'SuperAdmin', 'Principal', 'Director'];
    if (!allowedRoles.includes(authResult.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    const query = `
      SELECT 
        fp.id,
        fp.student_id,
        s.full_name as student_name,
        s.application_number,
        c.course_name,
        fp.amount_paid,
        fp.payment_mode,
        fp.payment_reference,
        fp.receipt_number,
        fp.payment_date,
        fp.notes,
        fp.recorded_at,
        u.username as recorded_by_name
      FROM fee_payments fp
      JOIN students s ON fp.student_id = s.id
      LEFT JOIN course_offerings co ON s.course_offering_id = co.id
      LEFT JOIN courses c ON co.course_id = c.id
      LEFT JOIN users u ON fp.recorded_by = u.id
      ORDER BY fp.payment_date DESC, fp.recorded_at DESC
    `;

    const result = await pool.query(query);

    return NextResponse.json({
      payments: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
