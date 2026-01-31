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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, LineChart, Line } from 'recharts';

interface DashboardStats {
  totalStudents?: number;
  admittedToday?: number;
  pendingDocuments?: number;
  totalFeesCollected?: number;
  pendingFees?: number;
  totalUsers?: number;
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

  useEffect(() => {
    // Skip fetching for specialized dashboards
    if (user?.role === 'DocumentOfficer' || user?.role === 'AccountsOfficer' || user?.role === 'Principal' || user?.role === 'Director' || user?.role === 'SuperAdmin') return;
    
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
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest system actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.slice(0, 4).map((activity, i) => (
                <div key={`activity-${activity.user}-${i}`} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-blue-900">
                      {activity.user.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
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

  const renderAdmissionStaffDashboard = () => (
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
          title="Pending Assignment"
          value={23}
          icon="⏳"
          subtitle="Need course assignment"
          loading={loading}
        />
        <StatCard
          title="Admitted"
          value={(stats.totalStudents || 0) - (stats.pendingDocuments || 0)}
          icon="✅"
          subtitle="Completed admissions"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Admission Trend</CardTitle>
            <CardDescription>Daily application entries (Last 7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={admissionTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="students" stroke="#1e40af" strokeWidth={2} dot={{ fill: '#1e40af' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Distribution</CardTitle>
            <CardDescription>Students by course preference</CardDescription>
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
                  fill="#8884d8"
                  dataKey="value"
                >
                  {courseDistributionData.map((entry) => (
                    <path key={`pie-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderDocumentOfficerDashboard = () => {
    const sampleStudents = [
      { id: '1', name: 'Rahul Kumar', missing: 'Transfer Certificate', app: 'APP2025234' },
      { id: '2', name: 'Priya Sharma', missing: 'Migration Certificate', app: 'APP2025235' },
      { id: '3', name: 'Amit Singh', missing: 'Character Certificate', app: 'APP2025236' },
      { id: '4', name: 'Sneha Reddy', missing: 'Aadhar Card', app: 'APP2025237' },
    ];

    const sampleDocs = [
      { id: '1', name: 'SSC Certificate', complete: stats.totalStudents || 245, total: stats.totalStudents || 245, percentage: 100 },
      { id: '2', name: 'Intermediate', complete: (stats.totalStudents || 245) - 2, total: stats.totalStudents || 245, percentage: 99 },
      { id: '3', name: 'Transfer Certificate', complete: (stats.totalStudents || 245) - (stats.pendingDocuments || 18), total: stats.totalStudents || 245, percentage: 93 },
      { id: '4', name: 'Aadhar Card', complete: (stats.totalStudents || 245) - 5, total: stats.totalStudents || 245, percentage: 98 },
      { id: '5', name: 'Photos', complete: stats.totalStudents || 245, total: stats.totalStudents || 245, percentage: 100 },
    ];

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Pending Documents"
            value={stats.pendingDocuments || 0}
            icon="📄"
            subtitle="Incomplete submissions"
            trend="Priority"
            trendColor="text-red-600"
            loading={loading}
          />
          <StatCard
            title="Complete Documents"
            value={(stats.totalStudents || 0) - (stats.pendingDocuments || 0)}
            icon="✅"
            subtitle="All documents verified"
            loading={loading}
          />
          <StatCard
            title="Today's Updates"
            value={34}
            icon="📝"
            subtitle="Documents processed"
            loading={loading}
          />
          <StatCard
            title="Completion Rate"
            value={`${stats.totalStudents ? Math.round(((stats.totalStudents - (stats.pendingDocuments || 0)) / stats.totalStudents) * 100) : 92.7}%`}
            icon="📊"
            subtitle="Overall status"
            loading={loading}
            isText
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Students Needing Attention</CardTitle>
              <CardDescription>Incomplete document submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sampleStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-600">Missing: {student.missing}</p>
                      <p className="text-xs text-gray-400 mt-1">{student.app}</p>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-medium text-blue-900 bg-blue-50 rounded-lg hover:bg-blue-100">
                      Update
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Types Status</CardTitle>
              <CardDescription>Completion by document type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sampleDocs.map((doc) => (
                  <div key={doc.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{doc.name}</span>
                      <span className="text-gray-600">{doc.complete}/{doc.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-900 h-2 rounded-full"
                        style={{ width: `${doc.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  };

  const renderAccountsOfficerDashboard = () => {
    const samplePayments = [
      { id: '1', name: 'Aditya Verma', amount: 85000, mode: 'Online', time: '10 min ago' },
      { id: '2', name: 'Kavya Nair', amount: 75000, mode: 'Cash', time: '25 min ago' },
      { id: '3', name: 'Rohan Patel', amount: 42500, mode: 'Cheque', time: '1 hour ago' },
      { id: '4', name: 'Divya Menon', amount: 85000, mode: 'Online', time: '2 hours ago' },
    ];

    const collectionRate = stats.totalFeesCollected && (stats.totalFeesCollected + (stats.pendingFees || 0)) > 0
      ? ((stats.totalFeesCollected / (stats.totalFeesCollected + (stats.pendingFees || 0))) * 100).toFixed(1)
      : '85.1';

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Today's Collection"
            value="₹2,45,000"
            icon="💰"
            subtitle="12 payments received"
            trend="+18% from yesterday"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Collection Trend</CardTitle>
              <CardDescription>Fee collection in lakhs (₹)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={feeCollectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => [`₹${value}L`, 'Amount']}
                  />
                  <Bar dataKey="amount" fill="#1e40af" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest fee transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {samplePayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{payment.name}</p>
                      <p className="text-xs text-gray-600">₹{payment.amount.toLocaleString()} • {payment.mode}</p>
                      <p className="text-xs text-gray-400 mt-1">{payment.time}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded">
                      Paid
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  };

  const renderPrincipalDirectorDashboard = () => {
    const sampleStatus = [
      { id: '1', label: 'Admitted', value: (stats.totalStudents || 245) - (stats.pendingDocuments || 18) - 45, color: 'bg-green-500' },
      { id: '2', label: 'Fee Pending', value: 45, color: 'bg-yellow-500' },
      { id: '3', label: 'Documents Pending', value: stats.pendingDocuments || 18, color: 'bg-orange-500' },
      { id: '4', label: 'New Applications', value: stats.admittedToday || 12, color: 'bg-blue-500' },
    ];

    const sampleMetrics = [
      { id: '1', label: 'Document Completion Rate', value: '92.7%', icon: '📄' },
      { id: '2', label: 'Fee Collection Rate', value: '85.1%', icon: '💰' },
      { id: '3', label: 'Average Processing Time', value: '2.3 days', icon: '⏱️' },
      { id: '4', label: 'Staff Efficiency', value: 'Excellent', icon: '⭐' },
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
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Admission Trend Analysis</CardTitle>
              <CardDescription>Daily admission entries over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={admissionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="students" stroke="#1e40af" strokeWidth={3} dot={{ fill: '#1e40af', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admission Status</CardTitle>
              <CardDescription>Current breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleStatus.map((status) => (
                  <div key={status.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-gray-700">{status.label}</span>
                      <span className="text-gray-900 font-semibold">{status.value}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${status.color} h-2 rounded-full`}
                        style={{ width: `${((status.value / (stats.totalStudents || 245)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
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
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {courseDistributionData.map((entry) => (
                      <path key={`pie-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
              <CardDescription>Institutional overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleMetrics.map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{metric.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                    </div>
                    <span className="text-sm font-bold text-blue-900">{metric.value}</span>
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
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.username}!
          </h1>
          <p className="text-blue-100">
            {user.role} Dashboard • Kashmir College of Engineering & Technology
          </p>
          <p className="text-blue-200 text-sm mt-2">
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
  trendColor = "text-green-600", 
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
    <Card>
      <CardContent className="p-6">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <span className="text-2xl">{icon}</span>
            </div>
            <div className="space-y-1">
              <p className={`${isText ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>
                {formatValue()}
              </p>
              <p className="text-xs text-gray-500">{subtitle}</p>
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
    <button className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
      <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}
