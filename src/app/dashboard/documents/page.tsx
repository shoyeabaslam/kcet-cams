'use client';

import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface StudentDocument {
  student_id: string;
  student_name: string;
  application_number: string;
  course_name: string;
  status: string;
  total_required: number;
  declared_count: number;
  completion_percentage: number;
  last_updated: string;
  email: string;
  phone: string;
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<StudentDocument[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [completionFilter, setCompletionFilter] = useState('all');

  useEffect(() => {
    // Allow DocumentOfficer, Admin, SuperAdmin, Principal, Director
    if (user && !['DocumentOfficer', 'Admin', 'SuperAdmin', 'Principal', 'Director'].includes(user.role)) {
      router.push('/unauthorized');
      return;
    }
    fetchStudentsWithDocuments();
  }, [user, router]);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, statusFilter, completionFilter, students]);

  const fetchStudentsWithDocuments = async () => {
    try {
      // First, fetch all required document types
      const docTypesResponse = await fetch('/api/document-types');
      if (!docTypesResponse.ok) throw new Error('Failed to fetch document types');
      const docTypesData = await docTypesResponse.json();
      const requiredDocTypes = docTypesData.documentTypes?.filter((dt: any) => dt.is_required === true) || [];
      const totalRequiredDocs = requiredDocTypes.length;

      const response = await fetch('/api/students');
      if (!response.ok) throw new Error('Failed to fetch students');
      
      const data = await response.json();
      const studentsData = data.students || [];

      // Fetch document details for each student
      const studentsWithDocs = await Promise.all(
        studentsData.map(async (student: any) => {
          try {
            // Use student_id field from API response
            const studentId = student.student_id || student.id;
            const detailResponse = await fetch(`/api/students/${studentId}`);
            if (!detailResponse.ok) throw new Error('Failed to fetch student details');
            
            const detailData = await detailResponse.json();
            const documents = detailData.documents || detailData.student.documents || [];
            
            // Count declared required documents (documents student has submitted)
            const declaredCount = documents.filter((d: any) => d.is_mandatory === true && d.declared === true).length;
            
            // Use total required doc types from system, not just submitted ones
            const completion = totalRequiredDocs > 0 ? Math.round((declaredCount / totalRequiredDocs) * 100) : 0;
            return {
              student_id: studentId,
              student_name: student.full_name,
              application_number: student.application_number,
              course_name: student.course_name || 'N/A',
              status: student.status,
              total_required: totalRequiredDocs,
              declared_count: declaredCount,
              completion_percentage: completion,
              last_updated: student.updated_at || student.created_at,
              email: student.email,
              phone: student.phone,
            };
          } catch (error) {
            const studentId = student.student_id || student.id;
            console.error(`Error fetching details for student ${studentId}:`, error);
            // Return student with zero documents if fetch fails
            return {
              student_id: studentId,
              student_name: student.full_name,
              application_number: student.application_number,
              course_name: student.course_name || 'N/A',
              status: student.status,
              total_required: totalRequiredDocs,
              declared_count: 0,
              completion_percentage: 0,
              last_updated: student.updated_at || student.created_at,
              email: student.email,
              phone: student.phone,
            };
          }
        })
      );

      setStudents(studentsWithDocs);
      setFilteredStudents(studentsWithDocs);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        filtered = filtered.filter(s => ['APPLICATION_ENTERED', 'DOCUMENTS_INCOMPLETE'].includes(s.status));
      } else if (statusFilter === 'complete') {
        filtered = filtered.filter(s => s.status === 'FEE_PENDING' || s.completion_percentage === 100);
      }
    }

    // Completion filter
    if (completionFilter !== 'all') {
      if (completionFilter === 'incomplete') {
        filtered = filtered.filter(s => s.completion_percentage < 100);
      } else if (completionFilter === 'complete') {
        filtered = filtered.filter(s => s.completion_percentage === 100);
      } else if (completionFilter === 'empty') {
        filtered = filtered.filter(s => s.completion_percentage === 0);
      }
    }

    setFilteredStudents(filtered);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'APPLICATION_ENTERED': 'bg-blue-100 text-blue-800',
      'DOCUMENTS_INCOMPLETE': 'bg-yellow-100 text-yellow-800',
      'FEE_PENDING': 'bg-orange-100 text-orange-800',
      'FEE_PARTIAL': 'bg-purple-100 text-purple-800',
      'FEE_RECEIVED': 'bg-emerald-100 text-emerald-800',
      'ADMITTED': 'bg-green-600 text-white',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const stats = {
    total: students.length,
    pending: students.filter(s => ['APPLICATION_ENTERED', 'DOCUMENTS_INCOMPLETE'].includes(s.status)).length,
    complete: students.filter(s => s.completion_percentage === 100).length,
    incomplete: students.filter(s => s.completion_percentage > 0 && s.completion_percentage < 100).length,
    empty: students.filter(s => s.completion_percentage === 0).length,
  };

  if (!user) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading documents...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
            <p className="text-gray-600 mt-1">Track and manage student document submissions</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600 mt-1">Total Students</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{stats.empty}</p>
                <p className="text-sm text-gray-600 mt-1">No Documents</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{stats.incomplete}</p>
                <p className="text-sm text-gray-600 mt-1">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.complete}</p>
                <p className="text-sm text-gray-600 mt-1">Complete</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
                <p className="text-sm text-gray-600 mt-1">Action Required</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Name, application number, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Document Status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                >
                  <option value="all">All Students</option>
                  <option value="pending">Pending Verification</option>
                  <option value="complete">Documents Complete</option>
                </select>
              </div>

              {/* Completion Filter */}
              <div>
                <label htmlFor="completion-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Completion
                </label>
                <select
                  id="completion-filter"
                  value={completionFilter}
                  onChange={(e) => setCompletionFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                >
                  <option value="all">All Levels</option>
                  <option value="empty">0% (No Documents)</option>
                  <option value="incomplete">1-99% (In Progress)</option>
                  <option value="complete">100% (Complete)</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredStudents.length} of {students.length} students
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Student Documents</CardTitle>
            <CardDescription>Click on any student to manage their documents</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600 text-lg font-medium">No students found</p>
                <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map((student) => (
                  <Link
                    key={student.student_id}
                    href={`/dashboard/students/${student.student_id}?tab=documents`}
                    className="block p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Student Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-gray-900 truncate">{student.student_name}</p>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(student.status)}`}>
                            {student.status.replaceAll('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="font-mono">{student.application_number}</span>
                          <span className="truncate">{student.course_name}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-64 hidden lg:block">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Document Progress</span>
                          <span className="text-xs font-semibold text-gray-900">
                            {student.declared_count}/{student.total_required}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${getCompletionColor(student.completion_percentage)}`}
                            style={{ width: `${student.completion_percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {student.completion_percentage}% Complete
                        </div>
                      </div>

                      {/* Completion Badge (Mobile) */}
                      <div className="lg:hidden">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          student.completion_percentage === 100 ? 'bg-green-100' :
                          student.completion_percentage >= 50 ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <span className={`text-sm font-bold ${
                            student.completion_percentage === 100 ? 'text-green-700' :
                            student.completion_percentage >= 50 ? 'text-yellow-700' : 'text-red-700'
                          }`}>
                            {student.completion_percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Action Indicator */}
                      <div>
                        {student.completion_percentage < 100 ? (
                          <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs font-medium text-yellow-800">Action Required</p>
                          </div>
                        ) : (
                          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-xs font-medium text-green-800">✓ Complete</p>
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <div>
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

        {/* Quick Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">📋 Document Officer Guide</p>
                <ul className="space-y-1 text-xs">
                  <li>• Click on any student to view and manage their documents</li>
                  <li>• Use "Add Documents" to bulk submit multiple documents at once</li>
                  <li>• Each document can have individual notes for tracking</li>
                  <li>• Status automatically updates when all required documents are submitted</li>
                  <li>• Progress bar shows completion percentage based on required documents</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
