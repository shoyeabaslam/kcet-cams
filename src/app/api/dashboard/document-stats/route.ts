import { NextRequest, NextResponse } from 'next/server';
import pool from '@/database/db';
import { verifyAuth } from '@/lib/api-auth';

// GET: Document Officer Dashboard Statistics
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Get document completion stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT s.id) as total_students,
        COUNT(DISTINCT CASE WHEN s.status IN ('DOCUMENTS_DECLARED', 'FEE_PENDING', 'FEE_PARTIAL', 'FEE_RECEIVED', 'ADMITTED') THEN s.id END) as complete_documents,
        COUNT(DISTINCT CASE WHEN s.status = 'DOCUMENTS_INCOMPLETE' THEN s.id END) as incomplete_documents,
        COUNT(DISTINCT CASE WHEN s.status = 'APPLICATION_ENTERED' THEN s.id END) as pending_documents
      FROM students s
      WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
    `);

    // Get students with incomplete documents
    const incompleteStudents = await pool.query(`
      SELECT 
        s.id,
        s.application_number,
        s.full_name,
        s.status,
        c.course_code,
        COUNT(CASE WHEN dt.is_required = true AND sd.id IS NULL THEN 1 END) as missing_required,
        ARRAY_AGG(
          CASE 
            WHEN dt.is_required = true AND sd.id IS NULL 
            THEN dt.name 
          END
        ) FILTER (WHERE dt.is_required = true AND sd.id IS NULL) as missing_docs
      FROM students s
      LEFT JOIN course_offerings co ON s.course_offering_id = co.id
      LEFT JOIN courses c ON co.course_id = c.id
      CROSS JOIN document_types dt
      LEFT JOIN student_documents sd ON sd.student_id = s.id AND sd.document_type_id = dt.id AND sd.declared = true
      WHERE s.status IN ('APPLICATION_ENTERED', 'DOCUMENTS_INCOMPLETE')
      GROUP BY s.id, s.application_number, s.full_name, s.status, c.course_code
      HAVING COUNT(CASE WHEN dt.is_required = true AND sd.id IS NULL THEN 1 END) > 0
      ORDER BY s.created_at DESC
      LIMIT 10
    `);

    // Get document type completion stats
    const docTypeStats = await pool.query(`
      SELECT 
        dt.name,
        dt.code,
        dt.is_required,
        COUNT(DISTINCT s.id) as total_students,
        COUNT(DISTINCT CASE WHEN sd.declared = true THEN sd.student_id END) as declared_count,
        COUNT(DISTINCT CASE WHEN sd.declared = false OR sd.id IS NULL THEN s.id END) as pending_count
      FROM document_types dt
      CROSS JOIN students s
      LEFT JOIN student_documents sd ON sd.document_type_id = dt.id AND sd.student_id = s.id
      WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY dt.id, dt.name, dt.code, dt.is_required
      ORDER BY dt.display_order, dt.name
    `);

    // Get recent document activities (last 7 days)
    const recentActivities = await pool.query(`
      SELECT 
        sd.id,
        sd.declared,
        sd.added_at,
        s.application_number,
        s.full_name,
        dt.name as document_name,
        u.username as added_by
      FROM student_documents sd
      JOIN students s ON sd.student_id = s.id
      JOIN document_types dt ON sd.document_type_id = dt.id
      LEFT JOIN users u ON sd.added_by = u.id
      WHERE sd.added_at >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY sd.added_at DESC
      LIMIT 20
    `);

    // Calculate completion rate
    const stats = statsResult.rows[0];
    const totalWithDocs = parseInt(stats.complete_documents) + parseInt(stats.incomplete_documents);
    const completionRate = totalWithDocs > 0 
      ? Math.round((parseInt(stats.complete_documents) / totalWithDocs) * 100)
      : 0;

    return NextResponse.json({
      stats: {
        total_students: parseInt(stats.total_students),
        complete_documents: parseInt(stats.complete_documents),
        incomplete_documents: parseInt(stats.incomplete_documents),
        pending_documents: parseInt(stats.pending_documents),
        completion_rate: completionRate,
      },
      incompleteStudents: incompleteStudents.rows,
      docTypeStats: docTypeStats.rows,
      recentActivities: recentActivities.rows,
    });
  } catch (error) {
    console.error('Error fetching document officer stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
