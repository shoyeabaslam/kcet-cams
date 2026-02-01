'use client';

import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DocumentType {
  id: number;
  code: string;
  name: string;
  is_required: boolean;
}

interface ExistingDocument {
  document_type_id: number;
  declared: boolean;
  notes: string | null;
}

interface DocumentSelection {
  checked: boolean;
  notes: string;
}

export default function AddDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [studentId, setStudentId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [appNumber, setAppNumber] = useState<string>('');
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selections, setSelections] = useState<Record<number, DocumentSelection>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then((resolvedParams) => {
      setStudentId(resolvedParams.id);
      fetchData(resolvedParams.id);
    });
  }, [params]);

  const fetchData = async (id: string) => {
    try {
      // Fetch student info
      const studentRes = await fetch(`/api/students/${id}`);
      if (studentRes.ok) {
        const data = await studentRes.json();
        setStudentName(data.student.full_name);
        setAppNumber(data.student.application_number);
      }

      // Fetch document types
      const docTypesRes = await fetch('/api/document-types');
      if (docTypesRes.ok) {
        const data = await docTypesRes.json();
        setDocumentTypes(data.documentTypes);
      }

      // Fetch existing documents and pre-check them
      const existingDocsRes = await fetch(`/api/students/${id}`);
      if (existingDocsRes.ok) {
        const data = await existingDocsRes.json();
        const existingDocs: ExistingDocument[] = data.student.documents || [];
        
        // Pre-populate selections with existing documents
        const initialSelections: Record<number, DocumentSelection> = {};
        existingDocs.forEach(doc => {
          if (doc.declared) {
            initialSelections[doc.document_type_id] = {
              checked: true,
              notes: doc.notes || ''
            };
          }
        });
        setSelections(initialSelections);
      }
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (docId: number) => {
    setSelections(prev => ({
      ...prev,
      [docId]: {
        checked: !prev[docId]?.checked,
        notes: prev[docId]?.notes || ''
      }
    }));
  };

  const handleNotesChange = (docId: number, notes: string) => {
    setSelections(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        notes
      }
    }));
  };

  const handleCheckAllRequired = () => {
    const newSelections: Record<number, DocumentSelection> = { ...selections };
    
    documentTypes.forEach(doc => {
      if (doc.is_required) {
        newSelections[doc.id] = {
          checked: true,
          notes: newSelections[doc.id]?.notes || ''
        };
      }
    });
    
    setSelections(newSelections);
  };

  const handleUncheckAll = () => {
    const newSelections: Record<number, DocumentSelection> = {};
    
    // Keep the notes but uncheck everything
    Object.keys(selections).forEach(key => {
      const docId = Number.parseInt(key);
      newSelections[docId] = {
        checked: false,
        notes: selections[docId]?.notes || ''
      };
    });
    
    setSelections(newSelections);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedDocs = Object.entries(selections)
      .filter(([_, sel]) => sel.checked)
      .map(([id, sel]) => ({
        document_type_id: Number.parseInt(id),
        notes: sel.notes || null
      }));

    if (selectedDocs.length === 0) {
      setError('Please select at least one document');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(`/api/students/${studentId}/documents/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: selectedDocs }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/dashboard/students/${studentId}?tab=documents`);
      } else {
        setError(data.error || 'Failed to submit documents');
      }
    } catch {
      setError('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  const canManageDocuments = ['DocumentOfficer', 'Admin', 'SuperAdmin'].includes(user.role);

  if (!canManageDocuments) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to manage documents.</p>
          <Link href={`/dashboard/students/${studentId}`} className="text-blue-900 hover:text-blue-700">
            ← Back to Student
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const selectedCount = Object.values(selections).filter(s => s.checked).length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link href={`/dashboard/students/${studentId}?tab=documents`} className="text-blue-900 hover:text-blue-700 mb-4 inline-block">
            ← Back to Student Details
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Submit Documents</h1>
          <p className="text-gray-600 mt-1">
            For: <span className="font-medium">{studentName}</span> ({appNumber})
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Document Checklist</CardTitle>
                <CardDescription>
                  Check documents submitted and add individual notes for each
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleCheckAllRequired();
                      } else {
                        handleUncheckAll();
                      }
                    }}
                    checked={documentTypes.filter(d => d.is_required).every(d => selections[d.id]?.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-600 transition-colors">
                    Check All Required Docs
                  </span>
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                {documentTypes.map(doc => {
                  const isChecked = selections[doc.id]?.checked || false;
                  const notes = selections[doc.id]?.notes || '';
                  
                  return (
                    <div
                      key={doc.id}
                      className={`border rounded-xl p-4 transition-all ${
                        isChecked ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggle(doc.id)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{doc.name}</span>
                            {doc.is_required && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                Required
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={notes}
                            onChange={(e) => handleNotesChange(doc.id, e.target.value)}
                            placeholder="Add notes (optional)..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!isChecked}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {documentTypes.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No document types available</p>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">📋 Status Updates</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Some required docs → <strong>DOCUMENTS_INCOMPLETE</strong></li>
                      <li>• All required docs → <strong>DOCUMENTS_DECLARED</strong></li>
                      <li>• Previously submitted documents are pre-checked</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting || selectedCount === 0}
                  className="flex-1 px-6 py-3 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </span>
                  ) : (
                    `Submit ${selectedCount} Document(s)`
                  )}
                </button>
                <Link
                  href={`/dashboard/students/${studentId}?tab=documents`}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
