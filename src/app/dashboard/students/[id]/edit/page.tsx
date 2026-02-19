'use client';

import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Course {
  id: string;
  course_name: string;
  course_code: string;
}

interface AcademicYear {
  id: number;
  year_label: string;
  is_active: boolean;
}

interface CourseOffering {
  id: string;
  course_id: string;
  academic_year_id: number;
  course_name: string;
  course_code: string;
  year_label: string;
  enrolled_count: number;
  intake_capacity: number;
}

interface Student {
  student_id: string;
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
  course_offering_id: string;
  academic_year_id: number;
  status: string;
  course_name: string;
  course_code: string;
}

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [studentId, setStudentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [filteredOfferings, setFilteredOfferings] = useState<CourseOffering[]>([]);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    category: 'General',
    email: '',
    phone: '',
    address: '',
    previousSchool: '',
    previousBoard: '',
    previousPercentage: '',
    academicYearId: '',
    courseId: '',
    courseOfferingId: '',
  });

  useEffect(() => {
    params.then((resolvedParams) => {
      setStudentId(resolvedParams.id);
      fetchStudent(resolvedParams.id);
    });
  }, []);

  useEffect(() => {
    // Filter course offerings based on selected academic year and course
    if (formData.academicYearId && formData.courseId) {
      const filtered = courseOfferings.filter(
        (co) => co.academic_year_id === Number(formData.academicYearId) && co.course_id === formData.courseId
      );
      setFilteredOfferings(filtered);
      if (filtered.length > 0) {
        setFormData((prev) => ({ ...prev, courseOfferingId: filtered[0].id }));
      }
    } else {
      setFilteredOfferings([]);
    }
  }, [formData.academicYearId, formData.courseId, courseOfferings]);

  const fetchStudent = async (id: string) => {
    try {
      const response = await fetch(`/api/students/${id}`);
      if (!response.ok) throw new Error('Failed to fetch student');
      
      const data = await response.json();
      const studentData = data.student;
      setStudent(studentData);

      // Populate form with student data
      setFormData({
        fullName: studentData.full_name || '',
        dateOfBirth: studentData.date_of_birth ? studentData.date_of_birth.split('T')[0] : '',
        gender: studentData.gender || '',
        category: studentData.category || 'General',
        email: studentData.email || '',
        phone: studentData.phone || '',
        address: studentData.address || '',
        previousSchool: studentData.previous_school || '',
        previousBoard: studentData.previous_board || '',
        previousPercentage: studentData.previous_percentage?.toString() || '',
        academicYearId: studentData.academic_year_id?.toString() || '',
        courseId: '', // Will be set after fetching course offerings
        courseOfferingId: studentData.course_offering_id || '',
      });

      // Fetch additional data after student is loaded
      await fetchCoursesAndOfferings(studentData.course_offering_id);
    } catch (error) {
      console.error('Error fetching student:', error);
      setError('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursesAndOfferings = async (courseOfferingId: string) => {
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

      // Fetch course offerings
      const coRes = await fetch('/api/course-offerings');
      if (coRes.ok) {
        const coData = await coRes.json();
        const offerings = coData.courseOfferings || [];
        setCourseOfferings(offerings);

        // Find the course ID from the current course offering
        if (courseOfferingId) {
          const currentOffering = offerings.find((o: CourseOffering) => o.id === courseOfferingId);
          if (currentOffering) {
            setFormData((prev) => ({ ...prev, courseId: currentOffering.course_id }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch courses and offerings:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update student');
      }

      router.push(`/dashboard/students/${studentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  // Only AdmissionStaff, Admin, and SuperAdmin can edit students
  const canEdit = ['AdmissionStaff', 'Admin', 'SuperAdmin'].includes(user.role);

  if (!canEdit) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-600">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            Only Admission Staff, Admin, and SuperAdmin can edit student information.
          </p>
          <Link href="/dashboard/students" className="text-blue-900 hover:text-blue-700">
            ← Back to Students
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-100">
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/students/${studentId}`} className="text-blue-900 hover:text-blue-700">
            ← Back
          </Link>
          <span className="text-gray-300">|</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Student</h1>
            <p className="text-gray-600 mt-1">
              {student.application_number} - {student.full_name}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic details of the student</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter student's full name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    name="dateOfBirth"
                    required
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    Gender <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-colors"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-colors"
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How to reach the student</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-colors"
                />
              </div>
            </CardContent>
          </Card>

          {/* Academic Background */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Academic Background</CardTitle>
              <CardDescription>Previous education details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="previousSchool" className="block text-sm font-medium text-gray-700 mb-2">
                    Previous School
                  </label>
                  <input
                    id="previousSchool"
                    type="text"
                    name="previousSchool"
                    value={formData.previousSchool}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="previousBoard" className="block text-sm font-medium text-gray-700 mb-2">
                    Board
                  </label>
                  <input
                    id="previousBoard"
                    type="text"
                    name="previousBoard"
                    value={formData.previousBoard}
                    onChange={handleChange}
                    placeholder="e.g., CBSE, JKBOSE"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="previousPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                    Percentage
                  </label>
                  <input
                    id="previousPercentage"
                    type="number"
                    name="previousPercentage"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.previousPercentage}
                    onChange={handleChange}
                    placeholder="85.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Course Selection</CardTitle>
              <CardDescription>Academic year and course for admission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="academicYearId" className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="academicYearId"
                    name="academicYearId"
                    required
                    value={formData.academicYearId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-colors"
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.year_label} {ay.is_active && '(Active)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-2">
                    Course <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="courseId"
                    name="courseId"
                    required
                    value={formData.courseId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-colors"
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.course_name} ({course.course_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Show availability info */}
              {filteredOfferings.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Seats Available:</span>{' '}
                    {filteredOfferings[0].intake_capacity - filteredOfferings[0].enrolled_count} out of {filteredOfferings[0].intake_capacity}
                  </p>
                </div>
              )}

              {formData.academicYearId && formData.courseId && filteredOfferings.length === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-800">
                    This course is not available for the selected academic year.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Link
              href={`/dashboard/students/${studentId}`}
              className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
