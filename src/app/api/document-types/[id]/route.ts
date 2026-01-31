import { NextRequest, NextResponse } from 'next/server';
import pool from '@/database/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if document type exists
    const checkQuery = `
      SELECT id, code, name 
      FROM document_types 
      WHERE id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Document type not found' },
        { status: 404 }
      );
    }

    const documentType = checkResult.rows[0];

    // Check if document type is used in student documents
    const documentsQuery = `
      SELECT COUNT(*) as count 
      FROM student_documents 
      WHERE document_type_id = $1
    `;
    const documentsResult = await pool.query(documentsQuery, [id]);
    const documentsCount = Number.parseInt(documentsResult.rows[0].count);

    if (documentsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete document type that is used in student documents' },
        { status: 400 }
      );
    }

    // Delete the document type
    await pool.query('DELETE FROM document_types WHERE id = $1', [id]);

    return NextResponse.json({
      message: `Document type "${documentType.name}" deleted successfully`
    });

  } catch (error) {
    console.error('Delete document type error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document type' },
      { status: 500 }
    );
  }
}
