'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="text-6xl">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-600">
          You don't have permission to access this page.
        </p>
        {user && (
          <p className="text-sm text-gray-500">
            Logged in as: <strong>{user.username}</strong> ({user.role})
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
          <Button onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
