'use client';

import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Student {
  id: string;
  application_number: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  category: string;
  email: string;
  phone: string;
  address: string;
  previous_school: string;
  previous_board: string;
  previous_percentage: number;
  status: string;
  course_code: string;
  course_name: string;
  department: string;
  year_name: string;
  total_fee: number;
  paid_amount: number;
  pending_amount: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
  created_by_name: string;
}

interface Document {
  id: number;
  document_type_id: number;
  document_name: string;
  is_mandatory: boolean;
  declared: boolean;
  notes: string;
  added_at: string;
}

interface Payment {
  id: string;
  amount_paid: number;
  payment_mode: string;
  payment_reference: string;
  receipt_number: string;
  payment_date: string;
  notes: string;
  recorded_at: string;
}

interface StatusHistory {
  id: number;
  old_status: string;
  new_status: string;
  reason: string;
  changed_at: string;
  changed_by_name: string;
}

type TabType = 'overview' | 'documents' | 'payments' | 'history';

export default function StudentDetailPage({ params, searchParams }: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [studentId, setStudentId] = useState<string>('');

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount_paid: '',
    payment_mode: 'Cash',
    payment_reference: '',
    receipt_number: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    Promise.all([params, searchParams]).then(([resolvedParams, resolvedSearchParams]) => {
      setStudentId(resolvedParams.id);
      // Set active tab from query parameter if provided
      if (resolvedSearchParams.tab && ['overview', 'documents', 'payments', 'history'].includes(resolvedSearchParams.tab)) {
        setActiveTab(resolvedSearchParams.tab as TabType);
      }
      fetchStudentDetails(resolvedParams.id);
    });
  }, []);

  const fetchStudentDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/students/${id}`);
      if (!response.ok) throw new Error('Failed to fetch student details');
      
      const data = await response.json();
      setStudent(data.student);
      setDocuments(data.documents || []);
      setPayments(data.payments || []);
      setHistory(data.statusHistory || []); // Fixed: was data.history
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete student');
      
      router.push('/dashboard/students');
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    }
  };

  const handleDocumentToggle = async (docId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/students/${studentId}/documents`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: docId,
          declared: !currentStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to update document');
      
      // Refresh data
      fetchStudentDetails(studentId);
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Failed to update document');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentLoading(true);

    try {
      const response = await fetch(`/api/students/${studentId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentData,
          amount_paid: parseFloat(paymentData.amount_paid),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to record payment');
      }

      // Reset form and refresh data
      setShowPaymentForm(false);
      setPaymentData({
        amount_paid: '',
        payment_mode: 'Cash',
        payment_reference: '',
        receipt_number: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchStudentDetails(studentId);
    } catch (error) {
      console.error('Error recording payment:', error);
      alert(error instanceof Error ? error.message : 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (!user) return null;

  const canEdit = ['AdmissionStaff', 'Admin', 'SuperAdmin'].includes(user.role);
  const canDelete = ['Admin', 'SuperAdmin'].includes(user.role);
  const canManageDocuments = ['DocumentOfficer', 'Admin', 'SuperAdmin'].includes(user.role);
  const canRecordPayments = ['AccountsOfficer', 'Admin', 'SuperAdmin'].includes(user.role);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'APPLICATION_ENTERED': 'bg-gray-100 text-gray-800',
      'DOCUMENTS_DECLARED': 'bg-blue-100 text-blue-800',
      'DOCUMENTS_INCOMPLETE': 'bg-yellow-100 text-yellow-800',
      'FEE_PENDING': 'bg-orange-100 text-orange-800',
      'FEE_PARTIAL': 'bg-purple-100 text-purple-800',
      'FEE_RECEIVED': 'bg-green-100 text-green-800',
      'ADMITTED': 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading student details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Student Not Found</h1>
          <Link href="/dashboard/students" className="text-blue-900 hover:text-blue-700">
            ← Back to Students
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard/students" className="text-blue-900 hover:text-blue-700">
                ← Back
              </Link>
              <span className="text-gray-300">|</span>
              <h1 className="text-3xl font-bold text-gray-900">{student.full_name}</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-lg font-mono text-gray-600">{student.application_number}</span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(student.status)}`}>
                {student.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <button
                onClick={() => router.push(`/dashboard/students/${studentId}/edit`)}
                className="px-4 py-2 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors"
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDeleteStudent}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6">
            {(['overview', 'documents', 'payments', 'history'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 font-medium capitalize transition-colors relative ${
                  activeTab === tab
                    ? 'text-blue-900 border-b-2 border-blue-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-gray-900">{student.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                  <p className="text-gray-900">
                    {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Gender</label>
                    <p className="text-gray-900">{student.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <p className="text-gray-900">{student.category || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{student.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900">{student.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-gray-900">{student.address || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Course</label>
                  <p className="text-gray-900 font-medium">{student.course_name}</p>
                  <p className="text-sm text-gray-600">{student.course_code} - {student.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Academic Year</label>
                  <p className="text-gray-900">{student.year_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Previous School</label>
                  <p className="text-gray-900">{student.previous_school || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Previous Board</label>
                  <p className="text-gray-900">{student.previous_board || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Previous Percentage</label>
                  <p className="text-gray-900">{student.previous_percentage ? `${student.previous_percentage}%` : 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Fee Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Fee Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Fee</label>
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{student.total_fee?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount Paid</label>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{student.paid_amount?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Balance</label>
                  <p className="text-2xl font-bold text-orange-600">
                    ₹{student.pending_amount?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Status</label>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                    student.payment_status === 'FEE_RECEIVED' ? 'bg-green-100 text-green-800' :
                    student.payment_status === 'FEE_PARTIAL' ? 'bg-purple-100 text-purple-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {student.payment_status}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Application Number</label>
                  <p className="text-gray-900 font-mono">{student.application_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(student.status)}`}>
                    {student.status}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created By</label>
                  <p className="text-gray-900">{student.created_by_name || 'System'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created At</label>
                  <p className="text-gray-900">{new Date(student.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-gray-900">{new Date(student.updated_at).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'documents' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Document Checklist</CardTitle>
                  <CardDescription>Track document submission status</CardDescription>
                </div>
                {canManageDocuments && (
                  <button
                    onClick={() => router.push(`/dashboard/students/${studentId}/documents/add`)}
                    className="px-4 py-2 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors text-sm"
                  >
                    + Add Document
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No documents recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          doc.declared ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {doc.declared ? (
                            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {doc.document_name}
                            {doc.is_mandatory && <span className="text-red-600 ml-1">*</span>}
                          </p>
                          {doc.notes && <p className="text-sm text-gray-600">{doc.notes}</p>}
                          <p className="text-xs text-gray-500">
                            {doc.declared ? 'Declared' : 'Not declared'} • {new Date(doc.added_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {canManageDocuments && (
                        <button
                          onClick={() => handleDocumentToggle(doc.id, doc.declared)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                            doc.declared
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {doc.declared ? 'Mark as Pending' : 'Mark as Declared'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'payments' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>All fee payments for this student</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showPaymentForm && canRecordPayments && (
                <form onSubmit={handlePaymentSubmit} className="mb-6 p-4 bg-blue-50 rounded-xl space-y-4">
                  <h3 className="font-semibold text-gray-900">Record New Payment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount Paid <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={paymentData.amount_paid}
                        onChange={(e) => setPaymentData({ ...paymentData, amount_paid: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Mode <span className="text-red-600">*</span>
                      </label>
                      <select
                        required
                        value={paymentData.payment_mode}
                        onChange={(e) => setPaymentData({ ...paymentData, payment_mode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Online">Online</option>
                        <option value="DD">DD (Demand Draft)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Receipt Number <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentData.receipt_number}
                        onChange={(e) => setPaymentData({ ...paymentData, receipt_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                        placeholder="RCT20260131001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Date <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={paymentData.payment_date}
                        onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Reference (Cheque No / Transaction ID)
                      </label>
                      <input
                        type="text"
                        value={paymentData.payment_reference}
                        onChange={(e) => setPaymentData({ ...paymentData, payment_reference: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={paymentData.notes}
                        onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                        placeholder="Optional notes..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={paymentLoading}
                      className="px-4 py-2 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50"
                    >
                      {paymentLoading ? 'Recording...' : 'Record Payment'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {payments.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No payments recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-xl text-gray-900">
                            ₹{payment.amount_paid.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {payment.payment_mode} • {payment.receipt_number}
                          </p>
                          {payment.payment_reference && (
                            <p className="text-xs text-gray-500">Ref: {payment.payment_reference}</p>
                          )}
                          {payment.notes && (
                            <p className="text-xs text-gray-600 mt-1">{payment.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Recorded: {new Date(payment.recorded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'history' && (
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
              <CardDescription>Timeline of status changes</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No status changes recorded</p>
              ) : (
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-900' : 'bg-gray-300'
                        }`}></div>
                        {index < history.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.old_status ? (
                                <>
                                  <span className="text-gray-500">{item.old_status}</span>
                                  <span className="mx-2">→</span>
                                  <span className="text-blue-900">{item.new_status}</span>
                                </>
                              ) : (
                                <span className="text-blue-900">{item.new_status}</span>
                              )}
                            </p>
                            {item.reason && (
                              <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                            {new Date(item.changed_at).toLocaleString()}
                          </span>
                        </div>
                        {item.changed_by_name && (
                          <p className="text-xs text-gray-500">By: {item.changed_by_name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
