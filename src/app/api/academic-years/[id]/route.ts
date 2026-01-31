import { NextRequest, NextResponse } from 'next/server';
import pool from '@/database/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if academic year exists
    const checkQuery = await pool.query(
      'SELECT id, year_label, is_active FROM academic_years WHERE id = $1',
      [id]
    );

    if (checkQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 404 }
      );
    }

    const academicYear = checkQuery.rows[0];

    // Prevent deletion of active academic year
    if (academicYear.is_active) {
      return NextResponse.json(
        { error: 'Cannot delete active academic year. Please deactivate it first.' },
        { status: 400 }
      );
    }

    // Check if there are any course offerings using this academic year
    const offeringsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM course_offerings WHERE academic_year_id = $1',
      [id]
    );

    if (Number.parseInt(offeringsCheck.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete academic year with existing course offerings' },
        { status: 400 }
      );
    }

    // Check if there are any students enrolled in this academic year
    const studentsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM students WHERE academic_year_id = $1',
      [id]
    );

    if (Number.parseInt(studentsCheck.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete academic year with enrolled students' },
        { status: 400 }
      );
    }

    // Delete the academic year
    await pool.query('DELETE FROM academic_years WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Academic year deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting academic year:', error);
    return NextResponse.json(
      { error: 'Failed to delete academic year' },
      { status: 500 }
    );
  }
}
