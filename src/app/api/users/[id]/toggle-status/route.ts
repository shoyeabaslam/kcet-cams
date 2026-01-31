import { NextRequest, NextResponse } from 'next/server';
import pool from '@/database/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Get the current user status
    const userQuery = await pool.query(
      'SELECT id, username, is_active, role_id FROM users WHERE id = $1',
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userQuery.rows[0];

    // Check if user is SuperAdmin (role_id = 1)
    const roleQuery = await pool.query(
      'SELECT name FROM roles WHERE id = $1',
      [user.role_id]
    );

    if (roleQuery.rows.length > 0 && roleQuery.rows[0].name === 'SuperAdmin') {
      return NextResponse.json(
        { error: 'Cannot deactivate SuperAdmin users' },
        { status: 403 }
      );
    }

    // Toggle the status
    const newStatus = !user.is_active;
    
    const updateQuery = await pool.query(
      `UPDATE users 
       SET is_active = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, username, email, is_active, role_id, created_at, updated_at`,
      [newStatus, userId]
    );

    const updatedUser = updateQuery.rows[0];

    // Get role name for response
    const roleData = await pool.query(
      'SELECT name FROM roles WHERE id = $1',
      [updatedUser.role_id]
    );

    const response = {
      ...updatedUser,
      role: roleData.rows[0]?.name || 'Unknown'
    };

    return NextResponse.json({
      success: true,
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      user: response
    });

  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle user status' },
      { status: 500 }
    );
  }
}
