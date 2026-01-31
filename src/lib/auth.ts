import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars'
);

export interface JWTPayload {
  id: string; // User ID (same as userId, but consistent naming)
  userId: string;
  username: string;
  email: string;
  role: string;
  roleId: number;
}

/**
 * Generate JWT token
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify password
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Get user role permissions
 */
export function getRolePermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    SuperAdmin: ['*'], // All permissions
    Admin: ['users:read', 'users:write', 'settings:read', 'settings:write'],
    AdmissionStaff: ['students:read', 'students:write', 'students:assign-course'],
    DocumentOfficer: ['students:read', 'documents:read', 'documents:write'],
    AccountsOfficer: ['students:read', 'fees:read', 'fees:write'],
    Principal: ['dashboard:read', 'reports:read', 'students:read'],
    Director: ['dashboard:read', 'reports:read', 'audit:read', 'students:read'],
  };

  return permissions[role] || [];
}

/**
 * Check if user has permission
 */
export function hasPermission(userRole: string, requiredPermission: string): boolean {
  const permissions = getRolePermissions(userRole);
  
  // SuperAdmin has all permissions
  if (permissions.includes('*')) {
    return true;
  }

  return permissions.includes(requiredPermission);
}
