import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import db from '@/database/db';

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request as any);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // TODO: Implement activity tracking once audit_logs is ready
    // For now, return recent student updates as activities
    const result = await db.query(`
      SELECT 
        u.username,
        'Student Update' as action,
        s.updated_at as created_at,
        EXTRACT(EPOCH FROM (NOW() - s.updated_at)) as seconds_ago
      FROM students s
      LEFT JOIN users u ON u.id = s.created_by
      WHERE s.updated_at > NOW() - INTERVAL '7 days'
      ORDER BY s.updated_at DESC
      LIMIT 10
    `);

    const activities = result.rows.map((row: any) => {
      const secondsAgo = Number.parseInt(row.seconds_ago);
      let timeAgo;
      
      if (secondsAgo < 60) {
        timeAgo = 'Just now';
      } else if (secondsAgo < 3600) {
        const minutes = Math.floor(secondsAgo / 60);
        timeAgo = `${minutes} min ago`;
      } else if (secondsAgo < 86400) {
        const hours = Math.floor(secondsAgo / 3600);
        timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else {
        const days = Math.floor(secondsAgo / 86400);
        timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
      }

      return {
        user: row.username,
        action: row.action,
        time: timeAgo
      };
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
