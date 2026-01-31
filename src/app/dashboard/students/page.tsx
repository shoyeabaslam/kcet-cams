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

  useEffect(() => {
    fetchStudents();
  }, [statusFilter, courseFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (courseFilter) params.append('course', courseFilter);
      if (search) params.append('search', search);

      const response = await fetch(`/api/students?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchStudents();
  };

  if (!user) return null;

  const canAddStudent = ['AdmissionStaff', 'Admin', 'SuperAdmin'].includes(user.role);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      'APPLICATION_ENTERED': 'bg-blue-100 text-blue-800',
      'DOCUMENTS_INCOMPLETE': 'bg-yellow-100 text-yellow-800',
      'DOCUMENTS_DECLARED': 'bg-purple-100 text-purple-800',
      'FEE_PENDING': 'bg-orange-100 text-orange-800',
      'FEE_PARTIAL': 'bg-yellow-100 text-yellow-800',
      'FEE_RECEIVED': 'bg-green-100 text-green-800',
      'ADMITTED': 'bg-green-100 text-green-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentBadge = (status: string) => {
    const badges: Record<string, string> = {
      'FEE_RECEIVED': 'bg-green-100 text-green-800',
      'FEE_PARTIAL': 'bg-yellow-100 text-yellow-800',
      'FEE_PENDING': 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-600 mt-1">Manage student applications and admissions</p>
          </div>
          {canAddStudent && (
            <Link
              href="/dashboard/students/new"
              className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
            >
              + Add Student
            </Link>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Students</CardTitle>
            <CardDescription>Search and filter student records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="flex space-x-2">
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Name, email, or application number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    Search
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="Application Submitted">Application Submitted</option>
                  <option value="Documents Pending">Documents Pending</option>
                  <option value="Documents Verified">Documents Verified</option>
                  <option value="Fee Pending">Fee Pending</option>
                  <option value="Fee Paid">Fee Paid</option>
                  <option value="Admitted">Admitted</option>
                </select>
              </div>
              <div>
                <label htmlFor="course-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <select
                  id="course-filter"
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Courses</option>
                  <option value="1">Computer Science</option>
                  <option value="2">AI & ML</option>
                  <option value="3">Electronics</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Student Records ({students.length})</CardTitle>
            <CardDescription>Complete list of student applications</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg" />
                  </div>
                ))}
              </div>
            )}
            {!loading && students.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No students found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
              </div>
            )}
            {!loading && students.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Application
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Documents
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{student.application_number}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(student.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.full_name}
                            </p>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            <p className="text-xs text-gray-500">{student.phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{student.course_name}</p>
                            <p className="text-xs text-gray-500">{student.course_code}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(student.status)}`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            {student.pending_docs > 0 ? (
                              <span className="text-orange-600 font-medium">
                                {student.pending_docs} pending
                              </span>
                            ) : (
                              <span className="text-green-600 font-medium">Complete</span>
                            )}
                            <p className="text-xs text-gray-500">
                              {student.total_docs || 0} total
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentBadge(student.payment_status || 'Pending')}`}>
                              {student.payment_status || 'Pending'}
                            </span>
                            {student.pending_amount > 0 && (
                              <p className="text-xs text-gray-600 mt-1">
                                ₹{student.pending_amount.toLocaleString()} due
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/dashboard/students/${student.student_id}`}
                            className="text-blue-900 hover:text-blue-700 font-medium text-sm"
                          >
                            View Details →
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
