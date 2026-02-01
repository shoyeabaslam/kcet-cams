'use client';

import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Application {
  student_id: string;
  application_number: string;
  full_name: string;
  email: string;
  phone: string;
  course_name: string;
  course_code: string;
  year_label: string;
  status: string;
  created_at: string;
  date_of_birth: string;
  category: string;
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  useEffect(() => {
    // Allow AdmissionStaff, Admin, SuperAdmin, Principal, Director
    if (user && user.role !== 'AdmissionStaff' && user.role !== 'Admin' && user.role !== 'SuperAdmin' && user.role !== 'Principal' && user.role !== 'Director') {
      router.push('/unauthorized');
      return;
    }
    fetchApplications();
  }, [user, router]);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, statusFilter, courseFilter, applications]);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/students');
      if (!response.ok) throw new Error('Failed to fetch applications');
      
      const data = await response.json();
      setApplications(data.students || []);
      setFilteredApplications(data.students || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.phone?.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(app => app.course_code === courseFilter);
    }

    setFilteredApplications(filtered);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'APPLICATION_ENTERED': 'bg-blue-100 text-blue-800',
      'DOCUMENTS_DECLARED': 'bg-green-100 text-green-800',
      'DOCUMENTS_INCOMPLETE': 'bg-yellow-100 text-yellow-800',
      'FEE_PENDING': 'bg-orange-100 text-orange-800',
      'FEE_PARTIAL': 'bg-purple-100 text-purple-800',
      'FEE_RECEIVED': 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return status.replaceAll('_', ' ');
  };

  const uniqueCourses = Array.from(new Set(applications.map(app => app.course_code))).filter(Boolean);

  const stats = {
    total: applications.length,
    new: applications.filter(app => app.status === 'APPLICATION_ENTERED').length,
    documentsIncomplete: applications.filter(app => app.status === 'DOCUMENTS_INCOMPLETE').length,
    feePending: applications.filter(app => app.status === 'FEE_PENDING').length,
    feeReceived: applications.filter(app => app.status === 'FEE_RECEIVED').length,
  };

  if (!user) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading applications...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
            <p className="text-gray-600 mt-1">Manage student applications and admissions</p>
          </div>
          <Link
            href="/dashboard/students/new"
            className="px-6 py-3 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors font-medium"
          >
            + New Application
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600 mt-1">Total Applications</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.new}</p>
                <p className="text-sm text-gray-600 mt-1">New Applications</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{stats.documentsIncomplete}</p>
                <p className="text-sm text-gray-600 mt-1">Pending Documents</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{stats.feePending}</p>
                <p className="text-sm text-gray-600 mt-1">Awaiting Payment</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">{stats.feeReceived}</p>
                <p className="text-sm text-gray-600 mt-1">Fees Received</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Name, application number, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="APPLICATION_ENTERED">New Applications</option>
                  <option value="DOCUMENTS_INCOMPLETE">Documents Incomplete</option>
                  <option value="FEE_PENDING">Fee Pending</option>
                  <option value="FEE_PARTIAL">Partial Payment</option>
                  <option value="FEE_RECEIVED">Fee Received (Final)</option>
                </select>
              </div>

              {/* Course Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                >
                  <option value="all">All Courses</option>
                  {uniqueCourses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredApplications.length} of {applications.length} applications
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>All Applications</CardTitle>
            <CardDescription>Click on any application to view details</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600 text-lg font-medium">No applications found</p>
                <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or add a new application</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApplications.map((app) => (
                  <Link
                    key={app.student_id}
                    href={`/dashboard/students/${app.student_id}`}
                    className="block p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Student Info */}
                        <div className="md:col-span-2">
                          <p className="font-semibold text-gray-900">{app.full_name}</p>
                          <p className="text-sm text-gray-600 font-mono">{app.application_number}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {app.email && (
                              <span className="text-xs text-gray-500">📧 {app.email}</span>
                            )}
                            {app.phone && (
                              <span className="text-xs text-gray-500">📱 {app.phone}</span>
                            )}
                          </div>
                        </div>

                        {/* Course Info */}
                        <div>
                          <p className="text-sm font-medium text-gray-700">{app.course_name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{app.course_code || 'No course'}</p>
                          <p className="text-xs text-gray-500 mt-1">📅 {app.year_label || 'N/A'}</p>
                        </div>

                        {/* Status */}
                        <div>
                          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                            {getStatusLabel(app.status)}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Applied</p>
                          <p className="text-xs text-gray-500">
                            {new Date(app.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="ml-4">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
