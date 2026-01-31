import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import db from '@/database/db';

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request as any);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Get fee collection for last 6 months
    const result = await db.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', payment_date), 'Mon') as month,
        ROUND(SUM(amount_paid)::numeric / 100000, 1) as amount
      FROM fee_payments
      WHERE payment_date >= CURRENT_DATE - INTERVAL '5 months'
      GROUP BY DATE_TRUNC('month', payment_date)
      ORDER BY DATE_TRUNC('month', payment_date) ASC
    `);

    const collectionData = result.rows.map((row: any) => ({
      month: row.month,
      amount: Number.parseFloat(row.amount)
    }));

    return NextResponse.json({ data: collectionData });
  } catch (error) {
    console.error('Error fetching fee collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fee collection data' },
      { status: 500 }
    );
  }
}
