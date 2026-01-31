'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalStudents: number;
  totalFeesCollectible: number;
  totalCollected: number;
  pendingAmount: number;
  todayCollection: number;
  feePendingCount: number;
  feePartialCount: number;
  feeReceivedCount: number;
}

interface RecentPayment {
  id: string;
  student_name: string;
  application_number: string;
  amount_paid: number;
  payment_mode: string;
  receipt_number: string;
  payment_date: string;
  recorded_at: string;
}

interface Student {
  student_id: string;
  full_name: string;
  application_number: string;
  course_name: string;
  status: string;
  total_fee: number;
  total_paid: number;
  balance: number;
  fee_status: string;
}

export default function AccountsOfficerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalFeesCollectible: 0,
    totalCollected: 0,
    pendingAmount: 0,
    todayCollection: 0,
    feePendingCount: 0,
    feePartialCount: 0,
    feeReceivedCount: 0,
  });
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all students with fee info
      const studentsRes = await fetch('/api/students');
      const studentsData = await studentsRes.json();
      const students = studentsData.students || [];

      // Calculate stats
      let totalFeesCollectible = 0;
      let totalCollected = 0;
      let feePendingCount = 0;
      let feePartialCount = 0;
      let feeReceivedCount = 0;

      const studentsWithFees: Student[] = [];

      students.forEach((student: any) => {
        const totalFee = student.total_fee || 0;
        const paidAmount = student.paid_amount || 0;
        const balance = totalFee - paidAmount;

        totalFeesCollectible += totalFee;
        totalCollected += paidAmount;

        // Determine fee status - use student.status if it's fee-related
        let feeStatus = 'FEE_RECEIVED';
        if (student.status === 'FEE_PENDING' || student.status === 'FEE_PARTIAL') {
          feeStatus = student.status;
        } else if (balance > 0) {
          feeStatus = balance === totalFee ? 'FEE_PENDING' : 'FEE_PARTIAL';
        }

        // Count by fee status
        if (feeStatus === 'FEE_PENDING') {
          feePendingCount++;
        } else if (feeStatus === 'FEE_PARTIAL') {
          feePartialCount++;
        } else if (feeStatus === 'FEE_RECEIVED') {
          feeReceivedCount++;
        }

        // Add students with pending/partial payments (use status from database)
        if (feeStatus === 'FEE_PENDING' || feeStatus === 'FEE_PARTIAL') {
          studentsWithFees.push({
            student_id: student.student_id || student.id,
            full_name: student.full_name,
            application_number: student.application_number,
            course_name: student.course_name || 'N/A',
            status: student.status,
            total_fee: totalFee,
            total_paid: paidAmount,
            balance: balance,
            fee_status: feeStatus,
          });
        }
      });

      setStats({
        totalStudents: students.length,
        totalFeesCollectible,
        totalCollected,
        pendingAmount: totalFeesCollectible - totalCollected,
        todayCollection: 0, // Will be calculated from today's payments
        feePendingCount,
        feePartialCount,
        feeReceivedCount,
      });

      setPendingStudents(studentsWithFees);

      // Fetch recent payments (last 10)
      // TODO: Create API endpoint for recent payments
      // For now, we'll show empty list
      setRecentPayments([]);

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
          <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fee Management Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of fee collections and pending payments</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Collectible</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.totalFeesCollectible)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Collected</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(stats.totalCollected)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(stats.pendingAmount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.totalFeesCollectible > 0 
                    ? Math.round((stats.totalCollected / stats.totalFeesCollectible) * 100) 
                    : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-red-600">{stats.feePendingCount}</p>
              <p className="text-sm text-gray-600 mt-2">Fee Pending</p>
              <p className="text-xs text-gray-500 mt-1">No payment received</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-orange-600">{stats.feePartialCount}</p>
              <p className="text-sm text-gray-600 mt-2">Partial Payment</p>
              <p className="text-xs text-gray-500 mt-1">Balance remaining</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">{stats.feeReceivedCount}</p>
              <p className="text-sm text-gray-600 mt-2">Fully Paid</p>
              <p className="text-xs text-gray-500 mt-1">No balance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students with Pending Payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Students with Pending Payments</CardTitle>
              <CardDescription>Students who need to pay fees (FEE_PENDING & FEE_PARTIAL)</CardDescription>
            </div>
            <Link
              href="/dashboard/fees"
              className="px-4 py-2 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors text-sm font-medium"
            >
              View All
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pendingStudents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">🎉 No pending payments! All students have paid their fees.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingStudents.slice(0, 5).map((student) => (
                <Link
                  key={student.student_id}
                  href={`/dashboard/students/${student.student_id}?tab=payments`}
                  className="block p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-gray-900">{student.full_name}</p>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          student.fee_status === 'FEE_PENDING' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {student.fee_status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-mono">{student.application_number}</span>
                        <span>{student.course_name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Fee</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(student.total_fee)}</p>
                      <p className="text-sm text-red-600">Balance: {formatCurrency(student.balance)}</p>
                    </div>
                  </div>
                </Link>
              ))}
              {pendingStudents.length > 5 && (
                <p className="text-center text-sm text-gray-500 pt-2">
                  + {pendingStudents.length - 5} more students with pending payments
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">💳 Accounts Officer Guide</p>
              <ul className="space-y-1 text-xs">
                <li>• Click on any student to record payment from their profile</li>
                <li>• Receipt numbers are auto-generated for each payment</li>
                <li>• Fee amount is auto-populated from course fee structure</li>
                <li>• You can edit fee amount with director approval note</li>
                <li>• Student status updates automatically when full payment is received</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
