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

export default function AdminAuditLogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<string>('7days');

  useEffect(() => {
    // Only SuperAdmin can access admin audit logs
    if (user && user.role !== 'SuperAdmin') {
      router.push('/unauthorized');
    }
  }, [user, router]);

  // Mock data with comprehensive activity tracking
  const mockLogs: AuditLog[] = [
    {
      id: '1',
      user_id: 'user-superadmin',
      username: 'superadmin',
      action: 'CREATE',
      entity: 'users',
      entity_id: 'user-new-123',
      timestamp: '2026-02-01T10:30:00Z',
      ip_address: '192.168.1.1',
      details: 'Created new user: new_admission_staff with role AdmissionStaff'
    },
    {
      id: '2',
      user_id: 'user-accounts',
      username: 'accounts_officer',
      action: 'CREATE',
      entity: 'fee_payments',
      entity_id: 'payment-123',
      timestamp: '2026-02-01T09:15:00Z',
      ip_address: '192.168.1.100',
      details: 'Recorded payment of ₹85,000 for APP20260001'
    },
    {
      id: '3',
      user_id: 'user-doc',
      username: 'doc_officer',
      action: 'UPDATE',
      entity: 'student_documents',
      entity_id: 'doc-456',
      timestamp: '2026-02-01T08:45:00Z',
      ip_address: '192.168.1.101',
      details: 'Declared Transfer Certificate for APP20260001'
    },
    {
      id: '4',
      user_id: 'user-admin',
      username: 'admin',
      action: 'UPDATE',
      entity: 'courses',
      entity_id: 'course-cse',
      timestamp: '2026-01-31T16:20:00Z',
      ip_address: '192.168.1.10',
      details: 'Updated CSE course intake capacity from 60 to 80'
    },
    {
      id: '5',
      user_id: 'user-admission',
      username: 'admission_staff',
      action: 'CREATE',
      entity: 'students',
      entity_id: 'student-789',
      timestamp: '2026-01-31T14:30:00Z',
      ip_address: '192.168.1.102',
      details: 'Created new student application APP20260003 for ECE course'
    },
    {
      id: '6',
      user_id: 'user-superadmin',
      username: 'superadmin',
      action: 'DELETE',
      entity: 'users',
      entity_id: 'user-old-456',
      timestamp: '2026-01-30T11:00:00Z',
      ip_address: '192.168.1.1',
      details: 'Deleted inactive user: old_staff (last login: 180 days ago)'
    },
    {
      id: '7',
      user_id: 'user-principal',
      username: 'principal',
      action: 'READ',
      entity: 'students',
      entity_id: 'report-dashboard',
      timestamp: '2026-01-31T09:00:00Z',
      ip_address: '192.168.1.50',
      details: 'Viewed admission dashboard and reports'
    },
    {
      id: '8',
      user_id: 'user-accounts',
      username: 'accounts_officer',
      action: 'UPDATE',
      entity: 'fee_payments',
      entity_id: 'payment-120',
      timestamp: '2026-01-30T15:45:00Z',
      ip_address: '192.168.1.100',
      details: 'Updated payment notes for receipt RCT-20260130-0001'
    },
  ];

  const filteredLogs = mockLogs.filter(log => {
    const matchesEntity = filterEntity === 'all' || log.entity === filterEntity;
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesUser = filterUser === 'all' || log.username === filterUser;
    const matchesSearch = searchTerm === '' || 
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesEntity && matchesAction && matchesUser && matchesSearch;
  });

  const uniqueUsers = Array.from(new Set(mockLogs.map(log => log.username)));

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'READ':
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      case 'courses':
        return '📚';
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

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">📜 System Audit Logs</h1>
          <p className="text-red-100">Complete activity tracking and compliance monitoring</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  <p className="text-sm text-gray-600">Create</p>
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
                  <p className="text-sm text-gray-600">Update</p>
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
                  <p className="text-sm text-gray-600">Delete</p>
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

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Read</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockLogs.filter(l => l.action === 'READ').length}
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-full">
                  <span className="text-xl">👁️</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Filters */}
        <Card>
          <CardHeader>
            <CardTitle>🔍 Filter & Search Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User
                </label>
                <select
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Users</option>
                  {uniqueUsers.map(username => (
                    <option key={username} value={username}>{username}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entity
                </label>
                <select
                  value={filterEntity}
                  onChange={(e) => setFilterEntity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Entities</option>
                  <option value="users">Users</option>
                  <option value="students">Students</option>
                  <option value="courses">Courses</option>
                  <option value="fee_payments">Fee Payments</option>
                  <option value="student_documents">Documents</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action
                </label>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="READ">Read</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="24hours">Last 24 Hours</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredLogs.length}</span> of{' '}
                <span className="font-semibold">{mockLogs.length}</span> activities
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterUser('all');
                  setFilterEntity('all');
                  setFilterAction('all');
                  setDateRange('7days');
                }}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Reset Filters
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>📋 Activity Timeline</CardTitle>
              <button className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                📥 Export CSV
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No audit logs found</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
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
                        {log.action === 'DELETE' && (
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                            ⚠️ Critical
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        <span className="font-semibold text-red-600">{log.username}</span>
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
                        <span className="flex items-center space-x-1">
                          <span>👤</span>
                          <span className="font-mono">{log.user_id}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Banner */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <p className="font-semibold text-blue-900 mb-1">Audit Log Retention</p>
                <p className="text-sm text-blue-800">
                  System audit logs are stored for compliance and security purposes. Current settings:
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                  <li>Retention period: 365 days (1 year)</li>
                  <li>Automatic archival after 90 days</li>
                  <li>Critical actions (DELETE) retained indefinitely</li>
                  <li>Export available in CSV, JSON formats</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
