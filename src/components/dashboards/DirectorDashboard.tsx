'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

interface Student {
  student_id: string;
  full_name: string;
  application_number: string;
  status: string;
  course_name: string;
  total_fee: string | number;
  paid_amount: string | number;
  pending_amount: string | number;
  created_at: string;
}

interface DashboardStats {
  totalApplications: number;
  totalAdmitted: number;
  totalRevenue: number;
  totalPending: number;
  conversionRate: number;
  collectionRate: number;
  documentCompliance: number;
  averageProcessingDays: number;
}

interface StatusData {
  status: string;
  count: number;
  color: string;
}

interface TrendData {
  date: string;
  applications: number;
  admissions: number;
  revenue: number;
}

interface CoursePerformance {
  course: string;
  fullName: string;
  applications: number;
  admitted: number;
  revenue: number;
  conversionRate: number;
}

const STATUS_COLORS: Record<string, string> = {
  'APPLICATION_ENTERED': '#3B82F6',
  'DOCUMENTS_INCOMPLETE': '#EAB308',
  'FEE_PENDING': '#F97316',
  'FEE_PARTIAL': '#A855F7',
  'FEE_RECEIVED': '#10B981',
  'ADMITTED': '#059669',
};

export default function DirectorDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    totalAdmitted: 0,
    totalRevenue: 0,
    totalPending: 0,
    conversionRate: 0,
    collectionRate: 0,
    documentCompliance: 0,
    averageProcessingDays: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      
      if (data.students) {
        setStudents(data.students);
        calculateStats(data.students);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (studentsData: Student[]) => {
    const totalApplications = studentsData.length;
    const totalAdmitted = studentsData.filter(s => s.status === 'ADMITTED').length;
    const totalRevenue = studentsData.reduce((sum, s) => sum + (Number(s.paid_amount) || 0), 0);
    const totalPending = studentsData.reduce((sum, s) => sum + (Number(s.pending_amount) || 0), 0);
    const totalExpected = studentsData.reduce((sum, s) => sum + (Number(s.total_fee) || 0), 0);
    const conversionRate = totalApplications > 0 ? (totalAdmitted / totalApplications * 100) : 0;
    const collectionRate = totalExpected > 0 ? (totalRevenue / totalExpected * 100) : 0;
    
    // Mock document compliance (would need document data in real scenario)
    const documentCompliance = 78.5;
    
    // Calculate average processing time
    const now = new Date();
    const processingTimes = studentsData.map(s => {
      const created = new Date(s.created_at);
      return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    });
    const averageProcessingDays = processingTimes.length > 0 
      ? processingTimes.reduce((sum, days) => sum + days, 0) / processingTimes.length 
      : 0;

    setStats({
      totalApplications,
      totalAdmitted,
      totalRevenue,
      totalPending,
      conversionRate,
      collectionRate,
      documentCompliance,
      averageProcessingDays,
    });
  };

  // Status Distribution Data
  const getStatusDistribution = (): StatusData[] => {
    const statusCount = students.reduce((acc, student) => {
      acc[student.status] = (acc[student.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCount).map(([status, count]) => ({
      status: status.replaceAll('_', ' '),
      count,
      color: STATUS_COLORS[status] || '#6B7280',
    }));
  };

  // Trend Data (Last 30 Days)
  const getTrendData = (): TrendData[] => {
    const days = 30;
    const trendData: TrendData[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const applicationsOnDay = students.filter(s => 
        s.created_at.split('T')[0] === dateStr
      ).length;

      const admissionsOnDay = students.filter(s => 
        s.status === 'ADMITTED' && s.created_at.split('T')[0] <= dateStr
      ).length;

      const revenueOnDay = students
        .filter(s => s.created_at.split('T')[0] <= dateStr)
        .reduce((sum, s) => sum + (Number(s.paid_amount) || 0), 0);

      if (i % 5 === 0 || i === 0) { // Show every 5 days
        trendData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          applications: applicationsOnDay,
          admissions: admissionsOnDay,
          revenue: revenueOnDay / 1000, // In thousands
        });
      }
    }

    return trendData;
  };

  // Course Performance Data
  const getCoursePerformance = (): CoursePerformance[] => {
    console.log('📊 Director Dashboard - Students data:', students);
    const courseData = students.reduce((acc, student) => {
      const course = student.course_name;
      if (!acc[course]) {
        acc[course] = { applications: 0, admitted: 0, revenue: 0 };
      }
      acc[course].applications += 1;
      if (student.status === 'ADMITTED') acc[course].admitted += 1;
      acc[course].revenue += Number(student.paid_amount) || 0;
      console.log(`Student: ${student.full_name}, Course: ${course}, Paid Amount: ${student.paid_amount}, Revenue so far: ${acc[course].revenue}`);
      return acc;
    }, {} as Record<string, { applications: number; admitted: number; revenue: number }>);
    
    console.log('📊 Course Data:', courseData);

    return Object.entries(courseData)
      .map(([course, data]) => ({
        course: course.length > 20 ? course.substring(0, 18) + '..' : course,
        fullName: course,
        applications: data.applications,
        admitted: data.admitted,
        revenue: data.revenue / 1000, // In thousands
        conversionRate: data.applications > 0 ? (data.admitted / data.applications * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getConversionLabel = (rate: number) => {
    if (rate >= 70) return '🏆 Excellent';
    if (rate >= 50) return '✅ Good';
    return '⚠️ Needs attention';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading institutional analytics...</p>
        </div>
      </div>
    );
  }

  const statusDistribution = getStatusDistribution();
  const trendData = getTrendData();
  const coursePerformance = getCoursePerformance();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">🏛️ Director&apos;s Strategic Dashboard</h1>
        <p className="text-purple-100">Institutional Oversight & Strategic Analytics</p>
      </div>

      {/* Key Executive Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
                <p className="text-xs text-gray-500 mt-1">Academic Year 2025-26</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admitted Students</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAdmitted}</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.conversionRate.toFixed(1)}% conversion rate
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">🎓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue Collected</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  {stats.collectionRate.toFixed(1)}% collection rate
                </p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Collections</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(stats.totalPending)}
                </p>
                <p className="text-xs text-orange-600 mt-1">Requires attention</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 30-Day Trend Analysis */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>📈 30-Day Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="applications" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Applications"
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="admissions" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Admissions"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  name="Revenue (₹K)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Application Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: { status?: string; count?: number }) => `${entry.status}: ${entry.count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry) => (
                    <Cell key={`cell-${entry.status}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Course Performance */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Course-wise Revenue Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coursePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="course" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#8B5CF6" name="Revenue (₹K)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Institutional KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-blue-800 mb-2">Document Compliance Rate</p>
              <p className="text-4xl font-bold text-blue-900">{stats.documentCompliance.toFixed(1)}%</p>
              <p className="text-xs text-blue-700 mt-2">Target: 95%</p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${stats.documentCompliance}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-green-800 mb-2">Avg. Processing Time</p>
              <p className="text-4xl font-bold text-green-900">{stats.averageProcessingDays.toFixed(0)}</p>
              <p className="text-xs text-green-700 mt-2">days per application</p>
              <p className="text-xs text-green-600 mt-1">
                {stats.averageProcessingDays <= 7 ? '✅ Within target' : '⚠️ Needs improvement'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-purple-800 mb-2">Conversion Efficiency</p>
              <p className="text-4xl font-bold text-purple-900">{stats.conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-purple-700 mt-2">Applications → Admissions</p>
              <p className="text-xs text-purple-600 mt-1">
                {getConversionLabel(stats.conversionRate)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🎯 Director&apos;s Strategic Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/dashboard/students">
                <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg transition-all border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-blue-900">👥 View All Students</p>
                      <p className="text-xs text-blue-700">Complete student database</p>
                    </div>
                    <span className="text-blue-600">→</span>
                  </div>
                </button>
              </Link>
              
              <Link href="/dashboard/applications">
                <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg transition-all border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-900">📝 Review Applications</p>
                      <p className="text-xs text-green-700">Admission pipeline overview</p>
                    </div>
                    <span className="text-green-600">→</span>
                  </div>
                </button>
              </Link>
              
              <Link href="/dashboard/documents">
                <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 rounded-lg transition-all border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-yellow-900">📄 Document Compliance</p>
                      <p className="text-xs text-yellow-700">Track documentation status</p>
                    </div>
                    <span className="text-yellow-600">→</span>
                  </div>
                </button>
              </Link>
              
              <Link href="/dashboard/payments">
                <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg transition-all border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-purple-900">💰 Financial Reports</p>
                      <p className="text-xs text-purple-700">Revenue and collections</p>
                    </div>
                    <span className="text-purple-600">→</span>
                  </div>
                </button>
              </Link>

              <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg transition-all border border-gray-300 opacity-60 cursor-not-allowed" disabled>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-700">📜 Audit Logs</p>
                    <p className="text-xs text-gray-600">Coming soon - System audit trail</p>
                  </div>
                  <span className="text-gray-500">🔒</span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Courses */}
        <Card>
          <CardHeader>
            <CardTitle>🏆 Top Performing Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {coursePerformance.slice(0, 5).map((course) => (
                <div key={course.fullName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm" title={course.fullName}>{course.course}</p>
                    <p className="text-xs text-gray-600">
                      {course.applications} applications • {course.admitted} admitted
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">{formatCurrency(course.revenue * 1000)}</p>
                    <p className="text-xs text-gray-600">{course.conversionRate.toFixed(0)}% conversion</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Indicators */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle>🔍 System Health & Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm font-semibold text-gray-700">Data Integrity</p>
              <p className="text-xs text-green-600">100% Verified</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-2xl mb-2">🔒</p>
              <p className="text-sm font-semibold text-gray-700">Security Status</p>
              <p className="text-xs text-green-600">All systems secure</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-2xl mb-2">📊</p>
              <p className="text-sm font-semibold text-gray-700">Reporting</p>
              <p className="text-xs text-blue-600">Up to date</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-2xl mb-2">⚡</p>
              <p className="text-sm font-semibold text-gray-700">System Performance</p>
              <p className="text-xs text-green-600">Optimal</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
