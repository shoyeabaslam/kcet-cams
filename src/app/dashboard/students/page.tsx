'use client';

import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Student {
  student_id: string;
  application_number: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  course_name: string;
  course_code: string;
  year_name: string;
  pending_amount: number;
  payment_status: string;
  pending_docs: number;
  total_docs: number;
  created_at: string;
}

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [courses, setCourses] = useState<{ id: string; course_name: string; course_code: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: number; year_label: string }[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Get status from URL if navigating from dashboard
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlStatus = params.get('status');
    if (urlStatus) {
      setStatusFilter(urlStatus);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [statusFilter, courseFilter, academicYearFilter, paymentStatusFilter]);

  const fetchFilters = async () => {
    try {
      // Fetch courses
      const coursesRes = await fetch('/api/courses');
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
      }

      // Fetch academic years
      const ayRes = await fetch('/api/academic-years');
      if (ayRes.ok) {
        const ayData = await ayRes.json();
        setAcademicYears(ayData.academicYears || []);
      }
    } catch (error) {
      console.error('Failed to fetch filters:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (courseFilter) params.append('course', courseFilter);
      if (academicYearFilter) params.append('academicYear', academicYearFilter);
      if (paymentStatusFilter) params.append('paymentStatus', paymentStatusFilter);
      if (search.trim()) params.append('search', search.trim());

      const response = await fetch(`/api/students?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
        setTotalCount(data.pagination?.total || data.students.length);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    fetchStudents();
  };

  const handleReset = () => {
    setSearch('');
    setStatusFilter('');
    setCourseFilter('');
    setAcademicYearFilter('');
    setPaymentStatusFilter('');
    // Reset will trigger useEffect to fetch all students
  };

  if (!user) return null;

  const canAddStudent = ['AdmissionStaff', 'Admin', 'SuperAdmin'].includes(user.role);

  // Check if any filters are active
  const hasActiveFilters = statusFilter || courseFilter || academicYearFilter || paymentStatusFilter || search.trim();

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      'APPLICATION_ENTERED': 'bg-chart-1/10 text-chart-1 border border-chart-1/20',
      'DOCUMENTS_INCOMPLETE': 'bg-amber-500/10 text-amber-700 border border-amber-500/20',
      'DOCUMENTS_DECLARED': 'bg-chart-2/10 text-chart-2 border border-chart-2/20',
      'FEE_PENDING': 'bg-orange-500/10 text-orange-700 border border-orange-500/20',
      'FEE_PARTIAL': 'bg-amber-500/10 text-amber-700 border border-amber-500/20',
      'FEE_RECEIVED': 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20',
    };
    return badges[status] || 'bg-muted text-muted-foreground border border-border';
  };

  const getPaymentBadge = (status: string) => {
    const badges: Record<string, string> = {
      'FEE_RECEIVED': 'bg-chart-3/10 text-chart-3 border border-chart-3/20',
      'FEE_PARTIAL': 'bg-amber-500/10 text-amber-700 border border-amber-500/20',
      'FEE_PENDING': 'bg-destructive/10 text-destructive border border-destructive/20',
    };
    return badges[status] || 'bg-muted text-muted-foreground border border-border';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Students</h1>
            <p className="text-muted-foreground mt-1">Manage student applications and admissions</p>
          </div>
          {canAddStudent && (
            <Link
              href="/dashboard/students/new"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
            >
              + Add Student
            </Link>
          )}
        </div>

        {/* Filters */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Search & Filter Students</CardTitle>
                <CardDescription>Find students using multiple criteria</CardDescription>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              {/* Search Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-4">
                  <label htmlFor="search-input" className="block text-sm font-medium text-foreground mb-2">
                    🔍 Quick Search
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Search by name, email, phone, or application number..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-foreground mb-2">
                    📋 Application Status
                  </label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">All Status</option>
                    <option value="APPLICATION_ENTERED">📝 Application Entered</option>
                    <option value="DOCUMENTS_INCOMPLETE">⚠️ Documents Incomplete</option>
                    <option value="DOCUMENTS_DECLARED">✅ Documents Declared</option>
                    <option value="FEE_PENDING">💰 Fee Pending</option>
                    <option value="FEE_PARTIAL">💵 Fee Partial</option>
                    <option value="FEE_RECEIVED">🎓 Fee Received (Complete)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="payment-filter" className="block text-sm font-medium text-foreground mb-2">
                    💳 Payment Status
                  </label>
                  <select
                    id="payment-filter"
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">All Payments</option>
                    <option value="FEE_PENDING">🔴 Pending</option>
                    <option value="FEE_PARTIAL">🟡 Partial Paid</option>
                    <option value="FEE_RECEIVED">🟢 Fully Paid</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="course-filter" className="block text-sm font-medium text-foreground mb-2">
                    📚 Course/Program
                  </label>
                  <select
                    id="course-filter"
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">All Courses</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.course_code} - {course.course_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="academic-year-filter" className="block text-sm font-medium text-foreground mb-2">
                    📅 Academic Year
                  </label>
                  <select
                    id="academic-year-filter"
                    value={academicYearFilter}
                    onChange={(e) => setAcademicYearFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">All Years</option>
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.year_label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
                  {statusFilter && (
                    <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md border border-blue-500/20">
                      Status: {statusFilter.replaceAll('_', ' ')}
                    </span>
                  )}
                  {paymentStatusFilter && (
                    <span className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-500/20">
                      Payment: {paymentStatusFilter.replaceAll('_', ' ')}
                    </span>
                  )}
                  {courseFilter && (
                    <span className="px-2 py-1 text-xs bg-violet-500/10 text-violet-700 dark:text-violet-400 rounded-md border border-violet-500/20">
                      Course: {courses.find(c => c.id === courseFilter)?.course_code}
                    </span>
                  )}
                  {academicYearFilter && (
                    <span className="px-2 py-1 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md border border-amber-500/20">
                      Year: {academicYears.find(ay => ay.id.toString() === academicYearFilter)?.year_label}
                    </span>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Student Records
                  <span className="ml-2 text-primary">({totalCount})</span>
                </CardTitle>
                <CardDescription>
                  {hasActiveFilters 
                    ? `Showing ${students.length} filtered results from ${totalCount} total students`
                    : `All student applications and admissions`
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-muted rounded-lg" />
                  </div>
                ))}
              </div>
            )}
            {!loading && students.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-muted-foreground">📋</span>
                </div>
                <p className="text-muted-foreground text-lg font-medium">No students found</p>
                <p className="text-muted-foreground/60 text-sm mt-2">Try adjusting your filters or search terms</p>
              </div>
            )}
            {!loading && students.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Application
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Documents
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.map((student) => (
                      <tr key={student.student_id} className="hover:bg-accent transition-colors">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-foreground">{student.application_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(student.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-foreground">
                              {student.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                            <p className="text-xs text-muted-foreground">{student.phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-foreground">{student.course_name}</p>
                            <p className="text-xs text-muted-foreground">{student.course_code}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-md ${getStatusBadge(student.status)}`}>
                            {student.status.replaceAll('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            {student.pending_docs > 0 ? (
                              <span className="text-orange-600 font-medium">
                                {student.pending_docs} pending
                              </span>
                            ) : (
                              <span className="text-chart-3 font-medium">Complete</span>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {student.total_docs || 0} total
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-md ${getPaymentBadge(student.payment_status || 'Pending')}`}>
                              {student.payment_status ? student.payment_status.replaceAll('_', ' ') : 'Pending'}
                            </span>
                            {student.pending_amount > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                ₹{student.pending_amount.toLocaleString()} due
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/dashboard/students/${student.student_id}`}
                            className="text-primary hover:text-primary/80 font-medium text-sm transition-colors inline-flex items-center"
                          >
                            View Details
                            {' '}
                            <span>→</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
