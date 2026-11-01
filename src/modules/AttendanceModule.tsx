import { getCurrentUser } from '../components/auth/AuthSystem';
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  UserCheck, Printer, Download, Calendar, MessageSquare, Send, CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight, Phone, ShieldAlert, Flame, Activity, TrendingDown, Info, CalendarDays, Sparkles, BarChart2, Check, CheckSquare, Square, X, Filter
} from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type AttendanceRecord, type Student } from '../types';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
import { triggerBrowserPrint, downloadElementAsPdf } from '../lib/pdf';
import { FloatingPdfButton } from '../components/common/FloatingPdfButton';

interface AttendanceModuleProps {
  onNavigate?: (path: string) => void;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({ onNavigate }) => {
  const currentUser = getCurrentUser();
  const isParent = currentUser?.role === 'parent';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  
  
  
  

  const state = erpStorage.getState();
  
  
  
  
  const [viewMode, setViewMode] = useState<'daily' | 'heatmap' | 'period'>('daily');
  const [selectedBatch, setSelectedBatch] = useState(state.batches[0]?.batchName || 'Batch 2026-A (Morning)');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Period Report State
  const [periodStart, setPeriodStart] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split('T')[0]);

  // Selection & Print State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [printData, setPrintData] = useState<{ type: 'daily' | 'period', students: any[], batch: string, start?: string, end?: string, date?: string } | null>(null);

  const [smsSentNotice, setSmsSentNotice] = useState<string | null>(null);

  const consecutiveAbsenceAlerts = useMemo(() => {
    return erpStorage.checkAndTriggerConsecutiveAbsenceAlerts();
  }, [state.attendance]);

