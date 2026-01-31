import { NextRequest, NextResponse } from 'next/server';
import pool from '@/database/db';
import { verifyAuth } from '@/lib/api-auth';

// POST: Record a new payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Check role permissions
  const allowedRoles = ['AccountsOfficer', 'Admin', 'SuperAdmin'];
  if (!allowedRoles.includes(authResult.user.role)) {
    return NextResponse.json(
      { error: 'Forbidden: Only accounts officers can record payments' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      amount_paid,
      payment_mode,
      payment_reference,
      receipt_number,
      payment_date,
      notes
    } = body;

    // Validation
    if (!amount_paid || amount_paid <= 0) {
      return NextResponse.json(
        { error: 'Valid amount_paid is required' },
        { status: 400 }
      );
    }

    if (!payment_mode || !receipt_number) {
      return NextResponse.json(
        { error: 'payment_mode and receipt_number are required' },
        { status: 400 }
      );
    }

    // Verify student exists
    const studentCheck = await pool.query(
      'SELECT id FROM students WHERE id = $1',
      [id]
    );

    if (studentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if receipt number already exists
    const receiptCheck = await pool.query(
      'SELECT id FROM fee_payments WHERE receipt_number = $1',
      [receipt_number]
    );

    if (receiptCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'Receipt number already exists' },
        { status: 400 }
      );
    }

    // Insert payment
    const result = await pool.query(
      `INSERT INTO fee_payments (
        student_id,
        amount_paid,
        payment_mode,
        payment_reference,
        receipt_number,
        payment_date,
        notes,
        recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        id,
        amount_paid,
        payment_mode,
        payment_reference || null,
        receipt_number,
        payment_date || new Date().toISOString().split('T')[0],
        notes || null,
        authResult.user.id
      ]
    );

    return NextResponse.json({
      message: 'Payment recorded successfully',
      payment: result.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
