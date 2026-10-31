import { type AuditLog, type UserRole } from '../types';
import { erpStorage } from './storage';

const AUDIT_STORAGE_KEY = 'taleemos_audit_logs_v5';

// Realistic initial audit entries across academies
const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-2026-1001',
    user: 'Prof. Ghulam Rasool',
    role: 'admin',
    actorEmail: 'admin@taleemacademy.edu.pk',
    action: 'STUDENT_ADMISSION',
    module: 'Admissions',
    targetRecord: 'TAK-26-001 (Muhammad Hamza)',
    targetId: 'STU-1001',
    timestamp: '2026-10-24 09:15 AM',
    details: 'Approved confirmed admission with fee challan voucher REC-1001 (PKR 8,000)',
    academyId: 'inst-1',
    academyName: 'Taleem Academy Main Campus (Kandhkot)',
  },
  {
    id: 'LOG-2026-1002',
    user: 'Accountant M. Ali',
    role: 'Accountant',
    actorEmail: 'accountant@taleemacademy.edu.pk',
    action: 'FEE_COLLECTION',
    module: 'Fees & Finance',
    targetRecord: 'VCH-26-804 (Mehwish Tariq Mahar)',
    targetId: 'VCH-26-804',
    timestamp: '2026-10-24 10:30 AM',
    details: 'Received PKR 7,500 monthly tuition fee via Bank Deposit Challan #68192',
    academyId: 'inst-1',
    academyName: 'Taleem Academy Main Campus (Kandhkot)',
  },
  {
    id: 'LOG-2026-1003',
    user: 'Asma Bibi (Attendance Coord)',
    role: 'Teacher',
    actorEmail: 'attendance@taleemacademy.edu.pk',
    action: 'ATTENDANCE_ALERT',
    module: 'Attendance',
    targetRecord: 'TAK-26-003 (Shahzaib Khan)',
    targetId: 'STU-1003',
    timestamp: '2026-10-24 11:45 AM',
    details: 'Automated consecutive absence alert (>3 missed classes) triggered and queued for parent SMS',
    academyId: 'inst-1',
    academyName: 'Taleem Academy Main Campus (Kandhkot)',
  },
  {
    id: 'LOG-2026-1004',
    user: 'Sajjad Ali Qasmi (Chief Developer)',
    role: 'developer',
    actorEmail: 'developer@hisaabkitaab.com',
    action: 'SYSTEM_CONFIG',
    module: 'System Core',
    targetRecord: 'Cloudinary & Firebase Bridge',
    targetId: 'CFG-01',
    timestamp: '2026-10-24 12:00 PM',
    details: 'Configured cloud storage preset TaleemOS and synchronized global multi-tenant security rules',
    academyId: 'inst-1',
    academyName: 'All Academies (Global Network)',
  },
  {
    id: 'LOG-2026-1005',
    user: 'Prof. Ghulam Rasool',
    role: 'admin',
    actorEmail: 'admin@taleemacademy.edu.pk',
    action: 'CUSTOM_FIELDS_UPDATE',
    module: 'Settings',
    targetRecord: 'Student Record Schema',
    targetId: 'CFG-STUDENT-FIELDS',
    timestamp: '2026-10-25 08:30 AM',
    details: 'Configured custom attributes: Emergency Contact Person & Previous School Board',
    academyId: 'inst-1',
    academyName: 'Taleem Academy Main Campus (Kandhkot)',
  },
  {
    id: 'LOG-2026-1006',
    user: 'Dr. Tariq Jamil',
    role: 'admin',
    actorEmail: 'director.sukkur@taleemacademy.edu.pk',
    action: 'BATCH_CREATED',
    module: 'Batches',
    targetRecord: 'ICS Computer Science Batch 2026-S1',
    targetId: 'BAT-201',
    timestamp: '2026-10-25 10:00 AM',
    details: 'Created new academic cohort for Sukkur Campus with capacity of 45 students',
    academyId: 'inst-2',
    academyName: 'Taleem Science & IT College (Sukkur)',
  },
  {
    id: 'LOG-2026-1007',
    user: 'Accounts Desk Sukkur',
    role: 'Accountant',
    actorEmail: 'accounts.sukkur@taleemacademy.edu.pk',
    action: 'PAYROLL_DISBURSED',
    module: 'Finance Payroll',
    targetRecord: 'Faculty Monthly Salaries Oct 2026',
    targetId: 'PAY-OCT-26',
    timestamp: '2026-10-25 02:20 PM',
    details: 'Disbursed PKR 480,000 across 12 faculty staff members via direct bank transfer',
    academyId: 'inst-2',
    academyName: 'Taleem Science & IT College (Sukkur)',
  },
  {
    id: 'LOG-2026-1008',
    user: 'Principal Zubaida Khanum',
    role: 'admin',
    actorEmail: 'principal.kashmore@taleemacademy.edu.pk',
    action: 'EXAM_SCHEDULED',
    module: 'Academics & Exams',
    targetRecord: 'Pre-Medical Mid-Term Exam Series',
    targetId: 'EXM-301',
    timestamp: '2026-10-26 09:00 AM',
    details: 'Published timetable and seating plan for Grade 11 & 12 Biology and Chemistry',
    academyId: 'inst-3',
    academyName: 'Taleem Girls Higher Academy (Kashmore)',
  },
];

