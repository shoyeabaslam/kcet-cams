import { NextRequest, NextResponse } from 'next/server';
import pool from '@/database/db';

// GET: Fetch all document types
export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        code,
        name,
        is_required,
        display_order,
        created_at
      FROM document_types
      ORDER BY display_order, name`
    );

    return NextResponse.json({
      success: true,
      documentTypes: result.rows
    });
  } catch (error) {
    console.error('Error fetching document types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document types' },
      { status: 500 }
    );
  }
}

// POST: Create new document type
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, is_required, display_order } = body;

    // Validate required fields
    if (!code || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert document type
    const insertQuery = `
      INSERT INTO document_types (code, name, is_required, display_order)
      VALUES ($1, $2, $3, $4)
      RETURNING id, code, name, is_required, display_order, created_at
    `;

    const result = await pool.query(insertQuery, [
      code.toUpperCase(),
      name,
      is_required ?? true,
      display_order ?? 0
    ]);

    return NextResponse.json({
      success: true,
      message: 'Document type created successfully',
      documentType: result.rows[0]
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating document type:', error);
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Document code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create document type' },
      { status: 500 }
    );
  }
}

// PUT: Update existing document type
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, code, name, is_required, display_order } = body;

    // Validate required fields
    if (!id || !code || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update document type
    const updateQuery = `
      UPDATE document_types 
      SET name = $1, is_required = $2, display_order = $3
      WHERE id = $4
      RETURNING id, code, name, is_required, display_order, created_at
    `;

    const result = await pool.query(updateQuery, [
      name,
      is_required ?? true,
      display_order ?? 0,
      id
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Document type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document type updated successfully',
      documentType: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error updating document type:', error);
    return NextResponse.json(
      { error: 'Failed to update document type' },
      { status: 500 }
    );
  }
}

