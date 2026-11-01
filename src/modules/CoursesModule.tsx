import { getCurrentUser } from '../components/auth/AuthSystem';
import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Printer,
  Download,
  Search,
  Layers,
  Clock,
  DollarSign,
  Trash2,
  Edit2,
  CheckSquare,
  Square,
  X,
  CheckCircle2,
} from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type Course } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
import { triggerBrowserPrint, downloadElementAsPdf } from '../lib/pdf';

export const CoursesModule: React.FC = () => {
  const state = erpStorage.getState();
  const currentUser = getCurrentUser();
  const isParent = currentUser?.role === 'parent';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  
  
  
  

  
  
  
  
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [duration, setDuration] = useState('2 Years');
  const [fee, setFee] = useState(5000);
  const [department, setDepartment] = useState('Science & Engineering');
  const [instructor, setInstructor] = useState('Prof. Ghulam Rasool');
  const [subjectsStr, setSubjectsStr] = useState('Physics, Chemistry, Mathematics');

  const filtered = state.courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => c.id));
    }
  };

  const handleOpenEdit = (c: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true);
    setEditingCourseId(c.id);
    setName(c.name);
    setCode(c.code);
    setDuration(c.duration);
    setFee(c.fee);
    setDepartment(c.department);
    setInstructor(c.instructor);
    setSubjectsStr(c.subjects.join(', '));
    setIsAddModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    if (isEditMode && editingCourseId) {
      erpStorage.updateItem('courses', editingCourseId, {
        name,
        code,
        duration,
        fee: Number(fee),
        subjects: subjectsStr.split(',').map((s) => s.trim()).filter(Boolean),
        department,
        instructor,
      });
      setActionNotice(`Updated course curriculum: ${name}`);
    } else {
      const newCourse: Course = {
        id: `CRS-0${state.courses.length + 1}`,
        name,
        code,
        duration,
        fee: Number(fee),
        subjects: subjectsStr.split(',').map((s) => s.trim()).filter(Boolean),
        department,
        status: 'Active',
        instructor,
      };
      erpStorage.addItem('courses', newCourse);
      setActionNotice(`Created new course program: ${name}`);
    }

    setIsAddModalOpen(false);
    setIsEditMode(false);
    setEditingCourseId(null);
    resetForm();
    setTimeout(() => setActionNotice(null), 3500);
  };

  const resetForm = () => {
    setName('');
    setCode('');
    setFee(5000);
    setSubjectsStr('');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this academic course program?')) {
      erpStorage.deleteItem('courses', id);
      if (selectedCourse?.id === id) setSelectedCourse(null);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      setActionNotice('Course removed.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} selected courses?`)) {
      selectedIds.forEach((id) => erpStorage.deleteItem('courses', id));
      setSelectedIds([]);
      setActionNotice('Selected courses deleted.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
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
              <BookOpen className="w-5 h-5 text-white" />
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Academic Courses & Syllabi</h1>
            <span className="px-2 py-0.5 bg-indigo-500 text-white font-black text-[10px] rounded uppercase">
              CURRICULUM
            </span>
          </div>
          <p className="text-xs text-indigo-200 mt-1">
            Institutional diplomas, intermediate streams, modular IT certifications, and fee definitions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            onClick={() => {
              setIsEditMode(false);
              setEditingCourseId(null);
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </button>
        </div>
      </div>

      {/* Search & Checkbox Select Bar */}
      <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses by title, department, or course code..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none"
          />
        </div>

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

      {/* Floating Toolbar when selected */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg border border-indigo-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 bg-indigo-500 text-white rounded-lg font-mono">
              {selectedIds.length}
            </span>
            <span>Courses Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPrintAllOpen(true)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Selected</span>
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
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Courses Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => setSelectedCourse(item)}
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
                        toggleSelect(item.id);
                      }}
                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                    />
                    <span className="px-2.5 py-0.5 font-mono text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg">
                      {item.code}
                    </span>
                  </div>
                  <span className="px-2 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase">
                    {item.status}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-extrabold text-slate-900">{item.name}</h3>
                <p className="text-xs text-slate-500">{item.department}</p>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400 font-sans">Duration:</span>
                    <span className="font-bold text-slate-800">{item.duration}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400 font-sans">Monthly Fee:</span>
                    <span className="font-black text-emerald-700">PKR {item.fee.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400 font-sans">Lead Faculty:</span>
                    <span className="font-bold text-indigo-900">{item.instructor}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Subjects Included:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {item.subjects.map((sub, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-mono">ID: {item.id}</span>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(item, e)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                    title="Edit / Modify Course"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                    title="Delete Course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT COURSE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditMode(false);
          setEditingCourseId(null);
        }}
        title={isEditMode ? 'Edit / Modify Course Curriculum' : 'Add New Academic Course Program'}
        subtitle="Define subjects, curriculum length, and tuition charges"
        badge={isEditMode ? 'MODIFY' : 'COURSE DEFINITION'}
      >
        <form onSubmit={handleSaveCourse} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Course Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. F.Sc General Science"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Course Code *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. FSC-GEN"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="2 Years or 6 Months"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monthly Fee (PKR)</label>
              <input
                type="number"
                min={0}
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Department name"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Subjects (Comma separated)
            </label>
            <input
              type="text"
              value={subjectsStr}
              onChange={(e) => setSubjectsStr(e.target.value)}
              placeholder="Physics, Chemistry, Mathematics, English"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Lead Instructor / Dean
            </label>
            <input
              type="text"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              placeholder="Professor name"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditMode(false);
                setEditingCourseId(null);
              }}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isEditMode ? 'Update Course' : 'Save Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINT ALL MODAL */}
      {isPrintAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 no-print overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">Academic Courses & Syllabi (A4)</h3>
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
                  onClick={() => downloadElementAsPdf('courses-print-table', 'TaleemOS_Courses_Catalog')}
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

            <div id="courses-print-table">
              <LetterheadPrint
                title="Institutional Academic Programs Catalog"
                documentNo="CRS-CATALOG-2026"
                summaryStats={[
                  { label: 'Total Programs', value: state.courses.length },
                  { label: 'Active Streams', value: state.courses.filter((c) => c.status === 'Active').length },
                ]}
              >
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold">
                      <th className="border border-slate-300 p-2">Code</th>
                      <th className="border border-slate-300 p-2">Course Name</th>
                      <th className="border border-slate-300 p-2">Department</th>
                      <th className="border border-slate-300 p-2">Duration</th>
                      <th className="border border-slate-300 p-2">Monthly Fee</th>
                      <th className="border border-slate-300 p-2">Lead Instructor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedIds.length > 0 ? filtered.filter((c) => selectedIds.includes(c.id)) : filtered).map((c) => (
                      <tr key={c.id}>
                        <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-700">{c.code}</td>
                        <td className="border border-slate-300 p-2 font-bold">{c.name}</td>
                        <td className="border border-slate-300 p-2">{c.department}</td>
                        <td className="border border-slate-300 p-2">{c.duration}</td>
                        <td className="border border-slate-300 p-2 font-mono font-bold">PKR {c.fee.toLocaleString()}</td>
                        <td className="border border-slate-300 p-2">{c.instructor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </LetterheadPrint>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesModule;
