import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, hasPermission, type JWTPayload } from './auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Verify authentication and return result or error response
 */
export async function verifyAuth(
  request: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  return { user: payload };
}

/**
 * Middleware to verify authentication in API routes
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  return { user: payload };
}

/**
 * Middleware to verify authentication and check permissions
 */
export async function authenticateAndAuthorize(
  request: NextRequest,
  requiredPermission?: string
): Promise<{ user: JWTPayload } | NextResponse> {
  const authResult = await authenticateRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // Check permission if required
  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  return { user };
}

/**
 * Middleware to check if user has specific role
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<{ user: JWTPayload } | NextResponse> {
  const authResult = await authenticateRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: `Access restricted to: ${allowedRoles.join(', ')}` },
      { status: 403 }
    );
  }

  return { user };
}
