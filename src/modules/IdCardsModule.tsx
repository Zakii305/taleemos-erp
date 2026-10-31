import React, { useState } from 'react';
import {
  IdCard, Printer, Download, Search, QrCode, CheckSquare, Square, X, Camera, Edit3, Trash2, ShieldCheck
} from 'lucide-react';
import { erpStorage, INSTITUTIONS } from '../lib/storage';
import { type Student } from '../types';
import { triggerBrowserPrint, downloadElementAsPdf } from '../lib/pdf';
import { getCurrentUser } from '../components/auth/AuthSystem';
import { CloudinaryUploader } from '../components/common/CloudinaryUploader';
import { Modal } from '../components/common/Modal';

export const IdCardsModule: React.FC = () => {
  const state = erpStorage.getState();
  const currentUser = getCurrentUser();
  const isDev = currentUser?.role === 'developer';

  const [batchFilter, setBatchFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [customLogoUrl, setCustomLogoUrl] = useState<string>(() => {
    return localStorage.getItem('taleemos_academy_logo') || '';
  });

  const activeInst = INSTITUTIONS.find((i) => i.id === state.activeInstitutionId) || INSTITUTIONS[0];
  const resolvedAcademyName: string = (isDev
    ? (state.activeInstitutionId === 'all' ? 'All Academies Network' : activeInst?.academyName || activeInst?.name || 'Taleem Academy')
    : (currentUser?.academyName || activeInst?.academyName || activeInst?.name || 'Taleem Academy')) || 'Taleem Academy';
  const resolvedCode = activeInst?.code || 'TAK-01';

  const emblemInitials = resolvedAcademyName.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || 'TA';

  const filteredStudents = state.students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      s.fatherName.toLowerCase().includes(search.toLowerCase());
    const matchBatch = batchFilter === 'All' || s.classBatch === batchFilter;
    return matchSearch && matchBatch;
  });

  const displayedStudents = selectedIds.length > 0
    ? filteredStudents.filter((s) => selectedIds.includes(s.id))
    : filteredStudents;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Permanently remove ${selectedIds.length} selected student ID records from the database?`)) {
      selectedIds.forEach((id) => erpStorage.deleteItem('students', id));
      setSelectedIds([]);
      setNotice('Selected student records removed.');
      setTimeout(() => setNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 rounded-xl">
              <IdCard className="w-5 h-5 text-white" />
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Student ID Cards PRO</h1>
            <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded uppercase">
              A4 8-UP
            </span>
          </div>
          <p className="text-xs text-indigo-200 mt-1">
            Beautiful, printable ID cards for <strong className="text-white">{resolvedAcademyName}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => triggerBrowserPrint()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print {selectedIds.length > 0 ? `Selected (${selectedIds.length})` : 'All Cards'}
          </button>
          <button
            type="button"
            onClick={() => downloadElementAsPdf('id-cards-sheet', `ID_Cards_${resolvedAcademyName.replace(/[^a-zA-Z0-9]/g, '_')}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll number, or father..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none cursor-pointer"
          >
            <option value="All">All Batches</option>
            {state.batches.map((b) => (
              <option key={b.id} value={b.batchName}>{b.batchName}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={toggleSelectAll}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition"
          >
            {selectedIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Select All</span>
          </button>

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 8-Card Printable Grid */}
      <div id="id-cards-sheet" className="p-4 md:p-6 bg-slate-100 rounded-[22px] print:bg-white print:p-0">
        <div className="text-center mb-4 print:hidden flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
          <span>Displaying {displayedStudents.length} cards</span>
          {selectedIds.length > 0 && (
            <button onClick={() => setSelectedIds([])} className="text-indigo-600 hover:underline flex items-center gap-1">
              <X className="w-3.5 h-3.5" />
              <span>Clear Selection</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3 max-w-[800px] mx-auto">
          {displayedStudents.map((s) => {
            const isSelected = selectedIds.includes(s.id);
            return (
              <div
                key={s.id}
                className={`w-full bg-white rounded-2xl shadow-lg border transition-all relative overflow-hidden flex flex-col group print:shadow-none print:border-slate-300 print:page-break-inside-avoid ${
                  isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/50' : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                {/* Checkbox & Edit Buttons (Top Right Overlay) */}
                <div className="absolute top-2 right-2 flex items-center gap-1 z-20 no-print">
                  <button
                    onClick={() => setEditingStudent(s)}
                    className="p-1.5 bg-white/90 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg shadow-sm transition"
                    title="Edit Details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <label className="p-1.5 bg-white/90 rounded-lg shadow-sm cursor-pointer hover:bg-indigo-50 transition flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(s.id)}
                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                    />
                  </label>
                </div>

                {/* New Beautiful Card Header */}
                <div className="bg-gradient-to-r from-indigo-950 to-indigo-800 text-white p-3 pb-6 relative">
                  <div className="flex items-center gap-2">
                    {customLogoUrl ? (
                      <img src={customLogoUrl} alt="Logo" className="w-8 h-8 rounded-md object-contain bg-white p-0.5 shadow-sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-white text-indigo-950 font-black text-xs flex items-center justify-center shadow-sm">
                        {emblemInitials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h5 className="text-[11px] font-black tracking-tight uppercase leading-tight truncate">{resolvedAcademyName}</h5>
                      <span className="text-[9px] font-mono text-indigo-200">Code: {resolvedCode}</span>
                    </div>
                  </div>
                  {/* Subtle watermark text */}
                  <div className="absolute -bottom-2 right-2 text-4xl font-black text-white/5 select-none pointer-events-none">ID</div>
                </div>

                {/* Card Body */}
                <div className="px-3 pb-3 relative flex gap-3 h-[90px]">
                  {/* Floating Photo */}
                  <div className="w-16 h-20 bg-white rounded-lg shadow-md border-2 border-white -mt-5 shrink-0 z-10 overflow-hidden">
                    <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Student Details */}
                  <div className="flex-1 min-w-0 pt-1">
                    <h4 className="font-black text-slate-900 text-sm leading-tight truncate">{s.name}</h4>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">S/O {s.fatherName}</div>
                    <div className="text-[9px] font-bold text-indigo-700 truncate mt-1 bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                      {s.classBatch}
                    </div>
                    <div className="flex items-center justify-between text-[10px] mt-1.5">
                      <span className="text-slate-500">Roll: <strong className="text-slate-900 font-mono">{s.rollNo}</strong></span>
                      <span className="text-rose-600 font-bold">Blood: {s.bloodGroup}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-slate-50 border-t border-slate-200 p-2 flex items-center justify-between mt-auto rounded-b-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white border border-slate-300 rounded flex items-center justify-center shadow-sm">
                      <QrCode className="w-5 h-5 text-slate-800" />
                    </div>
                    <div className="text-[8px] text-slate-500 leading-tight">
                      <div className="font-bold text-slate-800">VALID: JUN 2027</div>
                      <div>Session 2026-27</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 border-b border-slate-400 border-dashed mb-0.5" />
                    <span className="text-[8px] font-bold text-slate-600">Principal Sign</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FULL EDIT STUDENT DETAILS MODAL */}
      {editingStudent && (
        <Modal
          isOpen={Boolean(editingStudent)}
          onClose={() => setEditingStudent(null)}
          title={`Edit ID Card: ${editingStudent.name}`}
          subtitle="Update student details and Cloudinary photo simultaneously."
          badge="STUDENT ASSET"
          maxWidth="max-w-2xl"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              erpStorage.updateItem('students', editingStudent.id, {
                name: formData.get('name') as string,
                fatherName: formData.get('fatherName') as string,
                rollNo: formData.get('rollNo') as string,
                classBatch: formData.get('classBatch') as string,
                bloodGroup: formData.get('bloodGroup') as string,
                photoUrl: editingStudent.photoUrl,
              });
              setEditingStudent(null);
              setNotice(`Updated ID record for ${formData.get('name')}`);
              setTimeout(() => setNotice(null), 3000);
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Student Name *</label>
                <input name="name" required defaultValue={editingStudent.name} className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500 font-bold" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Father Name *</label>
                <input name="fatherName" required defaultValue={editingStudent.fatherName} className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Roll No *</label>
                <input name="rollNo" required defaultValue={editingStudent.rollNo} className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none font-mono" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Class Batch</label>
                <select name="classBatch" defaultValue={editingStudent.classBatch} className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none">
                  {state.batches.map((b) => (
                    <option key={b.id} value={b.batchName}>{b.batchName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase">Blood Group</label>
                <select name="bloodGroup" defaultValue={editingStudent.bloodGroup} className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none font-bold text-rose-600">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <CloudinaryUploader
                label="Student Photo (Cloudinary)"
                description="Upload new portrait to automatically update the ID card."
                value={editingStudent.photoUrl}
                accept="image/*"
                mode="image"
                previewShape="circle"
                folder="taleemos_students"
                onUpload={(url) => {
                  erpStorage.updateItem('students', editingStudent.id, { photoUrl: url });
                  setEditingStudent((prev) => (prev ? { ...prev, photoUrl: url } : null));
                  setNotice('Photo updated via Cloudinary!');
                  setTimeout(() => setNotice(null), 3000);
                }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setEditingStudent(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default IdCardsModule;
