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
  academic_year_id?: number;
  year_name?: string;
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

interface AcademicYear {
  id: number;
  year_label: string;
  is_active: boolean;
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
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
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

  // Fetch academic years on mount
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const res = await fetch('/api/academic-years');
        if (res.ok) {
          const data = await res.json();
          setAcademicYears(data.academicYears || []);
          // Auto-select the active academic year
          const activeYear = data.academicYears?.find((ay: AcademicYear) => ay.is_active);
          if (activeYear) {
            setSelectedAcademicYear(activeYear.id.toString());
          }
        }
      } catch (error) {
        console.error('Error fetching academic years:', error);
      }
    };
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Filter students when academic year changes
  useEffect(() => {
    if (allStudents.length > 0) {
      filterStudentsByAcademicYear();
    }
  }, [selectedAcademicYear, allStudents]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      
      if (data.students) {
        setAllStudents(data.students);
        // Initially show all or filtered students
        filterStudentsByAcademicYear(data.students);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudentsByAcademicYear = (studentsData?: Student[]) => {
    const dataToFilter = studentsData || allStudents;
    
    if (selectedAcademicYear === 'all') {
      setStudents(dataToFilter);
      calculateStats(dataToFilter);
    } else {
      const filtered = dataToFilter.filter(
        s => s.academic_year_id?.toString() === selectedAcademicYear
      );
      setStudents(filtered);
      calculateStats(filtered);
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
    const courseData = students.reduce((acc, student) => {
      const course = student.course_name;
      if (!acc[course]) {
        acc[course] = { applications: 0, admitted: 0, revenue: 0 };
      }
      acc[course].applications += 1;
      if (student.status === 'ADMITTED') acc[course].admitted += 1;
      acc[course].revenue += Number(student.paid_amount) || 0;
      return acc;
    }, {} as Record<string, { applications: number; admitted: number; revenue: number }>);
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
          <p className="text-muted-foreground">Loading institutional analytics...</p>
        </div>
      </div>
    );
  }

  const statusDistribution = getStatusDistribution();
  const trendData = getTrendData();
  const coursePerformance = getCoursePerformance();

  return (
    <div className="space-y-6 p-6">
      {/* Header with Academic Year Filter */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">🏛️ Director&apos;s Strategic Dashboard</h1>
            <p className="text-white/90">Institutional Oversight & Strategic Analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="academic-year-filter" className="text-sm font-medium text-white/90">Academic Year:</label>
            <select
              id="academic-year-filter"
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[200px]"
            >
              <option value="all" className="bg-gray-800">All Years</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id.toString()} className="bg-gray-800">
                  {year.year_label} {year.is_active ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Executive Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-chart-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalApplications}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedAcademicYear === 'all' 
                    ? 'All Academic Years' 
                    : academicYears.find(y => y.id.toString() === selectedAcademicYear)?.year_label || 'Selected Year'}
                </p>
              </div>
              <div className="bg-chart-1/10 p-3 rounded-full">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admitted Students</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalAdmitted}</p>
                <p className="text-xs text-chart-3 mt-1">
                  {stats.conversionRate.toFixed(1)}% conversion rate
                </p>
              </div>
              <div className="bg-chart-3/10 p-3 rounded-full">
                <span className="text-2xl">🎓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue Collected</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-xs text-chart-5 mt-1">
                  {stats.collectionRate.toFixed(1)}% collection rate
                </p>
              </div>
              <div className="bg-chart-5/10 p-3 rounded-full">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Collections</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(stats.totalPending)}
                </p>
                <p className="text-xs text-orange-600 mt-1">Requires attention</p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-full">
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
                  label={(props: { payload?: StatusData }) => props.payload ? `${props.payload.status}: ${props.payload.count}` : ''}
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
        <Card className="bg-chart-1/5 border-chart-1">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-chart-1 mb-2">Document Compliance Rate</p>
              <p className="text-4xl font-bold text-foreground">{stats.documentCompliance.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-2">Target: 95%</p>
              <div className="w-full bg-muted rounded-full h-2 mt-3">
                <div 
                  className="bg-chart-1 h-2 rounded-full transition-all" 
                  style={{ width: `${stats.documentCompliance}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-chart-3/5 border-chart-3">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-chart-3 mb-2">Avg. Processing Time</p>
              <p className="text-4xl font-bold text-foreground">{stats.averageProcessingDays.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground mt-2">days per application</p>
              <p className="text-xs text-chart-3 mt-1">
                {stats.averageProcessingDays <= 7 ? '✅ Within target' : '⚠️ Needs improvement'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-chart-2/5 border-chart-2">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-chart-2 mb-2">Conversion Efficiency</p>
              <p className="text-4xl font-bold text-foreground">{stats.conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-2">Applications → Admissions</p>
              <p className="text-xs text-chart-2 mt-1">
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
                <button className="w-full text-left px-4 py-3 bg-chart-1/5 hover:bg-chart-1/10 rounded-lg transition-all border border-chart-1/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">👥 View All Students</p>
                      <p className="text-xs text-muted-foreground">Complete student database</p>
                    </div>
                    <span className="text-chart-1">→</span>
                  </div>
                </button>
              </Link>
              
              <Link href="/dashboard/applications">
                <button className="w-full text-left px-4 py-3 bg-chart-3/5 hover:bg-chart-3/10 rounded-lg transition-all border border-chart-3/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">📝 Review Applications</p>
                      <p className="text-xs text-muted-foreground">Admission pipeline overview</p>
                    </div>
                    <span className="text-chart-3">→</span>
                  </div>
                </button>
              </Link>
              
              <Link href="/dashboard/documents">
                <button className="w-full text-left px-4 py-3 bg-orange-500/5 hover:bg-orange-500/10 rounded-lg transition-all border border-orange-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">📄 Document Compliance</p>
                      <p className="text-xs text-muted-foreground">Track documentation status</p>
                    </div>
                    <span className="text-orange-600">→</span>
                  </div>
                </button>
              </Link>
              
              <Link href="/dashboard/payments">
                <button className="w-full text-left px-4 py-3 bg-chart-2/5 hover:bg-chart-2/10 rounded-lg transition-all border border-chart-2/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">💰 Financial Reports</p>
                      <p className="text-xs text-muted-foreground">Revenue and collections</p>
                    </div>
                    <span className="text-chart-2">→</span>
                  </div>
                </button>
              </Link>

              <button className="w-full text-left px-4 py-3 bg-muted/50 rounded-lg border border-border opacity-60 cursor-not-allowed" disabled>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">📜 Audit Logs</p>
                    <p className="text-xs text-muted-foreground">Coming soon - System audit trail</p>
                  </div>
                  <span className="text-muted-foreground">🔒</span>
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
                <div key={course.fullName} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm" title={course.fullName}>{course.course}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.applications} applications • {course.admitted} admitted
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-chart-2">{formatCurrency(course.revenue * 1000)}</p>
                    <p className="text-xs text-muted-foreground">{course.conversionRate.toFixed(0)}% conversion</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Indicators */}
      <Card className="border-2 border-chart-2/20 bg-chart-2/5">
        <CardHeader>
          <CardTitle>🔍 System Health & Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background rounded-lg shadow-sm border border-border">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm font-semibold text-foreground">Data Integrity</p>
              <p className="text-xs text-chart-3">100% Verified</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg shadow-sm border border-border">
              <p className="text-2xl mb-2">🔒</p>
              <p className="text-sm font-semibold text-foreground">Security Status</p>
              <p className="text-xs text-chart-3">All systems secure</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg shadow-sm border border-border">
              <p className="text-2xl mb-2">📊</p>
              <p className="text-sm font-semibold text-foreground">Reporting</p>
              <p className="text-xs text-chart-1">Up to date</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg shadow-sm border border-border">
              <p className="text-2xl mb-2">⚡</p>
              <p className="text-sm font-semibold text-foreground">System Performance</p>
              <p className="text-xs text-chart-3">Optimal</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
