import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import db from '@/database/db';

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request as any);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  try {
    // Get statistics based on user role
    const stats: Record<string, number | string> = {};

    // Total students count
    const studentsResult = await db.query(
      'SELECT COUNT(*) as count FROM students'
    );
    stats.totalStudents = Number.parseInt(studentsResult.rows[0]?.count || '0');

    // Students admitted today
    const todayResult = await db.query(
      `SELECT COUNT(*) as count FROM students 
       WHERE DATE(created_at) = CURRENT_DATE`
    );
    stats.admittedToday = Number.parseInt(todayResult.rows[0]?.count || '0');

    // Pending documents count (documents not declared)
    const pendingDocsResult = await db.query(
      `SELECT COUNT(DISTINCT student_id) as count 
       FROM student_documents 
       WHERE declared = false`
    );
    stats.pendingDocuments = Number.parseInt(pendingDocsResult.rows[0]?.count || '0');

    // Total fees collected
    const feesCollectedResult = await db.query(
      `SELECT COALESCE(SUM(amount_paid), 0) as total 
       FROM fee_payments`
    );
    stats.totalFeesCollected = Number.parseInt(feesCollectedResult.rows[0]?.total || '0');

    // Pending fees
    const pendingFeesResult = await db.query(
      `SELECT COALESCE(SUM(balance), 0) as total 
       FROM student_fee_summary 
       WHERE balance > 0`
    );
    stats.pendingFees = Number.parseInt(pendingFeesResult.rows[0]?.total || '0');

    // Total users (for admin only)
    if (user.role === 'SuperAdmin' || user.role === 'Admin') {
      const usersResult = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE is_active = true'
      );
      stats.totalUsers = Number.parseInt(usersResult.rows[0]?.count || '0');
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
