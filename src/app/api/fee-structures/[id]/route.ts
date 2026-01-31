import { NextRequest, NextResponse } from 'next/server';
import pool from '@/database/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if fee structure exists
    const checkQuery = `
      SELECT fs.id, c.course_name, ay.year_label 
      FROM fee_structures fs
      JOIN course_offerings co ON fs.course_offering_id = co.id
      JOIN courses c ON co.course_id = c.id
      JOIN academic_years ay ON co.academic_year_id = ay.id
      WHERE fs.id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Fee structure not found' },
        { status: 404 }
      );
    }

    const feeStructure = checkResult.rows[0];

    // Check if fee structure has payment records
    const paymentsQuery = `
      SELECT COUNT(*) as count 
      FROM payments 
      WHERE fee_structure_id = $1
    `;
    const paymentsResult = await pool.query(paymentsQuery, [id]);
    const paymentsCount = Number.parseInt(paymentsResult.rows[0].count);

    if (paymentsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete fee structure with existing payment records' },
        { status: 400 }
      );
    }

    // Delete the fee structure
    await pool.query('DELETE FROM fee_structures WHERE id = $1', [id]);

    return NextResponse.json({
      message: `Fee structure for "${feeStructure.course_name} - ${feeStructure.year_label}" deleted successfully`
    });

  } catch (error) {
    console.error('Delete fee structure error:', error);
    return NextResponse.json(
      { error: 'Failed to delete fee structure' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { is_active } = body;

    // Check if fee structure exists
    const checkQuery = `
      SELECT id 
      FROM fee_structures 
      WHERE id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Fee structure not found' },
        { status: 404 }
      );
    }

    // Update the fee structure status
    const updateQuery = `
      UPDATE fee_structures 
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [is_active, id]);

    return NextResponse.json({
      message: `Fee structure ${is_active ? 'activated' : 'deactivated'} successfully`,
      feeStructure: result.rows[0]
    });

  } catch (error) {
    console.error('Toggle fee structure status error:', error);
    return NextResponse.json(
      { error: 'Failed to update fee structure status' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { total_fee, is_active } = body;

    // Check if fee structure exists
    const checkQuery = `
      SELECT id 
      FROM fee_structures 
      WHERE id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Fee structure not found' },
        { status: 404 }
      );
    }

    // Update the fee structure
    const updateQuery = `
      UPDATE fee_structures 
      SET total_fee = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3 
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [total_fee, is_active, id]);

    return NextResponse.json({
      message: 'Fee structure updated successfully',
      feeStructure: result.rows[0]
    });

  } catch (error) {
    console.error('Update fee structure error:', error);
    return NextResponse.json(
      { error: 'Failed to update fee structure' },
      { status: 500 }
    );
  }
}
