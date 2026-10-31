import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AuthSystem, getCurrentUser, User, logout } from './components/auth/AuthSystem';
import { Header } from './components/layout/Header';
import { SidebarDrawer } from './components/layout/SidebarDrawer';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ApprovalCenterModal } from './components/common/ApprovalCenterModal';
import { ExportZipModal } from './components/common/ExportZipModal';
import { erpStorage } from './lib/storage';

// All 28 ERP Modules
import StudentsModule from './modules/StudentsModule';
import AdmissionsModule from './modules/AdmissionsModule';
import EnquiriesModule from './modules/EnquiriesModule';
import BatchesModule from './modules/BatchesModule';
import FeesModule from './modules/FeesModule';
import DefaultersModule from './modules/DefaultersModule';
import ExpensesModule from './modules/ExpensesModule';
import PayrollModule from './modules/PayrollModule';
import AccountsModule from './modules/AccountsModule';
import AttendanceModule from './modules/AttendanceModule';
import StaffAttendanceModule from './modules/StaffAttendanceModule';
import LeavesModule from './modules/LeavesModule';
import CoursesModule from './modules/CoursesModule';
import AcademicCalendarModule from './modules/AcademicCalendarModule';
import TimetableModule from './modules/TimetableModule';
import ExamsModule from './modules/ExamsModule';
import ReportCardsModule from './modules/ReportCardsModule';
import LibraryModule from './modules/LibraryModule';
import IdCardsModule from './modules/IdCardsModule';
import PromoteModule from './modules/PromoteModule';
import TransfersModule from './modules/TransfersModule';
import CertificatesModule from './modules/CertificatesModule';
import TeachersModule from './modules/TeachersModule';
import CampusModule from './modules/CampusModule';
import InventoryModule from './modules/InventoryModule';
import AssetsModule from './modules/AssetsModule';
import CommunicationModule from './modules/CommunicationModule';
import AlertsModule from './modules/AlertsModule';
import SettingsModule from './modules/SettingsModule';
import AuditLogsModule from './modules/AuditLogsModule';
import { DeveloperModule } from './modules/DeveloperModule';
import { UsersModule } from './modules/UsersModule';
import { TeacherPortal } from './modules/TeacherPortal';
import { StudentPortal } from './modules/StudentPortal';
import { ParentPortal } from './modules/ParentPortal';
import { getPendingAcademyMembers, getPendingAdmins } from './lib/academyService';
import { getScopedAuditLogs } from './lib/auditLogger';
import { type AuditLog } from './types';
import { PredictiveForecastModal } from './components/common/PredictiveForecastModal';
import { TopbarNoticesModal } from './components/common/TopbarNoticesModal';
import { FloatingPdfButton } from './components/common/FloatingPdfButton';

import {
  Users,
  GraduationCap,
  DollarSign,
  AlertTriangle,
  Calendar,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Search,
  Plus,
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  Award,
  Wallet,
  ShieldCheck,
  Building2,
  MessageSquare,
  FileText,
  Info,
  Sparkles,
  Activity,
  CheckSquare,
  Square,
  Trash2,
  StickyNote,
  Tag,
  UserPlus,
} from 'lucide-react';

