import { NextRequest, NextResponse } from 'next/server';
import pool from '@/database/db';
import { verifyAuth } from '@/lib/api-auth';

// GET: Fetch fee adjustment for a student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id: studentId } = await params;

  try {
    const result = await pool.query(
      `SELECT 
        fa.*,
        u.username as applied_by_name
      FROM fee_adjustments fa
      LEFT JOIN users u ON fa.applied_by = u.id
      WHERE fa.student_id = $1 AND fa.is_active = TRUE
      ORDER BY fa.created_at DESC
      LIMIT 1`,
      [studentId]
    );

    return NextResponse.json({
      success: true,
      adjustment: result.rows[0] || null
    });

  } catch (error) {
    console.error('Error fetching fee adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fee adjustment' },
      { status: 500 }
    );
  }
}

// POST: Create a new fee adjustment (AccountsOfficer only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;
  const { id: studentId } = await params;

  // Only AccountsOfficer can apply fee adjustments
  if (user.role !== 'AccountsOfficer') {
    return NextResponse.json(
      { error: 'Only Accounts Officer can apply fee adjustments' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { adjusted_fee, adjustment_reason, director_approval_note } = body;

    // Validate required fields
    if (!adjusted_fee || !adjustment_reason) {
      return NextResponse.json(
        { error: 'Adjusted fee and adjustment reason are required' },
        { status: 400 }
      );
    }

    // Validate adjustment reason is not empty
    if (adjustment_reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Adjustment reason cannot be empty' },
        { status: 400 }
      );
    }

    // Get student's current fee information
    const studentQuery = await pool.query(
      `SELECT 
        s.id,
        sfs.total_fee,
        sfs.total_paid,
        sfs.fee_status
      FROM students s
      LEFT JOIN student_fee_summary sfs ON s.id = sfs.student_id
      WHERE s.id = $1`,
      [studentId]
    );

    if (studentQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const student = studentQuery.rows[0];
    const originalFee = Number(student.total_fee) || 0;
    const totalPaid = Number(student.total_paid) || 0;
    const adjustedFeeNum = Number(adjusted_fee);

    // Business rule validations
    if (adjustedFeeNum < 0) {
      return NextResponse.json(
        { error: 'Adjusted fee cannot be negative' },
        { status: 400 }
      );
    }

    if (adjustedFeeNum >= originalFee) {
      return NextResponse.json(
        { error: 'Adjusted fee must be less than original fee' },
        { status: 400 }
      );
    }

    // Check if student has already made partial payments
    if (totalPaid > 0) {
      return NextResponse.json(
        { error: 'Cannot apply discount after partial payment has been made' },
        { status: 400 }
      );
    }

    // Check if an active adjustment already exists
    const existingAdjustment = await pool.query(
      'SELECT id FROM fee_adjustments WHERE student_id = $1 AND is_active = TRUE',
      [studentId]
    );

    if (existingAdjustment.rows.length > 0) {
      return NextResponse.json(
        { error: 'An active fee adjustment already exists for this student. Only one discount is allowed.' },
        { status: 400 }
      );
    }

    // Create the fee adjustment
    const insertResult = await pool.query(
      `INSERT INTO fee_adjustments (
        student_id,
        original_fee,
        adjusted_fee,
        adjustment_reason,
        director_approval_note,
        applied_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        student_id,
        original_fee,
        adjusted_fee,
        discount_amount,
        discount_percentage,
        adjustment_reason,
        director_approval_note,
        applied_by,
        applied_at,
        is_active,
        created_at`,
      [
        studentId,
        originalFee,
        adjustedFeeNum,
        adjustment_reason.trim(),
        director_approval_note?.trim() || null,
        user.id
      ]
    );

    const adjustment = insertResult.rows[0];

    // Log to audit trail
    await pool.query(
      `INSERT INTO audit_logs (
        user_id,
        action,
        entity,
        entity_id,
        old_value,
        new_value
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.id,
        'FEE_ADJUSTMENT_APPLIED',
        'fee_adjustments',
        adjustment.id,
        JSON.stringify({ original_fee: originalFee }),
        JSON.stringify({
          adjusted_fee: adjustedFeeNum,
          discount_amount: adjustment.discount_amount,
          discount_percentage: adjustment.discount_percentage,
          reason: adjustment_reason.trim()
        })
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Fee adjustment applied successfully',
      adjustment
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating fee adjustment:', error);
    
    // Handle unique constraint violation (only one active adjustment)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'An active fee adjustment already exists for this student' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create fee adjustment' },
      { status: 500 }
    );
  }
}
