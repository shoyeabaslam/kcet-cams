# Document Submission System Update

## Changes Summary

### ✅ Completed Updates

#### 1. **API Endpoint Enhanced** (`/api/students/[id]/documents/bulk`)
- **Old Format**: `{document_type_ids: number[], notes: string}`
- **New Format**: `{documents: [{document_type_id: number, notes?: string}]}`
- **Status Calculation**: Moved from database trigger to API code
  ```typescript
  // Calculates status based on declared vs required documents
  if (declared_count >= total_required) → DOCUMENTS_DECLARED
  else if (declared_count > 0) → DOCUMENTS_INCOMPLETE
  ```
- **Returns**: `{documents, student: {old_status, new_status}, stats: {total_required, declared_count}}`

#### 2. **UI Component Rewritten** (`/dashboard/students/[id]/documents/add`)
- ✅ **Per-Document Notes**: Each document has its own notes field
- ✅ **Pre-Check Existing**: Automatically checks previously submitted documents
- ✅ **State Management**: Uses `Record<number, {checked: boolean, notes: string}>`
- ✅ **Format Match**: Sends `{documents: [{document_type_id, notes}]}` matching API
- ✅ **Visual Feedback**: 
  - Selected documents highlighted in blue
  - Required documents marked with red badge
  - Notes field disabled when unchecked
  - Shows count of selected documents in submit button

### 🔧 Technical Details

#### State Structure
```typescript
interface DocumentSelection {
  checked: boolean;
  notes: string;
}

const [selections, setSelections] = useState<Record<number, DocumentSelection>>({});
```

#### Pre-Loading Logic
```typescript
// Fetches student data and pre-populates existing documents
const existingDocs: ExistingDocument[] = data.student.documents || [];
existingDocs.forEach(doc => {
  if (doc.declared) {
    initialSelections[doc.document_type_id] = {
      checked: true,
      notes: doc.notes || ''
    };
  }
});
```

#### Submit Handler
```typescript
const selectedDocs = Object.entries(selections)
  .filter(([_, sel]) => sel.checked)
  .map(([id, sel]) => ({
    document_type_id: parseInt(id),
    notes: sel.notes || null
  }));

await fetch(`/api/students/${studentId}/documents/bulk`, {
  method: 'POST',
  body: JSON.stringify({ documents: selectedDocs })
});
```

### 📋 Status Calculation Logic

#### Required Documents Check
The API queries all required document types and counts declared ones:
```sql
SELECT 
  COUNT(DISTINCT dt.id) as total_required,
  COUNT(DISTINCT CASE WHEN sd.declared = TRUE THEN sd.document_type_id END) as declared_count
FROM document_types dt
LEFT JOIN student_documents sd ON sd.document_type_id = dt.id AND sd.student_id = $1
WHERE dt.is_required = TRUE
```

#### Status Updates
- **0 documents**: Status remains `APPLICATION_ENTERED` or current status
- **Some required docs**: `DOCUMENTS_INCOMPLETE`
- **All required docs**: `DOCUMENTS_DECLARED`

### 🎨 UI Features

1. **Document Checklist**
   - Checkbox for each document type
   - Individual notes input field per document
   - Visual indication of required vs optional documents
   - Blue highlight for selected documents

2. **Pre-Checked Documents**
   - Existing submissions automatically checked
   - Previous notes pre-populated
   - Can be unchecked if needed (status recalculated)

3. **Status Info Box**
   - Shows status transition rules
   - Explains pre-checking behavior
   - User-friendly guidance

4. **Submit Button**
   - Dynamic text: "Submit X Document(s)"
   - Disabled when no documents selected
   - Loading state during submission
   - Redirects to documents tab on success

### 🗂️ Files Modified

1. ✅ `/src/app/api/students/[id]/documents/bulk/route.ts` - Enhanced API with per-doc notes and status calc
2. ✅ `/src/app/dashboard/students/[id]/documents/add/page.tsx` - Complete UI rewrite
3. 📦 `/src/app/dashboard/students/[id]/documents/add/page_OLD.tsx` - Backup of previous version

### 🧪 Testing Checklist

- [ ] Login as documents@college.edu
- [ ] Navigate to any student detail page
- [ ] Click "Add Documents" tab
- [ ] Verify existing documents are pre-checked with notes
- [ ] Select new documents and add individual notes
- [ ] Submit and verify status updates correctly
- [ ] Check response includes {total_required, declared_count}
- [ ] Verify UI redirects to documents tab
- [ ] Confirm documents appear in the list

### 🚨 Known Issues to Monitor

1. **Status Calculation**
   - Watch for edge cases where declared_count might not match expected
   - Verify LEFT JOIN properly counts all required document types
   - Check if document_types.is_required is set correctly

2. **Database Trigger**
   - `trg_update_document_status` still exists but redundant
   - Consider migration 008 to drop trigger or keep as backup
   - If keeping, ensure trigger logic matches API logic exactly

### 📝 Next Steps

1. **Test the complete flow** with different scenarios:
   - New student with no documents
   - Student with partial documents
   - Student with all required documents
   - Editing existing document submissions

2. **Verify status transitions**:
   - APPLICATION_ENTERED → DOCUMENTS_INCOMPLETE
   - DOCUMENTS_INCOMPLETE → DOCUMENTS_DECLARED
   - DOCUMENTS_DECLARED → DOCUMENTS_INCOMPLETE (when unchecking)

3. **Monitor API responses** for stats:
   ```json
   {
     "student": {
       "old_status": "APPLICATION_ENTERED",
       "new_status": "DOCUMENTS_DECLARED"
     },
     "stats": {
       "total_required": 5,
       "declared_count": 5
     }
   }
   ```

4. **Consider future enhancements**:
   - File upload support (currently declarative only)
   - Document verification workflow
   - Bulk actions (approve/reject multiple)
   - Document history/audit trail

---

**Created**: $(date)
**Last Updated**: Transition from single-notes to per-document-notes system
**Status**: ✅ Ready for Testing


    const colors: { [key: string]: string } = {
      'APPLICATION_ENTERED': 'bg-blue-100 text-blue-800',
      'DOCUMENTS_DECLARED': 'bg-green-100 text-green-800',
      'DOCUMENTS_INCOMPLETE': 'bg-yellow-100 text-yellow-800',
      'FEE_PENDING': 'bg-orange-100 text-orange-800',
      'FEE_PARTIAL': 'bg-purple-100 text-purple-800',
      'FEE_RECEIVED': 'bg-emerald-100 text-emerald-800',
      'ADMITTED': 'bg-green-600 text-white',
    };