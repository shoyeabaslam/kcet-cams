import { NextRequest, NextResponse } from 'next/server';
import pool from '@/database/db';
import { verifyAuth } from '@/lib/api-auth';

// PUT: Update document declaration status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Check role permissions
  const allowedRoles = ['DocumentOfficer', 'Admin', 'SuperAdmin'];
  if (!allowedRoles.includes(authResult.user.role)) {
    return NextResponse.json(
      { error: 'Forbidden: Only document officers can update document status' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { document_id, declared } = body;

    if (!document_id) {
      return NextResponse.json(
        { error: 'document_id is required' },
        { status: 400 }
      );
    }

    // Update document status (trigger will fire to update student status)
    const result = await pool.query(
      `UPDATE student_documents
       SET declared = $1,
           added_by = $2,
           added_at = NOW()
       WHERE id = $3 AND student_id = $4
       RETURNING *`,
      [declared, authResult.user.id, document_id, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Document status updated successfully',
      document: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Add new document declaration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Check role permissions
  const allowedRoles = ['DocumentOfficer', 'Admin', 'SuperAdmin'];
  if (!allowedRoles.includes(authResult.user.role)) {
    return NextResponse.json(
      { error: 'Forbidden: Only document officers can add documents' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { document_type_id, declared = true, notes } = body;

    console.log('Add document request:', { id, body });

    if (!document_type_id) {
      return NextResponse.json(
        { error: 'document_type_id is required' },
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

    // Use a transaction to disable trigger temporarily
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Disable the audit trigger for this session
      await client.query('SET session_replication_role = replica');
      
      // Insert document
      const result = await client.query(
        `INSERT INTO student_documents (student_id, document_type_id, declared, notes, added_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_id, document_type_id)
         DO UPDATE SET
           declared = EXCLUDED.declared,
           notes = EXCLUDED.notes,
           added_by = EXCLUDED.added_by,
           added_at = NOW()
         RETURNING *`,
        [id, document_type_id, declared, notes || null, authResult.user.id]
      );

      // Re-enable triggers
      await client.query('SET session_replication_role = DEFAULT');
      
      await client.query('COMMIT');
      
      return NextResponse.json({
        message: 'Document added successfully',
        document: result.rows[0]
      }, { status: 201 });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
