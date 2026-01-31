'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';

interface Student {
  student_id: string;
  full_name: string;
  application_number: string;
  email: string;
  phone: string;
  course_name: string;
  status: string;
  total_fee: number;
  total_paid: number;
  balance: number;
  fee_status: string;
}

interface PaymentFormData {
  amount: string;
  paymentMode: string;
  receiptNumber: string;
  paymentDate: string;
  notes: string;
  feeAdjustment: boolean;
  adjustmentReason: string;
  originalFee: number;
}

interface Receipt {
  receiptNumber: string;
  studentName: string;
  applicationNumber: string;
  courseName: string;
  amount: number;
  paymentMode: string;
  paymentDate: string;
  notes: string;
  recordedBy: string;
  recordedAt: string;
}

export default function FeesManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  
  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    paymentMode: 'Cash',
    receiptNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    feeAdjustment: false,
    adjustmentReason: '',
    originalFee: 0,
  });

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<Receipt | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  useEffect(() => {
    if (user?.role !== 'AccountsOfficer') {
      router.push('/unauthorized');
      return;
    }
    fetchStudents();
  }, [user, router]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, statusFilter, courseFilter]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      
      if (data.students) {
        // Filter only FEE_PENDING and FEE_PARTIAL students
        const studentsWithFees = data.students
          .map((student: any) => {
            const totalFee = student.total_fee || 0;
            const paidAmount = student.paid_amount || 0;
            const balance = totalFee - paidAmount;

            // Determine fee status - use student.status if it's fee-related, otherwise calculate
            let feeStatus = 'FEE_RECEIVED';
            if (student.status === 'FEE_PENDING' || student.status === 'FEE_PARTIAL') {
              // Use the database status for fee-related statuses
              feeStatus = student.status;
            } else if (balance > 0) {
              // Calculate based on balance
              feeStatus = balance === totalFee ? 'FEE_PENDING' : 'FEE_PARTIAL';
            }

            return {
              student_id: student.student_id || student.id,
              full_name: student.full_name,
              application_number: student.application_number,
              email: student.email,
              phone: student.phone,
              course_name: student.course_name || 'N/A',
              status: student.status,
              total_fee: totalFee,
              total_paid: paidAmount,
              balance: balance,
              fee_status: feeStatus,
            };
          })
          .filter((s: Student) => s.fee_status === 'FEE_PENDING' || s.fee_status === 'FEE_PARTIAL');

        setStudents(studentsWithFees);
        setFilteredStudents(studentsWithFees);
      }
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
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.full_name.toLowerCase().includes(search) ||
        s.application_number.toLowerCase().includes(search) ||
        s.email.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.fee_status === statusFilter);
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(s => s.course_name === courseFilter);
    }

    setFilteredStudents(filtered);
  };

  const generateReceiptNumber = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = today.getTime().toString().slice(-4);
    return `RCT-${dateStr}-${timeStr}`;
  };

  const openPaymentModal = async (student: Student) => {
    setSelectedStudent(student);
    const receiptNum = generateReceiptNumber();
    
    // Fetch actual fee from fee_structures if not available
    let actualTotalFee = student.total_fee;
    console.log('Opening payment modal for student:', student.full_name);
    console.log('Initial total_fee from student:', actualTotalFee);
    
    if (!actualTotalFee || actualTotalFee === 0) {
      try {
        console.log('Fetching student details to get course_offering_id...');
        // Fetch student detail with course offering to get fee structure
        const detailRes = await fetch(`/api/students/${student.student_id}`);
        if (detailRes.ok) {
          const detailData = await detailRes.json();
          const courseOfferingId = detailData.student?.course_offering_id;
          console.log('Course offering ID:', courseOfferingId);
          
          if (courseOfferingId) {
            // Fetch fee structure for this course offering
            console.log('Fetching fee structure for course offering:', courseOfferingId);
            const feeRes = await fetch(`/api/fee-structures?courseOfferingId=${courseOfferingId}`);
            if (feeRes.ok) {
              const feeData = await feeRes.json();
              console.log('Fee structure response:', feeData);
              if (feeData.feeStructure?.total_fee) {
                actualTotalFee = Number.parseFloat(feeData.feeStructure.total_fee);
                console.log('✅ Fetched fee from fee_structures:', actualTotalFee);
              }
            } else {
              const errorData = await feeRes.json();
              console.error('❌ Fee structure API error:', errorData);
            }
          } else {
            console.warn('⚠️ No course_offering_id found for student');
          }
        } else {
          console.error('❌ Failed to fetch student details');
        }
      } catch (error) {
        console.error('❌ Error fetching fee structure:', error);
      }
    }
    
    console.log('Final actualTotalFee:', actualTotalFee);
    const balance = actualTotalFee - student.total_paid;
    console.log('Calculated balance:', balance);
    
    setFormData({
      amount: balance > 0 ? balance.toString() : actualTotalFee.toString(),
      paymentMode: 'Cash',
      receiptNumber: receiptNum,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
      feeAdjustment: false,
      adjustmentReason: '',
      originalFee: actualTotalFee,
    });
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedStudent(null);
    setFormData({
      amount: '',
      paymentMode: 'Cash',
      receiptNumber: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
      feeAdjustment: false,
      adjustmentReason: '',
      originalFee: 0,
    });
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    // Validation
    const amount = Number.parseFloat(formData.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const calculatedBalance = formData.originalFee - selectedStudent.total_paid;
    if (amount > calculatedBalance) {
      alert(`Amount cannot exceed balance of ₹${calculatedBalance.toLocaleString()}`);
      return;
    }

    if (formData.feeAdjustment && !formData.adjustmentReason.trim()) {
      alert('Please provide a reason for fee adjustment');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        amount_paid: amount,
        payment_mode: formData.paymentMode,
        receipt_number: formData.receiptNumber,
        payment_date: formData.paymentDate,
        notes: formData.feeAdjustment 
          ? `${formData.notes}\n\n[FEE ADJUSTED] Original: ₹${formData.originalFee}, New: ₹${selectedStudent.total_fee}\nReason: ${formData.adjustmentReason}`
          : formData.notes,
      };

      const response = await fetch(`/api/students/${selectedStudent.student_id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record payment');
      }

      // Create receipt data
      const receipt: Receipt = {
        receiptNumber: formData.receiptNumber,
        studentName: selectedStudent.full_name,
        applicationNumber: selectedStudent.application_number,
        courseName: selectedStudent.course_name,
        amount: amount,
        paymentMode: formData.paymentMode,
        paymentDate: formData.paymentDate,
        notes: formData.notes,
        recordedBy: user?.username || 'System',
        recordedAt: new Date().toISOString(),
      };

      setReceiptData(receipt);
      closePaymentModal();
      setShowReceiptModal(true);

      // Refresh student list
      await fetchStudents();

    } catch (error: any) {
      console.error('Error recording payment:', error);
      alert(error.message || 'Failed to record payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (feeStatus: string) => {
    const badges = {
      FEE_PENDING: 'bg-orange-100 text-orange-800',
      FEE_PARTIAL: 'bg-purple-100 text-purple-800',
      FEE_RECEIVED: 'bg-emerald-100 text-emerald-800',
    };
    return badges[feeStatus as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const courses = Array.from(new Set(students.map(s => s.course_name))).filter(Boolean);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading fee management...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
            <p className="text-gray-600 mt-1">Record payments for students with pending fees</p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">
                  {students.filter(s => s.fee_status === 'FEE_PENDING').length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Fee Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {students.filter(s => s.fee_status === 'FEE_PARTIAL').length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Partial Payment</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(students.reduce((sum, s) => sum + s.balance, 0))}
                </p>
                <p className="text-sm text-gray-600 mt-1">Total Outstanding</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Student</label>
                <input
                  type="text"
                  placeholder="Name, App#, Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fee Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="FEE_PENDING">Fee Pending</option>
                  <option value="FEE_PARTIAL">Partial Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Courses</option>
                  {courses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Students with Pending Payments ({filteredStudents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || courseFilter !== 'all'
                    ? '🔍 No students match your filters'
                    : '🎉 No students with pending payments!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map((student) => (
                  <div
                    key={student.student_id}
                    className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{student.full_name}</h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(student.fee_status)}`}>
                            {student.fee_status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <p className="text-xs text-gray-500">App Number</p>
                            <p className="font-mono">{student.application_number}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Course</p>
                            <p>{student.course_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Fee</p>
                            <p className="font-semibold">{formatCurrency(student.total_fee)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Paid</p>
                            <p className="font-semibold text-green-600">{formatCurrency(student.total_paid)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm text-gray-600 mb-1">Balance</p>
                        <p className="text-2xl font-bold text-red-600 mb-3">{formatCurrency(student.balance)}</p>
                        {user?.role === 'AccountsOfficer' && (
                          <button
                            onClick={() => openPaymentModal(student)}
                            className="px-4 py-2 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors text-sm font-medium"
                          >
                            💳 Record Payment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <h2 className="text-2xl font-bold text-gray-900">💳 Record Payment</h2>
              <p className="text-gray-600 mt-1">For {selectedStudent.full_name}</p>
            </div>
            
            <form onSubmit={handleSubmitPayment} className="p-6 space-y-6">
              {/* Student Info Summary */}
              <div className="bg-blue-50 rounded-xl p-4 space-y-2 text-sm border border-blue-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Application Number:</span>
                  <span className="font-mono font-semibold">{selectedStudent.application_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Course:</span>
                  <span className="font-semibold">{selectedStudent.course_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Fee:</span>
                  <span className="font-semibold">{formatCurrency(formData.originalFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Already Paid:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(selectedStudent.total_paid)}</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-blue-200">
                  <span className="font-semibold text-gray-900">Balance Due:</span>
                  <span className="font-bold text-red-600">{formatCurrency(formData.originalFee - selectedStudent.total_paid)}</span>
                </div>
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  min="1"
                  max={formData.originalFee - selectedStudent.total_paid}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                  placeholder="Enter amount"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum: ₹{(formData.originalFee - selectedStudent.total_paid).toLocaleString()}</p>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online Transfer</option>
                  <option value="DD">Demand Draft</option>
                  <option value="Card">Card (Debit/Credit)</option>
                </select>
              </div>

              {/* Receipt Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Number (Auto-generated)
                </label>
                <input
                  type="text"
                  value={formData.receiptNumber}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 font-mono"
                />
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Fee Adjustment Option */}
              <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.feeAdjustment}
                    onChange={(e) => setFormData({ ...formData, feeAdjustment: e.target.checked })}
                    className="w-5 h-5 text-blue-900 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Fee amount was adjusted (discount/special case)
                  </span>
                </label>
                
                {formData.feeAdjustment && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Fee Adjustment <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.adjustmentReason}
                      onChange={(e) => setFormData({ ...formData, adjustmentReason: e.target.value })}
                      required={formData.feeAdjustment}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Director approved 10% scholarship for academic merit..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be recorded in the payment notes for audit purposes
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any additional remarks..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-blue-900 text-white rounded-xl hover:bg-blue-800 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {submitting ? 'Recording...' : 'Record Payment & Generate Receipt'}
                </button>
                <button
                  type="button"
                  onClick={closePaymentModal}
                  disabled={submitting}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:bg-gray-100 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-100">
              <h2 className="text-2xl font-bold text-gray-900">✅ Payment Receipt</h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors text-sm font-medium"
                >
                  🖨️ Print Receipt
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
            
            {/* Receipt Content */}
            <div ref={receiptRef} className="p-8">
              <div className="border-2 border-gray-900 rounded-xl p-8">
                {/* Header */}
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold text-blue-900 mb-1">
                    Kashmir College of Engineering & Technology
                  </h1>
                  <p className="text-sm text-gray-600">Fee Payment Receipt</p>
                </div>

                {/* Receipt Details */}
                <div className="border-t-2 border-b-2 border-gray-300 py-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Receipt Number</p>
                      <p className="font-bold text-lg font-mono">{receiptData.receiptNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600">Date</p>
                      <p className="font-bold text-lg">
                        {new Date(receiptData.paymentDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Student Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Student Name:</span>
                    <span className="font-semibold">{receiptData.studentName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Application Number:</span>
                    <span className="font-semibold font-mono">{receiptData.applicationNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Course:</span>
                    <span className="font-semibold">{receiptData.courseName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Mode:</span>
                    <span className="font-semibold">{receiptData.paymentMode}</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Amount Received:</span>
                    <span className="text-3xl font-bold text-green-600">
                      {formatCurrency(receiptData.amount)}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {receiptData.notes && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-1">Notes:</p>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{receiptData.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-300">
                  <div className="flex justify-between text-xs text-gray-600">
                    <div>
                      <p>Recorded by: {receiptData.recordedBy}</p>
                      <p>Time: {new Date(receiptData.recordedAt).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold mt-8">Authorized Signature</p>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-6 text-xs text-gray-500">
                  <p>This is a computer-generated receipt</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
