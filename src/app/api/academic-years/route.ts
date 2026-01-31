import { NextResponse } from 'next/server';
import pool from '@/database/db';

export async function GET() {
  try {
    const query = `
      SELECT 
        id,
        year_label,
        start_date,
        end_date,
        is_active,
        created_at
      FROM academic_years
      ORDER BY start_date DESC
    `;

    const result = await pool.query(query);

    return NextResponse.json({
      success: true,
      academicYears: result.rows
    });

  } catch (error) {
    console.error('Error fetching academic years:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academic years' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { year_label, start_date, end_date, is_active } = body;

    // Validate required fields
    if (!year_label || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If setting as active, deactivate all others
    if (is_active) {
      await pool.query('UPDATE academic_years SET is_active = false');
    }

    // Insert academic year
    const insertQuery = `
      INSERT INTO academic_years (year_label, start_date, end_date, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING id, year_label, start_date, end_date, is_active, created_at
    `;

    const result = await pool.query(insertQuery, [
      year_label,
      start_date,
      end_date,
      is_active ?? false
    ]);

    return NextResponse.json({
      success: true,
      message: 'Academic year created successfully',
      academicYear: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating academic year:', error);
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Academic year already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create academic year' },
      { status: 500 }
    );
  }
}
