'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SystemToolsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    // Only SuperAdmin can access system tools
    if (user && user.role !== 'SuperAdmin') {
      router.push('/unauthorized');
    }
  }, [user, router]);

  const handleBackup = async () => {
    setIsProcessing(true);
    setMessage(null);
    
    // Simulate backup process
    setTimeout(() => {
      setMessage({
        type: 'success',
        text: 'Database backup completed successfully! Backup saved as: backup_2026-02-01_14-30.sql'
      });
      setIsProcessing(false);
    }, 3000);
  };

  const handleClearCache = () => {
    setIsProcessing(true);
    setMessage(null);
    
    setTimeout(() => {
      setMessage({
        type: 'success',
        text: 'System cache cleared successfully!'
      });
      setIsProcessing(false);
    }, 1500);
  };

  const handleOptimizeDB = () => {
    setIsProcessing(true);
    setMessage(null);
    
    setTimeout(() => {
      setMessage({
        type: 'success',
        text: 'Database optimization completed! Reclaimed 2.3 MB of space.'
      });
      setIsProcessing(false);
    }, 4000);
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">🔧 System Tools & Maintenance</h1>
          <p className="text-red-100">Database management, backups, and system optimization</p>
        </div>

        {/* Message Display */}
        {message && (
          <Card className={`border-l-4 ${
            message.type === 'success' ? 'border-l-green-500 bg-green-50' :
            message.type === 'error' ? 'border-l-red-500 bg-red-50' :
            'border-l-blue-500 bg-blue-50'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">
                  {message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <p className={`text-sm ${
                  message.type === 'success' ? 'text-green-800' :
                  message.type === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {message.text}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Database Management */}
        <Card>
          <CardHeader>
            <CardTitle>💾 Database Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">🗄️ Backup Database</h3>
                    <p className="text-sm text-blue-700">Create a complete database backup</p>
                  </div>
                </div>
                <button
                  onClick={handleBackup}
                  disabled={isProcessing}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                    isProcessing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isProcessing ? 'Creating Backup...' : 'Backup Now'}
                </button>
                <p className="text-xs text-blue-600 mt-2">
                  Last backup: Today at 2:30 AM (Automatic)
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-purple-900 mb-1">📥 Restore Database</h3>
                    <p className="text-sm text-purple-700">Restore from a previous backup</p>
                  </div>
                </div>
                <button
                  disabled={isProcessing}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                    isProcessing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  Select Backup File
                </button>
                <p className="text-xs text-purple-600 mt-2">
                  5 backup files available
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">⚡ Optimize Database</h3>
                    <p className="text-sm text-green-700">Clean up and optimize tables</p>
                  </div>
                </div>
                <button
                  onClick={handleOptimizeDB}
                  disabled={isProcessing}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                    isProcessing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isProcessing ? 'Optimizing...' : 'Optimize Now'}
                </button>
                <p className="text-xs text-green-600 mt-2">
                  Last optimized: 3 days ago
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-yellow-900 mb-1">📊 Database Stats</h3>
                    <p className="text-sm text-yellow-700">View database statistics</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-yellow-900">
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="font-semibold">15.3 MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tables:</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Records:</span>
                    <span className="font-semibold">2,847</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle>🛠️ System Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">🗑️</div>
                  <h3 className="font-bold text-red-900 mb-1">Clear Cache</h3>
                  <p className="text-sm text-red-700">Clear system cache files</p>
                </div>
                <button
                  onClick={handleClearCache}
                  disabled={isProcessing}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                    isProcessing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {isProcessing ? 'Clearing...' : 'Clear Cache'}
                </button>
              </div>

              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">📋</div>
                  <h3 className="font-bold text-orange-900 mb-1">System Logs</h3>
                  <p className="text-sm text-orange-700">View application logs</p>
                </div>
                <button
                  disabled={isProcessing}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                    isProcessing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  View Logs
                </button>
              </div>

              <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">🔄</div>
                  <h3 className="font-bold text-indigo-900 mb-1">Restart Services</h3>
                  <p className="text-sm text-indigo-700">Restart application services</p>
                </div>
                <button
                  disabled={isProcessing}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                    isProcessing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  Restart
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>ℹ️ System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Application Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-semibold">1.0.0</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Environment:</span>
                    <span className="font-semibold text-green-600">Production</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Framework:</span>
                    <span className="font-semibold">Next.js 15</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Node Version:</span>
                    <span className="font-semibold">20.x</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Database Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-semibold">PostgreSQL</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-semibold">14.x</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Connection:</span>
                    <span className="font-semibold text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Migrations:</span>
                    <span className="font-semibold">Up to date</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-red-900 mb-1">Critical System Tools</p>
                <p className="text-sm text-red-800">
                  These tools directly affect system operation. Always:
                </p>
                <ul className="text-sm text-red-800 mt-2 space-y-1 list-disc list-inside">
                  <li>Create a backup before major operations</li>
                  <li>Schedule maintenance during low-traffic periods</li>
                  <li>Notify users before restarting services</li>
                  <li>Test restore procedures regularly</li>
                  <li>Keep backup files in a secure location</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
