import { NextRequest, NextResponse } from 'next/server';
import pool from '@/database/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { username, email, password, role, is_active } = body;

    // Validate required fields
    if (!username || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get role_id from role name
    const roleQuery = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      [role]
    );

    if (roleQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const roleId = roleQuery.rows[0].id;

    // Build update query dynamically
    let updateQuery = `
      UPDATE users 
      SET username = $1, email = $2, role_id = $3, is_active = $4, updated_at = NOW()
    `;
    
    const queryParams: any[] = [username, email, roleId, is_active ?? true];

    // If password is provided, update it too
    if (password && password.trim() !== '') {
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);
      updateQuery += `, password_hash = $5 WHERE id = $6`;
      queryParams.push(passwordHash, userId);
    } else {
      updateQuery += ` WHERE id = $5`;
      queryParams.push(userId);
    }

    updateQuery += ` RETURNING id, username, email, is_active, role_id, created_at, updated_at`;

    const result = await pool.query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updatedUser = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: {
        ...updatedUser,
        role
      }
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      if (error.constraint === 'users_username_key') {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 409 }
        );
      }
      if (error.constraint === 'users_email_key') {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
