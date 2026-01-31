'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AcademicYear {
  id: number;
  year_label: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Course {
  id: string;
  course_code: string;
  course_name: string;
  department: string;
  duration_years: number;
  is_active: boolean;
}

interface DocumentType {
  id: number;
  code: string;
  name: string;
  is_required: boolean;
  display_order: number;
}

interface FeeStructure {
  id: string;
  course_code: string;
  course_name: string;
  academic_year: string;
  total_fee: string;
  is_active: boolean;
}

export default function CoursesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'academic-years' | 'courses' | 'fees' | 'documents'>('academic-years');
  
  // Academic Years
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [showAYModal, setShowAYModal] = useState(false);
  const [showDeleteAYModal, setShowDeleteAYModal] = useState(false);
  const [deletingAY, setDeletingAY] = useState<AcademicYear | null>(null);
  const [ayForm, setAYForm] = useState({ year_label: '', start_date: '', end_date: '', is_active: false });
  
  // Courses
  const [courses, setCourses] = useState<Course[]>([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showDeleteCourseModal, setShowDeleteCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({ course_code: '', course_name: '', department: '', duration_years: 4, is_active: true });
  
  // Document Types
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showDeleteDocModal, setShowDeleteDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentType | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<DocumentType | null>(null);
  const [docForm, setDocForm] = useState({ code: '', name: '', is_required: true, display_order: 0 });
  
  // Fee Structures
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showDeleteFeeModal, setShowDeleteFeeModal] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [deletingFee, setDeletingFee] = useState<FeeStructure | null>(null);
  const [feeForm, setFeeForm] = useState({ course_id: '', academic_year_id: '', total_fee: '', is_active: true });

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user && user.role !== 'SuperAdmin') {
      router.push('/unauthorized');
      return;
    }
    fetchAllData();
  }, [user, router]);

  const fetchAllData = async () => {
    try {
      // Fetch academic years
      const ayRes = await fetch('/api/academic-years');
      if (ayRes.ok) {
        const ayData = await ayRes.json();
        setAcademicYears(ayData.academicYears || []);
      }

      // Fetch courses
      const coursesRes = await fetch('/api/courses');
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
      }
      
      // Fetch document types
      const docRes = await fetch('/api/document-types');
      if (docRes.ok) {
        const docData = await docRes.json();
        setDocumentTypes(docData.documentTypes || []);
      }
      
      // Fetch fee structures
      const feeRes = await fetch('/api/fee-structures');
      if (feeRes.ok) {
        const feeData = await feeRes.json();
        setFeeStructures(feeData.feeStructures || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load data', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddAcademicYear = async () => {
    try {
      if (!ayForm.year_label || !ayForm.start_date || !ayForm.end_date) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      const response = await fetch('/api/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ayForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add academic year');

      showToast(`Academic Year "${ayForm.year_label}" added successfully!`, 'success');
      setShowAYModal(false);
      setAYForm({ year_label: '', start_date: '', end_date: '', is_active: false });
      fetchAllData();
    } catch (error) {
      console.error('Add academic year error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to add academic year', 'error');
    }
  };

  const handleDeleteAcademicYear = async () => {
    if (!deletingAY) return;

    try {
      const response = await fetch(`/api/academic-years/${deletingAY.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete academic year');

      showToast(`Academic Year "${deletingAY.year_label}" deleted successfully!`, 'success');
      setShowDeleteAYModal(false);
      setDeletingAY(null);
      fetchAllData();
    } catch (error) {
      console.error('Delete academic year error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete academic year', 'error');
    }
  };

  const handleAddCourse = async () => {
    try {
      if (!courseForm.course_code || !courseForm.course_name || !courseForm.department) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      const response = await fetch('/api/courses', {
        method: editingCourse ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCourse ? { ...courseForm, id: editingCourse.id } : courseForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save course');

      showToast(`Course "${courseForm.course_name}" ${editingCourse ? 'updated' : 'added'} successfully!`, 'success');
      setShowCourseModal(false);
      setEditingCourse(null);
      setCourseForm({ course_code: '', course_name: '', department: '', duration_years: 4, is_active: true });
      fetchAllData();
    } catch (error) {
      console.error('Save course error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to save course', 'error');
    }
  };

  const handleAddDocument = async () => {
    try {
      if (!docForm.code || !docForm.name) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      const response = await fetch('/api/document-types', {
        method: editingDoc ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDoc ? { ...docForm, id: editingDoc.id } : docForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save document type');

      showToast(`Document Type "${docForm.name}" ${editingDoc ? 'updated' : 'added'} successfully!`, 'success');
      setShowDocModal(false);
      setEditingDoc(null);
      setDocForm({ code: '', name: '', is_required: true, display_order: 0 });
      fetchAllData();
    } catch (error) {
      console.error('Save document type error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to save document type', 'error');
    }
  };

  const handleAddFee = async () => {
    try {
      if (!feeForm.course_id || !feeForm.academic_year_id || !feeForm.total_fee) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      const response = await fetch('/api/fee-structures', {
        method: editingFee ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingFee ? { ...feeForm, id: editingFee.id } : feeForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save fee structure');

      showToast(`Fee structure ${editingFee ? 'updated' : 'added'} successfully!`, 'success');
      setShowFeeModal(false);
      setEditingFee(null);
      setFeeForm({ course_id: '', academic_year_id: '', total_fee: '', is_active: true });
      fetchAllData();
    } catch (error) {
      console.error('Save fee structure error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to save fee structure', 'error');
    }
  };

  const handleToggleCourse = async (course: Course) => {
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !course.is_active }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update course status');

      showToast(`Course "${course.course_name}" ${course.is_active ? 'deactivated' : 'activated'} successfully!`, 'success');
      fetchAllData();
    } catch (error) {
      console.error('Toggle course error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update course status', 'error');
    }
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;

    try {
      const response = await fetch(`/api/courses/${deletingCourse.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete course');

      showToast(`Course "${deletingCourse.course_name}" deleted successfully!`, 'success');
      setShowDeleteCourseModal(false);
      setDeletingCourse(null);
      fetchAllData();
    } catch (error) {
      console.error('Delete course error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete course', 'error');
    }
  };

  const handleDeleteDocument = async () => {
    if (!deletingDoc) return;

    try {
      const response = await fetch(`/api/document-types/${deletingDoc.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete document type');

      showToast(`Document type "${deletingDoc.name}" deleted successfully!`, 'success');
      setShowDeleteDocModal(false);
      setDeletingDoc(null);
      fetchAllData();
    } catch (error) {
      console.error('Delete document type error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete document type', 'error');
    }
  };

  const handleToggleFee = async (fee: FeeStructure) => {
    try {
      const response = await fetch(`/api/fee-structures/${fee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !fee.is_active }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update fee structure status');

      showToast(`Fee structure ${fee.is_active ? 'deactivated' : 'activated'} successfully!`, 'success');
      fetchAllData();
    } catch (error) {
      console.error('Toggle fee structure error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update fee structure status', 'error');
    }
  };

  const handleDeleteFee = async () => {
    if (!deletingFee) return;

    try {
      const response = await fetch(`/api/fee-structures/${deletingFee.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete fee structure');

      showToast(`Fee structure deleted successfully!`, 'success');
      setShowDeleteFeeModal(false);
      setDeletingFee(null);
      fetchAllData();
    } catch (error) {
      console.error('Delete fee structure error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete fee structure', 'error');
    }
  };

  if (!user) return null;

  const tabs = [
    { id: 'academic-years' as const, label: 'Academic Years', icon: '📅', count: academicYears.length },
    { id: 'courses' as const, label: 'Courses', icon: '📚', count: courses.length },
    { id: 'fees' as const, label: 'Fee Structures', icon: '💰', count: feeStructures.length },
    { id: 'documents' as const, label: 'Document Types', icon: '📄', count: documentTypes.length },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border border-border rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground mb-1">Course & Configuration Management</h1>
          <p className="text-sm text-muted-foreground">Manage academic years, courses, fee structures, and document requirements</p>
        </div>

        {/* Tabs */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card hover:bg-accent border-border text-foreground'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{tab.icon}</span>
                    <span className="text-sm font-medium">{tab.label}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    activeTab === tab.id ? 'bg-primary-foreground/20' : 'bg-muted'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Academic Years Tab */}
        {activeTab === 'academic-years' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Academic Years</CardTitle>
              <button
                onClick={() => setShowAYModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                + Add Academic Year
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {academicYears.map((ay) => (
                  <div key={ay.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-foreground">{ay.year_label}</h3>
                        {ay.is_active && (
                          <span className="px-2 py-1 text-xs font-medium bg-chart-3/20 text-chart-3 rounded">Active</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(ay.start_date).toLocaleDateString()} - {new Date(ay.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors">
                        Edit
                      </button>
                      {!ay.is_active && (
                        <button 
                          onClick={() => {
                            setDeletingAY(ay);
                            setShowDeleteAYModal(true);
                          }}
                          className="px-3 py-1 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Courses</CardTitle>
              <button
                onClick={() => setShowCourseModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                + Add Course
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 text-xs font-mono bg-muted rounded">{course.course_code}</span>
                        <h3 className="font-semibold text-foreground">{course.course_name}</h3>
                        {!course.is_active && (
                          <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">Inactive</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {course.department} • {course.duration_years} years
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          setEditingCourse(course);
                          setCourseForm({
                            course_code: course.course_code,
                            course_name: course.course_name,
                            department: course.department,
                            duration_years: course.duration_years,
                            is_active: course.is_active
                          });
                          setShowCourseModal(true);
                        }}
                        className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleToggleCourse(course)}
                        className="px-3 py-1 text-sm text-chart-3 hover:bg-chart-3/10 rounded transition-colors"
                      >
                        {course.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      {!course.is_active && (
                        <button 
                          onClick={() => {
                            setDeletingCourse(course);
                            setShowDeleteCourseModal(true);
                          }}
                          className="px-3 py-1 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fee Structures Tab */}
        {activeTab === 'fees' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Fee Structures</CardTitle>
              <button
                onClick={() => setShowFeeModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                + Add Fee Structure
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {feeStructures.map((fee) => (
                  <div key={fee.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-foreground">{fee.course_name}</h3>
                        <span className="px-2 py-1 text-xs font-medium bg-muted rounded">{fee.academic_year}</span>
                        {!fee.is_active && (
                          <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">Inactive</span>
                        )}
                      </div>
                      <p className="text-sm text-chart-3 font-semibold mt-1">₹{Number(fee.total_fee).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          setEditingFee(fee);
                          setFeeForm({
                            course_id: fee.course_code, // Will need course ID lookup
                            academic_year_id: '', // Will need AY ID lookup
                            total_fee: fee.total_fee,
                            is_active: fee.is_active
                          });
                          setShowFeeModal(true);
                        }}
                        className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleToggleFee(fee)}
                        className="px-3 py-1 text-sm text-chart-3 hover:bg-chart-3/10 rounded transition-colors"
                      >
                        {fee.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      {!fee.is_active && (
                        <button 
                          onClick={() => {
                            setDeletingFee(fee);
                            setShowDeleteFeeModal(true);
                          }}
                          className="px-3 py-1 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Types Tab */}
        {activeTab === 'documents' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Document Types</CardTitle>
              <button
                onClick={() => setShowDocModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                + Add Document Type
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documentTypes.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 text-xs font-mono bg-muted rounded">{doc.code}</span>
                        <h3 className="font-semibold text-foreground">{doc.name}</h3>
                        {doc.is_required && (
                          <span className="px-2 py-1 text-xs font-medium bg-destructive/20 text-destructive rounded">Required</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Display Order: {doc.display_order}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          setEditingDoc(doc);
                          setDocForm({
                            code: doc.code,
                            name: doc.name,
                            is_required: doc.is_required,
                            display_order: doc.display_order
                          });
                          setShowDocModal(true);
                        }}
                        className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => {
                          setDeletingDoc(doc);
                          setShowDeleteDocModal(true);
                        }}
                        className="px-3 py-1 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Academic Year Modal */}
        {showAYModal && (
          <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Add Academic Year</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="ay-year-label" className="block text-sm font-medium text-foreground mb-2">Year Label</label>
                    <input
                      id="ay-year-label"
                      type="text"
                      placeholder="e.g., 2026-2027"
                      value={ayForm.year_label}
                      onChange={(e) => setAYForm({ ...ayForm, year_label: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ay-start-date" className="block text-sm font-medium text-foreground mb-2">Start Date</label>
                      <input
                        id="ay-start-date"
                        type="date"
                        value={ayForm.start_date}
                        onChange={(e) => setAYForm({ ...ayForm, start_date: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="ay-end-date" className="block text-sm font-medium text-foreground mb-2">End Date</label>
                      <input
                        id="ay-end-date"
                        type="date"
                        value={ayForm.end_date}
                        onChange={(e) => setAYForm({ ...ayForm, end_date: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="ay-is_active"
                      checked={ayForm.is_active}
                      onChange={(e) => setAYForm({ ...ayForm, is_active: e.target.checked })}
                      className="w-4 h-4 border-border rounded"
                    />
                    <label htmlFor="ay-is_active" className="text-sm text-foreground">Set as Active Academic Year</label>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowAYModal(false);
                        setAYForm({ year_label: '', start_date: '', end_date: '', is_active: false });
                      }}
                      className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddAcademicYear}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      Add Year
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add/Edit Course Modal */}
        {showCourseModal && (
          <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{editingCourse ? 'Edit' : 'Add'} Course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="course-code" className="block text-sm font-medium text-foreground mb-2">Course Code</label>
                    <input
                      id="course-code"
                      type="text"
                      placeholder="e.g., CS101"
                      value={courseForm.course_code}
                      onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                      disabled={!!editingCourse}
                    />
                  </div>
                  <div>
                    <label htmlFor="course-name" className="block text-sm font-medium text-foreground mb-2">Course Name</label>
                    <input
                      id="course-name"
                      type="text"
                      placeholder="e.g., Computer Science"
                      value={courseForm.course_name}
                      onChange={(e) => setCourseForm({ ...courseForm, course_name: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="course-department" className="block text-sm font-medium text-foreground mb-2">Department</label>
                    <input
                      id="course-department"
                      type="text"
                      placeholder="e.g., Engineering"
                      value={courseForm.department}
                      onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="course-duration" className="block text-sm font-medium text-foreground mb-2">Duration (Years)</label>
                    <input
                      id="course-duration"
                      type="number"
                      min="1"
                      max="10"
                      value={courseForm.duration_years}
                      onChange={(e) => setCourseForm({ ...courseForm, duration_years: Number.parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="course-is_active"
                      checked={courseForm.is_active}
                      onChange={(e) => setCourseForm({ ...courseForm, is_active: e.target.checked })}
                      className="w-4 h-4 border-border rounded"
                    />
                    <label htmlFor="course-is_active" className="text-sm text-foreground">Active Course</label>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowCourseModal(false);
                        setEditingCourse(null);
                        setCourseForm({ course_code: '', course_name: '', department: '', duration_years: 4, is_active: true });
                      }}
                      className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCourse}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      {editingCourse ? 'Update' : 'Add'} Course
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add/Edit Document Type Modal */}
        {showDocModal && (
          <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{editingDoc ? 'Edit' : 'Add'} Document Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="doc-code" className="block text-sm font-medium text-foreground mb-2">Document Code</label>
                    <input
                      id="doc-code"
                      type="text"
                      placeholder="e.g., AADHAR"
                      value={docForm.code}
                      onChange={(e) => setDocForm({ ...docForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                      disabled={!!editingDoc}
                    />
                  </div>
                  <div>
                    <label htmlFor="doc-name" className="block text-sm font-medium text-foreground mb-2">Document Name</label>
                    <input
                      id="doc-name"
                      type="text"
                      placeholder="e.g., Aadhar Card"
                      value={docForm.name}
                      onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="doc-display-order" className="block text-sm font-medium text-foreground mb-2">Display Order</label>
                    <input
                      id="doc-display-order"
                      type="number"
                      min="0"
                      value={docForm.display_order}
                      onChange={(e) => setDocForm({ ...docForm, display_order: Number.parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="doc-is_required"
                      checked={docForm.is_required}
                      onChange={(e) => setDocForm({ ...docForm, is_required: e.target.checked })}
                      className="w-4 h-4 border-border rounded"
                    />
                    <label htmlFor="doc-is_required" className="text-sm text-foreground">Required Document</label>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowDocModal(false);
                        setEditingDoc(null);
                        setDocForm({ code: '', name: '', is_required: true, display_order: 0 });
                      }}
                      className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddDocument}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      {editingDoc ? 'Update' : 'Add'} Document
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Fee Structure Modal */}
        {showFeeModal && (
          <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Add Fee Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="fee-course" className="block text-sm font-medium text-foreground mb-2">Course</label>
                    <select
                      id="fee-course"
                      value={feeForm.course_id}
                      onChange={(e) => setFeeForm({ ...feeForm, course_id: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    >
                      <option value="">Select Course</option>
                      {courses.filter(c => c.is_active).map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_code} - {course.course_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="fee-academic-year" className="block text-sm font-medium text-foreground mb-2">Academic Year</label>
                    <select
                      id="fee-academic-year"
                      value={feeForm.academic_year_id}
                      onChange={(e) => setFeeForm({ ...feeForm, academic_year_id: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    >
                      <option value="">Select Academic Year</option>
                      {academicYears.filter(ay => ay.is_active).map((ay) => (
                        <option key={ay.id} value={ay.id.toString()}>
                          {ay.year_label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="fee-total-fee" className="block text-sm font-medium text-foreground mb-2">Total Fee (₹)</label>
                    <input
                      id="fee-total-fee"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 50000"
                      value={feeForm.total_fee}
                      onChange={(e) => setFeeForm({ ...feeForm, total_fee: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="fee-is_active"
                      checked={feeForm.is_active}
                      onChange={(e) => setFeeForm({ ...feeForm, is_active: e.target.checked })}
                      className="w-4 h-4 border-border rounded"
                    />
                    <label htmlFor="fee-is_active" className="text-sm text-foreground">Active Fee Structure</label>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowFeeModal(false);
                        setEditingFee(null);
                        setFeeForm({ course_id: '', academic_year_id: '', total_fee: '', is_active: true });
                      }}
                      className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddFee}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      {editingFee ? 'Update' : 'Add'} Fee Structure
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-4 right-4 lg:right-8 z-50 animate-in slide-in-from-bottom-5">
            <div className={`px-6 py-4 rounded-lg shadow-lg border ${
              toast.type === 'success' 
                ? 'bg-chart-3/10 border-chart-3 text-chart-3' 
                : 'bg-destructive/10 border-destructive text-destructive'
            }`}>
              <div className="flex items-center space-x-3">
                <span className="text-xl">
                  {toast.type === 'success' ? '✅' : '❌'}
                </span>
                <p className="font-medium">{toast.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Delete Academic Year Confirmation Modal */}
        {showDeleteAYModal && deletingAY && (
          <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-destructive">Delete Academic Year</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-lg">⚠️</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground font-medium mb-2">
                        Are you sure you want to delete the academic year "{deletingAY.year_label}"?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This action cannot be undone. This will permanently delete the academic year and may affect related course offerings and fee structures.
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowDeleteAYModal(false);
                        setDeletingAY(null);
                      }}
                      className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAcademicYear}
                      className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Course Confirmation Modal */}
        {showDeleteCourseModal && deletingCourse && (
          <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-destructive">Delete Course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-lg">⚠️</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground font-medium mb-2">
                        Are you sure you want to delete the course "{deletingCourse.course_name}" ({deletingCourse.course_code})?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This action cannot be undone. This will permanently delete the course and may affect related students and fee structures.
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowDeleteCourseModal(false);
                        setDeletingCourse(null);
                      }}
                      className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteCourse}
                      className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Document Type Confirmation Modal */}
        {showDeleteDocModal && deletingDoc && (
          <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-destructive">Delete Document Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-lg">⚠️</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground font-medium mb-2">
                        Are you sure you want to delete the document type "{deletingDoc.name}" ({deletingDoc.code})?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This action cannot be undone. This will permanently delete the document type and may affect student document submissions.
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowDeleteDocModal(false);
                        setDeletingDoc(null);
                      }}
                      className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteDocument}
                      className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Fee Structure Confirmation Modal */}
        {showDeleteFeeModal && deletingFee && (
          <div className="fixed inset-y-0 right-0 left-0 lg:left-64 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-destructive">Delete Fee Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-lg">⚠️</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground font-medium mb-2">
                        Are you sure you want to delete the fee structure for "{deletingFee.course_name}" - {deletingFee.academic_year}?
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This action cannot be undone. This will permanently delete the fee structure and may affect payment records.
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowDeleteFeeModal(false);
                        setDeletingFee(null);
                      }}
                      className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteFee}
                      className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

