import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  UserCheck,
  Award,
  BookOpen,
  FileText,
  Bell,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ArrowRight,
  Plus,
  Printer,
  ChevronRight,
  Star,
  TrendingUp,
  BarChart2,
  ThumbsUp,
} from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type User } from '../components/auth/AuthSystem';

interface TeacherPortalProps {
  user: User;
  onNavigate: (path: string) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({ user, onNavigate }) => {
  const state = erpStorage.getState();

  // Find teacher profile matching this user
  const teacherProfile =
    state.teachers.find(
      (t) =>
        t.email.toLowerCase() === user.email.toLowerCase() ||
        t.name.toLowerCase().includes(user.name.toLowerCase())
    ) || state.teachers[0];

  const assignedBatches = teacherProfile?.assignedBatches || ['Batch 2026-A (Morning)'];

  // Assigned timetable slots
  const myTimetable = state.timetables.filter(
    (t) =>
      t.teacher.toLowerCase().includes(teacherProfile?.name.toLowerCase()) ||
      assignedBatches.includes(t.batch)
  );

  // Today's day name
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = daysOfWeek[new Date().getDay()] || 'Monday';
  const todaySchedule = myTimetable.filter((t) => t.day === todayName || t.day === 'Monday');

  // Teacher leaves
  const myLeaves = state.leaves.filter((l) => l.applicantType === 'Staff');

  // Exams for teacher's batches
  const myExams = state.exams.filter((e) =>
    assignedBatches.some((b) => e.classBatch.includes(b.split(' ')[0]))
  );

  return (
    <div className="space-y-6">
      {/* Teacher Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/40 flex items-center justify-center text-2xl font-black text-emerald-300 shadow-md">
              👨‍🏫
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Faculty Workspace
                </span>
                <span className="text-xs text-slate-400">
                  {teacherProfile?.department || 'Faculty of Science'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                Welcome, {teacherProfile?.name || user.name}
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                Specialization: <b>{teacherProfile?.specialization || 'Academic Instructor'}</b> &bull; Campus:{' '}
                <b>{user.academyName || 'Taleem Academy Kandhkot'}</b>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('attendance')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition active:scale-95 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Mark Student Attendance</span>
            </button>
            <button
              onClick={() => onNavigate('timetable')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-white/10 transition cursor-pointer"
            >
              <Clock className="w-4 h-4 text-indigo-300" />
              <span>My Timetable</span>
            </button>
          </div>
        </div>

        {/* Quick Launchers */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div
            onClick={() => onNavigate('attendance')}
            className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition cursor-pointer"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Class Attendance</span>
            <span className="text-base font-extrabold text-white mt-1 block">Take Roll Call</span>
          </div>
          <div
            onClick={() => onNavigate('exams')}
            className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition cursor-pointer"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Exams & Papers</span>
            <span className="text-base font-extrabold text-amber-300 mt-1 block">
              {myExams.length} Scheduled
            </span>
          </div>
          <div
            onClick={() => onNavigate('reportCards')}
            className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition cursor-pointer"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Student Grades</span>
            <span className="text-base font-extrabold text-indigo-300 mt-1 block">Marks Entry</span>
          </div>
          <div
            onClick={() => onNavigate('calendar')}
            className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition cursor-pointer"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Academic Calendar</span>
            <span className="text-base font-extrabold text-emerald-300 mt-1 block">Term Dates</span>
          </div>
          <div
            onClick={() => onNavigate('leaves')}
            className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition cursor-pointer"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Leave Applications</span>
            <span className="text-base font-extrabold text-rose-300 mt-1 block">Apply / Status</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Lectures & Assigned Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-7 bg-white rounded-3xl border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Today's Teaching Schedule ({todayName})
              </h3>
              <p className="text-xs text-slate-500">Scheduled classroom lectures and periods</p>
            </div>
            <button
              onClick={() => onNavigate('timetable')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Full Grid</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todaySchedule.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No lectures scheduled for today. Check the weekly timetable.
              </div>
            ) : (
              todaySchedule.map((slot) => (
                <div
                  key={slot.id}
                  className="p-4 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      P{slot.period}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{slot.subject}</h4>
                      <p className="text-xs text-slate-500">
                        {slot.batch} &bull; Room: <b>{slot.room}</b>
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                      {slot.timing}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assigned Cohorts & Batches */}
        <div className="lg:col-span-5 bg-white rounded-3xl border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              My Assigned Batches
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">
              {assignedBatches.length} Cohorts
            </span>
          </div>

          <div className="space-y-3">
            {state.batches
              .filter((b) =>
                assignedBatches.some((ab) => b.batchName.includes(ab) || ab.includes(b.batchName))
              )
              .map((b) => (
                <div key={b.id} className="p-4 bg-slate-50 rounded-2xl border space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-slate-900">{b.batchName}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{b.course}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-1 border-t">
                    <span>Enrolled: <b>{b.enrolled}/{b.capacity}</b></span>
                    <span>Timing: {b.timing}</span>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => onNavigate('attendance')}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Roll Call
                    </button>
                    <button
                      onClick={() => onNavigate('students')}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Students
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Teacher Performance Analytics • Academic Term Review */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700">
                <BarChart2 className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Teacher Performance Analytics
              </h3>
              <span className="px-2.5 py-0.5 bg-indigo-600 text-white font-black text-[10px] rounded-full uppercase tracking-wider">
                LAST ACADEMIC TERM
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              End-of-term student feedback surveys, classroom delivery evaluations, and attendance regularity breakdown.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black rounded-xl flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Top 5% Faculty Tier</span>
            </span>
          </div>
        </div>

        {/* Top Analytics Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Feedback Rating */}
          <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 uppercase">Avg Student Feedback</span>
              <div className="flex text-amber-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">4.88</span>
              <span className="text-xs font-bold text-slate-400">/ 5.00</span>
            </div>
            <div className="text-[11px] text-amber-700 font-medium">
              Based on 142 student evaluations across 3 batches
            </div>
          </div>

          {/* Attendance Regularity */}
          <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">Attendance Regularity</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                Punctual
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700 font-mono">97.4%</span>
              <span className="text-xs font-bold text-slate-400">Regularity</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">
              89 present / 91 term days &bull; 2 leaves &bull; 0 unexcused
            </div>
          </div>

          {/* Syllabus Pace */}
          <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800 uppercase">Syllabus Completion</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-200 text-indigo-900">
                On Track
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-900 font-mono">94.8%</span>
              <span className="text-xs font-bold text-slate-400">Target: 90%</span>
            </div>
            <div className="text-[11px] text-indigo-700 font-medium">
              24 / 25 planned modules delivered with lab practicals
            </div>
          </div>

          {/* Student Pass Rate */}
          <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-800 uppercase">Student Midterm Pass Rate</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-200 text-blue-900">
                +8.2% vs Avg
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-900 font-mono">92.6%</span>
              <span className="text-xs font-bold text-slate-400">Class Average</span>
            </div>
            <div className="text-[11px] text-blue-700 font-medium">
              Highest scoring cohort in Board Pre-Test Exams
            </div>
          </div>
        </div>

        {/* Visual Charts: Feedback Trend & Attendance Trajectory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Monthly Student Feedback Scores Chart */}
          <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Month-Over-Month Student Feedback Rating
                </h4>
                <p className="text-[11px] text-slate-500">Term score progression on 5.0 scale</p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                Peak: 4.94 ★
              </span>
            </div>

            {/* Bar Chart Visualization */}
            <div className="space-y-3 pt-2">
              {[
                { month: 'Month 1 (Jan)', score: 4.65, pct: 93, notes: 'Introductory lectures & syllabus orientation' },
                { month: 'Month 2 (Feb)', score: 4.75, pct: 95, notes: 'Theoretical derivations & interactive demos' },
                { month: 'Month 3 (Mar)', score: 4.82, pct: 96, notes: 'First midterm prep & revision sessions' },
                { month: 'Month 4 (Apr)', score: 4.88, pct: 97, notes: 'Past papers solving & laboratory sessions' },
                { month: 'Month 5 (May)', score: 4.94, pct: 98, notes: 'Board model paper series & feedback clinics' },
                { month: 'Month 6 (Jun)', score: 4.90, pct: 98, notes: 'Term final assessments & grand viva' },
              ].map((item) => (
                <div key={item.month} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-700">{item.month}</span>
                    <span className="font-mono font-bold text-indigo-900 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {item.score} / 5.0
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5 border-t border-slate-200">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Consistently above the 4.50 Academy Faculty Benchmark all term.</span>
            </div>
          </div>

          {/* Attendance Regularity Breakdown & Student Evaluations */}
          <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Attendance Regularity &amp; Student Voice
                </h4>
                <p className="text-[11px] text-slate-500">Punctuality and direct student feedback</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                97.4% Attendance
              </span>
            </div>

            {/* Attendance Pillars */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Classes Conducted</div>
                <div className="text-lg font-black text-slate-900 font-mono mt-1">89 / 91</div>
                <div className="text-[10px] text-emerald-600 font-bold">97.8% Delivered</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">On-Time Arrival</div>
                <div className="text-lg font-black text-slate-900 font-mono mt-1">98.9%</div>
                <div className="text-[10px] text-indigo-600 font-bold">Bell Ring Arrival</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Approved Leaves</div>
                <div className="text-lg font-black text-slate-900 font-mono mt-1">2 Days</div>
                <div className="text-[10px] text-amber-600 font-bold">Pre-Notified</div>
              </div>
            </div>

            {/* Student Survey Dimensional Scores */}
            <div className="space-y-2 pt-1">
              <h5 className="text-[11px] font-black text-slate-700 uppercase">Evaluation Dimensions:</h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-600 font-medium">Concept Explanation &amp; Subject Clarity</span>
                  <span className="font-mono font-black text-emerald-700">4.92 / 5.0</span>
                </div>
                <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-600 font-medium">Class Discipline &amp; Time Management</span>
                  <span className="font-mono font-black text-emerald-700">4.89 / 5.0</span>
                </div>
                <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-600 font-medium">Doubt Resolution &amp; Student Mentorship</span>
                  <span className="font-mono font-black text-emerald-700">4.85 / 5.0</span>
                </div>
              </div>
            </div>

            {/* Qualitative Student Quote */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-1">
              <div className="flex items-center gap-1 font-bold">
                <ThumbsUp className="w-3.5 h-3.5 text-indigo-600" />
                <span>Selected Student Feedback Note:</span>
              </div>
              <p className="italic text-slate-700">
                "Sir breaks down difficult numericals into logical steps and always stays for 15 minutes after class to ensure everyone understands the topic."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherPortal;
