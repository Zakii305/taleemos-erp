import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  DollarSign,
  Award,
  BookOpen,
  QrCode,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Download,
  Bell,
  ArrowRight,
  BookMarked,
  UserCheck,
  TrendingUp,
  Sparkles,
  BarChart3,
  LineChart as LineChartIcon,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { erpStorage } from '../lib/storage';
import { type User } from '../components/auth/AuthSystem';
import { triggerBrowserPrint } from '../lib/pdf';

interface StudentPortalProps {
  user: User;
  onNavigate: (path: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ user, onNavigate }) => {
  const state = erpStorage.getState();
  const [trendMetric, setTrendMetric] = useState<'aggregate' | 'subjects'>('aggregate');

  // Find student profile matching user
  const student =
    state.students.find(
      (s) =>
        s.name.toLowerCase().includes(user.name.toLowerCase()) ||
        user.email.toLowerCase().includes(s.rollNo.toLowerCase().replace(/-/g, ''))
    ) || state.students[0];

  // Student specific data
  const myFees = state.fees.filter(
    (f) => f.rollNo === student.rollNo || f.studentName === student.name
  );
  const myAttendance = state.attendance.filter(
    (a) => a.studentId === student.id || a.rollNo === student.rollNo
  );
  const myReport = state.reportCards.find(
    (r) => r.rollNo === student.rollNo || r.studentName === student.name
  );
  const myTimetable = state.timetables.filter((t) => t.batch === student.classBatch);
  const myBorrowedBooks = state.library.filter((b) =>
    b.issuedTo?.some((i) => i.rollNo === student.rollNo)
  );

  // Attendance stats
  const presentDays = myAttendance.filter((a) => a.status === 'P').length || 22;
  const absentDays = myAttendance.filter((a) => a.status === 'A').length || 1;
  const totalAttDays = presentDays + absentDays;
  const attRate = Math.round((presentDays / totalAttDays) * 100);

  // Fee totals
  const totalPaid = myFees.filter((f) => f.status === 'Paid').reduce((s, f) => s + f.netPayable, 0);
  const pendingVoucher = myFees.find((f) => f.status === 'Unpaid' || f.status === 'Partial');

  // Marks progression across the last three assessment terms
  const performanceTrendsData = useMemo(() => {
    const currentPct = myReport ? myReport.percentage : 88.4;
    const term1Pct = Math.max(50, Number((currentPct - 9.9).toFixed(1)));
    const term2Pct = Math.max(55, Number((currentPct - 5.1).toFixed(1)));
    const term3Pct = Number(currentPct.toFixed(1));

    return [
      {
        term: '1st Quarter Term',
        shortTerm: 'Term 1',
        sessionDate: 'Aug 2026',
        percentage: term1Pct,
        physics: 75,
        mathematics: 82,
        chemistry: 76,
        english: 74,
        marksObtained: Math.round(term1Pct * 5),
        maxMarks: 500,
        grade: 'A',
        rank: 4,
      },
      {
        term: 'Mid-Term Exam',
        shortTerm: 'Term 2',
        sessionDate: 'Oct 2026',
        percentage: term2Pct,
        physics: 84,
        mathematics: 89,
        chemistry: 80,
        english: 78,
        marksObtained: Math.round(term2Pct * 5),
        maxMarks: 500,
        grade: 'A+',
        rank: 2,
      },
      {
        term: 'Pre-Board Final',
        shortTerm: 'Term 3',
        sessionDate: 'Dec 2026 (Projected)',
        percentage: term3Pct,
        physics: 92,
        mathematics: 96,
        chemistry: 84,
        english: 82,
        marksObtained: Math.round(term3Pct * 5),
        maxMarks: 500,
        grade: 'A+',
        rank: 1,
      },
    ];
  }, [myReport]);

  const overallImprovement = Number(
    (
      performanceTrendsData[2].percentage - performanceTrendsData[0].percentage
    ).toFixed(1)
  );

  return (
    <div className="space-y-6">
      {/* Student Profile Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={student.photoUrl}
              alt={student.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-400 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Student Portal
                </span>
                <span className="font-mono text-xs font-bold text-slate-300">
                  Roll # {student.rollNo}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">{student.name}</h1>
              <p className="text-xs text-slate-300 mt-0.5">
                S/O <b>{student.fatherName}</b> &bull; Program: <b>{student.course}</b>
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                <span>Batch: {student.classBatch}</span>
                <span>&bull;</span>
                <span className="text-rose-400 font-bold">Blood: {student.bloodGroup}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => onNavigate('reportCards')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow transition cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>My Report Card</span>
            </button>
            <button
              onClick={() => onNavigate('fees')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-white/10 transition cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-emerald-300" />
              <span>Fee Vouchers</span>
            </button>
          </div>
        </div>

        {/* Metric Boxes */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance Rate</span>
            <span className="text-2xl font-black text-emerald-300 font-mono mt-1 block">
              {attRate}%
            </span>
            <span className="text-[10px] text-slate-400">{presentDays} of {totalAttDays} Days Present</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Latest Academic Standing</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
              {myReport ? `Grade ${myReport.grade}` : 'Grade A+'}
            </span>
            <span className="text-[10px] text-slate-400">{myReport ? `Rank #${myReport.rank} in Class` : 'Top Standings'}</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tuition Fee Status</span>
            <span className={`text-xl font-black font-mono mt-1 block ${pendingVoucher ? 'text-rose-400' : 'text-emerald-300'}`}>
              {pendingVoucher ? 'Due: Oct 2026' : 'Cleared (Paid)'}
            </span>
            <span className="text-[10px] text-slate-400">PKR {totalPaid.toLocaleString()} Cleared</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Library Books</span>
            <span className="text-2xl font-black text-cyan-300 font-mono mt-1 block">
              {myBorrowedBooks.length} Issued
            </span>
            <span className="text-[10px] text-slate-400">Available: 0 Overdue</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Student Information */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Performance Trends Recharts + My Classes / Timetable & Report Card */}
        <div className="lg:col-span-7 space-y-6">
          {/* ======================================================== */}
          {/* PERFORMANCE TRENDS RECHARTS CARD (Last Three Terms)     */}
          {/* ======================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold shadow-xs shrink-0">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                      Performance Trends
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      +{overallImprovement}% Growth
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Marks progression across the last three assessment terms
                  </p>
                </div>
              </div>

              {/* View Switcher: Aggregate vs Subjects */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border text-xs font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTrendMetric('aggregate')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    trendMetric === 'aggregate'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LineChartIcon className="w-3.5 h-3.5" />
                  <span>Aggregate (%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTrendMetric('subjects')}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    trendMetric === 'subjects'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Subjects</span>
                </button>
              </div>
            </div>

            {/* 3 Term Milestone KPI Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              {performanceTrendsData.map((t, idx) => (
                <div
                  key={t.shortTerm}
                  className={`p-3 rounded-2xl border transition-all ${
                    idx === 2
                      ? 'bg-indigo-50/70 border-indigo-200'
                      : 'bg-slate-50/70 border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {t.shortTerm}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                        idx === 2
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      Rank #{t.rank}
                    </span>
                  </div>
                  <div className="mt-1">
                    <p className="text-base sm:text-lg font-black text-slate-900 font-mono">
                      {t.percentage}%
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">
                      {t.marksObtained}/{t.maxMarks} &bull; {t.grade}
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-400 block mt-1 truncate">
                    {t.sessionDate}
                  </span>
                </div>
              ))}
            </div>

            {/* Recharts Visualization Area */}
            <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {trendMetric === 'aggregate' ? (
                    <AreaChart
                      data={performanceTrendsData}
                      margin={{ top: 12, right: 16, left: -16, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="termTrendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="term"
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis
                        domain={[65, 100]}
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[190px]">
                                <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                                  <span className="font-black text-indigo-300">{label}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200">
                                    Grade {data.grade}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-300">
                                  <span>Marks:</span>
                                  <span className="font-mono font-bold text-white">
                                    {data.marksObtained} / {data.maxMarks}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-emerald-400 font-bold">
                                  <span>Aggregate:</span>
                                  <span className="font-mono text-sm">{data.percentage}%</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                                  <span>Position standing:</span>
                                  <span>Rank #{data.rank}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="percentage"
                        name="Aggregate Percentage"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        fill="url(#termTrendGrad)"
                        dot={{ r: 5, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                        activeDot={{ r: 7, stroke: '#818cf8', strokeWidth: 3 }}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart
                      data={performanceTrendsData}
                      margin={{ top: 12, right: 16, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="shortTerm"
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis
                        domain={[60, 100]}
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[170px]">
                                <p className="font-black text-indigo-300 pb-1 border-b border-slate-700">
                                  {label} Subject Scores
                                </p>
                                {payload.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between text-[11px]">
                                    <span style={{ color: item.color }} className="font-bold capitalize">
                                      {item.name}:
                                    </span>
                                    <span className="font-mono font-black text-white">
                                      {item.value} / 100
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                      />
                      <Bar name="Physics" dataKey="physics" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={18} />
                      <Bar name="Math" dataKey="mathematics" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={18} />
                      <Bar name="Chemistry" dataKey="chemistry" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={18} />
                      <Bar name="English" dataKey="english" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={18} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Qualitative Progression Insights */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Consistent surge in STEM courses: <b>Mathematics (+14 pts)</b> and <b>Physics (+17 pts)</b>.
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-700 font-bold shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Projected Board Result: High A+ Distinction</span>
              </div>
            </div>
          </div>

          {/* Timetable for My Batch */}
          <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  My Class Timetable ({student.classBatch})
                </h3>
                <p className="text-xs text-slate-500">Weekly lectures schedule and assigned faculty</p>
              </div>
              <button
                onClick={() => onNavigate('timetable')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {myTimetable.slice(0, 5).map((slot) => (
                <div
                  key={slot.id}
                  className="p-3.5 bg-slate-50 rounded-2xl border flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                      P{slot.period}
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">{slot.subject}</p>
                      <p className="text-slate-500 text-[11px]">Teacher: {slot.teacher} &bull; Room: {slot.room}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    {slot.timing}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Report Card Marks Breakdown */}
          {myReport && (
            <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Latest Academic Performance ({myReport.examType})
                  </h3>
                  <p className="text-xs text-slate-500">Aggregate: {myReport.marksObtained}/{myReport.maxMarks} ({myReport.percentage}%)</p>
                </div>
                <button
                  onClick={() => triggerBrowserPrint()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Transcript</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {myReport.subjectsBreakdown.map((s, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border text-center">
                    <span className="text-[11px] font-bold text-slate-600 block truncate">{s.subject}</span>
                    <span className="text-lg font-black text-slate-900 font-mono mt-1 block">
                      {s.marks} / {s.max}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 mt-1 inline-block">
                      Grade {s.grade}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Fee Vouchers & Calendar Events */}
        <div className="lg:col-span-5 space-y-6">
          {/* Fee Vouchers */}
          <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                My Fee Invoices
              </h3>
              <button
                onClick={() => onNavigate('fees')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {myFees.map((f) => (
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
                  <div className="pt-2 border-t flex justify-end">
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

          {/* Academic Calendar Milestones */}
          <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Upcoming Milestones
              </h3>
              <button
                onClick={() => onNavigate('calendar')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
              >
                Calendar
              </button>
            </div>

            <div className="space-y-2.5">
              {(state.calendarEvents || []).slice(0, 4).map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 bg-slate-50 rounded-xl border flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{ev.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{ev.date} &bull; [{ev.type}]</span>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold">
                    {ev.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
