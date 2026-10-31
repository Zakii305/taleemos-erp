import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Printer,
  Download,
  Filter,
  Calendar,
  BookOpen,
  User,
  DoorOpen,
  Trash2,
  Edit2,
  Users,
  GraduationCap,
} from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type TimetableSlot } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
import { triggerBrowserPrint, downloadElementAsPdf } from '../lib/pdf';

export const TimetableModule: React.FC = () => {
  const state = erpStorage.getState();

  // Mode: 'class' (each class timetable) | 'teacher' (every teacher's timetable)
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');

  const [selectedBatch, setSelectedBatch] = useState(
    state.batches[0]?.batchName || 'Batch 2026-A (Morning)'
  );
  const [selectedTeacher, setSelectedTeacher] = useState(
    state.teachers[0]?.name || 'Sir Saeed Ahmed (Physics)'
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  // Form fields
  const [slotDay, setSlotDay] = useState<TimetableSlot['day']>('Monday');
  const [slotPeriod, setSlotPeriod] = useState<number>(1);
  const [slotTiming, setSlotTiming] = useState('08:00 - 08:50');
  const [slotSubject, setSlotSubject] = useState('Physics');
  const [slotTeacher, setSlotTeacher] = useState('Sir Saeed Ahmed (Physics)');
  const [slotRoom, setSlotRoom] = useState('Room 101');
  const [formBatch, setFormBatch] = useState(selectedBatch);

  const days: TimetableSlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [1, 2, 3, 4, 5, 6];

  const periodTimings: Record<number, string> = {
    1: '08:00 - 08:50',
    2: '08:50 - 09:40',
    3: '09:40 - 10:30',
    4: '10:50 - 11:40',
    5: '11:40 - 12:30',
    6: '12:30 - 01:15',
  };

  // Unique list of teachers from both state.teachers and timetable entries
  const allTeacherNames = Array.from(
    new Set([
      ...state.teachers.map((t) => t.name),
      ...state.timetables.map((t) => t.teacher),
      'Sir Saeed Ahmed (Physics)',
      'Dr. Naila Jatoi (Biology)',
      'Engr. Waqas Chachar (CS)',
      'Sir Danish Ali (MERN Stack)',
    ])
  ).filter(Boolean);

  const handlePeriodChange = (p: number) => {
    setSlotPeriod(p);
    setSlotTiming(periodTimings[p] || '08:00 - 08:50');
  };

  const openCreateForSlot = (day: TimetableSlot['day'], p: number, defaultTeacher?: string, defaultBatch?: string) => {
    setEditingSlotId(null);
    setSlotDay(day);
    handlePeriodChange(p);
    setFormBatch(defaultBatch || selectedBatch);
    setSlotTeacher(defaultTeacher || (viewMode === 'teacher' ? selectedTeacher : allTeacherNames[0] || 'Sir Saeed Ahmed'));
    setSlotSubject('Physics');
    setSlotRoom('Room 101');
    setIsAddModalOpen(true);
  };

  const openEditSlot = (slot: TimetableSlot, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSlotId(slot.id);
    setSlotDay(slot.day);
    setSlotPeriod(slot.period);
    setSlotTiming(slot.timing);
    setSlotSubject(slot.subject);
    setSlotTeacher(slot.teacher);
    setSlotRoom(slot.room);
    setFormBatch(slot.batch);
    setIsAddModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotSubject.trim()) return;

    if (editingSlotId) {
      erpStorage.updateItem('timetables', editingSlotId, {
        batch: formBatch,
        day: slotDay,
        period: Number(slotPeriod),
        timing: slotTiming,
        subject: slotSubject,
        teacher: slotTeacher,
        room: slotRoom,
      });
    } else {
      // Check if slot already exists for batch + day + period
      const existing = state.timetables.find(
        (t) => t.batch === formBatch && t.day === slotDay && t.period === Number(slotPeriod)
      );

      if (existing) {
        erpStorage.updateItem('timetables', existing.id, {
          subject: slotSubject,
          teacher: slotTeacher,
          room: slotRoom,
          timing: slotTiming,
        });
      } else {
        const newSlot: TimetableSlot = {
          id: `TT-${Date.now().toString().slice(-4)}`,
          batch: formBatch,
          day: slotDay,
          period: Number(slotPeriod),
          timing: slotTiming,
          subject: slotSubject,
          teacher: slotTeacher,
          room: slotRoom,
        };
        erpStorage.addItem('timetables', newSlot);
      }
    }

    setIsAddModalOpen(false);
    setEditingSlotId(null);
  };

  const handleDeleteSlot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this period from timetable?')) {
      erpStorage.deleteItem('timetables', id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 rounded-xl">
              <Clock className="w-5 h-5 text-white" />
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Academic Timetable Matrix (GRID)</h1>
            <span className="px-2 py-0.5 bg-indigo-500 text-white font-black text-[10px] rounded uppercase">
              CLASS & TEACHER TIMETABLES
            </span>
          </div>
          <p className="text-xs text-indigo-200 mt-1">
            Switch between each class timetable and every individual teacher's timetable with full A4 print & PDF export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPrintAllOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Timetable (A4)
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingSlotId(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Assign Period
          </button>
        </div>
      </div>

      {/* View Mode Switcher: Class Timetable vs Teacher Timetable */}
      <div className="bg-white rounded-2xl border p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold w-fit">
          <button
            type="button"
            onClick={() => setViewMode('class')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-2 ${
              viewMode === 'class' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>🏫 Class / Batch Timetable</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('teacher')}
            className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-2 ${
              viewMode === 'teacher' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>👨‍🏫 Teacher / Faculty Timetable</span>
          </button>
        </div>

        {/* Dynamic Selector based on View Mode */}
        {viewMode === 'class' ? (
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-500 uppercase">Select Class Cohort:</span>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 outline-none"
            >
              {state.batches.map((b) => (
                <option key={b.id} value={b.batchName}>
                  {b.batchName} ({b.course})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-500 uppercase">Select Faculty Member:</span>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 outline-none"
            >
              {allTeacherNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TIMETABLE GRID VIEW (Mon-Sat, 6 periods) */}
      <div className="p-4 md:p-6 bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-x-auto touch-scroll">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              {viewMode === 'class'
                ? `Showing Schedule for: ${selectedBatch}`
                : `Showing Personal Timetable for: ${selectedTeacher}`}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">6 Daily Periods • 45-50 Min Lectures</span>
        </div>

        <table className="w-full min-w-[700px] border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <th className="p-3 text-left w-24">Day</th>
              {periods.map((p) => (
                <th key={p} className="p-3 text-center border-l border-slate-200">
                  <div>Period {p}</div>
                  <div className="text-[10px] text-slate-400 font-mono font-normal">
                    {periodTimings[p]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="p-3 font-bold text-slate-900 bg-slate-50/30 whitespace-nowrap">{day}</td>
                {periods.map((p) => {
                  // Find slot based on active view mode
                  const slot =
                    viewMode === 'class'
                      ? state.timetables.find((t) => t.batch === selectedBatch && t.day === day && t.period === p)
                      : state.timetables.find(
                          (t) =>
                            (t.teacher === selectedTeacher || t.teacher.includes(selectedTeacher) || selectedTeacher.includes(t.teacher)) &&
                            t.day === day &&
                            t.period === p
                        );

                  return (
                    <td key={p} className="p-2 border-l border-slate-100 text-center align-top h-28 w-36">
                      {slot ? (
                        <div className="h-full p-2.5 bg-gradient-to-br from-indigo-50/90 to-purple-50/60 border border-indigo-200 rounded-xl flex flex-col justify-between group hover:shadow-md transition-shadow relative">
                          <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => openEditSlot(slot, e)}
                              className="p-1 text-slate-500 hover:text-indigo-600 rounded bg-white/80 shadow-xs"
                              title="Edit Slot"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSlot(slot.id, e)}
                              className="p-1 text-slate-500 hover:text-rose-600 rounded bg-white/80 shadow-xs"
                              title="Delete Slot"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div>
                            <div className="font-extrabold text-indigo-900 leading-tight">
                              {slot.subject}
                            </div>
                            <div className="text-[10px] text-slate-600 font-semibold mt-0.5 truncate">
                              {viewMode === 'class' ? slot.teacher : slot.batch}
                            </div>
                          </div>

                          <div className="text-[9px] font-mono text-indigo-700 bg-indigo-100/70 rounded px-1.5 py-0.5 mt-1 flex items-center justify-between">
                            <span>{slot.room}</span>
                            <span className="text-[8px] text-slate-500">{slot.timing.split('-')[0]}</span>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() =>
                            openCreateForSlot(
                              day,
                              p,
                              viewMode === 'teacher' ? selectedTeacher : undefined,
                              viewMode === 'class' ? selectedBatch : undefined
                            )
                          }
                          className="h-full border border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-xl flex flex-col items-center justify-center text-slate-300 hover:text-indigo-600 cursor-pointer transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-[9px] font-bold mt-0.5">
                            {viewMode === 'teacher' ? 'Free Slot' : 'Assign'}
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ASSIGN / EDIT PERIOD MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSlotId(null);
        }}
        title={editingSlotId ? 'Edit Timetable Slot' : 'Assign Timetable Slot'}
        subtitle={viewMode === 'class' ? `Cohort: ${formBatch}` : `Teacher: ${slotTeacher}`}
        badge="TIMETABLE MATRIX"
      >
        <form onSubmit={handleSaveSlot} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Class / Batch Cohort *
              </label>
              <select
                value={formBatch}
                onChange={(e) => setFormBatch(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-bold"
              >
                {state.batches.map((b) => (
                  <option key={b.id} value={b.batchName}>
                    {b.batchName} ({b.course})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Assigned Faculty / Teacher *
              </label>
              <select
                value={slotTeacher}
                onChange={(e) => setSlotTeacher(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-bold"
              >
                {allTeacherNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Day of Week</label>
              <select
                value={slotDay}
                onChange={(e) => setSlotDay(e.target.value as TimetableSlot['day'])}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Period (1 to 6)</label>
              <select
                value={slotPeriod}
                onChange={(e) => handlePeriodChange(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-mono font-bold"
              >
                {periods.map((p) => (
                  <option key={p} value={p}>
                    Period {p} ({periodTimings[p]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Classroom / Lab</label>
              <input
                type="text"
                value={slotRoom}
                onChange={(e) => setSlotRoom(e.target.value)}
                placeholder="Room 101 or Lab 02"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              required
              value={slotSubject}
              onChange={(e) => setSlotSubject(e.target.value)}
              placeholder="e.g. Physics, Chemistry, Calculus"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 font-bold"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingSlotId(null);
              }}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {editingSlotId ? 'Update Slot' : 'Save Slot'}
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINT TIMETABLE MODAL (Print A4 + Download PDF) */}
      {isPrintAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 no-print overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {viewMode === 'class'
                  ? `Official Class Timetable: ${selectedBatch}`
                  : `Official Faculty Schedule: ${selectedTeacher}`}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerBrowserPrint()}
                  className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print A4
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadElementAsPdf(
                      'timetable-print-sheet',
                      viewMode === 'class'
                        ? `Class_Timetable_${selectedBatch.replace(/[^a-zA-Z0-9]/g, '_')}`
                        : `Teacher_Timetable_${selectedTeacher.replace(/[^a-zA-Z0-9]/g, '_')}`
                    )
                  }
                  className="px-3.5 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
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

            <div id="timetable-print-sheet">
              <LetterheadPrint
                title={
                  viewMode === 'class'
                    ? `OFFICIAL CLASS TIMETABLE: ${selectedBatch}`
                    : `FACULTY WORKLOAD & TIMETABLE: ${selectedTeacher}`
                }
                documentNo={`TT-${viewMode === 'class' ? 'CLS' : 'TCH'}-2026`}
                summaryStats={[
                  {
                    label: viewMode === 'class' ? 'Class Cohort' : 'Faculty Member',
                    value: viewMode === 'class' ? selectedBatch : selectedTeacher,
                  },
                  { label: 'Periods Per Day', value: 6 },
                  { label: 'Weekly Days', value: 'Mon - Sat' },
                  { label: 'Break Time', value: '10:30 - 10:50 AM' },
                ]}
              >
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold">
                      <th className="border border-slate-300 p-2">Day</th>
                      {periods.map((p) => (
                        <th key={p} className="border border-slate-300 p-2 text-center">
                          Period {p} ({periodTimings[p]})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day) => (
                      <tr key={day}>
                        <td className="border border-slate-300 p-2 font-bold bg-slate-50">{day}</td>
                        {periods.map((p) => {
                          const slot =
                            viewMode === 'class'
                              ? state.timetables.find(
                                  (t) => t.batch === selectedBatch && t.day === day && t.period === p
                                )
                              : state.timetables.find(
                                  (t) =>
                                    (t.teacher === selectedTeacher ||
                                      t.teacher.includes(selectedTeacher) ||
                                      selectedTeacher.includes(t.teacher)) &&
                                    t.day === day &&
                                    t.period === p
                                );

                          return (
                            <td key={p} className="border border-slate-300 p-2 text-center">
                              {slot ? (
                                <div>
                                  <div className="font-bold text-slate-900">{slot.subject}</div>
                                  <div className="text-[10px] text-slate-600">
                                    {viewMode === 'class' ? slot.teacher : slot.batch}
                                  </div>
                                  <div className="text-[9px] font-mono text-indigo-700">{slot.room}</div>
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        })}
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

export default TimetableModule;
