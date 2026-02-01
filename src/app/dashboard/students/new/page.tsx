'use client';

import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

export default function NewStudentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
    fetchData();
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
      setFormData((prev) => ({ ...prev, courseOfferingId: '' }));
    }
  }, [formData.academicYearId, formData.courseId, courseOfferings]);

  const fetchData = async () => {
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
      const coRes = await fetch('/api/course-offerings?isOpen=true');
      if (coRes.ok) {
        const coData = await coRes.json();
        setCourseOfferings(coData.courseOfferings || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create student');
      }

      const data = await response.json();
      router.push(`/dashboard/students/${data.student.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const canAddStudent = ['AdmissionStaff', 'Admin', 'SuperAdmin'].includes(user.role);

  if (!canAddStudent) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-destructive">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to add students.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Student</h1>
          <p className="text-muted-foreground mt-1">Create a new student application entry</p>
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
                <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter student's full name"
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-foreground mb-2">
                    Date of Birth <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    name="dateOfBirth"
                    required
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-foreground mb-2">
                    Gender <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                    Category <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
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
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    Phone <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-foreground mb-2">
                  Address <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
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
                  <label htmlFor="previousSchool" className="block text-sm font-medium text-foreground mb-2">
                    Previous School
                  </label>
                  <input
                    id="previousSchool"
                    type="text"
                    name="previousSchool"
                    value={formData.previousSchool}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="previousBoard" className="block text-sm font-medium text-foreground mb-2">
                    Board
                  </label>
                  <input
                    id="previousBoard"
                    type="text"
                    name="previousBoard"
                    value={formData.previousBoard}
                    onChange={handleChange}
                    placeholder="e.g., CBSE, JKBOSE"
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="previousPercentage" className="block text-sm font-medium text-foreground mb-2">
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
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Course Selection</CardTitle>
              <CardDescription>Choose the academic year and course for admission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="academicYearId" className="block text-sm font-medium text-foreground mb-2">
                    Academic Year <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="academicYearId"
                    name="academicYearId"
                    required
                    value={formData.academicYearId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
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
                  <label htmlFor="courseId" className="block text-sm font-medium text-foreground mb-2">
                    Course <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="courseId"
                    name="courseId"
                    required
                    value={formData.courseId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
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
                <div className="bg-chart-1/10 border border-chart-1/20 rounded-lg p-4">
                  <p className="text-sm text-chart-1">
                    <span className="font-medium">Seats Available:</span>{' '}
                    {filteredOfferings[0].intake_capacity - filteredOfferings[0].enrolled_count} out of {filteredOfferings[0].intake_capacity}
                  </p>
                </div>
              )}
              
              {formData.academicYearId && formData.courseId && filteredOfferings.length === 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm text-destructive">
                    This course is not available for the selected academic year. Please contact the admin to create a course offering.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-input rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
