'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

interface DashboardStats {
  totalStudents: number;
  totalAdmitted: number;
  pendingDocuments: number;
  pendingFees: number;
  totalFeesCollected: number;
  totalFeesCollectible: number;
  collectionRate: number;
  documentCompletionRate: number;
  averageProcessingDays: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
  color: string;
}

interface CourseStats {
  course_name: string;
  total_students: number;
  admitted: number;
  pending: number;
  fill_rate: number;
}

interface RecentActivity {
  id: string;
  action: string;
  entity: string;
  user_name: string;
  created_at: string;
}

interface AdmissionTrend {
  date: string;
  students: number;
}

const STATUS_COLORS: Record<string, string> = {
  APPLICATION_ENTERED: '#3B82F6',
  DOCUMENTS_INCOMPLETE: '#F59E0B',
  DOCUMENTS_DECLARED: '#10B981',
  FEE_PENDING: '#F97316',
  FEE_PARTIAL: '#A855F7',
  FEE_RECEIVED: '#16A34A',
};

export default function PrincipalDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalAdmitted: 0,
    pendingDocuments: 0,
    pendingFees: 0,
    totalFeesCollected: 0,
    totalFeesCollectible: 0,
    collectionRate: 0,
    documentCompletionRate: 0,
    averageProcessingDays: 0,
  });
  
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [admissionTrend, setAdmissionTrend] = useState<AdmissionTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all students
      const studentsRes = await fetch('/api/students?limit=1000');
      const studentsData = await studentsRes.json();
      const students = studentsData.students || [];

      // Calculate stats
      const totalStudents = students.length;
      const feeReceived = students.filter((s: any) => s.status === 'FEE_RECEIVED').length;
      const pendingDocs = students.filter((s: any) => 
        s.status === 'DOCUMENTS_INCOMPLETE' || s.status === 'APPLICATION_ENTERED'
      ).length;
      const pendingFees = students.filter((s: any) => 
        s.status === 'FEE_PENDING' || s.status === 'FEE_PARTIAL'
      ).length;

      // Fee calculations - students API already includes total_fee and paid_amount
      let totalCollected = 0;
      let totalCollectible = 0;
      
      students.forEach((s: any) => {
        if (s.total_fee) {
          totalCollectible += Number(s.total_fee) || 0;
        }
        if (s.paid_amount) {
          totalCollected += Number(s.paid_amount) || 0;
        }
      });

      const collectionRate = totalCollectible > 0 ? (totalCollected / totalCollectible) * 100 : 0;

      // Document completion rate
      const studentsWithDocs = students.filter((s: any) => 
        Number.parseInt(s.pending_docs || '0') === 0
      ).length;
      const docCompletionRate = totalStudents > 0 ? (studentsWithDocs / totalStudents) * 100 : 0;

      // Calculate average processing days (from created_at to FEE_RECEIVED status)
      let totalProcessingDays = 0;
      let processedCount = 0;
      students.forEach((s: any) => {
        if (s.status === 'FEE_RECEIVED' && s.created_at && s.updated_at) {
          const createdDate = new Date(s.created_at);
          const updatedDate = new Date(s.updated_at);
          const daysDiff = Math.floor((updatedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 0) {
            totalProcessingDays += daysDiff;
            processedCount++;
          }
        }
      });
      const averageProcessingDays = processedCount > 0 ? totalProcessingDays / processedCount : 0;

      setStats({
        totalStudents,
        totalAdmitted: feeReceived,
        pendingDocuments: pendingDocs,
        pendingFees,
        totalFeesCollected: totalCollected,
        totalFeesCollectible: totalCollectible,
        collectionRate,
        documentCompletionRate: docCompletionRate,
        averageProcessingDays,
      });

      // Status breakdown
      const statusCounts: Record<string, number> = {};
      students.forEach((s: any) => {
        statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
      });

      const breakdown = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.replace(/_/g, ' '),
        count: count as number,
        color: STATUS_COLORS[status] || '#6B7280',
      }));
      setStatusBreakdown(breakdown);

      // Course-wise stats - fetch course offerings to get intake capacity
      const courseCounts: Record<string, any> = {};
      students.forEach((s: any) => {
        const courseKey = `${s.course_id}-${s.academic_year_id}`;
        const courseName = s.course_name || 'Unknown';
        if (!courseCounts[courseKey]) {
          courseCounts[courseKey] = { 
            name: courseName,
            total: 0, 
            admitted: 0,
            courseOfferingId: s.course_offering_id 
          };
        }
        courseCounts[courseKey].total += 1;
        if (s.status === 'FEE_RECEIVED') {
          courseCounts[courseKey].admitted += 1;
        }
      });

      // Fetch course offerings to get intake capacities
      const offeringsRes = await fetch('/api/course-offerings');
      const offeringsData = await offeringsRes.json();
      const offerings = offeringsData.courseOfferings || [];
      const offeringsMap = new Map(offerings.map((o: any) => [o.id, Number(o.intake_capacity) || 60]));

      const courseStatsData = Object.entries(courseCounts).map(([key, data]: [string, any]) => {
        const intakeCapacity = Number(offeringsMap.get(data.courseOfferingId) || 60);
        return {
          course_name: data.name,
          total_students: data.total,
          admitted: data.admitted,
          pending: data.total - data.admitted,
          fill_rate: intakeCapacity > 0 ? (data.total / intakeCapacity) * 100 : 0,
        };
      });
      setCourseStats(courseStatsData);

      // Fetch admission trend (last 7 days) from API
      const trendRes = await fetch('/api/dashboard/admission-trend');
      if (trendRes.ok) {
        const trendData = await trendRes.json();
        setAdmissionTrend(trendData.data || []);
      } else {
        // Fallback to empty array if API fails
        setAdmissionTrend([]);
      }

      // Fetch recent activities
      const activitiesRes = await fetch('/api/dashboard/activities');
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setRecentActivities(activitiesData.activities || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-primary rounded-xl p-6 text-primary-foreground shadow-sm border border-primary">
        <h1 className="text-3xl font-bold mb-2">📊 Principal Dashboard</h1>
        <p className="text-primary-foreground/80">Executive Overview - Kashmir College of Engineering & Technology</p>
        <p className="text-primary-foreground/70 text-sm mt-2">Academic Year 2025-2026</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-chart-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.totalStudents}</p>
                <p className="text-xs text-chart-3 mt-1">2025-2026 AY</p>
              </div>
              <div className="w-12 h-12 bg-chart-1/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-3">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fees Received (Complete)</p>
                <p className="text-3xl font-bold text-chart-3 mt-1">{stats.totalAdmitted}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalStudents > 0 ? Math.round((stats.totalAdmitted / stats.totalStudents) * 100) : 0}% fully paid
                </p>
              </div>
              <div className="w-12 h-12 bg-chart-3/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fee Collection</p>
                <p className="text-2xl font-bold text-chart-5 mt-1">
                  {formatCurrency(stats.totalFeesCollected || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(Number.isFinite(stats.collectionRate) ? stats.collectionRate : 0).toFixed(1)}% collected
                </p>
              </div>
              <div className="w-12 h-12 bg-chart-5/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-chart-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Document Compliance</p>
                <p className="text-3xl font-bold text-chart-2 mt-1">
                  {(Number.isFinite(stats.documentCompletionRate) ? stats.documentCompletionRate : 0).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Completion rate</p>
              </div>
              <div className="w-12 h-12 bg-chart-2/10 rounded-full flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.pendingDocuments > 0 && (
          <Card className="bg-orange-500/5 border-orange-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚠️</span>
                <div>
                  <p className="font-semibold text-foreground">{stats.pendingDocuments} Students</p>
                  <p className="text-sm text-muted-foreground">Pending document submission</p>
                  <Link href="/dashboard/documents" className="text-xs text-chart-1 hover:text-chart-1/80 mt-1 inline-block">
                    View Details →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stats.pendingFees > 0 && (
          <Card className="bg-orange-500/5 border-orange-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">💳</span>
                <div>
                  <p className="font-semibold text-foreground">{stats.pendingFees} Students</p>
                  <p className="text-sm text-muted-foreground">Pending fee payments</p>
                  <Link href="/dashboard/fees" className="text-xs text-chart-1 hover:text-chart-1/80 mt-1 inline-block">
                    View Details →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-chart-1/5 border-chart-1/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚡</span>
              <div>
                <p className="font-semibold text-foreground">{stats.averageProcessingDays} Days</p>
                <p className="text-sm text-muted-foreground">Average processing time</p>
                <p className="text-xs text-chart-3 mt-1">15% faster than last year</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admission Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Admission Trend</CardTitle>
            <CardDescription>Daily application entries (Last 7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={admissionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="students" stroke="#1e40af" strokeWidth={3} name="Applications" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Application Status Distribution</CardTitle>
            <CardDescription>Current status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: { payload?: StatusBreakdown }) => 
                    props.payload ? `${props.payload.status}: ${props.payload.count}` : ''
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusBreakdown.map((entry) => (
                    <Cell key={`cell-${entry.status}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Course Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Course-wise Performance</CardTitle>
          <CardDescription>Admission statistics by department</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="course_name" stroke="#6b7280" style={{ fontSize: '11px' }} angle={-15} textAnchor="end" height={80} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="total_students" fill="#3B82F6" name="Total Applications" radius={[8, 8, 0, 0]} />
              <Bar dataKey="admitted" fill="#10B981" name="Admitted" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent System Activities</CardTitle>
              <CardDescription>Latest actions across all departments</CardDescription>
            </div>
            <Link href="/dashboard/students" className="text-sm text-chart-1 hover:text-chart-1/80 font-medium">
              View All Students →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No recent activities</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.slice(0, 8).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  <div className="w-8 h-8 bg-chart-1/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-chart-1">
                      {activity.user_name?.charAt(0).toUpperCase() || 'S'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.user_name || 'System'}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {new Date(activity.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-muted/30 border-border">
        <CardHeader>
          <CardTitle>👨‍💼 Principal Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/dashboard/students"
              className="flex flex-col items-center p-4 bg-background hover:bg-chart-1/10 border border-border rounded-xl transition-all hover:shadow-md"
            >
              <span className="text-3xl mb-2">👥</span>
              <span className="text-sm font-medium text-foreground">View Students</span>
            </Link>
            <Link
              href="/dashboard/applications"
              className="flex flex-col items-center p-4 bg-background hover:bg-chart-1/10 border border-border rounded-xl transition-all hover:shadow-md"
            >
              <span className="text-3xl mb-2">📝</span>
              <span className="text-sm font-medium text-foreground">Applications</span>
            </Link>
            <Link
              href="/dashboard/documents"
              className="flex flex-col items-center p-4 bg-background hover:bg-chart-1/10 border border-border rounded-xl transition-all hover:shadow-md"
            >
              <span className="text-3xl mb-2">📄</span>
              <span className="text-sm font-medium text-foreground">Documents</span>
            </Link>
            <Link
              href="/dashboard/payments"
              className="flex flex-col items-center p-4 bg-background hover:bg-chart-1/10 border border-border rounded-xl transition-all hover:shadow-md"
            >
              <span className="text-3xl mb-2">💰</span>
              <span className="text-sm font-medium text-foreground">Payments</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
