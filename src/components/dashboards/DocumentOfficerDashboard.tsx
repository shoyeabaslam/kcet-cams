'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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

interface DocTypestat {
  name: string;
  code: string;
  is_required: boolean;
  total_students: number;
  declared_count: number;
  pending_count: number;
}

interface RecentActivity {
  id: number;
  declared: boolean;
  added_at: string;
  application_number: string;
  full_name: string;
  document_name: string;
  added_by: string;
}

export default function DocumentOfficerDashboard() {
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [incompleteStudents, setIncompleteStudents] = useState<IncompleteStudent[]>([]);
  const [docTypeStats, setDocTypeStats] = useState<DocTypestat[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/document-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setIncompleteStudents(data.incompleteStudents);
        setDocTypeStats(data.docTypeStats);
        setRecentActivities(data.recentActivities);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage student document submissions</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Reviews</CardDescription>
              <CardTitle className="text-4xl font-bold text-orange-600">
                {stats?.pending_documents || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Applications awaiting document review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Incomplete Submissions</CardDescription>
              <CardTitle className="text-4xl font-bold text-yellow-600">
                {stats?.incomplete_documents || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Students with missing documents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Complete Documents</CardDescription>
              <CardTitle className="text-4xl font-bold text-green-600">
                {stats?.complete_documents || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                All required documents verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completion Rate</CardDescription>
              <CardTitle className="text-4xl font-bold text-blue-900">
                {stats?.completion_rate || 0}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Overall document verification rate
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students Needing Attention */}
          <Card>
            <CardHeader>
              <CardTitle>Students Needing Attention</CardTitle>
              <CardDescription>Incomplete document submissions (Top 10)</CardDescription>
            </CardHeader>
            <CardContent>
              {incompleteStudents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">All caught up!</p>
                  <p className="text-sm text-gray-500 mt-1">No students with incomplete documents</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incompleteStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-start justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">{student.full_name}</p>
                          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            {student.missing_required} missing
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {student.application_number} • {student.course_code}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {student.missing_docs?.slice(0, 3).map((doc, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded">
                              {doc}
                            </span>
                          ))}
                          {student.missing_docs?.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              +{student.missing_docs.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/students/${student.id}?tab=documents`}
                        className="ml-4 px-4 py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap"
                      >
                        Review
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Types Status */}
          <Card>
            <CardHeader>
              <CardTitle>Document Types Status</CardTitle>
              <CardDescription>Completion by document type (Last 30 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {docTypeStats.map((docType) => {
                  const completionPercentage = docType.total_students > 0
                    ? Math.round((docType.declared_count / docType.total_students) * 100)
                    : 0;

                  return (
                    <div key={docType.code}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {docType.name}
                          </span>
                          {docType.is_required && (
                            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {docType.declared_count}/{docType.total_students}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            completionPercentage === 100
                              ? 'bg-green-600'
                              : completionPercentage >= 75
                              ? 'bg-blue-600'
                              : completionPercentage >= 50
                              ? 'bg-yellow-600'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Document Activities</CardTitle>
            <CardDescription>Last 7 days of document submissions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-center text-gray-600 py-8">No recent activities</p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.declared ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      {activity.declared ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.document_name} - {activity.declared ? 'Declared' : 'Marked as Pending'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.full_name} ({activity.application_number})
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.added_at).toLocaleString()} • by {activity.added_by || 'System'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/dashboard/students?status=APPLICATION_ENTERED"
                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-900 hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Review New Applications</p>
                  <p className="text-sm text-gray-600">Process pending documents</p>
                </div>
              </Link>

              <Link
                href="/dashboard/students?status=DOCUMENTS_INCOMPLETE"
                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-900 hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Follow Up Incomplete</p>
                  <p className="text-sm text-gray-600">Students with missing docs</p>
                </div>
              </Link>

              <Link
                href="/dashboard/students"
                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-900 hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">View All Students</p>
                  <p className="text-sm text-gray-600">Browse complete list</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
