'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalStudents: number;
  totalCourses: number;
  totalRevenue: number;
  systemHealth: string;
  databaseSize: string;
  lastBackup: string;
}

interface UsersByRole {
  role: string;
  count: number;
  color: string;
}

const ROLE_COLORS: Record<string, string> = {
  'SuperAdmin': '#DC2626',
  'Admin': '#EA580C',
  'AdmissionStaff': '#3B82F6',
  'DocumentOfficer': '#10B981',
  'AccountsOfficer': '#8B5CF6',
  'Principal': '#0EA5E9',
  'Director': '#6366F1',
};

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalRevenue: 0,
    systemHealth: 'Excellent',
    databaseSize: '0 MB',
    lastBackup: 'Never',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      // Fetch students data
      const studentsRes = await fetch('/api/students');
      const studentsData = await studentsRes.json();
      
      const totalStudents = studentsData.students?.length || 0;
      const totalRevenue = studentsData.students?.reduce(
        (sum: number, s: { paid_amount: string | number }) => sum + (Number(s.paid_amount) || 0),
        0
      ) || 0;

      // Mock user and system data (will be replaced with actual API calls)
      setStats({
        totalUsers: 7,
        activeUsers: 7,
        totalStudents,
        totalCourses: 8,
        totalRevenue,
        systemHealth: 'Excellent',
        databaseSize: '15.3 MB',
        lastBackup: new Date().toLocaleDateString(),
      });
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data - will be replaced with API calls
  const usersByRole: UsersByRole[] = [
    { role: 'SuperAdmin', count: 1, color: ROLE_COLORS.SuperAdmin },
    { role: 'Admin', count: 1, color: ROLE_COLORS.Admin },
    { role: 'AdmissionStaff', count: 1, color: ROLE_COLORS.AdmissionStaff },
    { role: 'DocumentOfficer', count: 1, color: ROLE_COLORS.DocumentOfficer },
    { role: 'AccountsOfficer', count: 1, color: ROLE_COLORS.AccountsOfficer },
    { role: 'Principal', count: 1, color: ROLE_COLORS.Principal },
    { role: 'Director', count: 1, color: ROLE_COLORS.Director },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading system overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-border rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Master Data Management</h1>
        <p className="text-sm text-muted-foreground">Configure system users, courses, and fee structures</p>
      </div>

      {/* Critical System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-semibold text-foreground">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.activeUsers} active</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-semibold text-foreground">{stats.totalStudents}</p>
                <p className="text-xs text-muted-foreground mt-1">AY 2025-26</p>
              </div>
              <div className="bg-chart-1/10 p-3 rounded-lg">
                <span className="text-2xl">🎓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-semibold text-foreground">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Collected</p>
              </div>
              <div className="bg-chart-3/10 p-3 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Courses</p>
                <p className="text-2xl font-semibold text-foreground">{stats.totalCourses}</p>
                <p className="text-xs text-muted-foreground mt-1">Programs offered</p>
              </div>
              <div className="bg-chart-4/10 p-3 rounded-lg">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/admin/users">
              <button className="w-full px-6 py-4 bg-card hover:bg-accent border border-border rounded-lg transition-all text-left group">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Manage Users</p>
                    <p className="text-xs text-muted-foreground">Create & manage system users</p>
                  </div>
                </div>
              </button>
            </Link>

            <Link href="/admin/courses">
              <button className="w-full px-6 py-4 bg-card hover:bg-accent border border-border rounded-lg transition-all text-left group">
                <div className="flex items-center space-x-4">
                  <div className="bg-chart-2/10 p-3 rounded-lg group-hover:bg-chart-2/20 transition-colors">
                    <span className="text-2xl">📚</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Manage Courses</p>
                    <p className="text-xs text-muted-foreground">Configure courses, fees & academic years</p>
                  </div>
                </div>
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {usersByRole.map((role) => (
                <div key={role.role} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border border-border hover:bg-accent transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }}></div>
                    <span className="text-sm font-medium text-foreground">{role.role}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{role.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Total Users</span>
                <span className="text-sm font-semibold text-foreground">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Active Courses</span>
                <span className="text-sm font-semibold text-foreground">{stats.totalCourses}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Total Students</span>
                <span className="text-sm font-semibold text-foreground">{stats.totalStudents}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Academic Year</span>
                <span className="text-sm font-semibold text-chart-3">2025-2026 (Active)</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-sm text-muted-foreground">System Status</span>
                <span className="text-sm font-semibold text-chart-3 flex items-center space-x-1">
                  <span className="w-2 h-2 bg-chart-3 rounded-full"></span>
                  <span>Operational</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