interface QuickNoteItem {
  id: string;
  text: string;
  category: 'Reminder' | 'Urgent' | 'Meeting' | 'Memo' | 'Task';
  completed: boolean;
  createdAt: number;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('dashboard');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isApprovalsOpen, setIsApprovalsOpen] = useState(false);
  const [isExportZipOpen, setIsExportZipOpen] = useState(false);
  const [isForecastModalOpen, setIsForecastModalOpen] = useState(false);
  const [isNoticesModalOpen, setIsNoticesModalOpen] = useState(false);
  const [storageVersion, setStorageVersion] = useState(0);
  const [moduleSearch, setModuleSearch] = useState('');
  const [pendingMemberCount, setPendingMemberCount] = useState(0);
  const [demoWriteAlert, setDemoWriteAlert] = useState<string | null>(null);

  // Quick Notes State (Persisted in localStorage for Admins)
  const [quickNotes, setQuickNotes] = useState<QuickNoteItem[]>(() => {
    try {
      const saved = localStorage.getItem('taleemos_admin_quick_notes_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'note-1',
        text: 'Follow up on Class 9 overdue fee challans before weekend',
        category: 'Urgent',
        completed: false,
        createdAt: Date.now() - 3600000 * 2,
      },
      {
        id: 'note-2',
        text: 'Monthly Academic Council & Teacher Zone coordination meeting at 11:30 AM',
        category: 'Meeting',
        completed: false,
        createdAt: Date.now() - 3600000 * 5,
      },
      {
        id: 'note-3',
        text: 'Review attendance heatmap regularity before staff payroll generation',
        category: 'Reminder',
        completed: true,
        createdAt: Date.now() - 3600000 * 24,
      },
    ];
  });
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'Reminder' | 'Urgent' | 'Meeting' | 'Memo' | 'Task'>('Reminder');

  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const newNote: QuickNoteItem = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      category: newNoteCategory,
      completed: false,
      createdAt: Date.now(),
    };
    const updated = [newNote, ...quickNotes];
    setQuickNotes(updated);
    localStorage.setItem('taleemos_admin_quick_notes_v1', JSON.stringify(updated));
    setNewNoteText('');
  };

  const handleToggleQuickNote = (id: string) => {
    const updated = quickNotes.map((n) => (n.id === id ? { ...n, completed: !n.completed } : n));
    setQuickNotes(updated);
    localStorage.setItem('taleemos_admin_quick_notes_v1', JSON.stringify(updated));
  };

  const handleDeleteQuickNote = (id: string) => {
    const updated = quickNotes.filter((n) => n.id !== id);
    setQuickNotes(updated);
    localStorage.setItem('taleemos_admin_quick_notes_v1', JSON.stringify(updated));
  };

  const handleClearCompletedNotes = () => {
    const updated = quickNotes.filter((n) => !n.completed);
    setQuickNotes(updated);
    localStorage.setItem('taleemos_admin_quick_notes_v1', JSON.stringify(updated));
  };

  // Recent System Activity Feed (Last 5 actions across ERP)
  const [recentActivities, setRecentActivities] = useState<AuditLog[]>([]);

  const loadRecentActivities = () => {
    const isDev = user?.role === 'developer';
    const acadId = user?.academyId || 'inst-1';
    const logs = getScopedAuditLogs(acadId, isDev);
    setRecentActivities(logs.slice(0, 5));
  };

  useEffect(() => {
    loadRecentActivities();
    const handleActivityChange = () => loadRecentActivities();
    window.addEventListener('taleemos_audit_log_changed', handleActivityChange);
    window.addEventListener('storage', handleActivityChange);
    return () => {
      window.removeEventListener('taleemos_audit_log_changed', handleActivityChange);
      window.removeEventListener('storage', handleActivityChange);
    };
  }, [user]);

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    if (u) {
      if (u.role === 'developer') {
        setCurrentPath('developer');
      } else if (u.academyId) {
        erpStorage.setActiveInstitution(u.academyId);
      }
    }
    setLoading(false);
  }, []);

  // Subscribe to reactive updates from erpStorage
  useEffect(() => {
    const unsubscribe = erpStorage.subscribe(() => {
      setStorageVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  // Listen for keyboard shortcuts (Ctrl+K for global search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Poll for pending registrations (admins for developer, or teachers/students/parents for admin)
  useEffect(() => {
    if (!user) return;
    const checkPending = async () => {
      try {
        if (user.role === 'developer') {
          const admins = await getPendingAdmins();
          setPendingMemberCount(admins.length);
        } else if (user.role === 'admin' && user.academyId) {
          const members = await getPendingAcademyMembers(user.academyId);
          setPendingMemberCount(members.length);
        }
      } catch {}
    };
    checkPending();
    const interval = setInterval(checkPending, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Listen for blocked writes in demo accounts
  useEffect(() => {
    let timer: any = null;
    const handleDemoWriteBlocked = (e: any) => {
      const detail = e?.detail?.action || 'Modifications';
      setDemoWriteAlert('Demo Account is strictly Read-Only. Modifications and state saves are blocked to protect sandbox integrity.');
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setDemoWriteAlert(null);
      }, 5000);
    };
    window.addEventListener('taleemos_demo_write_blocked', handleDemoWriteBlocked);
    return () => {
      window.removeEventListener('taleemos_demo_write_blocked', handleDemoWriteBlocked);
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Universal Read-Only Capture Interceptor for Demo Accounts
  useEffect(() => {
    if (!user?.isDemo && !user?.readOnly) return;

    const handleCaptureClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const button = target.closest('button, a, input[type="submit"]');
      if (!button) return;

      const btnText = (button.textContent || '').trim().toLowerCase();
      const btnTitle = (button.getAttribute('title') || '').toLowerCase();
      const btnType = button.getAttribute('type');

      // Allowed navigation & passive read-only actions:
      const isAllowed =
        btnText.includes('exit demo') ||
        btnText.includes('logout') ||
        btnText.includes('print') ||
        btnText.includes('download') ||
        btnText.includes('pdf') ||
        btnText.includes('search') ||
        btnText.includes('copy') ||
        btnText.includes('cancel') ||
        btnText.includes('close') ||
        btnText.includes('tab') ||
        btnText.includes('view') ||
        btnText.includes('details') ||
        btnText === '✕' ||
        btnText === '×' ||
        button.closest('[aria-label="Demo Account Notification"]') ||
        button.closest('.no-print');

      if (isAllowed) return;

      const isMutation =
        btnType === 'submit' ||
        btnText.includes('create') ||
        btnText.includes('add ') ||
        btnText.includes('new ') ||
        btnText.includes('save') ||
        btnText.includes('delete') ||
        btnText.includes('remove') ||
        btnText.includes('edit') ||
        btnText.includes('update') ||
        btnText.includes('mark ') ||
        btnText.includes('collect') ||
        btnText.includes('issue') ||
        btnText.includes('promote') ||
        btnText.includes('transfer') ||
        btnText.includes('record') ||
        btnTitle.includes('delete') ||
        btnTitle.includes('edit') ||
        btnTitle.includes('create');

      if (isMutation) {
        e.preventDefault();
        e.stopPropagation();
        setDemoWriteAlert('Demo Sandbox is strictly Read-Only. Adding, editing, deleting, or saving records is disabled.');
      }
    };

    const handleCaptureSubmit = (e: SubmitEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDemoWriteAlert('Demo Sandbox is strictly Read-Only. Form submissions and state saves are blocked.');
    };

    document.addEventListener('click', handleCaptureClick, true);
    document.addEventListener('submit', handleCaptureSubmit, true);
    return () => {
      document.removeEventListener('click', handleCaptureClick, true);
      document.removeEventListener('submit', handleCaptureSubmit, true);
    };
  }, [user]);

  const state = erpStorage.getState();
  const userAcademyId = user?.academyId || state.activeInstitutionId;
  const isDev = user?.role === 'developer';

  // Multi-tenant academy isolation: developers see all in 'all' mode, otherwise filtered by academyId
  const scopedStudents = useMemo(() => {
    if (isDev && state.activeInstitutionId === 'all') return state.students;
    return state.students.filter(
      (s: any) => !s.academyId || s.academyId === userAcademyId || s.institutionId === userAcademyId
    );
  }, [state.students, isDev, state.activeInstitutionId, userAcademyId]);

  const scopedAdmissions = useMemo(() => {
    if (isDev && state.activeInstitutionId === 'all') return state.admissions;
    return state.admissions.filter(
      (a: any) => !a.academyId || a.academyId === userAcademyId || a.institutionId === userAcademyId
    );
  }, [state.admissions, isDev, state.activeInstitutionId, userAcademyId]);

  const scopedBatches = useMemo(() => {
    if (isDev && state.activeInstitutionId === 'all') return state.batches;
    return state.batches.filter(
      (b: any) => !b.academyId || b.academyId === userAcademyId || b.institutionId === userAcademyId
    );
  }, [state.batches, isDev, state.activeInstitutionId, userAcademyId]);

  const scopedFees = useMemo(() => {
    if (isDev && state.activeInstitutionId === 'all') return state.fees;
    return state.fees.filter(
      (f: any) => !f.academyId || f.academyId === userAcademyId || f.institutionId === userAcademyId
    );
  }, [state.fees, isDev, state.activeInstitutionId, userAcademyId]);

  const totalStudents = scopedStudents.length;
  const totalPaidFees = useMemo(() => {
    return scopedFees
      .filter((f) => f.status === 'Paid')
      .reduce((acc, curr) => acc + curr.netPayable, 0);
  }, [scopedFees]);

  const totalPendingFees = useMemo(() => {
    return scopedFees
      .filter((f) => f.status === 'Unpaid' || f.status === 'Partial')
      .reduce((acc, curr) => acc + curr.netPayable, 0);
  }, [scopedFees]);

  const confirmedAdmissions = scopedAdmissions.filter((a) => a.status === 'Confirmed').length;
  const activeBatches = scopedBatches.filter((b) => b.status === 'Active').length;
  const pendingApprovalsCount = state.approvals.filter((a) => a.status === 'Pending Approval').length;

  const last6MonthsCollectionData = useMemo(() => [
    { month: 'May 2026', shortMonth: 'May', collected: 540000, pending: 85000 },
    { month: 'Jun 2026', shortMonth: 'Jun', collected: 610000, pending: 72000 },
    { month: 'Jul 2026', shortMonth: 'Jul', collected: 480000, pending: 110000 },
    { month: 'Aug 2026', shortMonth: 'Aug', collected: 675000, pending: 95000 },
    { month: 'Sep 2026', shortMonth: 'Sep', collected: 690000, pending: 65000 },
    { month: 'Oct 2026', shortMonth: 'Oct', collected: totalPaidFees || 720000, pending: totalPendingFees || 186000 },
  ], [totalPaidFees, totalPendingFees]);

  // Predictive Analytics & Forecast Model for Next Month (November 2026)
  const predictiveForecast = useMemo(() => {
    // 1. Student Enrollment Predictive Logic
    const qualifiedEnquiries = state.enquiries.filter((e) => e.status !== 'Lost').length;
    const expectedFromEnquiries = Math.round(qualifiedEnquiries * 0.38);
    const pendingAdmissionsCount = scopedAdmissions.filter((a) => a.status === 'Pending').length;
    const expectedFromPendingAdmissions = Math.round(pendingAdmissionsCount * 0.75);
    const organicGrowth = Math.max(1, Math.round(totalStudents * 0.035));
    const projectedNewStudents = Math.max(3, expectedFromEnquiries + expectedFromPendingAdmissions + organicGrowth);
    const projectedEnrollment = totalStudents + projectedNewStudents;
    const enrollmentGrowthPct = totalStudents > 0 
      ? Number(((projectedNewStudents / totalStudents) * 100).toFixed(1))
      : 8.5;
    const enrollmentProgress = Math.min(100, Math.round((totalStudents / projectedEnrollment) * 100));

    // 2. Fee Collection Predictive Logic
    const historicalAvgCollection = 630000;
    const baseCollection = totalPaidFees > 0 ? totalPaidFees : historicalAvgCollection;
    const expectedDefaulterRecovery = Math.round(totalPendingFees * 0.42);
    const newStudentTuitionYield = projectedNewStudents * 5500;
    const projectedFeeCollection = Math.round(baseCollection * 1.05 + expectedDefaulterRecovery + newStudentTuitionYield);
    const feeGrowthDelta = projectedFeeCollection - baseCollection;
    const feeGrowthPct = baseCollection > 0 
      ? Number(((feeGrowthDelta / baseCollection) * 100).toFixed(1))
      : 10.4;
    const feeCollectionProgress = Math.min(100, Math.round((baseCollection / projectedFeeCollection) * 100));

    return {
      nextMonthName: 'November 2026',
      shortMonthName: 'Nov',
      enrollment: {
        actual: totalStudents,
        projected: projectedEnrollment,
        delta: projectedNewStudents,
        growthPct: enrollmentGrowthPct,
        progressPct: enrollmentProgress,
        confidence: '92%',
        qualifiedEnquiries,
        pendingAdmissions: pendingAdmissionsCount,
        primaryDriver: `${qualifiedEnquiries} leads + ${pendingAdmissionsCount} pending adm`,
      },
      fees: {
        actual: totalPaidFees,
        projected: projectedFeeCollection,
        delta: feeGrowthDelta,
        growthPct: feeGrowthPct,
        progressPct: feeCollectionProgress,
        confidence: '88%',
        expectedDefaulterRecovery,
        newStudentTuitionYield,
        primaryDriver: `PKR ${Math.round(expectedDefaulterRecovery / 1000)}k dues recovery + intake`,
      },
    };
  }, [totalStudents, totalPaidFees, totalPendingFees, state.enquiries, scopedAdmissions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">Initializing TaleemOS Smart ERP...</h2>
        <p className="text-xs text-slate-400 mt-1">Loading institution records & local database</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthSystem
        onLogin={(u) => {
          setUser(u);
          if (u.role === 'developer') {
            setCurrentPath('developer');
          } else if (u.academyId) {
            erpStorage.setActiveInstitution(u.academyId);
            setCurrentPath('dashboard');
          }
        }}
      />
    );
  }

  const quickLaunchers = [
    ...(isDev
      ? [
          {
            label: 'Developer Hub',
            icon: '👑',
            path: 'developer',
            color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200',
          },
        ]
      : []),
    { label: 'Users Directory', icon: '👥', path: 'users', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
    { label: 'Academic Calendar', icon: '📅', path: 'calendar', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200' },
    { label: 'New Admission', icon: '📝', path: 'admissions', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' },
    { label: 'Collect Fees', icon: '💰', path: 'fees', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' },
    { label: 'Mark Attendance', icon: '📅', path: 'attendance', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200' },
    { label: 'Staff Attendance', icon: '👔', path: 'staffAttendance', color: 'bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200' },
    { label: 'Print ID Cards', icon: '🪪', path: 'idCards', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200' },
    { label: 'Issue Certificate', icon: '🏅', path: 'certificates', color: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200' },
    { label: 'Transfers / TC', icon: '🔄', path: 'transfers', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200' },
    { label: 'Broadcast SMS', icon: '💬', path: 'communication', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
  ];

  const allModulesList = [
    ...(isDev
      ? [
          {
            id: 'developer',
            name: 'Developer Master Hub',
            icon: '👑',
            category: 'Developer',
            count: 'Super Super Admin',
          },
        ]
      : []),
    { id: 'users', name: 'Users & Roles Directory', icon: '👥', category: 'Admin', count: 'Printable A4' },
    { id: 'students', name: 'Students Directory', icon: '👨‍🎓', category: 'Students', count: `${scopedStudents.length}` },
    { id: 'admissions', name: 'Admissions Desk', icon: '📝', category: 'Admissions', count: `${scopedAdmissions.length}` },
    { id: 'enquiries', name: 'New Enquiries', icon: '📩', category: 'Admissions', count: `${state.enquiries.length}` },
    { id: 'batches', name: 'Batches & Sections', icon: '👥', category: 'Admissions', count: `${scopedBatches.length}` },
    { id: 'fees', name: 'Fees Finance', icon: '💰', category: 'Finance', count: `PKR ${(totalPaidFees/1000).toFixed(0)}k` },
    { id: 'defaulters', name: 'Fee Defaulters', icon: '⚠️', category: 'Finance', count: `${scopedFees.filter(f=>f.status==='Unpaid').length}` },
    { id: 'expenses', name: 'Expenses Ledger', icon: '💸', category: 'Finance', count: `${state.expenses.length}` },
    { id: 'payroll', name: 'Staff Payroll', icon: '💵', category: 'Finance', count: `${state.payroll.length}` },
    { id: 'accounts', name: 'Accounts & Balance Sheet', icon: '📒', category: 'Finance', count: 'Active' },
    { id: 'attendance', name: 'Student Attendance', icon: '📅', category: 'Attendance', count: 'Daily' },
    { id: 'staffAttendance', name: 'Faculty Attendance', icon: '👔', category: 'Attendance', count: 'Biometric' },
    { id: 'leaves', name: 'Leave Management', icon: '🌴', category: 'Attendance', count: `${state.leaves.length}` },
    { id: 'courses', name: 'Courses & Curriculum', icon: '📚', category: 'Academics', count: `${state.courses.length}` },
    { id: 'calendar', name: 'Academic Calendar', icon: '📅', category: 'Academics', count: `${state.calendarEvents?.length || 17} events` },
    { id: 'timetable', name: 'Weekly Timetable', icon: '🕒', category: 'Academics', count: `${state.timetables.length}` },
    { id: 'exams', name: 'Exams & Date Sheets', icon: '📝', category: 'Academics', count: `${state.exams.length}` },
    { id: 'reportCards', name: 'Report Cards & Marks', icon: '📄', category: 'Academics', count: `${state.reportCards.length}` },
    { id: 'library', name: 'Library ERP', icon: '📖', category: 'Academics', count: `${state.library.length} books` },
    { id: 'idCards', name: 'ID Cards Generator', icon: '🪪', category: 'Students', count: 'Barcode' },
    { id: 'promote', name: 'Promote Workflow', icon: '⬆️', category: 'Students', count: 'Class 9-12' },
    { id: 'transfers', name: 'Transfers & TC', icon: '🔄', category: 'Students', count: 'Inter-campus' },
    { id: 'certificates', name: 'Awards & Certificates', icon: '🏅', category: 'Students', count: 'Print A4' },
    { id: 'teachers', name: 'Teacher Zone', icon: '👨‍🏫', category: 'Operations', count: `${state.teachers.length}` },
    { id: 'campus', name: 'Campus Facilities', icon: '🏫', category: 'Operations', count: `${state.campus.length} rooms` },
    { id: 'inventory', name: 'Inventory Stock', icon: '📦', category: 'Operations', count: `${state.inventory.length} items` },
    { id: 'assets', name: 'Assets & Infrastructure', icon: '🏛️', category: 'Operations', count: 'Fixed Assets' },
    { id: 'communication', name: 'SMS & WhatsApp Broadcast', icon: '📢', category: 'Operations', count: 'Live API' },
    { id: 'auditlogs', name: 'Audit Logs & Security', icon: '🛡️', category: 'Operations', count: 'Security' },
    { id: 'alerts', name: 'Alerts & Notifications', icon: '🔔', category: 'Main', count: `${state.alerts.length}` },
    { id: 'settings', name: 'System Settings', icon: '⚙️', category: 'Operations', count: 'Config' },
  ];

  const filteredModules = allModulesList.filter((m) =>
    m.name.toLowerCase().includes(moduleSearch.toLowerCase()) ||
    m.category.toLowerCase().includes(moduleSearch.toLowerCase()) ||
    m.id.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  const normalizedPath = currentPath.toLowerCase().replace(/[-_]/g, '');

  const activeUser = impersonatedUser || user;

  const renderActiveModule = () => {
    // Strict Demo Role Access Lockdown: only allow the respective role's portal and permitted views
    if (user?.isDemo || user?.readOnly) {
      if (activeUser?.role === 'teacher') {
        const teacherAllowed = ['dashboard', 'attendance', 'timetable', 'exams', 'reportcards', 'calendar', 'courses', 'library', 'leaves', 'alerts', 'communication'];
        if (!teacherAllowed.includes(normalizedPath)) {
          return <TeacherPortal user={activeUser!} onNavigate={(p: string) => setCurrentPath(p)} />;
        }
      } else if (activeUser?.role === 'student') {
        const studentAllowed = ['dashboard', 'attendance', 'fees', 'timetable', 'reportcards', 'library', 'calendar', 'alerts'];
        if (!studentAllowed.includes(normalizedPath)) {
          return <StudentPortal user={activeUser!} onNavigate={(p: string) => setCurrentPath(p)} />;
        }
      } else if (activeUser?.role === 'parent') {
        const parentAllowed = ['dashboard', 'fees', 'attendance', 'reportcards', 'alerts', 'calendar'];
        if (!parentAllowed.includes(normalizedPath)) {
          return <ParentPortal user={activeUser!} onNavigate={(p: string) => setCurrentPath(p)} />;
        }
      } else if (activeUser?.role === 'admin') {
        if (normalizedPath === 'developer') {
          return renderExecutiveDashboard();
        }
      }
    }

    switch (normalizedPath) {
      case 'dashboard':
        if (activeUser?.role === 'teacher') return <TeacherPortal user={activeUser!} onNavigate={(p: string) => setCurrentPath(p)} />;
        if (activeUser?.role === 'student') return <StudentPortal user={activeUser!} onNavigate={(p: string) => setCurrentPath(p)} />;
        if (activeUser?.role === 'parent') return <ParentPortal user={activeUser!} onNavigate={(p: string) => setCurrentPath(p)} />;
        return renderExecutiveDashboard();
      case 'users':
      case 'usersmodule':
        return <UsersModule onNavigate={(p: string) => setCurrentPath(p)} />;
      case 'teacherportal':
        return <TeacherPortal user={activeUser!} onNavigate={(p: string) => setCurrentPath(p)} />;
      case 'studentportal':
        return <StudentPortal user={activeUser!} onNavigate={(p: string) => setCurrentPath(p)} />;
      case 'parentportal':
        return <ParentPortal user={activeUser!} onNavigate={(p: string) => setCurrentPath(p)} />;
      case 'developer':
      case 'developermodule':
        return (
          <DeveloperModule
            onNavigate={(p: string) => setCurrentPath(p)}
            onSelectAcademy={(acadId: string) => {
              erpStorage.setActiveInstitution(acadId);
              setCurrentPath('dashboard');
            }}
          />
        );
      case 'students':
        return <StudentsModule onNavigate={(p: string) => setCurrentPath(p)} />;
      case 'admissions':
        return <AdmissionsModule />;
      case 'enquiries':
        return <EnquiriesModule />;
      case 'batches':
        return <BatchesModule />;
      case 'fees':
        return <FeesModule />;
      case 'defaulters':
        return <DefaultersModule />;
      case 'expenses':
        return <ExpensesModule />;
      case 'payroll':
        return <PayrollModule />;
      case 'accounts':
        return <AccountsModule />;
      case 'attendance':
        return <AttendanceModule onNavigate={(p: string) => setCurrentPath(p)} />;
      case 'staffattendance':
        return <StaffAttendanceModule />;
      case 'leaves':
        return <LeavesModule />;
      case 'courses':
        return <CoursesModule />;
      case 'calendar':
      case 'academiccalendar':
        return <AcademicCalendarModule onNavigate={(p: string) => setCurrentPath(p)} />;
      case 'timetable':
        return <TimetableModule />;
      case 'exams':
        return <ExamsModule />;
      case 'reportcards':
        return <ReportCardsModule />;
      case 'library':
        return <LibraryModule />;
      case 'idcards':
        return <IdCardsModule />;
      case 'promote':
        return <PromoteModule />;
      case 'transfers':
        return <TransfersModule />;
      case 'certificates':
        return <CertificatesModule />;
      case 'teachers':
        return <TeachersModule />;
      case 'campus':
        return <CampusModule />;
      case 'inventory':
        return <InventoryModule />;
      case 'assets':
        return <AssetsModule />;
      case 'communication':
        return <CommunicationModule />;
      case 'alerts':
        return <AlertsModule onNavigate={(p: string) => setCurrentPath(p)} />;
      case 'auditlogs':
      case 'auditlog':
        return <AuditLogsModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return renderExecutiveDashboard();
    }
  };

  const renderExecutiveDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Enterprise Active
              </span>
              <span className="text-xs text-slate-400">Session 2026-2027</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              TaleemOS Enterprise Hub
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Centralized Academic, Administrative & Financial Control Panel for Multi-Campus Institutions.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-white/10 transition shadow-sm"
            >
              <Search className="w-4 h-4 text-indigo-300" />
              <span>Search Hub (Ctrl+K)</span>
            </button>
          </div>
        </div>

        {/* Quick Launchers */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
            Quick Action Launchers
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {quickLaunchers.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setCurrentPath(item.path);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 ${item.color}`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[11px] font-bold leading-tight truncate w-full">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Developer Super Admin Banner */}
      {isDev && (
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/40 rounded-3xl p-5 shadow-lg text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-xl shrink-0">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-purple-200">Developer Super Super Admin Master Mode</h4>
                <span className="bg-purple-500/30 text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-400/30">MASTER PRIVILEGES</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Full authority over multi-academy allotment, pending admin onboarding approvals, and cross-academy data.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCurrentPath('developer')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              Open Developer Hub →
            </button>
          </div>
        </div>
      )}

      {/* Admin Pending Members Banner */}
      {!isDev && user?.role === 'admin' && pendingMemberCount > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              {pendingMemberCount}
            </div>
            <div>
              <h4 className="font-bold text-sm text-blue-950">
                Action Required: {pendingMemberCount} Pending Registrations for {user.academyName || 'Your Academy'}
              </h4>
              <p className="text-xs text-blue-800 mt-0.5">
                Teachers, students, or parents are waiting for your approval before they can log in.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition shrink-0"
          >
            Review in Drawer ({pendingMemberCount})
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div
          onClick={() => setCurrentPath('students')}
          className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Enrolled Students
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {totalStudents.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Active across all batches & campuses</p>
          </div>

          {/* Projected vs Actual Micro-Indicator */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span>{predictiveForecast.shortMonthName} Projected</span>
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-slate-400 text-[10px]">Act: {predictiveForecast.enrollment.actual}</span>
                <span className="text-slate-300">/</span>
                <span className="font-extrabold text-indigo-700">{predictiveForecast.enrollment.projected}</span>
                <span className="text-[10px] font-bold text-emerald-600">
                  (+{predictiveForecast.enrollment.delta})
                </span>
              </div>
            </div>

            {/* Micro Dual-Bar Progress */}
            <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${predictiveForecast.enrollment.progressPct}%` }}
                title={`Actual: ${predictiveForecast.enrollment.actual} of ${predictiveForecast.enrollment.projected} projected target`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400 truncate max-w-[150px]" title={predictiveForecast.enrollment.primaryDriver}>
                {predictiveForecast.enrollment.primaryDriver}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsForecastModalOpen(true);
                }}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 transition cursor-pointer"
                title="Open Predictive Forecast Model"
              >
                <span>{predictiveForecast.enrollment.confidence} Conf.</span>
                <Info className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Total Fee Collected */}
        <div
          onClick={() => setCurrentPath('fees')}
          className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Fee Collection MTD
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-700 font-mono">
                PKR {totalPaidFees.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Paid vouchers in current academic month
            </p>
          </div>

          {/* Projected vs Actual Micro-Indicator */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{predictiveForecast.shortMonthName} Projected</span>
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-slate-400 text-[10px]">Act: PKR {(predictiveForecast.fees.actual / 1000).toFixed(0)}k</span>
                <span className="text-slate-300">/</span>
                <span className="font-extrabold text-emerald-700">PKR {(predictiveForecast.fees.projected / 1000).toFixed(0)}k</span>
                <span className="text-[10px] font-bold text-emerald-600">
                  (+{predictiveForecast.fees.growthPct}%)
                </span>
              </div>
            </div>

            {/* Micro Dual-Bar Progress */}
            <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${predictiveForecast.fees.progressPct}%` }}
                title={`Actual: PKR ${predictiveForecast.fees.actual.toLocaleString()} of PKR ${predictiveForecast.fees.projected.toLocaleString()} projected`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400 truncate max-w-[150px]" title={predictiveForecast.fees.primaryDriver}>
                {predictiveForecast.fees.primaryDriver}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsForecastModalOpen(true);
                }}
                className="text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-0.5 transition cursor-pointer"
                title="Open Predictive Forecast Model"
              >
                <span>{predictiveForecast.fees.confidence} Conf.</span>
                <Info className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Pending / Defaulter Fees */}
        <div
          onClick={() => setCurrentPath('defaulters')}
          className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Overdue / Defaulter Fees
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600 font-mono">
              PKR {totalPendingFees.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Follow-up
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {state.fees.filter((f) => f.status === 'Unpaid').length} pending student vouchers
          </p>
        </div>

        {/* Confirmed Admissions & Batches */}
        <div
          onClick={() => setCurrentPath('admissions')}
          className="bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Admissions & Batches
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-sky-900 font-mono">
              {confirmedAdmissions}
            </span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {activeBatches} Batches
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {state.enquiries.length} pending prospective leads
          </p>
        </div>
      </div>

      {/* Main Dashboard Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Fee Collections Breakdown + Today's Highlights */}
        <div className="lg:col-span-7 space-y-6">
          {/* Financial Health & Fee Collection Trend Card */}
          <div className="bg-white rounded-3xl border p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    Financial Health & Fee Collection Trend
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly fee collection trend over the last 6 months (May – Oct 2026)
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                  +8.2% Growth MoM
                </span>
                <button
                  onClick={() => setCurrentPath('accounts')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Ledger</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Recharts Bar Chart: Last 6 Months Fee Collection */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={last6MonthsCollectionData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="shortMonth"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `PKR ${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const collected = payload[0]?.value as number;
                          const pending = payload[1]?.value as number;
                          const total = collected + pending;
                          const rate = total > 0 ? ((collected / total) * 100).toFixed(1) : 0;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[170px]">
                              <p className="font-black text-indigo-300 pb-1 border-b border-slate-700 flex items-center justify-between">
                                <span>{label} 2026</span>
                                <span className="text-[10px] text-emerald-400 font-mono">{rate}% Coll.</span>
                              </p>
                              <div className="flex items-center justify-between text-emerald-300">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                  <span>Collected:</span>
                                </span>
                                <span className="font-mono font-bold">PKR {collected.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-amber-300">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                                  <span>Pending:</span>
                                </span>
                                <span className="font-mono font-bold">PKR {pending.toLocaleString()}</span>
                              </div>
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
                      wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                    />
                    <Bar
                      name="Collected Fees"
                      dataKey="collected"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    />
                    <Bar
                      name="Pending Dues"
                      dataKey="pending"
                      fill="#f59e0b"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Collection Progress Bar */}
            <div className="p-4 bg-slate-50 rounded-2xl border space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">Total Billed Fees:</span>
                <span className="font-mono text-slate-900">
                  PKR {(totalPaidFees + totalPendingFees).toLocaleString()}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${
                      totalPaidFees + totalPendingFees > 0
                        ? (totalPaidFees / (totalPaidFees + totalPendingFees)) * 100
                        : 50
                    }%`,
                  }}
                  className="bg-emerald-500 h-full transition-all"
                  title="Collected"
                />
                <div
                  style={{
                    width: `${
                      totalPaidFees + totalPendingFees > 0
                        ? (totalPendingFees / (totalPaidFees + totalPendingFees)) * 100
                        : 50
                    }%`,
                  }}
                  className="bg-amber-500 h-full transition-all"
                  title="Pending"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Collected: PKR {totalPaidFees.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Pending: PKR {totalPendingFees.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Recent Admissions Preview */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Recent Admissions
                </h4>
                <button
                  onClick={() => setCurrentPath('admissions')}
                  className="text-xs text-indigo-600 hover:underline font-bold"
                >
                  View All ({state.admissions.length})
                </button>
              </div>
              <div className="divide-y divide-slate-100 border rounded-2xl overflow-hidden">
                {state.admissions.slice(0, 4).map((adm) => (
                  <div
                    key={adm.id}
                    className="p-3.5 hover:bg-slate-50 flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[11px]">
                        {adm.studentName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{adm.studentName}</p>
                        <p className="text-[11px] text-slate-500">
                          {adm.course} • {adm.batch}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          adm.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {adm.status}
                      </span>
                      <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                        PKR {(adm.netFee || adm.admissionFee - adm.discount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today's Academic Timetable Snapshot */}
          <div className="bg-white rounded-3xl border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Academic Routine Snapshot
                </h3>
                <p className="text-xs text-slate-500">Active class periods & assigned educators</p>
              </div>
              <button
                onClick={() => setCurrentPath('timetable')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Full Timetable</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {state.timetables.slice(0, 4).map((slot) => (
                <div
                  key={slot.id}
                  className="p-3.5 bg-slate-50 rounded-2xl border hover:border-indigo-300 transition"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {slot.timing || `Period ${slot.period}`}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      Room {slot.room}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-slate-900">{slot.subject}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {slot.batch} • Teacher: {slot.teacher}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: All 28 ERP Modules Quick Directory with Search */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pending Approvals Widget */}
          {pendingApprovalsCount > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                    {pendingApprovalsCount}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-amber-950">
                      Action Required: Approvals
                    </h4>
                    <p className="text-[11px] text-amber-800">
                      Discount, admission, or voucher requests waiting
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsApprovalsOpen(true)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Review
                </button>
              </div>
            </div>
          )}

          {/* Complete 28 Modules Directory */}
          <div className="bg-white rounded-3xl border p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  ERP Suite • 28 Modules
                </h3>
                <p className="text-xs text-slate-500">Instant access to all institution subsystems</p>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  placeholder="Filter modules..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-500 w-full sm:w-36 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[580px] overflow-y-auto pr-1">
              {filteredModules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => {
                    setCurrentPath(mod.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-3 rounded-2xl border border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition flex items-center justify-between group cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-sm shrink-0 group-hover:scale-105 transition">
                      {mod.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate group-hover:text-indigo-600 transition">
                        {mod.name}
                      </p>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {mod.category}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                    {mod.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Operational Pulse: Recent System Activity Feed & Quick Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Recent System Activity Feed */}
        <div className="lg:col-span-7 bg-white rounded-3xl border p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    Recent System Activity
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live ERP Pulse
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time record of the last 5 operational actions taken across the academy
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCurrentPath('auditlogs');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <span>Full Audit Logs</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of 5 Recent Actions */}
            <div className="divide-y divide-slate-100 border rounded-2xl overflow-hidden">
              {recentActivities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>No recent activity events recorded yet.</p>
                </div>
              ) : (
                recentActivities.map((act) => {
                  const isFinance =
                    act.module.includes('Fee') ||
                    act.action.includes('FEE') ||
                    act.action.includes('PAYROLL') ||
                    act.action.includes('EXPENSE');
                  const isStudent =
                    act.module.includes('Admission') ||
                    act.action.includes('ADMISSION') ||
                    act.action.includes('STUDENT');
                  const isAttendance =
                    act.module.includes('Attendance') || act.action.includes('ATTENDANCE');
                  const isExam =
                    act.module.includes('Exam') || act.action.includes('EXAM');

                  const badgeColor = isFinance
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isStudent
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : isAttendance
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : isExam
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200';

                  const iconEl = isFinance ? (
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  ) : isStudent ? (
                    <UserPlus className="w-4 h-4 text-sky-600" />
                  ) : isAttendance ? (
                    <Calendar className="w-4 h-4 text-amber-600" />
                  ) : isExam ? (
                    <FileText className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Activity className="w-4 h-4 text-purple-600" />
                  );

                  return (
                    <div
                      key={act.id}
                      className="p-3.5 hover:bg-slate-50/80 transition flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${badgeColor}`}
                        >
                          {iconEl}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 leading-tight">
                              {act.action.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600">
                              {act.module}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
                            {act.details || act.targetRecord}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                            <span className="font-medium text-slate-700">{act.user}</span>
                            <span>&bull;</span>
                            <span className="truncate">{act.targetRecord}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="font-mono text-[10px] text-slate-400 block whitespace-nowrap">
                          {act.timestamp}
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-bold text-slate-500 bg-slate-100 inline-block mt-1">
                          {act.id}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Filtered for: <strong className="text-slate-700">{user?.role === 'developer' ? 'All Academies' : (user?.academyName || 'Current Academy')}</strong></span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Automated Audit Stream Active
            </span>
          </div>
        </div>

        {/* Right Column (5 cols): Quick Notes & Reminders */}
        <div className="lg:col-span-5 bg-white rounded-3xl border p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-amber-500" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    Quick Notes & Reminders
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Admins temporary reminders & memos (persisted in local storage)
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {quickNotes.filter((n) => !n.completed).length} Pending
              </span>
            </div>

            {/* Quick Note Input Form */}
            <form onSubmit={handleAddQuickNote} className="mb-4 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Jot down a quick note or memo..."
                  className="flex-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Tag Selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-semibold text-slate-400">Tag:</span>
                {(['Reminder', 'Urgent', 'Meeting', 'Task', 'Memo'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewNoteCategory(cat)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                      newNoteCategory === cat
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </form>

            {/* Persistent Notes List */}
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {quickNotes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed">
                  <StickyNote className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                  <p>No reminders saved. Jot down your first memo above!</p>
                </div>
              ) : (
                quickNotes.map((note) => {
                  const tagStyles: Record<string, string> = {
                    Urgent: 'bg-rose-50 text-rose-700 border-rose-200',
                    Meeting: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    Reminder: 'bg-amber-50 text-amber-700 border-amber-200',
                    Task: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    Memo: 'bg-slate-100 text-slate-700 border-slate-200',
                  };

                  return (
                    <div
                      key={note.id}
                      className={`p-2.5 rounded-xl border transition flex items-start justify-between gap-2 text-xs group ${
                        note.completed
                          ? 'bg-slate-50/60 border-slate-200 opacity-60'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleQuickNote(note.id)}
                          className="mt-0.5 text-slate-400 hover:text-indigo-600 transition cursor-pointer shrink-0"
                          title={note.completed ? 'Mark uncompleted' : 'Mark completed'}
                        >
                          {note.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-medium leading-snug break-words ${
                              note.completed ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {note.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                tagStyles[note.category] || 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {note.category}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(note.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuickNote(note.id)}
                        title="Delete Note"
                        className="p-1 text-slate-300 hover:text-rose-600 rounded transition cursor-pointer shrink-0 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {quickNotes.some((n) => n.completed) && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleClearCompletedNotes}
                className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition cursor-pointer"
              >
                Clear completed notes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sticky Top Banner for Demo Accounts (Strict Read-Only Mode) */}
      {(user?.isDemo || user?.readOnly) && (
        <aside aria-label="Demo Account Notification" className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 text-xs font-semibold shadow-md flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 border-b border-amber-500">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span className="bg-black/25 px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider">
              Demo Sandbox (Read-Only)
            </span>
            <span className="text-amber-50">
              Active demo session as <strong className="text-white capitalize">{user.role}</strong>. In demo mode, all modifications/writes are blocked.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => logout()}
              className="px-3 py-1 bg-white text-amber-900 rounded-lg text-xs font-bold hover:bg-amber-100 transition shadow-sm cursor-pointer"
            >
              Exit Demo
            </button>
          </div>
        </aside>
      )}

      {/* Floating Demo Mode Write Blocked Toast */}
      {demoWriteAlert && (
        <div className="fixed top-14 right-4 z-50 max-w-md bg-amber-950 border-2 border-amber-400 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-amber-200">Action Blocked (Demo Account)</p>
            <p className="text-amber-100 mt-0.5 leading-relaxed">{demoWriteAlert}</p>
          </div>
          <button
            onClick={() => setDemoWriteAlert(null)}
            className="text-amber-300 hover:text-white text-xs font-bold px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Main Navigation Header */}
      <Header
        onToggleMobileDrawer={() => setIsMobileDrawerOpen((prev) => !prev)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenApprovals={() => setIsApprovalsOpen(true)}
        onOpenNotices={() => setIsNoticesModalOpen(true)}
        onOpenExportZip={() => setIsExportZipOpen(true)}
        onNavigate={(path: string) => {
          setCurrentPath(path);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={activeUser!}
      />

      <div className="flex-1 flex min-h-0">
        {/* Sidebar Drawer */}
        <SidebarDrawer
          currentPath={currentPath}
          setCurrentPath={(p: string) => {
            setCurrentPath(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          isMobileDrawerOpen={isMobileDrawerOpen}
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-28 md:pb-8">
          {/* Active Session & Instant Role Switcher Bar */}
          <div className="mb-4 p-2.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-indigo-900/50 flex flex-wrap items-center justify-between gap-2.5 text-xs text-white shadow-md no-print">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-300">
                Active Session: <b className="text-white">{activeUser?.name}</b>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                user.role === 'developer' ? 'bg-purple-600 text-white' :
                user.role === 'admin' ? 'bg-blue-600 text-white' :
                user.role === 'teacher' ? 'bg-emerald-600 text-white' :
                user.role === 'student' ? 'bg-cyan-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                {user.role}
              </span>
              {user.isDemo && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  🔒 Read-Only Demo
                </span>
              )}
            </div>

            {activeUser?.isDemo || activeUser?.readOnly ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  🔒 Locked to {activeUser.role.toUpperCase()} Portal
                </span>
              </div>
            ) : isDev ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold uppercase hidden sm:inline">View As:</span>
                {(['developer', 'admin', 'teacher', 'student', 'parent'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      if (r === 'developer') {
                        setImpersonatedUser(null);
                        setCurrentPath('developer');
                      } else {
                        const fakeUser: User = {
                          ...activeUser!,
                          uid: `usr-${r}-view`,
                          id: `usr-${r}-view`,
                          name: `Developer View (${r.toUpperCase()})`,
                          email: `${r}@view.com`,
                          role: r,
                          academyId: 'inst-1',
                          academyName: 'Taleem Academy Main Campus',
                          status: 'approved',
                        };
                        setImpersonatedUser(fakeUser);
                        erpStorage.setActiveInstitution('inst-1');
                        setCurrentPath('dashboard');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer capitalize ${
                      (activeUser?.role) === r
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {r === 'developer' ? '👑 Dev' : r === 'admin' ? '🏢 Admin' : r === 'teacher' ? '👨‍🏫 Teacher' : r === 'student' ? '🎓 Student' : '👨‍👩‍👧 Parent'}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Breadcrumb if not on dashboard */}
          {normalizedPath !== 'dashboard' && (
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white border rounded-2xl px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentPath('dashboard');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-black text-slate-900 capitalize">
                  {currentPath.replace(/[-_]/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="hidden sm:inline">Active Scope:</span>
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  {isDev
                    ? (state.activeInstitutionId === 'all' ? '🌐 All Academies' : state.activeInstitutionId)
                    : (user?.academyName || 'Taleem Academy')}
                </span>
              </div>
            </div>
          )}

          {/* Global Floating 'Download as PDF' button for active module */}
          {normalizedPath !== 'dashboard' && normalizedPath !== 'students' && normalizedPath !== 'fees' && (
            <FloatingPdfButton
              label={`Download ${currentPath.replace(/[-_]/g, ' ')} PDF`}
            />
          )}

          {/* Module Output */}
          <div className="transition-all">
            {renderActiveModule()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed for responsive mobile usability) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-indigo-900/50 px-2 py-1.5 flex items-center justify-around shadow-2xl no-print">
        <button
          onClick={() => {
            setCurrentPath('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer ${
            normalizedPath === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-base">🏠</span>
          <span className="text-[10px] leading-tight">Home</span>
        </button>

        <button
          onClick={() => {
            setCurrentPath('users');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer ${
            normalizedPath === 'users' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-base">👥</span>
          <span className="text-[10px] leading-tight">Users</span>
        </button>

        <button
          onClick={() => {
            setCurrentPath('calendar');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer ${
            normalizedPath === 'calendar' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-base">📅</span>
          <span className="text-[10px] leading-tight">Calendar</span>
        </button>

        <button
          onClick={() => {
            setCurrentPath('fees');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition cursor-pointer ${
            normalizedPath === 'fees' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-base">💰</span>
          <span className="text-[10px] leading-tight">Fees</span>
        </button>

        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
        >
          <span className="text-base">☰</span>
          <span className="text-[10px] leading-tight">Drawer</span>
        </button>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(modulePath: string) => {
          setCurrentPath(modulePath);
          setIsSearchOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <ApprovalCenterModal
        isOpen={isApprovalsOpen}
        onClose={() => setIsApprovalsOpen(false)}
        activeRole={state.activeRole}
      />

      <ExportZipModal
        isOpen={isExportZipOpen}
        onClose={() => setIsExportZipOpen(false)}
      />

      <PredictiveForecastModal
        isOpen={isForecastModalOpen}
        onClose={() => setIsForecastModalOpen(false)}
        forecast={predictiveForecast}
      />

      <TopbarNoticesModal
        isOpen={isNoticesModalOpen}
        onClose={() => setIsNoticesModalOpen(false)}
        onNavigate={(path: string) => {
          setCurrentPath(path);
          setIsNoticesModalOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
