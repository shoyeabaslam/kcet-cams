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

export default function DocumentOfficerDashboard() {
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [incompleteStudents, setIncompleteStudents] = useState<IncompleteStudent[]>([]);
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
            <p className="text-muted-foreground">Loading dashboard...</p>
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
          <h1 className="text-3xl font-bold text-foreground">Document Management Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage student document submissions</p>
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
              <p className="text-sm text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
                Students with missing documents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Complete Documents</CardDescription>
              <CardTitle className="text-4xl font-bold text-chart-3">
                {stats?.complete_documents || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
                Overall document verification rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Students Needing Attention */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Students Needing Attention</CardTitle>
            <CardDescription>Incomplete document submissions requiring action</CardDescription>
          </CardHeader>
          <CardContent>
            {incompleteStudents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-foreground mb-1">All caught up!</p>
                <p className="text-sm text-muted-foreground">No students with incomplete documents</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incompleteStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col sm:flex-row sm:items-start justify-between p-4 border border-border rounded-xl hover:border-primary/50 hover:bg-accent/50 transition-all"
                  >
                    <div className="flex-1 mb-3 sm:mb-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="font-semibold text-foreground">{student.full_name}</p>
                        <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
                          {student.missing_required} missing
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {student.application_number} • {student.course_code}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {student.missing_docs?.slice(0, 4).map((doc) => (
                          <span key={`${student.id}-${doc}`} className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded border border-red-200 dark:border-red-800">
                            {doc}
                          </span>
                        ))}
                        {student.missing_docs?.length > 4 && (
                          <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded border border-border">
                            +{student.missing_docs.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/students/${student.id}?tab=documents`}
                      className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap self-end sm:self-start"
                    >
                      Review Documents
                    </Link>
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
                className="flex items-center gap-3 p-4 border-2 border-border rounded-xl hover:border-blue-900 hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">Review New Applications</p>
                  <p className="text-sm text-muted-foreground">Process pending documents</p>
                </div>
              </Link>

              <Link
                href="/dashboard/students?status=DOCUMENTS_INCOMPLETE"
                className="flex items-center gap-3 p-4 border-2 border-border rounded-xl hover:border-blue-900 hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">Follow Up Incomplete</p>
                  <p className="text-sm text-muted-foreground">Students with missing docs</p>
                </div>
              </Link>

              <Link
                href="/dashboard/students"
                className="flex items-center gap-3 p-4 border-2 border-border rounded-xl hover:border-blue-900 hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-chart-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">View All Students</p>
                  <p className="text-sm text-muted-foreground">Browse complete list</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
