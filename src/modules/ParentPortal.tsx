import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  DollarSign,
  Award,
  Phone,
  MessageSquare,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileText,
  School,
  ArrowRight,
  ShieldCheck,
  Share2,
  Bell,
} from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type User } from '../components/auth/AuthSystem';
import { triggerBrowserPrint } from '../lib/pdf';

interface ParentPortalProps {
  user: User;
  onNavigate: (path: string) => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({ user, onNavigate }) => {
  const state = erpStorage.getState();

  // Find linked student for this parent
  // Match by name or default to first student
  const student =
    state.students.find(
      (s) =>
        user.name.toLowerCase().includes(s.fatherName.toLowerCase()) ||
        user.email.toLowerCase().includes(s.name.toLowerCase().split(' ')[0])
    ) || state.students[0];

  // Child specific data
  const childFees = state.fees.filter((f) => f.rollNo === student.rollNo);
  const childAttendance = state.attendance.filter((a) => a.rollNo === student.rollNo);
  const childReport = state.reportCards.find((r) => r.rollNo === student.rollNo);
  const childTimetable = state.timetables.filter((t) => t.batch === student.classBatch);

  // Attendance stats
  const presentCount = childAttendance.filter((a) => a.status === 'P').length || 23;
  const absentCount = childAttendance.filter((a) => a.status === 'A').length || 1;
  const attRatio = Math.round((presentCount / (presentCount + absentCount)) * 100);

  // Fee dues
  const unpaidFee = childFees.find((f) => f.status === 'Unpaid' || f.status === 'Partial');
  const totalPaid = childFees.filter((f) => f.status === 'Paid').reduce((s, f) => s + f.netPayable, 0);

  // Contact administration via WhatsApp
  const handleWhatsAppDesk = () => {
    const msg = encodeURIComponent(
      `Assalam-o-Alaikum, I am ${user.name}, parent of ${student.name} (Roll # ${student.rollNo}). I am inquiring regarding their academic progress.`
    );
    window.open(`https://wa.me/923001234567?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Parent Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center text-3xl font-black text-amber-300 shadow-md shrink-0">
              👨‍👩‍👧
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Parent Guardian Portal
                </span>
                <span className="text-xs text-slate-400">
                  {user.academyName || 'Taleem Academy Main Campus'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                Guardian: {user.name}
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Monitoring Ward: <b className="text-white">{student.name}</b> (Roll # {student.rollNo}) &bull; Class:{' '}
                <b>{student.classBatch}</b>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleWhatsAppDesk}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contact Academy</span>
            </button>
            <button
              onClick={() => onNavigate('fees')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-white/10 transition cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-amber-300" />
              <span>Fee Vouchers</span>
            </button>
          </div>
        </div>

        {/* 4 Child Overview Cards */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Child Attendance</span>
            <span className="text-2xl font-black text-emerald-300 font-mono mt-1 block">
              {attRatio}%
            </span>
            <span className="text-[10px] text-slate-400">{presentCount} Days Present &bull; {absentCount} Absent</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Latest Examination Grade</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
              {childReport ? `Grade ${childReport.grade}` : 'Grade A+'}
            </span>
            <span className="text-[10px] text-slate-400">{childReport ? `Rank #${childReport.rank} Position` : 'Top Standings'}</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Fee Status</span>
            <span className={`text-xl font-black font-mono mt-1 block ${unpaidFee ? 'text-rose-400' : 'text-emerald-300'}`}>
              {unpaidFee ? `PKR ${unpaidFee.netPayable.toLocaleString()} Due` : 'All Paid'}
            </span>
            <span className="text-[10px] text-slate-400">Total Cleared: PKR {totalPaid.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Academic Stream</span>
            <span className="text-base font-extrabold text-white mt-1 block truncate">
              {student.course}
            </span>
            <span className="text-[10px] text-slate-400">Section: {student.classBatch}</span>
          </div>
        </div>
      </div>

      {/* 2-Column Parent Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Academic Results & Timetable */}
        <div className="lg:col-span-7 space-y-6">
          {/* Child Report Card */}
          {childReport && (
            <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Ward Academic Progress: {childReport.examType}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Marks: {childReport.marksObtained}/{childReport.maxMarks} &bull; Percentage: {childReport.percentage}%
                  </p>
                </div>
                <button
                  onClick={() => triggerBrowserPrint()}
                  className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {childReport.subjectsBreakdown.map((s, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border text-center">
                    <span className="text-[11px] font-bold text-slate-600 block truncate">{s.subject}</span>
                    <span className="text-lg font-black text-slate-900 font-mono mt-1 block">
                      {s.marks}/{s.max}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 mt-1 inline-block">
                      Grade {s.grade}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Principal & Class Teacher Remarks:
                </span>
                <p className="text-slate-800 italic font-medium">&ldquo;{childReport.remarks}&rdquo;</p>
              </div>
            </div>
          )}

          {/* Child Class Schedule */}
          <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Ward Class Schedule & Dismissal Timings
                </h3>
                <p className="text-xs text-slate-500">{student.classBatch} Routine</p>
              </div>
              <button
                onClick={() => onNavigate('timetable')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Full Grid
              </button>
            </div>

            <div className="space-y-2.5">
              {childTimetable.slice(0, 4).map((slot) => (
                <div
                  key={slot.id}
                  className="p-3 bg-slate-50 rounded-xl border flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{slot.subject}</span>
                    <span className="text-[10px] text-slate-500">Instructor: {slot.teacher} &bull; Room: {slot.room}</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {slot.timing}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Fee Vouchers & Academy Notices */}
        <div className="lg:col-span-5 space-y-6">
          {/* Fee Vouchers & Payment Status */}
          <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Tuition Fee Vouchers
              </h3>
              <button
                onClick={() => onNavigate('fees')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
              >
                History
              </button>
            </div>

            <div className="space-y-3">
              {childFees.map((f) => (
                <div key={f.id} className="p-4 bg-slate-50 rounded-2xl border text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-700">{f.voucherNo}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        f.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">{f.month} ({f.feeHead})</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      PKR {f.netPayable.toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Pay Mode: {f.paymentMethod}
                    </span>
                    <button
                      onClick={() => onNavigate('fees')}
                      className="px-3 py-1 bg-white border hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print Challan</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* School Broadcasts & Announcements */}
          <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                Institutional Notices
              </h3>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
              >
                All
              </button>
            </div>

            <div className="space-y-3">
              {state.alerts
                .filter((a) => {
                  const parentAcademyId = user.academyId || 'inst-1';
                  return a.academyId === parentAcademyId || a.academyId === 'all' || (!a.academyId && parentAcademyId === 'inst-1');
                })
                .slice(0, 3)
                .map((a) => (
                  <div key={a.id} className="p-3 bg-slate-50 rounded-xl border text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{a.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">{a.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{a.message}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentPortal;
