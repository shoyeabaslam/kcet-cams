import { NextRequest, NextResponse } from 'next/server';
import pool from '@/database/db';

// GET /api/courses - Get all courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeOfferings = searchParams.get('includeOfferings') === 'true';

    if (includeOfferings) {
      // Get courses with current year offerings
      const result = await pool.query(
        `SELECT 
          c.id as course_id,
          c.course_code,
          c.course_name,
          c.department,
          c.duration_years,
          c.is_active,
          co.id as offering_id,
          co.intake_capacity as total_seats,
          co.intake_capacity as available_seats,
          ay.year_label as year_name,
          ay.id as academic_year_id,
          (SELECT COUNT(*) FROM students s WHERE s.course_offering_id = co.id) as enrolled_students
        FROM courses c
        LEFT JOIN course_offerings co ON c.id = co.course_id
        LEFT JOIN academic_years ay ON co.academic_year_id = ay.id
        WHERE (ay.is_active = true OR ay.is_active IS NULL) AND c.is_active = true
        ORDER BY c.course_name`
      );

      return NextResponse.json({ courses: result.rows });
    } else {
      // Get all courses
      const result = await pool.query(
        `SELECT 
          id,
          course_code,
          course_name,
          department,
          duration_years,
          is_active,
          created_at,
          updated_at
        FROM courses 
        ORDER BY course_code ASC`
      );

      return NextResponse.json({ success: true, courses: result.rows });
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create new course
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { course_code, course_name, department, duration_years, is_active } = body;

    // Validate required fields
    if (!course_code || !course_name || !department) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert course
    const insertQuery = `
      INSERT INTO courses (course_code, course_name, department, duration_years, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, course_code, course_name, department, duration_years, is_active, created_at, updated_at
    `;

    const result = await pool.query(insertQuery, [
      course_code.toUpperCase(),
      course_name,
      department,
      duration_years ?? 4,
      is_active ?? true
    ]);

    return NextResponse.json({
      success: true,
      message: 'Course created successfully',
      course: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating course:', error);
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

// PUT /api/courses - Update existing course
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, course_code, course_name, department, duration_years, is_active } = body;

    // Validate required fields
    if (!id || !course_code || !course_name || !department) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update course
    const updateQuery = `
      UPDATE courses 
      SET course_name = $1, department = $2, duration_years = $3, is_active = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING id, course_code, course_name, department, duration_years, is_active, created_at, updated_at
    `;

    const result = await pool.query(updateQuery, [
      course_name,
      department,
      duration_years ?? 4,
      is_active ?? true,
      id
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      course: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

