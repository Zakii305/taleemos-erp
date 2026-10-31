import React, { useState } from 'react';
import {
  Award,
  Plus,
  Printer,
  Download,
  Search,
  Calendar,
  CheckCircle,
  FileText,
  Trash2,
  Edit2,
  CheckSquare,
  Square,
  X,
  CheckCircle2,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type Exam } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
import { triggerBrowserPrint, downloadElementAsPdf } from '../lib/pdf';
import { FloatingPdfButton } from '../components/common/FloatingPdfButton';

export const ExamsModule: React.FC = () => {
  const state = erpStorage.getState();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [isBulkPrintAllBatchesOpen, setIsBulkPrintAllBatchesOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const distinctBatches = Array.from(
    new Set([
      ...state.batches.map((b) => b.batchName),
      ...state.exams.map((e) => e.classBatch),
    ])
  );

  // Form fields
  const [examType, setExamType] = useState<Exam['examType']>('Monthly');
  const [classBatch, setClassBatch] = useState('Batch 2026-A (Morning)');
  const [subject, setSubject] = useState('Mathematics (Calculus)');
  const [maxMarks, setMaxMarks] = useState(100);
  const [passMarks, setPassMarks] = useState(40);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [room, setRoom] = useState('Room 101');
  const [supervisor, setSupervisor] = useState('Sir Saeed Ahmed');
  const [status, setStatus] = useState<Exam['status']>('Scheduled');

  const filtered = state.exams.filter((ex) => {
    const matchSearch =
      ex.subject.toLowerCase().includes(search.toLowerCase()) ||
      ex.classBatch.toLowerCase().includes(search.toLowerCase()) ||
      ex.supervisor.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || ex.examType === typeFilter;
    return matchSearch && matchType;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((e) => e.id));
    }
  };

  const handleOpenEdit = (ex: Exam, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true);
    setEditingExamId(ex.id);
    setExamType(ex.examType);
    setClassBatch(ex.classBatch);
    setSubject(ex.subject);
    setMaxMarks(ex.maxMarks);
    setPassMarks(ex.passMarks);
    setDate(ex.date);
    setRoom(ex.room);
    setSupervisor(ex.supervisor);
    setStatus(ex.status);
    setIsAddModalOpen(true);
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    if (isEditMode && editingExamId) {
      erpStorage.updateItem('exams', editingExamId, {
        examType,
        classBatch,
        subject,
        maxMarks: Number(maxMarks),
        passMarks: Number(passMarks),
        date,
        room,
        supervisor,
        status,
      });
      setActionNotice(`Updated examination: ${subject}`);
    } else {
      const newExam: Exam = {
        id: `EXM-${Date.now().toString().slice(-4)}`,
        examType,
        classBatch,
        subject,
        maxMarks: Number(maxMarks),
        passMarks: Number(passMarks),
        date,
        room,
        supervisor,
        status,
      };
      erpStorage.addItem('exams', newExam);
      setActionNotice(`Scheduled new examination: ${subject}`);
    }

    setIsAddModalOpen(false);
    setIsEditMode(false);
    setEditingExamId(null);
    resetForm();
    setTimeout(() => setActionNotice(null), 3500);
  };

  const resetForm = () => {
    setSubject('');
    setMaxMarks(100);
    setPassMarks(40);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this examination schedule?')) {
      erpStorage.deleteItem('exams', id);
      if (selectedExam?.id === id) setSelectedExam(null);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      setActionNotice('Examination schedule deleted.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} selected exams?`)) {
      selectedIds.forEach((id) => erpStorage.deleteItem('exams', id));
      setSelectedIds([]);
      setActionNotice('Selected exams deleted.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 relative">
      {/* Floating Download as PDF Button */}
      <FloatingPdfButton
        label="Download Date Sheets PDF"
        onPrint={() => setIsBulkPrintAllBatchesOpen(true)}
      />

      {/* Toast */}
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
              <Award className="w-5 h-5 text-white" />
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Examinations & Assessments</h1>
            <span className="px-2 py-0.5 bg-indigo-500 text-white font-black text-[10px] rounded uppercase">
              EVALUATIONS
            </span>
          </div>
          <p className="text-xs text-indigo-200 mt-1">
            Date sheets, pass marks thresholds, seating rooms, and invigilation schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBulkPrintAllBatchesOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl border border-indigo-400/40 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            Bulk Print All Date Sheets
          </button>
          <button
            type="button"
            onClick={() => setIsPrintAllOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Schedule
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditMode(false);
              setEditingExamId(null);
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Schedule Exam
          </button>
        </div>
      </div>

      {/* Search & Checkbox Select Bar */}
      <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exams by subject paper, cohort, or invigilator..."
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

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Exam Type:
          </span>
          {['All', 'Monthly', 'Term', 'Final', 'Surprise Test'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                typeFilter === t
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Toolbar when selected */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg border border-indigo-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 bg-indigo-500 text-white rounded-lg font-mono">
              {selectedIds.length}
            </span>
            <span>Exams Selected</span>
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

      {/* Results Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => setSelectedExam(item)}
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
                    <span className="px-2.5 py-0.5 font-bold text-xs bg-indigo-50 text-indigo-700 rounded-lg">
                      {item.examType}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase ${
                      item.status === 'Published'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'Marks Submitted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-extrabold text-slate-900">{item.subject}</h3>
                <p className="text-xs text-slate-500">{item.classBatch}</p>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Max Marks</span>
                    <span className="font-bold text-slate-800">{item.maxMarks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">Pass Marks</span>
                    <span className="font-bold text-rose-600">{item.passMarks}</span>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <div>Exam Date: <strong className="text-slate-800 font-mono">{item.date}</strong></div>
                  <div>Hall / Room: <span className="text-slate-700">{item.room}</span></div>
                  <div>Invigilator: <span className="text-slate-700">{item.supervisor}</span></div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[10px]">ID: {item.id}</span>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(item, e)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                    title="Edit / Modify Exam"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                    title="Delete Exam"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SCHEDULE / EDIT EXAM MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditMode(false);
          setEditingExamId(null);
        }}
        title={isEditMode ? 'Edit / Modify Examination' : 'Schedule New Examination'}
        subtitle="Establish evaluation date and invigilator assignment"
        badge={isEditMode ? 'MODIFY' : 'EXAM SETUP'}
      >
        <form onSubmit={handleCreateExam} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Exam Type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as Exam['examType'])}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"
              >
                <option value="Monthly">Monthly Test</option>
                <option value="Term">Term Examination</option>
                <option value="Final">Annual Final Examination</option>
                <option value="Surprise Test">Surprise Test</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Candidate Batch *
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
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Subject Paper Title *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Physics (Thermodynamics & Optics)"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Max Marks</label>
              <input
                type="number"
                min={1}
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pass Marks</label>
              <input
                type="number"
                min={1}
                value={passMarks}
                onChange={(e) => setPassMarks(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Examination Room</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Room 101"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Supervisor</label>
              <input
                type="text"
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                placeholder="Faculty Supervisor"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditMode(false);
                setEditingExamId(null);
              }}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isEditMode ? 'Update Exam' : 'Publish Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINT ALL MODAL (Print + PDF Download) */}
      {isPrintAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 no-print overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">Official Date Sheet & Assessment Roster</h3>
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
                  onClick={() => downloadElementAsPdf('exams-print-table', 'TaleemOS_Exam_DateSheet')}
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

            <div id="exams-print-table">
              <LetterheadPrint
                title="OFFICIAL INSTITUTIONAL EXAMINATION DATE SHEET"
                documentNo="EXM-DATESHEET-2026"
                summaryStats={[
                  { label: 'Scheduled Papers', value: state.exams.length },
                  { label: 'Session', value: '2026-2027' },
                ]}
              >
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold">
                      <th className="border border-slate-300 p-2">Date</th>
                      <th className="border border-slate-300 p-2">Exam Type</th>
                      <th className="border border-slate-300 p-2">Batch</th>
                      <th className="border border-slate-300 p-2">Subject Paper</th>
                      <th className="border border-slate-300 p-2">Max / Pass</th>
                      <th className="border border-slate-300 p-2">Hall</th>
                      <th className="border border-slate-300 p-2">Invigilator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedIds.length > 0 ? filtered.filter((e) => selectedIds.includes(e.id)) : filtered).map((e) => (
                      <tr key={e.id}>
                        <td className="border border-slate-300 p-2 font-mono font-bold">{e.date}</td>
                        <td className="border border-slate-300 p-2">{e.examType}</td>
                        <td className="border border-slate-300 p-2">{e.classBatch}</td>
                        <td className="border border-slate-300 p-2 font-bold">{e.subject}</td>
                        <td className="border border-slate-300 p-2 font-mono">
                          {e.maxMarks} / {e.passMarks}
                        </td>
                        <td className="border border-slate-300 p-2">{e.room}</td>
                        <td className="border border-slate-300 p-2">{e.supervisor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </LetterheadPrint>
            </div>
          </div>
        </div>
      )}

      {/* BULK PRINT CONSOLIDATED DATE SHEETS (ALL BATCHES SIMULTANEOUSLY) */}
      {isBulkPrintAllBatchesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 no-print overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-6 gap-3 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span>Consolidated Date Sheets &bull; All Batches</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Concatenated printer-ready date sheet dossier for all academic cohorts simultaneously.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerBrowserPrint()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print All Batches (A4)
                </button>
                <button
                  type="button"
                  onClick={() => downloadElementAsPdf('bulk-exams-print-document', 'TaleemOS_All_Batches_DateSheets')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Concatenated PDF
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkPrintAllBatchesOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Consolidated Document Printable Area */}
            <div id="bulk-exams-print-document" className="space-y-8 bg-white p-2">
              <LetterheadPrint
                title="CONSOLIDATED INSTITUTIONAL DATE SHEET DOSSIER"
                documentNo="EXM-BULK-ALL-2026"
                summaryStats={[
                  { label: 'Total Batches', value: distinctBatches.length },
                  { label: 'Total Exam Papers', value: state.exams.length },
                  { label: 'Session', value: '2026 - 2027' },
                ]}
              >
                <div className="space-y-10">
                  {distinctBatches.map((batchName, idx) => {
                    const batchExams = state.exams.filter((ex) => ex.classBatch === batchName);
                    return (
                      <div
                        key={batchName}
                        className={`space-y-4 ${
                          idx < distinctBatches.length - 1 ? 'pb-8 border-b-2 border-dashed border-slate-200' : ''
                        }`}
                        style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                      >
                        {/* Batch Header Bar */}
                        <div className="bg-slate-900 text-white p-3 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs px-2 py-0.5 bg-indigo-500 rounded font-bold">
                              BATCH {idx + 1}
                            </span>
                            <span className="font-extrabold text-sm tracking-wide">{batchName}</span>
                          </div>
                          <span className="text-xs text-indigo-200 font-medium">
                            {batchExams.length} Scheduled Paper{batchExams.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        {/* Batch Examination Table */}
                        {batchExams.length === 0 ? (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500 italic">
                            Regular classroom assessment timetable in progress for this cohort.
                          </div>
                        ) : (
                          <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-slate-800 font-bold">
                                <th className="border border-slate-300 p-2 text-center w-12">#</th>
                                <th className="border border-slate-300 p-2 w-28">Date</th>
                                <th className="border border-slate-300 p-2">Subject Paper</th>
                                <th className="border border-slate-300 p-2 text-center w-24">Assessment</th>
                                <th className="border border-slate-300 p-2 text-center w-24">Max / Pass</th>
                                <th className="border border-slate-300 p-2 w-24">Hall / Room</th>
                                <th className="border border-slate-300 p-2">Chief Invigilator</th>
                              </tr>
                            </thead>
                            <tbody>
                              {batchExams.map((ex, exIdx) => (
                                <tr key={ex.id} className="hover:bg-slate-50">
                                  <td className="border border-slate-300 p-2 text-center font-mono font-bold text-slate-600">
                                    {exIdx + 1}
                                  </td>
                                  <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-900">
                                    {ex.date}
                                  </td>
                                  <td className="border border-slate-300 p-2 font-extrabold text-slate-900">
                                    {ex.subject}
                                  </td>
                                  <td className="border border-slate-300 p-2 text-center">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                                      {ex.examType}
                                    </span>
                                  </td>
                                  <td className="border border-slate-300 p-2 text-center font-mono font-bold">
                                    {ex.maxMarks} / {ex.passMarks}
                                  </td>
                                  <td className="border border-slate-300 p-2 font-medium">{ex.room}</td>
                                  <td className="border border-slate-300 p-2 font-medium">{ex.supervisor}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        {/* Batch Instructions & Candidate Code of Conduct */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Candidate Instructions for {batchName}:</span>
                          </div>
                          <p>
                            1. Candidates must arrive at the allocated examination room at least 15 minutes before the paper starts with their student photo ID card.
                          </p>
                          <p>
                            2. Mobile phones, programmable smartwatches, and unauthorized notes are strictly prohibited inside the hall.
                          </p>
                        </div>

                        {/* Signature Block per batch */}
                        <div className="pt-3 flex justify-between items-end text-xs text-slate-600 font-medium">
                          <div>
                            <div className="w-40 border-b border-slate-400 mb-1" />
                            <span>Head of Department</span>
                          </div>
                          <div className="text-right">
                            <div className="w-44 border-b border-slate-400 mb-1 ml-auto" />
                            <span>Controller of Examinations</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </LetterheadPrint>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamsModule;
