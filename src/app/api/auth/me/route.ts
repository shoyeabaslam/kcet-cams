import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '../../../../../database/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get fresh user data from database
    const result = await query(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.is_active,
        r.id as role_id,
        r.name as role_name,
        r.description as role_description
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1`,
      [payload.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role_name,
        roleId: user.role_id,
        roleDescription: user.role_description,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