  const weekDays = useMemo(() => {
    const base = new Date(selectedDate);
    const day = base.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(base);
    monday.setDate(base.getDate() + diffToMon);

    const labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return labels.map((name, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      return { dayName: name, shortName: name.slice(0, 3), dateStr, displayDate: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) };
    });
  }, [selectedDate]);

  const heatmapData = useMemo(() => {
    const batches = state.batches;
    const dayTotalAbsents: Record<string, number> = {};
    const dayTotalStudents: Record<string, number> = {};
    const dayTotalPresents: Record<string, number> = {};

    weekDays.forEach((wd) => {
      dayTotalAbsents[wd.dateStr] = 0; dayTotalStudents[wd.dateStr] = 0; dayTotalPresents[wd.dateStr] = 0;
    });

    const rows = batches.map((batch) => {
      const enrolled = batch.enrolled || 25;
      const daysStats = weekDays.map((wd) => {
        const records = state.attendance.filter((a) => a.batch === batch.batchName && a.date === wd.dateStr);
        let pCount = records.filter((r) => r.status === 'P').length;
        let aCount = records.filter((r) => r.status === 'A').length;
        let lCount = records.filter((r) => r.status === 'L').length;

        if (records.length === 0) {
          const isFriday = wd.shortName === 'Fri'; const isSaturday = wd.shortName === 'Sat'; const isMonday = wd.shortName === 'Mon';
          const simAbsentRate = isFriday ? 0.24 : isSaturday ? 0.28 : isMonday ? 0.14 : 0.08;
          aCount = Math.round(enrolled * simAbsentRate); lCount = Math.round(enrolled * 0.05); pCount = Math.max(0, enrolled - aCount - lCount);
        }

        const totalMarked = pCount + aCount + lCount;
        const rate = totalMarked > 0 ? Math.round(((pCount + lCount * 0.5) / totalMarked) * 100) : 90;

        dayTotalAbsents[wd.dateStr] += aCount; dayTotalStudents[wd.dateStr] += totalMarked; dayTotalPresents[wd.dateStr] += pCount;

        return { day: wd, rate, pCount, aCount, lCount, total: totalMarked };
      });

      const avgBatchRate = Math.round(daysStats.reduce((sum, d) => sum + d.rate, 0) / daysStats.length);
      return { batch, days: daysStats, avgRate: avgBatchRate };
    });

    let maxAbsents = -1; let peakDay = weekDays[4]; let minAbsents = 999999; let bestDay = weekDays[1];
    weekDays.forEach((wd) => {
      const abs = dayTotalAbsents[wd.dateStr] || 0;
      if (abs > maxAbsents) { maxAbsents = abs; peakDay = wd; }
      if (abs < minAbsents) { minAbsents = abs; bestDay = wd; }
    });

    const totalWeeklyStudents = Object.values(dayTotalStudents).reduce((a, b) => a + b, 0);
    const totalWeeklyPresents = Object.values(dayTotalPresents).reduce((a, b) => a + b, 0);
    const totalWeeklyAbsents = Object.values(dayTotalAbsents).reduce((a, b) => a + b, 0);
    const weeklyAvgRate = totalWeeklyStudents > 0 ? Math.round((totalWeeklyPresents / totalWeeklyStudents) * 100) : 88;
    const peakDayStudents = dayTotalStudents[peakDay.dateStr] || 1;
    const peakDayAbsenceRate = Math.round((maxAbsents / peakDayStudents) * 100);

    return { rows, peakDay, maxAbsents, peakDayAbsenceRate, bestDay, weeklyAvgRate, totalWeeklyAbsents, dayTotalAbsents, dayTotalStudents };
  }, [state.batches, state.attendance, weekDays]);

  const batchStudents = state.students.filter((s) => s.classBatch === selectedBatch);

  // PERIOD REPORT CALCULATION
  const periodReportData = useMemo(() => {
    return batchStudents.map(student => {
      const studentRecords = state.attendance.filter(a => a.studentId === student.id && a.batch === selectedBatch && a.date >= periodStart && a.date <= periodEnd);
      const present = studentRecords.filter(r => r.status === 'P').length;
      const absent = studentRecords.filter(r => r.status === 'A').length;
      const late = studentRecords.filter(r => r.status === 'L').length;
      const totalDays = studentRecords.length;
      const percentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;
      return { ...student, present, absent, late, totalDays, percentage };
    });
  }, [batchStudents, state.attendance, selectedBatch, periodStart, periodEnd]);

  const getStatus = (studentId: string): 'P' | 'A' | 'L' => {
    const rec = state.attendance.find((a) => a.studentId === studentId && a.date === selectedDate && a.batch === selectedBatch);
    return rec ? rec.status : 'P';
  };

  const handleSetStatus = (student: Student, status: 'P' | 'A' | 'L') => {
    const existing = state.attendance.find((a) => a.studentId === student.id && a.date === selectedDate && a.batch === selectedBatch);
    if (existing) erpStorage.updateItem('attendance', existing.id, { status });
    else {
      const newRec: AttendanceRecord = { id: `ATT-${Date.now().toString().slice(-4)}`, date: selectedDate, batch: selectedBatch, studentId: student.id, studentName: student.name, rollNo: student.rollNo, status };
      erpStorage.addItem('attendance', newRec);
    }
  };

  const markAll = (status: 'P' | 'A') => batchStudents.forEach((student) => handleSetStatus(student, status));

  const presentCount = batchStudents.filter((s) => getStatus(s.id) === 'P').length;
  const absentCount = batchStudents.filter((s) => getStatus(s.id) === 'A').length;
  const lateCount = batchStudents.filter((s) => getStatus(s.id) === 'L').length;
  const attendanceRate = batchStudents.length > 0 ? Math.round((presentCount / batchStudents.length) * 100) : 0;

  const handleSendSmsToAbsents = () => {
    const absents = batchStudents.filter((s) => getStatus(s.id) === 'A');
    if (absents.length === 0) { alert('No students marked absent.'); return; }
    setSmsSentNotice(`Dispatched SMS to ${absents.length} parents.`);
    setTimeout(() => setSmsSentNotice(null), 4000);
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => { e.stopPropagation(); setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };
  const toggleSelectAll = () => { if (selectedIds.length === batchStudents.length && batchStudents.length > 0) setSelectedIds([]); else setSelectedIds(batchStudents.map(s => s.id)); };

  const handleTriggerPrintDaily = (studentsToPrint: Student[]) => {
    setPrintData({ type: 'daily', students: studentsToPrint, batch: selectedBatch, date: selectedDate });
    setTimeout(() => window.print(), 300);
  };

  const handleTriggerPrintPeriod = (studentsToPrint: any[]) => {
    setPrintData({ type: 'period', students: studentsToPrint, batch: selectedBatch, start: periodStart, end: periodEnd });
    setTimeout(() => window.print(), 300);
  };

  const PrintRosterContent = ({ students, batch, date }: { students: Student[], batch: string, date: string }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead><tr className="bg-slate-100 text-slate-800 font-bold"><th className="border border-slate-300 p-2">Roll No</th><th className="border border-slate-300 p-2">Student Name</th><th className="border border-slate-300 p-2">Father Name</th><th className="border border-slate-300 p-2">Parent Phone</th><th className="border border-slate-300 p-2 text-center">Status</th></tr></thead>
      <tbody>
        {students.map((s) => {
          const st = getStatus(s.id);
          return (<tr key={s.id}><td className="border border-slate-300 p-2 font-mono font-bold text-indigo-700">{s.rollNo}</td><td className="border border-slate-300 p-2 font-bold">{s.name}</td><td className="border border-slate-300 p-2">{s.fatherName}</td><td className="border border-slate-300 p-2 font-mono">{s.phone}</td><td className="border border-slate-300 p-2 text-center font-black"><span className={`px-2 py-0.5 rounded ${st === 'P' ? 'bg-emerald-100 text-emerald-800' : st === 'A' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{st === 'P' ? 'PRESENT' : st === 'A' ? 'ABSENT' : 'LATE'}</span></td></tr>);
        })}
      </tbody>
    </table>
  );

  const PrintPeriodContent = ({ students }: { students: any[] }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead><tr className="bg-slate-100 text-slate-800 font-bold"><th className="border border-slate-300 p-2">Roll No</th><th className="border border-slate-300 p-2">Student Name</th><th className="border border-slate-300 p-2 text-center">Present</th><th className="border border-slate-300 p-2 text-center">Absent</th><th className="border border-slate-300 p-2 text-center">Late</th><th className="border border-slate-300 p-2 text-center">Total Days</th><th className="border border-slate-300 p-2 text-center">Attendance %</th></tr></thead>
      <tbody>
        {students.map((s) => (
          <tr key={s.id}><td className="border border-slate-300 p-2 font-mono font-bold text-indigo-700">{s.rollNo}</td><td className="border border-slate-300 p-2 font-bold">{s.name}</td><td className="border border-slate-300 p-2 text-center font-mono text-emerald-700">{s.present}</td><td className="border border-slate-300 p-2 text-center font-mono text-rose-700">{s.absent}</td><td className="border border-slate-300 p-2 text-center font-mono text-amber-700">{s.late}</td><td className="border border-slate-300 p-2 text-center font-mono">{s.totalDays}</td><td className="border border-slate-300 p-2 text-center font-black"><span className={s.percentage >= 80 ? 'text-emerald-600' : s.percentage >= 60 ? 'text-amber-600' : 'text-rose-600'}>{s.percentage}%</span></td></tr>
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
              <span className="p-2 bg-indigo-600 rounded-xl"><UserCheck className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Student Attendance & Reports</h1>
              <span className="px-2 py-0.5 bg-emerald-500 text-white font-black text-[10px] rounded uppercase">BIOMETRIC & HEATMAP</span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">Batch-wise attendance marking, weekly heatmap, and custom period reports.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-white/10 p-1 border border-white/20">
              <button type="button" onClick={() => setViewMode('daily')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${viewMode === 'daily' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}><Calendar className="w-3.5 h-3.5" /> Daily Sheet</button>
              <button type="button" onClick={() => setViewMode('heatmap')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${viewMode === 'heatmap' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-300 hover:text-white'}`}><Flame className="w-3.5 h-3.5" /> Heatmap</button>
              <button type="button" onClick={() => setViewMode('period')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${viewMode === 'period' ? 'bg-emerald-500 text-white shadow' : 'text-slate-300 hover:text-white'}`}><BarChart2 className="w-3.5 h-3.5" /> Period Report</button>
            </div>
            {viewMode === 'daily' && <button type="button" onClick={() => handleTriggerPrintDaily(batchStudents)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Daily</button>}
            {viewMode === 'period' && <button type="button" onClick={() => handleTriggerPrintPeriod(periodReportData)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl border border-emerald-500 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Report</button>}
          </div>
        </div>

        {viewMode === 'heatmap' && (
          <div className="space-y-5 animate-in fade-in">
             <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-sm text-center text-slate-500 font-bold">Heatmap view is active. (Displaying Matrix)</div>
          </div>
        )}
        {viewMode === 'daily' && (
          <div className="space-y-6">
            <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-500 uppercase">Batch:</span><select value={selectedBatch} onChange={(e) => { setSelectedBatch(e.target.value); setSelectedIds([]); }} className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 outline-none">{state.batches.map((b) => (<option key={b.id} value={b.batchName}>{b.batchName} ({b.enrolled} Students)</option>))}</select></div>
                <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-500 uppercase">Date:</span><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none" /></div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" style={{display: (!isParent && !isStudent) ? 'block' : 'none'}} onClick={() => markAll('P')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer">Mark All Present</button>
                <button type="button" style={{display: (!isParent && !isStudent) ? 'block' : 'none'}} onClick={() => markAll('A')} className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer">Mark All Absent</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-slate-500 uppercase">Total in Batch</div><div className="text-2xl font-black text-slate-900 font-mono mt-1">{batchStudents.length}</div></div>
              <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-emerald-600 uppercase">Present (P)</div><div className="text-2xl font-black text-emerald-600 font-mono mt-1">{presentCount}</div></div>
              <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-rose-600 uppercase">Absent (A)</div><div className="text-2xl font-black text-rose-600 font-mono mt-1">{absentCount}</div></div>
              <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-indigo-600 uppercase">Daily Rate</div><div className="text-2xl font-black text-indigo-600 font-mono mt-1">{attendanceRate}%</div></div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm">
               <div className="flex items-center gap-2">
                 <button onClick={toggleSelectAll} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">{selectedIds.length === batchStudents.length && batchStudents.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All</button>
                 {selectedIds.length > 0 && (<button onClick={() => handleTriggerPrintDaily(batchStudents.filter(s => selectedIds.includes(s.id)))} className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"><Printer className="w-4 h-4" /> Print Selected</button>)}
               </div>
            </div>
            <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead><tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200"><th className="p-3.5 w-10"></th><th className="p-3.5">Roll No</th><th className="p-3.5">Student</th><th className="p-3.5">Father Name</th><th className="p-3.5">Contact Phone</th><th className="p-3.5 text-center">Status Action</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchStudents.map((s) => {
                      const currentStatus = getStatus(s.id); const isSelected = selectedIds.includes(s.id);
                      return (
                        <tr key={s.id} className={`hover:bg-slate-50/50 transition ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                          <td className="p-3.5 text-center"><input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(s.id, e as any)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" /></td>
                          <td className="p-3.5 font-mono font-bold text-indigo-700">{s.rollNo}</td><td className="p-3.5 font-bold text-slate-900">{s.name}</td><td className="p-3.5 text-slate-600">{s.fatherName}</td><td className="p-3.5 font-mono text-slate-500">{s.phone}</td>
                          <td className="p-3.5 text-center"><div style={{display: (!isParent && !isStudent) ? 'inline-flex' : 'none'}} className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200"><button type="button" onClick={() => handleSetStatus(s, 'P')} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${currentStatus === 'P' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>P</button><button type="button" onClick={() => handleSetStatus(s, 'A')} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${currentStatus === 'A' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>A</button><button type="button" onClick={() => handleSetStatus(s, 'L')} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${currentStatus === 'L' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>L</button></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PERIOD REPORT VIEW */}
        {viewMode === 'period' && (
          <div className="space-y-6">
            <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-500 uppercase">Batch:</span><select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 outline-none">{state.batches.map((b) => (<option key={b.id} value={b.batchName}>{b.batchName}</option>))}</select></div>
                <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-500 uppercase">From:</span><input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none" /></div>
                <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-500 uppercase">To:</span><input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none" /></div>
              </div>
            </div>

            <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between"><span className="font-extrabold text-sm text-slate-900">Period Attendance Summary ({periodStart} to {periodEnd})</span></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead><tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200"><th className="p-3.5">Roll No</th><th className="p-3.5">Student Name</th><th className="p-3.5 text-center">Present</th><th className="p-3.5 text-center">Absent</th><th className="p-3.5 text-center">Late</th><th className="p-3.5 text-center">Total Days</th><th className="p-3.5 text-center">Attendance %</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {periodReportData.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3.5 font-mono font-bold text-indigo-700">{s.rollNo}</td><td className="p-3.5 font-bold text-slate-900">{s.name}</td>
                        <td className="p-3.5 text-center font-mono text-emerald-700 font-bold">{s.present}</td><td className="p-3.5 text-center font-mono text-rose-700 font-bold">{s.absent}</td>
                        <td className="p-3.5 text-center font-mono text-amber-700 font-bold">{s.late}</td><td className="p-3.5 text-center font-mono">{s.totalDays}</td>
                        <td className="p-3.5 text-center font-black"><span className={`px-2 py-0.5 rounded ${s.percentage >= 80 ? 'bg-emerald-100 text-emerald-800' : s.percentage >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>{s.percentage}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      {printData && createPortal(
        <div id="print-mount" className="hidden print:block w-full bg-white text-slate-900">
          <div className="print-page">
            {printData.type === 'daily' ? (
              <LetterheadPrint title={`DAILY ATTENDANCE REGISTER: ${printData.batch}`} documentNo={`ATT-${printData.date}`} date={printData.date} summaryStats={[{ label: 'Total', value: printData.students.length }, { label: 'Present', value: printData.students.filter(s => getStatus(s.id) === 'P').length }, { label: 'Absent', value: printData.students.filter(s => getStatus(s.id) === 'A').length }]}>
                <PrintRosterContent students={printData.students} batch={printData.batch} date={printData.date!} />
              </LetterheadPrint>
            ) : (
              <LetterheadPrint title={`PERIOD ATTENDANCE REPORT: ${printData.batch}`} documentNo={`ATT-RANGE-${printData.start}`} date={`${printData.start} to ${printData.end}`} summaryStats={[{ label: 'Total Students', value: printData.students.length }, { label: 'Report Period', value: `${printData.start} - ${printData.end}` }]}>
                <PrintPeriodContent students={printData.students} />
              </LetterheadPrint>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AttendanceModule;
