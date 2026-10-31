export type UserRole =
  | 'developer'
  | 'admin'
  | 'teacher'
  | 'student'
  | 'parent'
  // Legacy aliases for backwards compatibility
  | 'Super Admin'
  | 'Director / Owner'
  | 'Principal'
  | 'Accountant'
  | 'Receptionist / Front Desk'
  | 'Teacher'
  | 'Student'
  | 'Parent';

export interface Academy {
  academyId: string;
  academyName: string;
  code: string;
  address: string;
  phone: string;
  adminId?: string;
  adminName?: string;
  adminEmail?: string;
  createdBy: string;
  createdAt: number | string;
  isActive: boolean;
  // Legacy institution compat
  id?: string;
  name?: string;
  campusName?: string;
  city?: string;
  email?: string;
}

export type Institution = Academy;

export interface AppUser {
  uid: string;
  id?: string;
  email: string;
  name: string;
  role: 'developer' | 'admin' | 'teacher' | 'student' | 'parent';
  academyId: string | null;
  academyName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number | string;
  phone?: string;
  isDemo?: boolean;
  readOnly?: boolean;
  authProvider?: string;
  photoURL?: string;
  lastLoginAt?: number;
}

export interface MenuItem {
  icon: string;
  label: string;
  path: string;
  badge?: string;
}

export interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

export const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'main',
    label: 'MAIN',
    items: [
      { icon: '📊', label: 'Dashboard', path: 'dashboard' },
      { icon: '🔔', label: 'Alerts & Notifications', path: 'alerts', badge: 'PRO' },
    ],
  },
  {
    id: 'admission',
    label: 'ADMISSIONS',
    items: [
      { icon: '📝', label: 'New Enquiries', path: 'enquiries', badge: 'PRO' },
      { icon: '✅', label: 'Admissions', path: 'admissions', badge: 'ERP' },
      { icon: '📋', label: 'Batches', path: 'batches', badge: 'PRO' },
    ],
  },
  {
    id: 'students',
    label: 'STUDENTS',
    items: [
      { icon: '👥', label: 'Students Directory', path: 'students' },
      { icon: '🎫', label: 'ID Cards', path: 'id-cards', badge: 'PRO' },
      { icon: '📈', label: 'Promote', path: 'promote' },
    ],
  },
  {
    id: 'academics',
    label: 'ACADEMICS',
    items: [
      { icon: '📚', label: 'Courses', path: 'courses' },
      { icon: '📅', label: 'Academic Calendar', path: 'calendar', badge: 'NEW' },
      { icon: '🕒', label: 'Timetable', path: 'timetable', badge: 'GRID' },
      { icon: '📝', label: 'Exams', path: 'exams' },
      { icon: '📄', label: 'Report Cards', path: 'report-cards', badge: 'PRO' },
      { icon: '📖', label: 'Library', path: 'library' },
    ],
  },
  {
    id: 'attendance',
    label: 'ATTENDANCE',
    items: [
      { icon: '👥', label: 'Student Attend', path: 'attendance' },
      { icon: '👨‍🏫', label: 'Staff Attend', path: 'staff-attendance' },
      { icon: '📝', label: 'Leave Mgmt', path: 'leaves', badge: 'PRO' },
    ],
  },
  {
    id: 'finance',
    label: 'FINANCE',
    items: [
      { icon: '💰', label: 'Fees', path: 'fees', badge: 'PRO' },
      { icon: '💸', label: 'Expenses', path: 'expenses' },
      { icon: '💵', label: 'Payroll', path: 'payroll', badge: 'PRO' },
      { icon: '🚨', label: 'Defaulters', path: 'defaulters' },
    ],
  },
  {
    id: 'ops',
    label: 'OPERATIONS',
    items: [
      { icon: '🎓', label: 'Teacher Zone', path: 'teachers' },
      { icon: '🏫', label: 'Campus', path: 'campus' },
      { icon: '📦', label: 'Inventory', path: 'inventory' },
      { icon: '💬', label: 'Communication', path: 'communication', badge: 'PRO' },
      { icon: '⚙️', label: 'Settings', path: 'settings' },
    ],
  },
];

// Approval System
export type ApprovalStatus = 'Pending Approval' | 'Approved' | 'Rejected';
export type ApprovalModule =
  | 'Admission Confirmed'
  | 'Fee Discount > 500'
  | 'Expense > 5000'
  | 'Staff Leave'
  | 'Student Promotion'
  | 'Marks Final Submit';

export interface ApprovalHistoryItem {
  actor: string;
  role: UserRole;
  action: 'Created' | 'Approved' | 'Rejected' | 'Reviewed';
  timestamp: string;
  reason?: string;
}

