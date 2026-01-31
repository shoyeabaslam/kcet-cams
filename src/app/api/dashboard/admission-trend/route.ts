import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import db from '@/database/db';

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request as any);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Get admission trend for last 7 days
    const result = await db.query(`
      SELECT 
        TO_CHAR(DATE(created_at), 'Mon DD') as date,
        COUNT(*) as students
      FROM students
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);

    const trendData = result.rows.map((row: any) => ({
      date: row.date,
      students: Number.parseInt(row.students)
    }));

    return NextResponse.json({ data: trendData });
  } catch (error) {
    console.error('Error fetching admission trend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admission trend' },
      { status: 500 }
    );
  }
}
