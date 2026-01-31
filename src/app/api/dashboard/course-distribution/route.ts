import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import db from '@/database/db';

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request as any);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Get course distribution
    const result = await db.query(`
      SELECT 
        c.course_name as name,
        COUNT(s.id) as value
      FROM courses c
      LEFT JOIN course_offerings co ON c.id = co.course_id
      LEFT JOIN students s ON s.course_offering_id = co.id
      WHERE c.is_active = true
      GROUP BY c.id, c.course_name
      ORDER BY value DESC
    `);

    // Define colors for courses
    const colors = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#bfdbfe', '#eff6ff', '#f0f9ff'];

    const distributionData = result.rows.map((row: any, index: number) => ({
      name: row.name,
      value: Number.parseInt(row.value),
      color: colors[index % colors.length]
    }));

    return NextResponse.json({ data: distributionData });
  } catch (error) {
    console.error('Error fetching course distribution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course distribution' },
      { status: 500 }
    );
  }
}