function getCurrentSession() {
  try {
    const raw = localStorage.getItem('taleemos_current_user_v5');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function getAllAuditLogsFromStorage(): AuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse audit logs from storage:', e);
  }

  // Seed default if empty
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
  } catch {}
  return INITIAL_AUDIT_LOGS;
}

export function saveAuditLogsToStorage(logs: AuditLog[]): void {
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs.slice(0, 500)));
    window.dispatchEvent(new CustomEvent('taleemos_audit_log_changed'));
  } catch (e) {
    console.error('Failed to save audit logs:', e);
  }
}

export interface LogAuditParams {
  action: string;
  module: string;
  targetRecord?: string;
  targetId?: string;
  details: string;
  actorName?: string;
  actorRole?: UserRole;
  actorEmail?: string;
  actorId?: string;
  academyId?: string;
  academyName?: string;
}

export function logAuditEvent(params: LogAuditParams): AuditLog {
  const session = getCurrentSession();
  const state = erpStorage.getState();

  const userRole = (params.actorRole || session?.role || state.activeRole || 'admin') as UserRole;
  const userName = params.actorName || session?.name || state.userName || 'System Operator';
  const userEmail = params.actorEmail || session?.email || 'admin@taleemacademy.edu.pk';
  const userId = params.actorId || session?.uid || session?.id || 'usr-system';

  // Multi-tenancy academy resolution
  const academyId =
    params.academyId ||
    session?.academyId ||
    state.activeInstitutionId ||
    'inst-1';

  const academyName =
    params.academyName ||
    session?.academyName ||
    (academyId === 'inst-1'
      ? 'Taleem Academy Main Campus (Kandhkot)'
      : academyId === 'inst-2'
      ? 'Taleem Science & IT College (Sukkur)'
      : academyId === 'inst-3'
      ? 'Taleem Girls Higher Academy (Kashmore)'
      : 'Taleem Academy');

  const now = new Date();
  const formattedDate =
    now.toLocaleDateString('en-CA') +
    ' ' +
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const newLog: AuditLog = {
    id: `LOG-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`,
    user: userName,
    role: userRole,
    actorEmail: userEmail,
    actorId: userId,
    action: params.action.toUpperCase(),
    module: params.module,
    targetRecord: params.targetRecord || 'General Record',
    targetId: params.targetId,
    timestamp: formattedDate,
    details: params.details,
    academyId,
    academyName,
  };

  const currentLogs = getAllAuditLogsFromStorage();
  const updatedLogs = [newLog, ...currentLogs];
  saveAuditLogsToStorage(updatedLogs);

  // Also bridge with erpStorage internal state
  try {
    erpStorage.logAudit(params.action, params.module, params.details);
  } catch {}

  return newLog;
}

/**
 * Retrieves audit logs strictly enforcing role-based tenancy:
 * - Admin: strictly filtered by their academyId
 * - Developer: full visibility across all academies (or filtered by requested academyId if selected)
 */
export function getScopedAuditLogs(
  userAcademyId?: string | null,
  isDeveloper: boolean = false,
  selectedAcademyFilter: string = 'all'
): AuditLog[] {
  const allLogs = getAllAuditLogsFromStorage();

  if (isDeveloper) {
    if (!selectedAcademyFilter || selectedAcademyFilter === 'all') {
      return allLogs;
    }
    return allLogs.filter((l) => l.academyId === selectedAcademyFilter);
  }

  // Admin and other roles: strictly scoped to user's academyId
  const effectiveAcadId = userAcademyId || 'inst-1';
  return allLogs.filter((l) => l.academyId === effectiveAcadId);
}

export function clearAuditLogsForScope(
  userAcademyId?: string | null,
  isDeveloper: boolean = false,
  targetAcademyId: string = 'all'
): void {
  const allLogs = getAllAuditLogsFromStorage();

  if (isDeveloper && targetAcademyId === 'all') {
    saveAuditLogsToStorage([]);
    return;
  }

  const acadIdToClear = isDeveloper ? targetAcademyId : (userAcademyId || 'inst-1');
  const remaining = allLogs.filter((l) => l.academyId !== acadIdToClear);
  saveAuditLogsToStorage(remaining);
}