export interface ApprovalRequest {
  id: string;
  module: ApprovalModule;
  recordId: string;
  title: string;
  requestedBy: string;
  requestedRole: UserRole;
  currentApproverRole: UserRole;
  amountOrValue?: string;
  status: ApprovalStatus;
  date: string;
  reason?: string;
  history: ApprovalHistoryItem[];
}

// 1. Alerts & Notifications
export interface AlertNotification {
  id: string;
  title: string;
  type:
    | 'Fee Due'
    | 'Exam'
    | 'Admission'
    | 'HR'
    | 'Library'
    | 'General'
    | 'Attendance'
    | 'Student Absenteeism';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  date: string;
  audience: 'All' | 'Teachers' | 'Students' | 'Parents' | 'Staff';
  status: 'New' | 'Pending' | 'Scheduled' | 'Resolved';
  message: string;
  assignedTo: string;
  actionTaken: string;
  studentId?: string;
  rollNo?: string;
  batch?: string;
  consecutiveDays?: number;
  academyId?: string; // 'all' or specific academyId (e.g. 'inst-1')
  academyName?: string;
  postedBy?: string;
  postedByRole?: string;
  postedById?: string;
}

// 2. Enquiries
export interface Enquiry {
  id: string;
  studentName: string;
  fatherName: string;
  phone: string;
  course: string;
  source: 'Walk-in' | 'Facebook' | 'Referral' | 'Poster' | 'WhatsApp' | 'Google';
  status: 'New' | 'Contacted' | 'Follow-up' | 'Admitted' | 'Lost';
  enquiryDate: string;
  followUpDate: string;
  assignedTo: string;
  actionTaken: string;
  remarks: string;
}

// 2b. Admissions
export interface Admission {
  id: string;
  receiptNo: string;
  studentName: string;
  fatherName: string;
  cnic: string;
  phone: string;
  course: string;
  batch: string;
  admissionDate: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  assignedTo: string;
  admissionFee: number;
  discount: number;
  netFee: number;
  remarks: string;
  photoUrl?: string;
}

// 2c. Batches
export interface Batch {
  id: string;
  batchName: string;
  course: string;
  teacher: string;
  room: string;
  capacity: number;
  enrolled: number;
  timing: string;
  status: 'Active' | 'Upcoming' | 'Completed' | 'Cancelled';
  startDate: string;
  endDate: string;
  feeStructure: string;
  remarks: string;
}

// 3. Students
export interface Student {
  id: string;
  rollNo: string;
  name: string;
  fatherName: string;
  classBatch: string;
  course: string;
  phone: string;
  cnic: string;
  admissionDate: string;
  status: 'Active' | 'Inactive' | 'Graduated' | 'Suspended';
  photoUrl: string;
  documents: { title: string; url: string }[];
  address: string;
  bloodGroup: string;
  gender: 'Male' | 'Female' | 'Other';
  feePaidTotal: number;
  feePendingTotal: number;
  customFields?: Record<string, string>;
}

// Custom Field Definition for Students (Admin configurable up to 5)
export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'date';
  placeholder?: string;
  isRequired?: boolean;
  academyId?: string;
  createdAt?: string;
}

// Message Template for Bulk SMS & WhatsApp
export interface MessageTemplate {
  id: string;
  title: string;
  category: 'Fee Reminder' | 'Attendance Alert' | 'Exam Notice' | 'General Announcement' | 'Admission';
  channel: 'SMS' | 'WhatsApp' | 'Push Notification';
  message: string;
  academyId?: string;
  createdDate?: string;
  isSystem?: boolean;
}

// 3b. Promotion Record
export interface PromotionRecord {
  id: string;
  studentId: string;
  studentName: string;
  currentClass: string;
  targetClass: string;
  academicYear: string;
  status: 'Pending' | 'Approved' | 'Promoted' | 'Retained';
  date: string;
  approver: string;
  remarks: string;
}

// 4. Academics - Courses
export interface Course {
  id: string;
  name: string;
  code: string;
  duration: string;
  fee: number;
  subjects: string[];
  department: string;
  status: 'Active' | 'Archived';
  instructor: string;
}

// 4b. Timetable
export interface TimetableSlot {
  id: string;
  batch: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period: number; // 1 to 6
  timing: string;
  subject: string;
  teacher: string;
  room: string;
}

// 4c. Exams
export interface Exam {
  id: string;
  examType: 'Monthly' | 'Term' | 'Final' | 'Surprise Test';
  classBatch: string;
  subject: string;
  maxMarks: number;
  passMarks: number;
  date: string;
  room: string;
  supervisor: string;
  status: 'Scheduled' | 'Completed' | 'Marks Submitted' | 'Published';
}

