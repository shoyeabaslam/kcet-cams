'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuditLog {
  id: string;
  user_id: string;
  username: string;
  action: string;
  entity: string;
  entity_id: string;
  timestamp: string;
  ip_address?: string;
  details?: string;
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Only Director role can access audit logs
    if (user && user.role !== 'Director' && user.role !== 'SuperAdmin') {
      router.push('/unauthorized');
      return;
    }
    
    // fetchAuditLogs(); // Commented out - will be implemented when backend is ready
    setLoading(false);
  }, [user, router]);

  // Mock data for demonstration
  const mockLogs: AuditLog[] = [
    {
      id: '1',
      user_id: 'user-1',
      username: 'accounts_officer',
      action: 'CREATE',
      entity: 'fee_payments',
      entity_id: 'payment-123',
      timestamp: '2026-01-31T14:30:00Z',
      ip_address: '192.168.1.100',
      details: 'Recorded payment of ₹19,999.98 for APP20260001'
    },
    {
      id: '2',
      user_id: 'user-2',
      username: 'doc_officer',
      action: 'UPDATE',
      entity: 'student_documents',
      entity_id: 'doc-456',
      timestamp: '2026-01-31T13:15:00Z',
      ip_address: '192.168.1.101',
      details: 'Declared SSC certificate for APP20260001'
    },
    {
      id: '3',
      user_id: 'user-3',
      username: 'admission_staff',
      action: 'CREATE',
      entity: 'students',
      entity_id: 'student-789',
      timestamp: '2026-01-31T10:45:00Z',
      ip_address: '192.168.1.102',
      details: 'Created new student application APP20260002'
    },
    {
      id: '4',
      user_id: 'user-1',
      username: 'accounts_officer',
      action: 'CREATE',
      entity: 'fee_payments',
      entity_id: 'payment-124',
      timestamp: '2026-01-31T16:20:00Z',
      ip_address: '192.168.1.100',
      details: 'Recorded payment of ₹49,999.98 for APP20260002'
    },
    {
      id: '5',
      user_id: 'user-3',
      username: 'admission_staff',
      action: 'UPDATE',
      entity: 'students',
      entity_id: 'student-123',
      timestamp: '2026-01-31T09:30:00Z',
      ip_address: '192.168.1.102',
      details: 'Updated student status to ADMITTED for APP20260001'
    },
  ];

  const filteredLogs = mockLogs.filter(log => {
    const matchesEntity = filterEntity === 'all' || log.entity === filterEntity;
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesSearch = searchTerm === '' || 
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesEntity && matchesAction && matchesSearch;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'students':
        return '👥';
      case 'fee_payments':
        return '💰';
      case 'student_documents':
        return '📄';
      case 'users':
        return '🔑';
      default:
        return '📋';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading audit logs...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">📜 Audit Logs</h1>
          <p className="text-purple-100">System activity and compliance tracking</p>
        </div>

        {/* Info Banner */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <p className="font-semibold text-blue-900 mb-1">Demo Mode</p>
                <p className="text-sm text-blue-800">
                  This page displays mock audit log data for demonstration purposes. 
                  The actual audit log system will be connected to the database audit_logs table, 
                  which captures all system activities including CREATE, UPDATE, and DELETE operations 
                  across students, payments, documents, and users.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Activities</p>
                  <p className="text-2xl font-bold text-gray-900">{mockLogs.length}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <span className="text-xl">📊</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Create Actions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockLogs.filter(l => l.action === 'CREATE').length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <span className="text-xl">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Update Actions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockLogs.filter(l => l.action === 'UPDATE').length}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <span className="text-xl">🔄</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Delete Actions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockLogs.filter(l => l.action === 'DELETE').length}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <span className="text-xl">🗑️</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>🔍 Filter Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by user, entity, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entity Type
                </label>
                <select
                  value={filterEntity}
                  onChange={(e) => setFilterEntity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Entities</option>
                  <option value="students">Students</option>
                  <option value="fee_payments">Fee Payments</option>
                  <option value="student_documents">Documents</option>
                  <option value="users">Users</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Type
                </label>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>📋 Activity Log</CardTitle>
              <div className="text-sm text-gray-600">
                Showing {filteredLogs.length} of {mockLogs.length} activities
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No audit logs found matching your filters</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your search criteria</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-shrink-0 text-3xl">
                      {getEntityIcon(log.entity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded border ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        <span className="font-semibold text-purple-600">{log.username}</span>
                        {' '}{log.action.toLowerCase()}d{' '}
                        <span className="font-mono text-blue-600">{log.entity}</span>
                      </p>
                      {log.details && (
                        <p className="text-sm text-gray-600">{log.details}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        {log.ip_address && (
                          <span className="flex items-center space-x-1">
                            <span>🌐</span>
                            <span>{log.ip_address}</span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <span>🔖</span>
                          <span className="font-mono">{log.entity_id}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Implementation Note */}
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-yellow-900 mb-1">Implementation Note</p>
                <p className="text-sm text-yellow-800">
                  To enable real audit logging, you need to:
                </p>
                <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
                  <li>Create an API endpoint at <code className="bg-yellow-100 px-1 rounded">/api/audit-logs</code></li>
                  <li>Query the <code className="bg-yellow-100 px-1 rounded">audit_logs</code> table from the database</li>
                  <li>Ensure the trigger in <code className="bg-yellow-100 px-1 rounded">002_triggers_functions.sql</code> is active</li>
                  <li>The system will automatically capture all data modifications</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
