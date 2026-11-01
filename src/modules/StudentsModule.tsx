import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Printer,
  Download,
  Search,
  Phone,
  FileText,
  Upload,
  CreditCard,
  ArrowUpRight,
  Trash2,
  Edit2,
  DollarSign,
  IdCard,
  CheckSquare,
  Square,
  X,
  CheckCircle2,
  Calendar,
  Sliders,
} from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type Student, type CustomFieldDefinition } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
import { triggerBrowserPrint, downloadElementAsPdf } from '../lib/pdf';
import { uploadToCloudinary } from '../lib/cloudinary';
import { CloudinaryUploader } from '../components/common/CloudinaryUploader';
import { FloatingPdfButton } from '../components/common/FloatingPdfButton';
import { UnifiedPrintLayout } from '../components/common/UnifiedPrintLayout';
import { getCustomFieldsForAcademy } from '../lib/customFields';
import { logAuditEvent } from '../lib/auditLogger';
import { getCurrentUser } from '../components/auth/AuthSystem';

interface StudentsModuleProps {
  onNavigate?: (path: string) => void;
}

export const StudentsModule: React.FC<StudentsModuleProps> = ({ onNavigate }) => {
  const currentUser = getCurrentUser();
  const isParent = currentUser?.role === 'parent';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  const state = erpStorage.getState();
  
  const academyId = currentUser?.academyId || state.activeInstitutionId || 'inst-1';

  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDossierPrintOpen, setIsBatchDossierPrintOpen] = useState(false);
  const [batchPrintMode, setBatchPrintMode] = useState<'dossier' | 'table'>('dossier');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkClassBatch, setBulkClassBatch] = useState('');
  const [bulkCourse, setBulkCourse] = useState('');

  // Custom Fields
  const [customFieldsConfig, setCustomFieldsConfig] = useState<CustomFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const loadCustomFields = () => {
    setCustomFieldsConfig(getCustomFieldsForAcademy(academyId));
  };

  useEffect(() => {
    loadCustomFields();
    const handleCustomFieldsChange = () => loadCustomFields();
    window.addEventListener('taleemos_custom_fields_changed', handleCustomFieldsChange);
    return () => window.removeEventListener('taleemos_custom_fields_changed', handleCustomFieldsChange);
  }, [academyId]);

  // Form fields
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [classBatch, setClassBatch] = useState('Batch 2026-A (Morning)');
  const [course, setCourse] = useState('F.Sc Pre-Engineering');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [gender, setGender] = useState<Student['gender']>('Male');
  const [photoUrl, setPhotoUrl] = useState('');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);

  // KPIs
  const totalStudents = state.students.length;
  const activeStudents = state.students.filter((s) => s.status === 'Active').length;
  const maleCount = state.students.filter((s) => s.gender === 'Male').length;
  const femaleCount = state.students.filter((s) => s.gender === 'Female').length;

  const filtered = state.students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      s.fatherName.toLowerCase().includes(search.toLowerCase()) ||
      s.cnic.includes(search) ||
      s.phone.includes(search);
    const matchBatch = batchFilter === 'All' || s.classBatch === batchFilter;
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchSearch && matchBatch && matchStatus;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((s) => s.id));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingPhoto(true);
      try {
        const url = await uploadToCloudinary(e.target.files[0]);
        setPhotoUrl(url);
      } catch (err) {
        console.error('Photo upload failed:', err);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleOpenEdit = (s: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true);
    setEditingStudentId(s.id);
    setName(s.name);
    setFatherName(s.fatherName);
    setClassBatch(s.classBatch);
    setCourse(s.course);
    setPhone(s.phone);
    setCnic(s.cnic);
    setAddress(s.address);
    setBloodGroup(s.bloodGroup);
    setGender(s.gender);
    setPhotoUrl(s.photoUrl);
    setAdmissionDate(s.admissionDate);
    setCustomFieldValues(s.customFields || {});
    setIsAddModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !fatherName.trim() || !phone.trim()) return;

    if (isEditMode && editingStudentId) {
      erpStorage.updateItem('students', editingStudentId, {
        name,
        fatherName,
        classBatch,
        course,
        phone,
        cnic: cnic || '43102-XXXXXXX-X',
        address: address || 'Kandhkot, Sindh',
        bloodGroup,
        gender,
        photoUrl: photoUrl || undefined,
        admissionDate,
        customFields: customFieldValues,
      });

      logAuditEvent({
        action: 'UPDATE_STUDENT',
        module: 'Students',
        targetRecord: `${name} (ID: ${editingStudentId})`,
        targetId: editingStudentId,
        details: `Updated student demographic details and custom attributes for ${name}`,
        academyId,
      });

      setActionNotice(`Updated record for student: ${name}`);
    } else {
      const nextRoll = `TAK-26-${String(state.students.length + 1).padStart(3, '0')}`;
      const newStudentId = `STU-${Date.now().toString().slice(-4)}`;
      const newStudent: Student = {
        id: newStudentId,
        rollNo: nextRoll,
        name,
        fatherName,
        classBatch,
        course,
        phone,
        cnic: cnic || '43102-XXXXXXX-X',
        admissionDate,
        status: 'Active',
        photoUrl:
          photoUrl ||
          (gender === 'Female'
            ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80'),
        documents: [],
        address: address || 'Kandhkot, Sindh',
        bloodGroup,
        gender,
        feePaidTotal: 0,
        feePendingTotal: 0,
        customFields: customFieldValues,
      };
      erpStorage.addItem('students', newStudent);

      logAuditEvent({
        action: 'CREATE_STUDENT',
        module: 'Students',
        targetRecord: `${name} (${nextRoll})`,
        targetId: newStudentId,
        details: `Registered new student ${name} into ${classBatch} with roll ${nextRoll}`,
        academyId,
      });

      setActionNotice(`Registered new student: ${name} (${nextRoll})`);
    }

    setIsAddModalOpen(false);
    setIsEditMode(false);
    setEditingStudentId(null);
    resetForm();
    setTimeout(() => setActionNotice(null), 3500);
  };

  const resetForm = () => {
    setName('');
    setFatherName('');
    setPhone('');
    setCnic('');
    setAddress('');
    setPhotoUrl('');
    setCustomFieldValues({});
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const stToDelete = state.students.find((s) => s.id === id);
    if (confirm(`Delete student record for "${stToDelete?.name || id}" from directory?`)) {
      erpStorage.deleteItem('students', id);
      if (selectedStudent?.id === id) setSelectedStudent(null);
      setSelectedIds((prev) => prev.filter((item) => item !== id));

      logAuditEvent({
        action: 'DELETE_STUDENT',
        module: 'Students',
        targetRecord: `${stToDelete?.name || 'Student'} (${stToDelete?.rollNo || id})`,
        targetId: id,
        details: `Deleted student record for ${stToDelete?.name || id}`,
        academyId,
      });

      setActionNotice('Student record removed.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Permanently remove ${selectedIds.length} selected student records?`)) {
      selectedIds.forEach((id) => erpStorage.deleteItem('students', id));

      logAuditEvent({
        action: 'BULK_DELETE_STUDENTS',
        module: 'Students',
        targetRecord: `${selectedIds.length} Students`,
        details: `Bulk deleted ${selectedIds.length} student records from directory`,
        academyId,
      });

      setSelectedIds([]);
      setActionNotice('Selected student records removed.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  
  const handleBulkUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkClassBatch && !bulkCourse) {
      setActionNotice('No changes selected for bulk update.');
      setTimeout(() => setActionNotice(null), 3000);
      return;
    }
    
    selectedIds.forEach((id) => {
      const updates: Partial<Student> = {};
      if (bulkClassBatch) updates.classBatch = bulkClassBatch;
      if (bulkCourse) updates.course = bulkCourse;
      erpStorage.updateItem('students', id, updates);
    });

    logAuditEvent({
      action: 'BULK_UPDATE_STUDENTS',
      module: 'Students',
      targetRecord: `${selectedIds.length} Students`,
      details: `Bulk updated ${selectedIds.length} student records`,
      academyId,
    });

    setSelectedIds([]);
    setIsBulkEditModalOpen(false);
    setBulkClassBatch('');
    setBulkCourse('');
    setActionNotice(`Bulk updated ${selectedIds.length} student records.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleExportCsv = () => {
    if (filtered.length === 0) {
      alert('No student records to export.');
      return;
    }

    const baseHeaders = [
      'Roll No',
      'Student Name',
      'Father Name',
      'Course',
      'Batch',
      'Phone',
      'CNIC',
      'Gender',
      'Blood Group',
      'Address',
      'Admission Date',
      'Status',
      'Fee Paid (PKR)',
      'Fee Pending (PKR)',
    ];

    const customHeaders = customFieldsConfig.map((cf) => cf.label);
    const headers = [...baseHeaders, ...customHeaders];

    const rows = filtered.map((s) => {
      const baseValues = [
        `"${s.rollNo}"`,
        `"${s.name}"`,
        `"${s.fatherName}"`,
        `"${s.course}"`,
        `"${s.classBatch}"`,
        `"${s.phone}"`,
        `"${s.cnic}"`,
        `"${s.gender}"`,
        `"${s.bloodGroup}"`,
        `"${(s.address || '').replace(/"/g, '""')}"`,
        `"${s.admissionDate}"`,
        `"${s.status}"`,
        `"${s.feePaidTotal || 0}"`,
        `"${s.feePendingTotal || 0}"`,
      ];

      const customValues = customFieldsConfig.map((cf) => {
        const val = s.customFields?.[cf.id] || '';
        return `"${val.replace(/"/g, '""')}"`;
      });

      return [...baseValues, ...customValues].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TaleemOS_Students_Directory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    logAuditEvent({
      action: 'EXPORT_STUDENTS_CSV',
      module: 'Students',
      targetRecord: `${filtered.length} Student Records`,
      details: `Exported ${filtered.length} student records including ${customFieldsConfig.length} custom fields to CSV`,
      academyId,
    });

    setActionNotice(`Exported ${filtered.length} student records with custom fields to CSV!`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 relative">
      {/* Floating Download as PDF Button */}
      <FloatingPdfButton
        label="Download Students PDF"
        onPrint={() => {
          if (selectedIds.length > 0) {
            setIsBatchDossierPrintOpen(true);
          } else {
            setIsPrintAllOpen(true);
          }
        }}
      />
      {/* Toast Notice */}
      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 rounded-xl">
              <Users className="w-5 h-5 text-white" />
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Students Directory</h1>
            <span className="px-2 py-0.5 bg-indigo-500 text-white font-black text-[10px] rounded uppercase">
              REGISTRY
            </span>
          </div>
          <p className="text-xs text-indigo-200 mt-1">
            Student master records, roll numbers, Cloudinary photo archive, and fee history linkages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setIsPrintAllOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print All
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('idCards')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <IdCard className="w-4 h-4" />
            Bulk ID Cards
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditMode(false);
              setEditingStudentId(null);
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Registered</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">{totalStudents}</div>
        </div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase">Active Students</div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">{activeStudents}</div>
        </div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-blue-500 uppercase">Male Students</div>
          <div className="text-2xl font-black text-blue-600 font-mono mt-1">{maleCount}</div>
        </div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-purple-500 uppercase">Female Students</div>
          <div className="text-2xl font-black text-purple-600 font-mono mt-1">{femaleCount}</div>
        </div>
      </div>

      {/* Search, Filters, and Checkbox Multi-Select Bar */}
      <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Roll No (TAK-26-001), name, father, phone, or CNIC..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Select All Checkbox Button */}
          <button
            type="button"
            onClick={toggleSelectAll}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition shrink-0"
          >
            {selectedIds.length === filtered.length && filtered.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {selectedIds.length === filtered.length && filtered.length > 0
                ? 'Deselect All'
                : `Select All (${filtered.length})`}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Batch:
          </span>
          {['All', 'Batch 2026-A (Morning)', 'Batch 2026-B (Morning)', 'Batch 2026-C (Afternoon)'].map(
            (b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBatchFilter(b)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                  batchFilter === b
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {b}
              </button>
            )
          )}
        </div>
      </div>

      {/* Floating Multi-Select Action Toolbar when rows are checked */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg border border-indigo-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 bg-indigo-500 text-white rounded-lg font-mono">
              {selectedIds.length}
            </span>
            <span>Students Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <button
              type="button"
              onClick={() => {
                setBatchPrintMode('dossier');
                setIsBatchDossierPrintOpen(true);
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF ({selectedIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBatchPrintMode('table');
                setIsPrintAllOpen(true);
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Roster List</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBulkEditModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Bulk Edit</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('idCards')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <IdCard className="w-3.5 h-3.5" />
              <span>Print ID Cards</span>
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Student Cards (Tappable to Detail Modal) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const isSelected = selectedIds.includes(s.id);
          return (
            <div
              key={s.id}
              onClick={() => setSelectedStudent(s)}
              className={`p-5 rounded-[22px] border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between ${
                isSelected ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-400/40' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelect(s.id);
                      }}
                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                    />
                    <span className="px-2.5 py-0.5 text-xs font-mono font-black bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                      {s.rollNo}
                    </span>
                  </div>
                  <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                    {s.status}
                  </span>
                </div>

                <div className="mt-3 flex items-start gap-3">
                  <img
                    src={s.photoUrl}
                    alt={s.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-100 shrink-0"
                  />
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{s.name}</h3>
                    <p className="text-xs text-slate-500 font-semibold">S/O {s.fatherName}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{s.classBatch}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-mono font-bold">{s.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Blood Group:</span>
                    <span className="font-bold text-rose-600">{s.bloodGroup}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Fee Status:</span>
                    <span className="font-bold text-emerald-600">PKR {s.feePaidTotal} Paid</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate?.('fees');
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Fees History</span>
                </button>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(s, e)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                    title="Edit / Modify Student"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(s.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                    title="Delete Student"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT STUDENT MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditMode(false);
          setEditingStudentId(null);
        }}
        title={isEditMode ? 'Edit / Modify Student Record' : 'Add New Student Directory Record'}
        subtitle="Generates unique institutional Roll Number (TAK-26-XXX)"
        badge={isEditMode ? 'MODIFY' : 'DIRECTORY'}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Student name"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Father Name *
              </label>
              <input
                type="text"
                required
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="Father / Guardian name"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Class / Batch *
              </label>
              <select
                value={classBatch}
                onChange={(e) => setClassBatch(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"
              >
                {state.batches.map((b) => (
                  <option key={b.id} value={b.batchName}>
                    {b.batchName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Course</label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"
              >
                {state.courses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Student['gender'])}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Contact Phone *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 0000000"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                CNIC / B-Form
              </label>
              <input
                type="text"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder="43102-XXXXXXX-X"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-bold"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Residential Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address in Kandhkot or surrounding areas"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
            />
          </div>

          {/* Dynamic Custom Fields Section (Configured in Settings) */}
          {customFieldsConfig.length > 0 && (
            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 uppercase">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  Custom Student Attributes ({customFieldsConfig.length} Configured)
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold">Settings Config</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customFieldsConfig.map((cf) => (
                  <div key={cf.id}>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      {cf.label} {cf.isRequired ? '*' : '(Optional)'}
                    </label>
                    {cf.type === 'date' ? (
                      <input
                        type="date"
                        required={cf.isRequired}
                        value={customFieldValues[cf.id] || ''}
                        onChange={(e) =>
                          setCustomFieldValues((prev) => ({ ...prev, [cf.id]: e.target.value }))
                        }
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-mono"
                      />
                    ) : (
                      <input
                        type="text"
                        required={cf.isRequired}
                        value={customFieldValues[cf.id] || ''}
                        onChange={(e) =>
                          setCustomFieldValues((prev) => ({ ...prev, [cf.id]: e.target.value }))
                        }
                        placeholder={cf.placeholder || `Enter ${cf.label}`}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cloudinary Student Photo upload */}
          <CloudinaryUploader
            label="Student Photo (Cloudinary Direct Integration)"
            description="Preset: TaleemOS | Cloud: h79njj6q | Replaces local storage"
            value={photoUrl}
            accept="image/*"
            mode="image"
            previewShape="circle"
            folder="taleemos_students"
            onUpload={(url) => setPhotoUrl(url)}
          />

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditMode(false);
                setEditingStudentId(null);
              }}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isEditMode ? 'Update Student Record' : 'Register Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DETAIL MODAL + Single ID Card Print & PDF Download */}
      {selectedStudent && (
        <Modal
          isOpen={Boolean(selectedStudent)}
          onClose={() => setSelectedStudent(null)}
          title={`Student Profile: ${selectedStudent.name}`}
          subtitle={`Roll No: ${selectedStudent.rollNo} • Batch: ${selectedStudent.classBatch}`}
          badge={selectedStudent.status}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div id="single-student-profile" className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b border-slate-200">
                <img
                  src={selectedStudent.photoUrl}
                  alt={selectedStudent.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-600 shadow-md"
                />
                <div className="text-center sm:text-left">
                  <h4 className="text-lg font-black text-slate-900">{selectedStudent.name}</h4>
                  <div className="text-xs text-slate-500 font-semibold">
                    Father: <span className="text-slate-800">{selectedStudent.fatherName}</span>
                  </div>
                  <div className="text-xs text-indigo-700 font-mono font-bold mt-1">
                    Roll No: {selectedStudent.rollNo} &bull; Blood: {selectedStudent.bloodGroup}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mt-4">
                <div>
                  <span className="text-slate-400 block font-semibold">Course:</span>
                  <span className="font-bold text-slate-800">{selectedStudent.course}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Phone:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedStudent.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">CNIC:</span>
                  <span className="font-mono text-slate-800">{selectedStudent.cnic}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Address:</span>
                  <span className="text-slate-800">{selectedStudent.address}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Admitted On:</span>
                  <span className="font-mono text-slate-800">{selectedStudent.admissionDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Gender:</span>
                  <span className="font-bold text-slate-800">{selectedStudent.gender}</span>
                </div>
              </div>

              {/* Custom Student Fields Display */}
              {customFieldsConfig.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 mb-2 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    Custom Attributes & Emergency Contacts
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {customFieldsConfig.map((cf) => {
                      const val = selectedStudent.customFields?.[cf.id];
                      return (
                        <div key={cf.id} className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{cf.label}:</span>
                          <span className="font-bold text-slate-800 mt-0.5 block">
                            {val ? (cf.type === 'date' ? `📅 ${val}` : val) : <span className="text-slate-400 italic font-normal">Not Provided</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Student Documents & Scans (Cloudinary Integration) */}
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      Student Documents & Scans (Cloudinary Archive)
                    </h5>
                    <p className="text-[10px] text-slate-500">
                      Matric certificate, B-Form, CNIC & character documents stored on Cloudinary
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(selectedStudent.documents || []).length === 0 ? (
                    <div className="col-span-full p-3 bg-white rounded-xl border text-center text-slate-400 text-xs">
                      No documents attached yet. Upload below.
                    </div>
                  ) : (
                    (selectedStudent.documents || []).map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="font-bold text-slate-800 text-xs truncate">
                            {doc.title}
                          </span>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold shrink-0 transition"
                        >
                          View Cloudinary
                        </a>
                      </div>
                    ))
                  )}
                </div>

                {/* Upload New Document via Cloudinary */}
                <div className="p-3 bg-white rounded-xl border border-dashed border-indigo-300">
                  <CloudinaryUploader
                    label="Upload Official Certificate / Doc (Cloudinary)"
                    description="Secure cloud upload to preset: TaleemOS (PDF or Image)"
                    accept="application/pdf,image/*"
                    mode="document"
                    folder="taleemos_documents"
                    buttonText="Attach New Document"
                    onUpload={(url, meta) => {
                      const docTitle = meta?.name || 'Document_' + Date.now();
                      const currentDocs = selectedStudent.documents || [];
                      const updatedDocs = [...currentDocs, { title: docTitle, url }];
                      erpStorage.updateItem('students', selectedStudent.id, { documents: updatedDocs });
                      setSelectedStudent({ ...selectedStudent, documents: updatedDocs });
                      setActionNotice('Uploaded document ' + docTitle + ' to Cloudinary!');
                      setTimeout(() => setActionNotice(null), 3500);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerBrowserPrint()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  Print Student Card
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadElementAsPdf(
                      'single-student-profile',
                      `Student_Card_${selectedStudent.rollNo.replace(/[^a-zA-Z0-9]/g, '_')}`
                    )
                  }
                  className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    onNavigate?.('promote');
                  }}
                  className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Promote
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PRINT ALL STUDENTS MODAL (Print + PDF Download) */}
      {isPrintAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 no-print overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">Students Master Directory (A4)</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerBrowserPrint()}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print A4
                </button>
                <button
                  type="button"
                  onClick={() => downloadElementAsPdf('students-print-table', 'TaleemOS_Students_Directory')}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF Download
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintAllOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  Close
                </button>
              </div>
            </div>

            <div id="students-print-table">
              <LetterheadPrint
                title="Institutional Master Student Directory"
                documentNo="STU-DIR-2026"
                summaryStats={[
                  { label: 'Total Registered', value: totalStudents },
                  { label: 'Active Students', value: activeStudents },
                  { label: 'Male', value: maleCount },
                  { label: 'Female', value: femaleCount },
                ]}
              >
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold">
                      <th className="border border-slate-300 p-2">Roll No</th>
                      <th className="border border-slate-300 p-2">Student Name</th>
                      <th className="border border-slate-300 p-2">Father Name</th>
                      <th className="border border-slate-300 p-2">Batch</th>
                      <th className="border border-slate-300 p-2">Course</th>
                      <th className="border border-slate-300 p-2">Phone</th>
                      <th className="border border-slate-300 p-2">Blood</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedIds.length > 0 ? filtered.filter((s) => selectedIds.includes(s.id)) : filtered).map((s) => (
                      <tr key={s.id}>
                        <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-700">
                          {s.rollNo}
                        </td>
                        <td className="border border-slate-300 p-2 font-bold">{s.name}</td>
                        <td className="border border-slate-300 p-2">{s.fatherName}</td>
                        <td className="border border-slate-300 p-2">{s.classBatch}</td>
                        <td className="border border-slate-300 p-2">{s.course}</td>
                        <td className="border border-slate-300 p-2 font-mono">{s.phone}</td>
                        <td className="border border-slate-300 p-2 font-bold text-rose-600">{s.bloodGroup}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </LetterheadPrint>
            </div>
          </div>
        </div>
      )}

      
      {/* BULK EDIT MODAL */}
      <Modal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        title={`Bulk Edit ${selectedIds.length} Selected Students`}
        subtitle="Update shared attributes for all selected records simultaneously"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleBulkUpdate} className="space-y-4">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
            You are about to update <strong>{selectedIds.length}</strong> students. Leave a field as "-- No Change --" to keep its current value.
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Change Class / Batch To:
            </label>
            <select
              value={bulkClassBatch}
              onChange={(e) => setBulkClassBatch(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"
            >
              <option value="">-- No Change --</option>
              {state.batches.map((b) => (
                <option key={b.id} value={b.batchName}>{b.batchName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Change Course To:
            </label>
            <select
              value={bulkCourse}
              onChange={(e) => setBulkCourse(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"
            >
              <option value="">-- No Change --</option>
              {state.courses.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBulkEditModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Apply Bulk Update
            </button>
          </div>
        </form>
      </Modal>

      {/* BATCH PRINT CONCATENATED DOSSIERS MODAL */}
      {isBatchDossierPrintOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 no-print overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-6 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-slate-900">
                    Concatenated Batch Print ({selectedIds.length} Student Dossiers)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-700">
                    Multi-Page A4 PDF
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Each selected student is formatted with official academy letterhead, photos, and verification seals separated by page breaks.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => triggerBrowserPrint()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Concatenated PDF
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadElementAsPdf(
                      'batch-students-concatenated-dossiers',
                      `Batch_Students_Concatenated_${selectedIds.length}_Records`
                    )
                  }
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  PDF File
                </button>
                <button
                  type="button"
                  onClick={() => setIsBatchDossierPrintOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Concatenated Document Container */}
            <div id="batch-students-concatenated-dossiers" className="space-y-8">
              {(selectedIds.length > 0
                ? state.students.filter((s) => selectedIds.includes(s.id))
                : filtered
              ).map((student, index, arr) => (
                <div
                  key={student.id}
                  className={`student-dossier-card avoid-break ${
                    index < arr.length - 1 ? 'page-break' : ''
                  }`}
                >
                  <UnifiedPrintLayout
                    title="STUDENT OFFICIAL ENROLLMENT DOSSIER"
                    subtitle={`Academic Profile & Permanent Institutional Record • ${student.classBatch}`}
                    documentNo={`DOS-${student.rollNo}`}
                    watermarkText="OFFICIAL STUDENT DOSSIER"
                    signatures={[
                      'Admission Registrar',
                      'Accounts Verification',
                      'Principal / Director General',
                    ]}
                  >
                    <div className="space-y-5 text-xs">
                      {/* Top Profile Card */}
                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
                        <img
                          src={student.photoUrl}
                          alt={student.name}
                          className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-900 shadow-md shrink-0"
                        />
                        <div className="text-center sm:text-left flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                              {student.name}
                            </h3>
                            <span className="font-mono text-xs font-black bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1 rounded-lg">
                              Roll No: {student.rollNo}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-semibold mt-1">
                            Son / Daughter of: <strong className="text-slate-900">{student.fatherName}</strong>
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
                            <span>Program: <strong className="text-indigo-900">{student.course}</strong></span>
                            <span>&bull;</span>
                            <span>Batch: <strong className="text-slate-800">{student.classBatch}</strong></span>
                            <span>&bull;</span>
                            <span>Status: <strong className="text-emerald-700 uppercase">{student.status}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Bio & Demographics Table */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-white border border-slate-200 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">B-Form / CNIC</span>
                          <span className="font-mono font-bold text-slate-800 text-xs">{student.cnic}</span>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact Phone</span>
                          <span className="font-mono font-bold text-indigo-700 text-xs">{student.phone}</span>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Blood Group</span>
                          <span className="font-bold text-rose-600 text-xs">{student.bloodGroup}</span>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Gender</span>
                          <span className="font-bold text-slate-800 text-xs">{student.gender}</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Permanent Residential Address
                        </span>
                        <p className="text-slate-800 font-medium">{student.address}</p>
                      </div>

                      {/* Financial Clearance Summary */}
                      <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-500 font-sans block">
                            Tuition & Admission Fees Account
                          </span>
                          <div className="text-sm font-bold text-slate-800 mt-0.5">
                            Total Paid To Date: <span className="text-emerald-700 font-black">PKR {student.feePaidTotal.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-slate-500 font-sans block">
                            Account Balance
                          </span>
                          <span className={`text-sm font-black ${student.feePendingTotal > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {student.feePendingTotal > 0 ? `PKR ${student.feePendingTotal.toLocaleString()} Pending` : 'All Clear'}
                          </span>
                        </div>
                      </div>

                      {/* Verification Notice */}
                      <div className="p-3 border-2 border-dashed border-slate-300 bg-slate-50/60 rounded-xl text-center text-[10px] text-slate-500">
                        This dossier is an official institutional document of Taleem Academy. Certified true copy for academic records and examination admissions.
                      </div>
                    </div>
                  </UnifiedPrintLayout>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsModule;
