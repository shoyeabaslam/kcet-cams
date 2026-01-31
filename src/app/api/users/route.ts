import { NextResponse } from 'next/server';
import pool from '@/database/db';

export async function GET() {
  try {
    const query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.is_active,
        u.created_at,
        u.updated_at,
        r.name as role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `;

    const result = await pool.query(query);

    return NextResponse.json({
      success: true,
      users: result.rows
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, role, is_active } = body;

    // Validate required fields
    if (!username || !email || !password || !role) {
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

    // Hash password (Note: In production, use bcrypt or similar)
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const insertQuery = `
      INSERT INTO users (username, email, password_hash, role_id, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, is_active, role_id, created_at
    `;

    const result = await pool.query(insertQuery, [
      username,
      email,
      passwordHash,
      roleId,
      is_active ?? true
    ]);

    const newUser = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        ...newUser,
        role
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user:', error);
    
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
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
