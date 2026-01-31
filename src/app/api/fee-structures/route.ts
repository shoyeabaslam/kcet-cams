import { NextRequest, NextResponse } from 'next/server';
import pool from '@/database/db';

// GET /api/fee-structures - Get all fee structures or by course offering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseOfferingId = searchParams.get('courseOfferingId');

    if (courseOfferingId) {
      // Get specific fee structure
      const query = `
        SELECT 
          fs.id,
          fs.course_offering_id,
          fs.total_fee,
          fs.currency,
          fs.is_active,
          fs.created_at,
          c.course_name,
          c.course_code,
          ay.year_label
        FROM fee_structures fs
        JOIN course_offerings co ON fs.course_offering_id = co.id
        JOIN courses c ON co.course_id = c.id
        JOIN academic_years ay ON co.academic_year_id = ay.id
        WHERE fs.course_offering_id = $1 AND fs.is_active = true
        LIMIT 1
      `;

      const result = await pool.query(query, [courseOfferingId]);

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Fee structure not found for this course offering' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        feeStructure: result.rows[0],
      });
    } else {
      // Get all fee structures
      const query = `
        SELECT 
          fs.id,
          fs.total_fee,
          fs.currency,
          fs.is_active,
          fs.created_at,
          c.id as course_id,
          c.course_code,
          c.course_name,
          ay.id as academic_year_id,
          ay.year_label as academic_year,
          co.id as course_offering_id
        FROM fee_structures fs
        JOIN course_offerings co ON fs.course_offering_id = co.id
        JOIN courses c ON co.course_id = c.id
        JOIN academic_years ay ON co.academic_year_id = ay.id
        ORDER BY ay.year_label DESC, c.course_code ASC
      `;

      const result = await pool.query(query);

      return NextResponse.json({
        success: true,
        feeStructures: result.rows
      });
    }
  } catch (error) {
    console.error('Error fetching fee structure:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fee structure' },
      { status: 500 }
    );
  }
}

// POST /api/fee-structures - Create new fee structure
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { course_id, academic_year_id, total_fee, is_active } = body;

    // Validate required fields
    if (!course_id || !academic_year_id || !total_fee) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First, check if course offering exists
    const offeringCheck = await pool.query(
      `SELECT id FROM course_offerings 
       WHERE course_id = $1 AND academic_year_id = $2`,
      [course_id, academic_year_id]
    );

    let courseOfferingId;

    if (offeringCheck.rows.length === 0) {
      // Create course offering if it doesn't exist
      const offeringResult = await pool.query(
        `INSERT INTO course_offerings (course_id, academic_year_id, intake_capacity, is_open)
         VALUES ($1, $2, 60, true)
         RETURNING id`,
        [course_id, academic_year_id]
      );
      courseOfferingId = offeringResult.rows[0].id;
    } else {
      courseOfferingId = offeringCheck.rows[0].id;
    }

    // Check if fee structure already exists for this offering
    const feeCheck = await pool.query(
      'SELECT id FROM fee_structures WHERE course_offering_id = $1',
      [courseOfferingId]
    );

    if (feeCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'Fee structure already exists for this course and academic year' },
        { status: 409 }
      );
    }

    // Insert fee structure
    const insertQuery = `
      INSERT INTO fee_structures (course_offering_id, total_fee, currency, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING id, course_offering_id, total_fee, currency, is_active, created_at
    `;

    const result = await pool.query(insertQuery, [
      courseOfferingId,
      total_fee,
      'INR',
      is_active ?? true
    ]);

    return NextResponse.json({
      success: true,
      message: 'Fee structure created successfully',
      feeStructure: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating fee structure:', error);
    return NextResponse.json(
      { error: 'Failed to create fee structure' },
      { status: 500 }
    );
  }
}

