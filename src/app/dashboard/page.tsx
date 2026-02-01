'use client';

import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/dashboard-layout';
import DocumentOfficerDashboard from '@/components/dashboards/DocumentOfficerDashboard';
import AccountsOfficerDashboard from '@/components/dashboards/AccountsOfficerDashboard';
import PrincipalDashboard from '@/components/dashboards/PrincipalDashboard';
import DirectorDashboard from '@/components/dashboards/DirectorDashboard';
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface DashboardStats {
  totalStudents?: number;
  admittedToday?: number;
  pendingDocuments?: number;
  totalFeesCollected?: number;
  pendingFees?: number;
  totalUsers?: number;
}

interface DocumentStats {
  total_students: number;
  complete_documents: number;
  incomplete_documents: number;
  pending_documents: number;
  completion_rate: number;
}

interface IncompleteStudent {
  id: string;
  application_number: string;
  full_name: string;
  status: string;
  course_code: string;
  missing_required: number;
  missing_docs: string[];
}

interface DocTypeStat {
  name: string;
  code: string;
  is_required: boolean;
  total_students: number;
  declared_count: number;
  pending_count: number;
}

interface Activity {
  user: string;
  action: string;
  time: string;
}

interface ChartDataPoint {
  date?: string;
  month?: string;
  students?: number;
  amount?: number;
  name?: string;
  value?: number;
  color?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [admissionTrendData, setAdmissionTrendData] = useState<ChartDataPoint[]>([]);
  const [courseDistributionData, setCourseDistributionData] = useState<ChartDataPoint[]>([]);
  const [feeCollectionData, setFeeCollectionData] = useState<ChartDataPoint[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Document Officer specific state
  const [documentStats, setDocumentStats] = useState<DocumentStats | null>(null);
  const [incompleteStudents, setIncompleteStudents] = useState<IncompleteStudent[]>([]);
  const [docTypeStats, setDocTypeStats] = useState<DocTypeStat[]>([]);

  useEffect(() => {
    // Fetch document stats for DocumentOfficer
    if (user?.role === 'DocumentOfficer') {
      const fetchDocumentStats = async () => {
        try {
          const res = await fetch('/api/dashboard/document-stats');
          if (res.ok) {
            const data = await res.json();
            setDocumentStats(data.stats);
            setIncompleteStudents(data.incompleteStudents || []);
            setDocTypeStats(data.docTypeStats || []);
          }
        } catch (error) {
          console.error('Error fetching document stats:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchDocumentStats();
      return;
    }

    // Skip fetching for other specialized dashboards
    if (user?.role === 'AccountsOfficer' || user?.role === 'Principal' || user?.role === 'Director' || user?.role === 'SuperAdmin') return;
    
    const fetchDashboardData = async () => {
      try {
        // Fetch stats
        const statsRes = await fetch('/api/dashboard/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }

        // Fetch admission trend
        const trendRes = await fetch('/api/dashboard/admission-trend');
        if (trendRes.ok) {
          const trendData = await trendRes.json();
          setAdmissionTrendData(trendData.data);
        }

        // Fetch course distribution
        const courseRes = await fetch('/api/dashboard/course-distribution');
        if (courseRes.ok) {
          const courseData = await courseRes.json();
          setCourseDistributionData(courseData.data);
        }

        // Fetch fee collection
        const feeRes = await fetch('/api/dashboard/fee-collection');
        if (feeRes.ok) {
          const feeData = await feeRes.json();
          setFeeCollectionData(feeData.data);
        }

        // Fetch activities
        const activitiesRes = await fetch('/api/dashboard/activities');
        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json();
          setActivities(activitiesData.activities);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (!user) return null;
  
  // Show specialized dashboard for DocumentOfficer
  if (user.role === 'DocumentOfficer') {
    return <DocumentOfficerDashboard />;
  }
  
  // Show specialized dashboard for AccountsOfficer
  if (user.role === 'AccountsOfficer') {
    return (
      <DashboardLayout>
        <AccountsOfficerDashboard />
      </DashboardLayout>
    );
  }
  
  // Show specialized dashboard for Principal
  if (user.role === 'Principal') {
    return (
      <DashboardLayout>
        <PrincipalDashboard />
      </DashboardLayout>
    );
  }

  // Show specialized dashboard for Director
  if (user.role === 'Director') {
    return (
      <DashboardLayout>
        <DirectorDashboard />
      </DashboardLayout>
    );
  }

  // Show specialized dashboard for SuperAdmin
  if (user.role === 'SuperAdmin') {
    return (
      <DashboardLayout>
        <SuperAdminDashboard />
      </DashboardLayout>
    );
  }

  const renderAdminDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers || 0}
          icon="👥"
          subtitle="Active in system"
          trend="+3 this week"
          loading={loading}
        />
        <StatCard
          title="Total Students"
          value={stats.totalStudents || 0}
          icon="🎓"
          subtitle="All time"
          trend={`+${stats.admittedToday || 0} today`}
          loading={loading}
        />
        <StatCard
          title="Active Courses"
          value={courseDistributionData.length}
          icon="📚"
          subtitle="Offerings"
          loading={loading}
        />
        <StatCard
          title="System Health"
          value="Excellent"
          icon="✅"
          subtitle="All systems operational"
          loading={loading}
          isText
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest system actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.slice(0, 4).map((activity, i) => (
                <div key={`activity-${activity.user}-${i}`} className="flex items-start space-x-3 pb-3 border-b border-border last:border-0">
                  <div className="w-8 h-8 bg-chart-1/10 rounded-full flex items-center justify-center flex-shrink-0 border border-chart-1/20">
                    <span className="text-xs font-semibold text-chart-1">
                      {activity.user.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.user}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <QuickActionButton icon="👤" label="Create User" />
              <QuickActionButton icon="📚" label="Add Course" />
              <QuickActionButton icon="📅" label="Academic Year" />
              <QuickActionButton icon="⚙️" label="Settings" />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderAdmissionStaffDashboard = () => {
    // Filter out courses with 0 students to avoid overlap
    const filteredCourseData = courseDistributionData.filter(course => (course.value || 0) > 0);
    const hasValidCourseData = filteredCourseData.length > 0;

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Today's Applications"
            value={stats.admittedToday || 0}
            icon="📝"
            subtitle="New entries"
            trend="+5 from yesterday"
            loading={loading}
          />
          <StatCard
            title="Total Students"
            value={stats.totalStudents || 0}
            icon="🎓"
            subtitle="All applications"
            loading={loading}
          />
          <StatCard
            title="Pending Documents"
            value={stats.pendingDocuments || 0}
            icon="📄"
            subtitle="Need verification"
            loading={loading}
          />
          <StatCard
            title="Completed"
            value={(stats.totalStudents || 0) - (stats.pendingDocuments || 0)}
            icon="✅"
            subtitle="Admissions complete"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Admission Trend</CardTitle>
              <CardDescription>Daily application entries over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={admissionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="students" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={3} 
                    dot={{ fill: 'hsl(var(--chart-1))', r: 5 }} 
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {hasValidCourseData && (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Course Distribution</CardTitle>
                <CardDescription>Students enrolled by program</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  <div className="w-full lg:w-1/2">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={filteredCourseData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={100}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {filteredCourseData.map((entry, index) => {
                            const colors = [
                              '#3b82f6', // blue-500
                              '#8b5cf6', // violet-500
                              '#ec4899', // pink-500
                              '#10b981', // emerald-500
                              '#f59e0b', // amber-500
                            ];
                            return (
                              <Cell 
                                key={`cell-${entry.name}`} 
                                fill={colors[index % colors.length]}
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))', 
                            borderRadius: '8px',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full lg:w-1/2 space-y-3">
                    {filteredCourseData.map((course, index) => {
                      const colors = [
                        'bg-blue-500',
                        'bg-violet-500',
                        'bg-pink-500',
                        'bg-emerald-500',
                        'bg-amber-500',
                      ];
                      return (
                        <div key={course.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className={`w-4 h-4 rounded-sm flex-shrink-0 ${colors[index % colors.length]}`}
                            />
                            <span className="text-sm font-medium text-foreground">{course.name}</span>
                          </div>
                          <span className="text-sm font-bold text-foreground">{course.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </>
    );
  };

  const renderDocumentOfficerDashboard = () => {
    const completionPercentage = documentStats?.completion_rate || 0;
    
    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Complete Documents"
            value={documentStats?.complete_documents || 0}
            icon="✅"
            subtitle="Fully verified students"
            loading={loading}
          />
          <StatCard
            title="Incomplete Documents"
            value={documentStats?.incomplete_documents || 0}
            icon="⚠️"
            subtitle="Missing documents"
            trend="Priority"
            trendColor="text-destructive"
            loading={loading}
          />
          <StatCard
            title="Pending Review"
            value={documentStats?.pending_documents || 0}
            icon="📄"
            subtitle="Need initial check"
            loading={loading}
          />
          <StatCard
            title="Completion Rate"
            value={`${completionPercentage}%`}
            icon="📊"
            subtitle="Overall progress"
            loading={loading}
            isText
          />
        </div>

        {/* Students with Incomplete Documents */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Students with Missing Documents</CardTitle>
            <CardDescription>Requires immediate attention ({incompleteStudents.length} students)</CardDescription>
          </CardHeader>
          <CardContent>
            {incompleteStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg">🎉 All students have complete documents!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incompleteStudents.map((student) => (
                  <div 
                    key={student.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-1 mb-2 sm:mb-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{student.full_name}</p>
                        <span className="px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive rounded border border-destructive/20">
                          {student.missing_required} missing
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {student.application_number} • {student.course_code}
                      </p>
                      {student.missing_docs && student.missing_docs.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {student.missing_docs.map((doc, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-0.5 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded border border-amber-500/20"
                            >
                              {doc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button className="px-4 py-2 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 border border-primary/20 transition-colors">
                      Update Status
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Type Statistics */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Document Type Statistics</CardTitle>
            <CardDescription>Completion status by document type</CardDescription>
          </CardHeader>
          <CardContent>
            {docTypeStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No document types configured</p>
              </div>
            ) : (
              <div className="space-y-4">
                {docTypeStats.map((docType) => {
                  const percentage = docType.total_students > 0 
                    ? Math.round((docType.declared_count / docType.total_students) * 100)
                    : 0;
                  
                  return (
                    <div key={docType.code} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{docType.name}</span>
                          {docType.is_required && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded border border-blue-500/20">
                              Required
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">{docType.declared_count}</span>
                          {' / '}
                          <span>{docType.total_students}</span>
                          <span className="ml-2 text-xs">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-violet-500 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAccountsOfficerDashboard = () => {
    const collectionRate = stats.totalFeesCollected && (stats.totalFeesCollected + (stats.pendingFees || 0)) > 0
      ? ((stats.totalFeesCollected / (stats.totalFeesCollected + (stats.pendingFees || 0))) * 100).toFixed(1)
      : '0';

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Fees Collectible"
            value={`₹${(((stats.totalFeesCollected || 0) + (stats.pendingFees || 0)) / 100000).toFixed(1)}L`}
            icon="�"
            subtitle="Total amount"
            loading={loading}
            isText
          />
          <StatCard
            title="Total Collected"
            value={`₹${((stats.totalFeesCollected || 0) / 100000).toFixed(1)}L`}
            icon="💵"
            subtitle="This academic year"
            loading={loading}
            isText
          />
          <StatCard
            title="Pending Fees"
            value={`₹${((stats.pendingFees || 0) / 100000).toFixed(1)}L`}
            icon="⏳"
            subtitle="Outstanding amount"
            loading={loading}
            isText
          />
          <StatCard
            title="Collection Rate"
            value={`${collectionRate}%`}
            icon="📊"
            subtitle="Fee recovery"
            loading={loading}
            isText
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Monthly Collection Trend</CardTitle>
              <CardDescription>Fee collection in lakhs (₹)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={feeCollectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value) => [`₹${value}L`, 'Amount']}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </>
    );
  };

  const renderPrincipalDirectorDashboard = () => {
    const sampleStatus = [
      { id: '1', label: 'Fee Received', value: (stats.totalStudents || 0) - (stats.pendingDocuments || 0), color: 'hsl(var(--chart-3))' },
      { id: '2', label: 'Documents Pending', value: stats.pendingDocuments || 0, color: 'hsl(var(--chart-2))' },
      { id: '3', label: 'New Applications', value: stats.admittedToday || 0, color: 'hsl(var(--chart-1))' },
    ];

    const sampleMetrics = [
      { 
        id: '1', 
        label: 'Document Completion Rate', 
        value: `${stats.totalStudents && stats.totalStudents > 0 ? Math.round(((stats.totalStudents - (stats.pendingDocuments || 0)) / stats.totalStudents) * 100) : 0}%`, 
        icon: '📄' 
      },
      { 
        id: '2', 
        label: 'Fee Collection Rate', 
        value: `${stats.totalFeesCollected && (stats.totalFeesCollected + (stats.pendingFees || 0)) > 0 ? ((stats.totalFeesCollected / (stats.totalFeesCollected + (stats.pendingFees || 0))) * 100).toFixed(1) : 0}%`, 
        icon: '💰' 
      },
      { 
        id: '3', 
        label: 'Total Students', 
        value: stats.totalStudents || 0, 
        icon: '🎓' 
      },
      { 
        id: '4', 
        label: 'Active Courses', 
        value: courseDistributionData.length || 0, 
        icon: '📚' 
      },
    ];

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Admissions"
            value={stats.totalStudents || 0}
            icon="🎓"
            subtitle="2025-2026 Academic Year"
            trend="+6.8% from last year"
            loading={loading}
          />
          <StatCard
            title="Today's Entries"
            value={stats.admittedToday || 0}
            icon="📝"
            subtitle="New applications"
            loading={loading}
          />
          <StatCard
            title="Fees Collected"
            value={`₹${((stats.totalFeesCollected || 0) / 100000).toFixed(1)}L`}
            icon="💰"
            subtitle="85.1% recovery rate"
            loading={loading}
            isText
          />
          <StatCard
            title="System Status"
            value="Active"
            icon="✅"
            subtitle="All operations normal"
            loading={loading}
            isText
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 border-border">
            <CardHeader>
              <CardTitle>Admission Trend Analysis</CardTitle>
              <CardDescription>Daily admission entries over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={admissionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="students" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={3} 
                    dot={{ fill: 'hsl(var(--chart-1))', r: 4 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Admission Status</CardTitle>
              <CardDescription>Current breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleStatus.map((status) => (
                  <div key={status.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-foreground">{status.label}</span>
                      <span className="text-foreground font-semibold">{status.value}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${((status.value / (stats.totalStudents || 245)) * 100)}%`,
                          backgroundColor: status.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Course-wise Admissions</CardTitle>
              <CardDescription>Distribution across programs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={courseDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {courseDistributionData.map((entry, index) => {
                      const colors = [
                        '#3b82f6', // blue-500
                        '#8b5cf6', // violet-500
                        '#ec4899', // pink-500
                        '#10b981', // emerald-500
                        '#f59e0b', // amber-500
                      ];
                      return (
                        <Cell 
                          key={`cell-${entry.name}`} 
                          fill={colors[index % colors.length]}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))', 
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
              <CardDescription>Institutional overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleMetrics.map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{metric.icon}</span>
                      <span className="text-sm font-medium text-foreground">{metric.label}</span>
                    </div>
                    <span className="text-sm font-bold text-chart-1">{metric.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  };

  const getRoleDashboard = () => {
    switch (user.role) {
      case 'SuperAdmin':
      case 'Admin':
        return renderAdminDashboard();
      case 'AdmissionStaff':
        return renderAdmissionStaffDashboard();
      case 'DocumentOfficer':
        return renderDocumentOfficerDashboard();
      case 'AccountsOfficer':
        return renderAccountsOfficerDashboard();
      case 'Principal':
      case 'Director':
        return renderPrincipalDirectorDashboard();
      default:
        return renderPrincipalDirectorDashboard();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-primary to-chart-4 rounded-2xl p-6 text-primary-foreground shadow-lg">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.username}!
          </h1>
          <p className="text-primary-foreground/90">
            {user.role} Dashboard • Kashmir College of Engineering & Technology
          </p>
          <p className="text-primary-foreground/70 text-sm mt-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Role-specific Dashboard */}
        {getRoleDashboard()}
      </div>
    </DashboardLayout>
  );
}

// Reusable StatCard Component
function StatCard({ 
  title, 
  value, 
  icon, 
  subtitle, 
  trend, 
  trendColor = "text-chart-3", 
  loading, 
  isText = false 
}: Readonly<{ 
  title: string;
  value: number | string;
  icon: string;
  subtitle: string;
  trend?: string;
  trendColor?: string;
  loading: boolean;
  isText?: boolean;
}>) {
  const formatValue = () => {
    if (isText) return value;
    if (typeof value === 'number') return value.toLocaleString();
    return value;
  };

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-4" />
            <div className="h-8 bg-muted rounded w-3/4" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <span className="text-2xl">{icon}</span>
            </div>
            <div className="space-y-1">
              <p className={`${isText ? 'text-2xl' : 'text-3xl'} font-bold text-foreground`}>
                {formatValue()}
              </p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
              {trend && (
                <p className={`text-xs font-medium ${trendColor}`}>{trend}</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Quick Action Button
function QuickActionButton({ icon, label }: Readonly<{ icon: string; label: string }>) {
  return (
    <button className="flex flex-col items-center justify-center p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors group border border-border">
      <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}