// 4d. Report Cards
export interface ReportCard {
  id: string;
  rollNo: string;
  studentName: string;
  fatherName: string;
  classBatch: string;
  examType: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  rank: number;
  remarks: string;
  subjectsBreakdown: { subject: string; marks: number; max: number; grade: string }[];
}

// 4e. Library
export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  rackNo: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  issuedTo?: { studentName: string; rollNo: string; issueDate: string; dueDate: string }[];
  finePerDay: number;
}

// 5. Attendance
export interface AttendanceRecord {
  id: string;
  date: string;
  batch: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  status: 'P' | 'A' | 'L'; // Present, Absent, Late
  remarks?: string;
}

// 5b. Staff Attendance
export interface StaffAttendanceRecord {
  id: string;
  date: string;
  staffName: string;
  staffId: string;
  role: string;
  checkIn: string;
  checkOut: string;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave';
  overtimeHours: number;
}

// 5c. Leaves
export interface LeaveRequest {
  id: string;
  applicantType: 'Student' | 'Staff';
  applicantName: string;
  applicantId: string;
  leaveType: 'Sick' | 'Casual' | 'Emergency' | 'Maternity / Paternity';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  appliedDate: string;
}

// 6. Finance - Fees
export interface FeeVoucher {
  id: string;
  voucherNo: string;
  studentName: string;
  rollNo: string;
  batch: string;
  month: string;
  feeHead: 'Admission' | 'Monthly' | 'Exam' | 'Library' | 'Lab' | 'Annual';
  amount: number;
  discount: number;
  fine: number;
  netPayable: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
  paymentMethod: 'Cash' | 'Bank Transfer' | 'EasyPaisa' | 'JazzCash' | 'Cheque';
  paidDate?: string;
  collectedBy: string;
}

// 6b. Expenses
export interface Expense {
  id: string;
  title: string;
  category: 'Rent' | 'Salary' | 'Utility' | 'Stationery' | 'Maintenance' | 'Marketing';
  amount: number;
  date: string;
  paymentMode: 'Cash' | 'Bank' | 'Cheque';
  receiptUrl?: string;
  status: 'Approved' | 'Pending Approval' | 'Rejected';
  approvedBy: string;
  recordedBy: string;
  remarks: string;
}

// 6c. Payroll
export interface PayrollRecord {
  id: string;
  staffName: string;
  designation: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: 'Paid' | 'Pending Approval' | 'Processed';
  paymentDate?: string;
  paymentMethod: string;
}

// 7. Operations - Teachers
export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  specialization: string;
  department: string;
  assignedBatches: string[];
  assignedSubjects: string[];
  joiningDate: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  photoUrl: string;
}

// 7b. Campus
export interface CampusRoom {
  id: string;
  building: string;
  roomNumber: string;
  type: 'Lecture Hall' | 'Computer Lab' | 'Science Lab' | 'Auditorium' | 'Staff Room' | 'Library';
  capacity: number;
  status: 'Available' | 'Occupied' | 'Under Maintenance';
  facilities: string[];
}

// 7c. Inventory
export interface InventoryItem {
  id: string;
  name: string;
  category: 'Stationery' | 'IT Equipment' | 'Furniture' | 'Sports' | 'Lab Consumable';
  currentStock: number;
  minimumThreshold: number;
  unit: string;
  costPerUnit: number;
  location: string;
  lastUpdated: string;
}

// 7d. Communication
export interface CommunicationMessage {
  id: string;
  channel: 'SMS' | 'WhatsApp' | 'Notice Board' | 'Push Notification';
  audience: 'All Students' | 'Selected Batch' | 'All Parents' | 'Faculty';
  targetBatch?: string;
  title: string;
  message: string;
  sentDate: string;
  sentBy: string;
  deliveryStatus: 'Delivered' | 'Queued' | 'Failed';
}

// Audit Log
export interface AuditLog {
  id: string;
  user: string;
  role: UserRole;
  action: string;
  module: string;
  timestamp: string;
  details: string;
  actorId?: string;
  actorEmail?: string;
  targetRecord?: string;
  targetId?: string;
  academyId?: string;
  academyName?: string;
}

// Academic Calendar
export type CalendarEventType = 'Exam' | 'Holiday' | 'Event' | 'Meeting' | 'Sports' | 'Ceremony';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  startTime?: string;
  endTime?: string;
  type: CalendarEventType;
  description?: string;
  location?: string;
  targetAudience?: 'All' | 'Students' | 'Faculty' | 'Parents' | 'Staff';
  classBatch?: string;
  isNationalHoliday?: boolean;
  status?: 'Confirmed' | 'Tentative' | 'Postponed';
}

