import { NextRequest, NextResponse } from 'next/server';
import pool from '@/database/db';
import { verifyAuth } from '@/lib/api-auth';

interface DocumentSubmission {
  document_type_id: number;
  notes?: string;
}

// POST: Bulk submit multiple documents at once
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
      { error: 'Forbidden: Only document officers can submit documents' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { documents } = body as { documents: DocumentSubmission[] };

    if (!Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: 'documents array is required' },
        { status: 400 }
      );
    }

    // Verify student exists
    const studentCheck = await pool.query(
      'SELECT id, full_name, status FROM students WHERE id = $1',
      [id]
    );

    if (studentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const student = studentCheck.rows[0];
    const oldStatus = student.status;

    // Use transaction to insert multiple documents
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const insertedDocs = [];
      
      // Insert each document with individual notes
      for (const doc of documents) {
        const result = await client.query(
          `INSERT INTO student_documents (student_id, document_type_id, declared, notes, added_by)
           VALUES ($1, $2, TRUE, $3, $4)
           ON CONFLICT (student_id, document_type_id)
           DO UPDATE SET
             declared = TRUE,
             notes = EXCLUDED.notes,
             added_by = EXCLUDED.added_by,
             added_at = NOW()
           RETURNING *`,
          [id, doc.document_type_id, doc.notes || null, authResult.user.id]
        );
        
        insertedDocs.push(result.rows[0]);
      }
      
      // Calculate new status based on document completion
      const docStatsResult = await client.query(`
        SELECT 
          COUNT(DISTINCT dt.id) as total_required,
          COUNT(DISTINCT CASE WHEN sd.declared = TRUE THEN sd.document_type_id END) as declared_count
        FROM document_types dt
        LEFT JOIN student_documents sd ON sd.document_type_id = dt.id AND sd.student_id = $1
        WHERE dt.is_required = TRUE
      `, [id]);

      const { total_required, declared_count } = docStatsResult.rows[0];
      let newStatus = oldStatus;

      // Update status based on document completion
      if (['APPLICATION_ENTERED', 'DOCUMENTS_INCOMPLETE', 'DOCUMENTS_DECLARED'].includes(oldStatus)) {
        if (declared_count >= total_required) {
          // All required documents declared → move to FEE_PENDING
          newStatus = 'FEE_PENDING';
        } else if (declared_count > 0) {
          // Some documents declared → DOCUMENTS_INCOMPLETE
          newStatus = 'DOCUMENTS_INCOMPLETE';
        } else {
          // No documents → stay at APPLICATION_ENTERED
          newStatus = 'APPLICATION_ENTERED';
        }

        // Update student status if changed
        if (newStatus !== oldStatus) {
          await client.query(
            `UPDATE students SET status = $1, updated_at = NOW() WHERE id = $2`,
            [newStatus, id]
          );
        }
      }
      
      await client.query('COMMIT');
      client.release();

      return NextResponse.json({
        message: `Successfully submitted ${insertedDocs.length} document(s)`,
        documents: insertedDocs,
        student: {
          id: student.id,
          name: student.full_name,
          old_status: oldStatus,
          new_status: newStatus
        },
        stats: {
          total_required: Number.parseInt(total_required),
          declared_count: Number.parseInt(declared_count)
        }
      }, { status: 201 });
      
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('Error bulk submitting documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
