import { NextRequest, NextResponse } from 'next/server';
import pool from '@/database/db';

// GET /api/course-offerings - Get all course offerings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const academicYearId = searchParams.get('academicYearId');
    const isOpen = searchParams.get('isOpen');

    let query = `
      SELECT 
        co.id,
        co.course_id,
        co.academic_year_id,
        co.intake_capacity,
        co.is_open,
        co.created_at,
        c.course_code,
        c.course_name,
        c.department,
        c.duration_years,
        ay.year_label,
        ay.start_date,
        ay.end_date,
        ay.is_active as year_is_active,
        COALESCE(enrolled.count, 0) as enrolled_count
      FROM course_offerings co
      JOIN courses c ON co.course_id = c.id
      JOIN academic_years ay ON co.academic_year_id = ay.id
      LEFT JOIN (
        SELECT course_offering_id, COUNT(*) as count
        FROM students
        GROUP BY course_offering_id
      ) enrolled ON co.id = enrolled.course_offering_id
      WHERE 1=1
    `;

    const params: (string | boolean)[] = [];
    let paramIndex = 1;

    if (courseId) {
      query += ` AND co.course_id = $${paramIndex}`;
      params.push(courseId);
      paramIndex++;
    }

    if (academicYearId) {
      query += ` AND co.academic_year_id = $${paramIndex}`;
      params.push(academicYearId);
      paramIndex++;
    }

    if (isOpen !== null) {
      query += ` AND co.is_open = $${paramIndex}`;
      params.push(isOpen === 'true');
      paramIndex++;
    }

    query += ` ORDER BY ay.start_date DESC, c.course_name ASC`;

    const result = await pool.query(query, params);

    return NextResponse.json({
      courseOfferings: result.rows,
    });
  } catch (error) {
    console.error('Error fetching course offerings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course offerings' },
      { status: 500 }
    );
  }
}

// POST /api/course-offerings - Create new course offering
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { course_id, academic_year_id, intake_capacity, is_open } = body;

    // Validate required fields
    if (!course_id || !academic_year_id) {
      return NextResponse.json(
        { error: 'Course ID and Academic Year ID are required' },
        { status: 400 }
      );
    }

    // Check if offering already exists
    const existingQuery = `
      SELECT id FROM course_offerings 
      WHERE course_id = $1 AND academic_year_id = $2
    `;
    const existingResult = await pool.query(existingQuery, [course_id, academic_year_id]);

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Course offering already exists for this course and academic year' },
        { status: 409 }
      );
    }

    // Create course offering
    const insertQuery = `
      INSERT INTO course_offerings (course_id, academic_year_id, intake_capacity, is_open)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      course_id,
      academic_year_id,
      intake_capacity || 60,
      is_open === undefined ? true : is_open,
    ]);

    return NextResponse.json({
      message: 'Course offering created successfully',
      courseOffering: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating course offering:', error);
    return NextResponse.json(
      { error: 'Failed to create course offering' },
      { status: 500 }
    );
  }
}
