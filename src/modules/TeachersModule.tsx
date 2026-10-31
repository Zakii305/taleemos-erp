import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { GraduationCap, Plus, Printer, Download, Search, Mail, Phone, BookOpen, Layers, Clock, Trash2, CheckSquare, Square, X, Edit2 } from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type Teacher } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
import { CloudinaryUploader } from '../components/common/CloudinaryUploader';

export const TeachersModule: React.FC = () => {
  const state = erpStorage.getState();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<Teacher[] | null>(null);

  // Bulk Edit State
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkDepartment, setBulkDepartment] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('M.Sc Physics');
  const [specialization, setSpecialization] = useState('Physics');
  const [department, setDepartment] = useState('Faculty of Science');
  const [assignedBatch, setAssignedBatch] = useState('Batch 2026-A (Morning)');
  const [photoUrl, setPhotoUrl] = useState('');

  const filtered = state.teachers.filter((t) => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.department.toLowerCase().includes(search.toLowerCase()) || 
    t.specialization.toLowerCase().includes(search.toLowerCase())
  );

  // Selection Logic
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) setSelectedIds([]);
    else setSelectedIds(filtered.map(t => t.id));
  };

  const handleBulkDelete = () => {
    if (confirm(`Permanently remove ${selectedIds.length} selected faculty records?`)) {
      selectedIds.forEach((id) => erpStorage.deleteItem('teachers', id));
      setSelectedIds([]);
    }
  };

  const handleBulkUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkDepartment && !bulkStatus) { setIsBulkEditModalOpen(false); return; }
    selectedIds.forEach((id) => {
      const updates: Partial<Teacher> = {};
      if (bulkDepartment) updates.department = bulkDepartment;
      if (bulkStatus) updates.status = bulkStatus as any;
      erpStorage.updateItem('teachers', id, updates);
    });
    setSelectedIds([]); setIsBulkEditModalOpen(false);
    setBulkDepartment(''); setBulkStatus('');
  };

  // Form Logic (Add / Edit)
  const resetForm = () => {
    setName(''); setEmail(''); setPhone(''); setQualification('M.Sc Physics');
    setSpecialization('Physics'); setDepartment('Faculty of Science');
    setAssignedBatch(state.batches[0]?.batchName || 'Batch 2026-A (Morning)');
    setPhotoUrl(''); setIsEditMode(false); setEditingId(null);
  };

  const handleOpenEdit = (teacher: Teacher, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true); setEditingId(teacher.id);
    setName(teacher.name); setEmail(teacher.email); setPhone(teacher.phone);
    setQualification(teacher.qualification); setSpecialization(teacher.specialization);
    setDepartment(teacher.department);
    setAssignedBatch(teacher.assignedBatches[0] || '');
    setPhotoUrl(teacher.photoUrl);
    setIsFormModalOpen(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditMode && editingId) {
      erpStorage.updateItem('teachers', editingId, {
        name, email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@taleemacademy.edu.pk`,
        phone: phone || '+92 300 0000000', qualification, specialization, department,
        assignedBatches: [assignedBatch], assignedSubjects: [specialization],
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      });
    } else {
      const newTeacher: Teacher = {
        id: `TCH-0${state.teachers.length + 1}`, name,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@taleemacademy.edu.pk`,
        phone: phone || '+92 300 0000000', qualification, specialization, department,
        assignedBatches: [assignedBatch], assignedSubjects: [specialization],
        joiningDate: new Date().toISOString().split('T')[0], status: 'Active',
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      };
      erpStorage.addItem('teachers', newTeacher);
    }
    setIsFormModalOpen(false); resetForm();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this faculty member profile?')) {
      erpStorage.deleteItem('teachers', id);
      if (selectedTeacher?.id === id) setSelectedTeacher(null);
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleTriggerPrint = (recordsToPrint: Teacher[]) => {
    setPrintData(recordsToPrint);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 300);
  };

  const PrintTableContent = ({ data }: { data: Teacher[] }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead>
        <tr className="bg-slate-100 text-slate-800 font-bold">
          <th className="border border-slate-300 p-2">Staff ID</th><th className="border border-slate-300 p-2">Faculty Name</th>
          <th className="border border-slate-300 p-2">Qualification</th><th className="border border-slate-300 p-2">Specialization</th>
          <th className="border border-slate-300 p-2">Department</th><th className="border border-slate-300 p-2">Phone</th>
        </tr>
      </thead>
      <tbody>
        {data.map((t) => (
          <tr key={t.id}>
            <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-700">{t.id}</td>
            <td className="border border-slate-300 p-2 font-bold">{t.name}</td>
            <td className="border border-slate-300 p-2">{t.qualification}</td>
            <td className="border border-slate-300 p-2">{t.specialization}</td>
            <td className="border border-slate-300 p-2">{t.department}</td>
            <td className="border border-slate-300 p-2 font-mono">{t.phone}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-200 print:hidden">
        {/* Header */}
        <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-600 rounded-xl"><GraduationCap className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Faculty & Teacher Zone PRO</h1>
              <span className="px-2 py-0.5 bg-indigo-500 text-white font-black text-[10px] rounded uppercase">FACULTY DOSSIER</span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">Instructor credentials, subject specializations, individual timetable grids, and workload allocations.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIsPrintModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Roster</button>
            <button type="button" onClick={() => { resetForm(); setIsFormModalOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"><Plus className="w-4 h-4" /> Add Faculty</button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search faculty by name, department, or qualification..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleSelectAll} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
                {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All
              </button>
              {selectedIds.length > 0 && (
                <>
                  <button onClick={() => handleTriggerPrint(state.teachers.filter(t => selectedIds.includes(t.id)))} className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"><Printer className="w-4 h-4" /> Print ({selectedIds.length})</button>
                  <button onClick={handleBulkDelete} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"><Trash2 className="w-4 h-4" /> Delete</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="p-3.5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg border border-indigo-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold"><span className="px-2.5 py-1 bg-indigo-500 text-white rounded-lg font-mono">{selectedIds.length}</span><span>Faculty Members Selected</span></div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setIsBulkEditModalOpen(true)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"><Edit2 className="w-3.5 h-3.5" /> Bulk Edit</button>
              <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete Selected</button>
              <button onClick={() => setSelectedIds([])} className="p-1.5 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Faculty Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div key={item.id} onClick={() => setSelectedTeacher(item)} className={`p-5 rounded-[22px] border transition-all cursor-pointer flex flex-col justify-between ${isSelected ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-400/40' : 'bg-white border-slate-200 hover:shadow-lg'}`}>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="p-1 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 shadow-sm" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(item.id, e as any)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                      </label>
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg">{item.department}</span>
                    </div>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">{item.status}</span>
                  </div>
                  <div className="mt-3 flex items-start gap-3">
                    <img src={item.photoUrl} alt={item.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-200 shrink-0" />
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">{item.name}</h3>
                      <p className="text-xs text-slate-500 font-semibold">{item.qualification}</p>
                      <p className="text-[11px] text-indigo-700 font-mono mt-0.5">{item.specialization}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /><span className="truncate">{item.email}</span></div>
                    <div className="flex items-center gap-1.5 font-mono"><Phone className="w-3.5 h-3.5 text-slate-400" /><span>{item.phone}</span></div>
                    <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-indigo-500" /><span className="font-semibold text-slate-800">Batches: {item.assignedBatches.join(', ')}</span></div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[10px] text-indigo-600 font-bold">Tap to view Timetable &rarr;</span>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={(e) => handleOpenEdit(item, e)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={(e) => handleDelete(item.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* ADD / EDIT FACULTY MODAL */}
      <Modal isOpen={isFormModalOpen} onClose={() => { setIsFormModalOpen(false); resetForm(); }} title={isEditMode ? "Edit Faculty Profile" : "Register Faculty Member"} subtitle="Establish teacher credentials and subject assignments" badge={isEditMode ? "EDIT" : "FACULTY PROFILE"}>
        <form onSubmit={handleSaveTeacher} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teacher Full Name *</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Prof. / Dr. Full Name" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Highest Qualification</label><input type="text" value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="M.Phil / Ph.D / M.Sc" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teacher@taleemacademy.edu.pk" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 0000000" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
          </div>
          <CloudinaryUploader label="Faculty Profile Photo (Cloudinary)" description="Direct upload to Cloudinary preset TaleemOS" value={photoUrl} accept="image/*" mode="image" previewShape="circle" folder="taleemos_teachers" onUpload={(url) => setPhotoUrl(url)} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Specialization</label><input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. Modern Physics" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label><input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Faculty of Science" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Batch</label><select value={assignedBatch} onChange={(e) => setAssignedBatch(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white">{state.batches.map((b) => (<option key={b.id} value={b.batchName}>{b.batchName}</option>))}</select></div>
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={() => { setIsFormModalOpen(false); resetForm(); }} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg">{isEditMode ? 'Update Profile' : 'Add Faculty Profile'}</button>
          </div>
        </form>
      </Modal>

      {/* DETAIL MODAL + TIMETABLE */}
      {selectedTeacher && (
        <Modal isOpen={Boolean(selectedTeacher)} onClose={() => setSelectedTeacher(null)} title={`Faculty Dossier: ${selectedTeacher.name}`} subtitle={`${selectedTeacher.qualification} • ${selectedTeacher.department}`} badge={selectedTeacher.status} maxWidth="max-w-4xl">
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              <img src={selectedTeacher.photoUrl} alt={selectedTeacher.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-600 shadow" />
              <div>
                <h4 className="text-base font-black text-slate-900">{selectedTeacher.name}</h4>
                <div className="text-xs text-slate-600">{selectedTeacher.email} &bull; {selectedTeacher.phone}</div>
                <div className="text-xs text-indigo-700 font-bold mt-0.5">Assigned Cohorts: {selectedTeacher.assignedBatches.join(', ')}</div>
              </div>
            </div>
            <div>
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-600" /> Assigned Weekly Teaching Schedule</h5>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold"><tr><th className="p-2.5">Cohort Batch</th><th className="p-2.5">Day</th><th className="p-2.5">Period & Timing</th><th className="p-2.5">Subject</th><th className="p-2.5">Room</th></tr></thead>
                  <tbody>
                    {state.timetables.filter((t) => t.teacher === selectedTeacher.name).length === 0 ? (
                      <tr><td colSpan={5} className="p-4 text-center text-slate-400">No timetable slots assigned yet. Use Timetable GRID module to allocate periods.</td></tr>
                    ) : (
                      state.timetables.filter((t) => t.teacher === selectedTeacher.name).map((slot) => (
                        <tr key={slot.id} className="border-t border-slate-100"><td className="p-2.5 font-bold">{slot.batch}</td><td className="p-2.5 font-semibold text-indigo-700">{slot.day}</td><td className="p-2.5 font-mono">Period {slot.period} ({slot.timing})</td><td className="p-2.5 font-bold text-slate-900">{slot.subject}</td><td className="p-2.5 font-mono">{slot.room}</td></tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => setSelectedTeacher(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200">Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* BULK EDIT MODAL */}
      <Modal isOpen={isBulkEditModalOpen} onClose={() => setIsBulkEditModalOpen(false)} title={`Bulk Edit ${selectedIds.length} Selected Faculty`} subtitle="Update shared attributes simultaneously" maxWidth="max-w-md">
        <form onSubmit={handleBulkUpdate} className="space-y-4 text-xs">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900">You are about to update <strong>{selectedIds.length}</strong> faculty records. Leave a field blank to keep its current value.</div>
          <div><label className="block font-bold text-slate-700 uppercase mb-1">Change Department To:</label><input type="text" value={bulkDepartment} onChange={(e) => setBulkDepartment(e.target.value)} placeholder="e.g. Faculty of Computer Science" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none bg-white font-medium" /></div>
          <div><label className="block font-bold text-slate-700 uppercase mb-1">Change Status To:</label><select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none bg-white font-medium"><option value="">-- No Change --</option><option value="Active">Active</option><option value="On Leave">On Leave</option><option value="Resigned">Resigned</option></select></div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsBulkEditModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg">Apply Bulk Update</button>
          </div>
        </form>
      </Modal>
      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div><h3 className="font-bold text-base text-slate-900">Print Faculty Roster</h3><p className="text-[11px] text-slate-500">Export faculty records to A4.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => handleTriggerPrint(filtered)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print Filtered</button>
                <button type="button" onClick={() => handleTriggerPrint(state.teachers)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print All</button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div className="bg-white shadow-md mx-auto pointer-events-none">
                <div className="p-8">
                  <LetterheadPrint title="INSTITUTIONAL TEACHING FACULTY & DEANS ROSTER" documentNo="FACULTY-ROSTER-2026" summaryStats={[{ label: 'Total Faculty', value: filtered.length }, { label: 'Active Teachers', value: filtered.filter((t) => t.status === 'Active').length }]}>
                    <PrintTableContent data={filtered} />
                  </LetterheadPrint>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECRET PRINT PORTAL - ONLY RENDERED WHEN PRINTING */}
      {/* ======================================================== */}
      {printData && createPortal(
        <div id="print-mount" className="hidden print:block w-full bg-white text-slate-900">
          <div className="print-page">
            <LetterheadPrint title="INSTITUTIONAL TEACHING FACULTY & DEANS ROSTER" documentNo="FACULTY-ROSTER-2026" summaryStats={[{ label: 'Total Records', value: printData.length }]}>
              <PrintTableContent data={printData} />
            </LetterheadPrint>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default TeachersModule;
