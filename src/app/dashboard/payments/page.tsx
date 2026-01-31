'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Payment {
    id: string;
    student_id: string;
    student_name: string;
    application_number: string;
    course_name: string;
    amount_paid: number;
    payment_mode: string;
    payment_reference: string | null;
    receipt_number: string;
    payment_date: string;
    notes: string | null;
    recorded_by_name: string;
    recorded_at: string;
}

export default function PaymentsPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [payments, setPayments] = useState<Payment[]>([]);
    const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all');
    const [dateFromFilter, setDateFromFilter] = useState('');
    const [dateToFilter, setDateToFilter] = useState('');

    // Stats
    const [totalAmount, setTotalAmount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        // Allow AccountsOfficer, Admin, SuperAdmin, Principal, Director
        if (user?.role && !['AccountsOfficer', 'Admin', 'SuperAdmin', 'Principal', 'Director'].includes(user.role)) {
            router.push('/unauthorized');
            return;
        }
        fetchPayments();
    }, [user, router]);

    useEffect(() => {
        filterPayments();
    }, [payments, searchTerm, paymentModeFilter, dateFromFilter, dateToFilter]);

    const fetchPayments = async () => {
        try {
            // Fetch all payments from all students
            const response = await fetch('/api/payments');
            const data = await response.json();

            if (data.payments) {
                setPayments(data.payments);
                setFilteredPayments(data.payments);

                // Calculate totals
                const total = data.payments.reduce((sum: number, p: Payment) => sum + Number(p.amount_paid), 0);
                setTotalAmount(total);
                setTotalCount(data.payments.length);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterPayments = () => {
        let filtered = [...payments];

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.student_name.toLowerCase().includes(search) ||
                p.application_number.toLowerCase().includes(search) ||
                p.receipt_number.toLowerCase().includes(search)
            );
        }

        // Payment mode filter
        if (paymentModeFilter !== 'all') {
            filtered = filtered.filter(p => p.payment_mode === paymentModeFilter);
        }

        // Date range filter
        if (dateFromFilter) {
            filtered = filtered.filter(p => new Date(p.payment_date) >= new Date(dateFromFilter));
        }
        if (dateToFilter) {
            filtered = filtered.filter(p => new Date(p.payment_date) <= new Date(dateToFilter));
        }

        setFilteredPayments(filtered);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPaymentModeIcon = (mode: string) => {
        switch (mode) {
            case 'Cash': return '💵';
            case 'Cheque': return '📝';
            case 'Online': return '💳';
            case 'DD': return '🏦';
            case 'Card': return '💳';
            default: return '💰';
        }
    };

    const paymentModes = Array.from(new Set(payments.map(p => p.payment_mode))).filter(Boolean);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading payment history...</p>
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
                        <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
                        <p className="text-gray-600 mt-1">Complete record of all fee payments</p>
                    </div>
                    {
                        user?.role === 'AccountsOfficer' && (
                            <Link
                                href="/dashboard/fees"
                                className="px-4 py-2 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors text-sm font-medium"
                            >
                                💳 Record New Payment
                            </Link>
                        )
                    }
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Payments</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{totalCount}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">📋</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Amount</p>
                                    <p className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(totalAmount)}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">💰</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Filtered Results</p>
                                    <p className="text-3xl font-bold text-blue-600 mt-1">{filteredPayments.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">🔍</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                <input
                                    type="text"
                                    placeholder="Student, App#, Receipt#..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                                <select
                                    value={paymentModeFilter}
                                    onChange={(e) => setPaymentModeFilter(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Modes</option>
                                    {paymentModes.map(mode => (
                                        <option key={mode} value={mode}>{mode}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                                <input
                                    type="date"
                                    value={dateFromFilter}
                                    onChange={(e) => setDateFromFilter(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                                <input
                                    type="date"
                                    value={dateToFilter}
                                    onChange={(e) => setDateToFilter(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {(searchTerm || paymentModeFilter !== 'all' || dateFromFilter || dateToFilter) && (
                            <div className="mt-4 flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setPaymentModeFilter('all');
                                        setDateFromFilter('');
                                        setDateToFilter('');
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payments List */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Payments ({filteredPayments.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredPayments.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-600">
                                    {searchTerm || paymentModeFilter !== 'all' || dateFromFilter || dateToFilter
                                        ? '🔍 No payments match your filters'
                                        : '📋 No payment records found'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Receipt#</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Student</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Course</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Mode</th>
                                            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Recorded By</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPayments.map((payment) => (
                                            <tr key={payment.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                                                <td className="py-4 px-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{formatDate(payment.payment_date)}</p>
                                                        <p className="text-xs text-gray-500">{formatDateTime(payment.recorded_at)}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="text-sm font-mono font-semibold text-gray-900">{payment.receipt_number}</p>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Link
                                                        href={`/dashboard/students/${payment.student_id}`}
                                                        className="hover:text-blue-600"
                                                    >
                                                        <p className="text-sm font-medium text-gray-900">{payment.student_name}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{payment.application_number}</p>
                                                    </Link>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="text-sm text-gray-700">{payment.course_name}</p>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                        {getPaymentModeIcon(payment.payment_mode)} {payment.payment_mode}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <p className="text-sm font-bold text-green-600">{formatCurrency(Number(payment.amount_paid))}</p>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="text-sm text-gray-700">{payment.recorded_by_name || 'System'}</p>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Link
                                                        href={`/dashboard/students/${payment.student_id}`}
                                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                    >
                                                        View Student →
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

                {/* Summary Footer */}
                {filteredPayments.length > 0 && (
                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Showing {filteredPayments.length} payment(s)</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Total amount shown: {formatCurrency(filteredPayments.reduce((sum, p) => sum + Number(p.amount_paid), 0))}
                                    </p>
                                </div>
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 bg-white border border-green-300 text-green-700 rounded-xl hover:bg-green-50 transition-colors text-sm font-medium"
                                >
                                    🖨️ Print Report
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
