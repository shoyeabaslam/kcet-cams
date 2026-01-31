import { NextRequest, NextResponse } from 'next/server';
import pool from '@/database/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if course exists
    const checkQuery = `
      SELECT id, course_code, course_name, is_active 
      FROM courses 
      WHERE id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const course = checkResult.rows[0];

    // Check if course has course offerings (linked to academic years)
    const offeringsQuery = `
      SELECT COUNT(*) as count 
      FROM course_offerings 
      WHERE course_id = $1
    `;
    const offeringsResult = await pool.query(offeringsQuery, [id]);
    const offeringsCount = Number.parseInt(offeringsResult.rows[0].count);

    if (offeringsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete course with existing course offerings. Please delete associated fee structures first.' },
        { status: 400 }
      );
    }

    // Check if course has enrolled students
    const studentsQuery = `
      SELECT COUNT(*) as count 
      FROM students 
      WHERE course_id = $1
    `;
    const studentsResult = await pool.query(studentsQuery, [id]);
    const studentsCount = Number.parseInt(studentsResult.rows[0].count);

    if (studentsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete course with enrolled students' },
        { status: 400 }
      );
    }

    // Delete the course
    await pool.query('DELETE FROM courses WHERE id = $1', [id]);

    return NextResponse.json({
      message: `Course "${course.course_name}" deleted successfully`
    });

  } catch (error) {
    console.error('Delete course error:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
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

    // Check if course exists
    const checkQuery = `
      SELECT id, course_code, course_name, is_active 
      FROM courses 
      WHERE id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Update the course status
    const updateQuery = `
      UPDATE courses 
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [is_active, id]);

    return NextResponse.json({
      message: `Course ${is_active ? 'activated' : 'deactivated'} successfully`,
      course: result.rows[0]
    });

  } catch (error) {
    console.error('Toggle course status error:', error);
    return NextResponse.json(
      { error: 'Failed to update course status' },
      { status: 500 }
    );
  }
}
