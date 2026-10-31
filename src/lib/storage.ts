import { db, isFirebaseEnabled } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  type UserRole,
  type Institution,
  type AlertNotification,
  type Enquiry,
  type Admission,
  type Batch,
  type Student,
  type PromotionRecord,
  type Course,
  type TimetableSlot,
  type Exam,
  type ReportCard,
  type LibraryBook,
  type AttendanceRecord,
  type StaffAttendanceRecord,
  type LeaveRequest,
  type FeeVoucher,
  type Expense,
  type PayrollRecord,
  type Teacher,
  type CampusRoom,
  type InventoryItem,
  type CommunicationMessage,
  type ApprovalRequest,
  type AuditLog,
  type CalendarEvent,
} from '../types';

export const INSTITUTIONS: Institution[] = [
  {
    academyId: 'inst-1',
    academyName: 'Taleem Academy Main Campus (Kandhkot)',
    createdBy: 'developer@hisaabkitaab.com',
    createdAt: 1700000000000,
    isActive: true,
    id: 'inst-1',
    name: 'Taleem Academy Main Campus',
    campusName: 'Kandhkot Campus',
    city: 'Kandhkot',
    address: 'Station Road, Near Post Office, Kandhkot, Sindh, Pakistan',
    phone: '+92 300 1234567',
    email: 'info@taleemacademy.edu.pk',
    code: 'TAK-01',
  },
  {
    academyId: 'inst-2',
    academyName: 'Taleem Science & IT College (Sukkur)',
    createdBy: 'developer@hisaabkitaab.com',
    createdAt: 1700000000000,
    isActive: true,
    id: 'inst-2',
    name: 'Taleem Science & IT College',
    campusName: 'Sukkur Campus',
    city: 'Sukkur',
    address: 'Military Road, Sukkur, Sindh, Pakistan',
    phone: '+92 333 9876543',
    email: 'sukkur@taleemacademy.edu.pk',
    code: 'TSK-02',
  },
  {
    academyId: 'inst-3',
    academyName: 'Taleem Girls Higher Academy (Kashmore)',
    createdBy: 'developer@hisaabkitaab.com',
    createdAt: 1700000000000,
    isActive: true,
    id: 'inst-3',
    name: 'Taleem Girls Higher Academy',
    campusName: 'Kashmore Campus',
    city: 'Kashmore',
    address: 'Bypass Road, Kashmore, Sindh, Pakistan',
    phone: '+92 312 4455667',
    email: 'girls@taleemacademy.edu.pk',
    code: 'TGK-03',
  },
];

const STORAGE_KEY = 'taleemos_hub_v5_store';

export interface ERPStoreState {
  activeInstitutionId: string;
  activeRole: UserRole;
  userName: string;
  alerts: AlertNotification[];
  enquiries: Enquiry[];
  admissions: Admission[];
  batches: Batch[];
  students: Student[];
  promotions: PromotionRecord[];
  courses: Course[];
  timetables: TimetableSlot[];
  exams: Exam[];
  reportCards: ReportCard[];
  library: LibraryBook[];
  attendance: AttendanceRecord[];
  staffAttendance: StaffAttendanceRecord[];
  leaves: LeaveRequest[];
  fees: FeeVoucher[];
  expenses: Expense[];
  payroll: PayrollRecord[];
  teachers: Teacher[];
  campus: CampusRoom[];
  inventory: InventoryItem[];
  communications: CommunicationMessage[];
  approvals: ApprovalRequest[];
  auditLogs: AuditLog[];
  calendarEvents: CalendarEvent[];
}

export const INITIAL_DATA: ERPStoreState = {
  activeInstitutionId: 'inst-1',
  activeRole: 'Super Admin',
  userName: 'Prof. Ghulam Rasool (Director)',
  alerts: [
    {
      id: 'ALT-101',
      title: 'Fee Collection Due for October 2026',
      type: 'Fee Due',
      priority: 'Critical',
      date: '2026-10-24',
      audience: 'Students',
      status: 'New',
      message: 'Monthly tuition fees for October must be cleared by 28th October to avoid PKR 200 late fine.',
      assignedTo: 'Accountant (M. Ali)',
      actionTaken: 'SMS reminders queued for 14 defaulters.',
    },
    {
      id: 'ALT-ABS-TAK-26-003',
      title: 'Consecutive Absence Alert: Shahzaib Khan Bangash (TAK-26-003)',
      type: 'Student Absenteeism',
      priority: 'Critical',
      date: '2026-10-24',
      audience: 'Parents',
      status: 'Pending',
      message: 'Automated Attendance Alert: Student Shahzaib Khan Bangash (Roll # TAK-26-003) has missed 4 consecutive classes in Batch 2026-A (Morning) from 21st to 24th October without approved leave. Mandatory parent conference required.',
      assignedTo: 'Attendance Coordinator (Asma Bibi)',
      actionTaken: 'Parent WhatsApp notice prepared; academic dean alerted.',
      studentId: 'STU-1003',
      rollNo: 'TAK-26-003',
      batch: 'Batch 2026-A (Morning)',
      consecutiveDays: 4,
    },
    {
      id: 'ALT-102',
      title: 'Mid-Term Examination Schedule Announced',
      type: 'Exam',
      priority: 'High',
      date: '2026-10-22',
      audience: 'All',
      status: 'Pending',
      message: 'Pre-Medical & Computer Science batches mid-term examinations commence from 5th November.',
      assignedTo: 'Academic Coordinator',
      actionTaken: 'Date sheet draft submitted for Principal approval.',
    },
    {
      id: 'ALT-103',
      title: 'Science Lab Chemical Restock Required',
      type: 'General',
      priority: 'Medium',
      date: '2026-10-20',
      audience: 'Staff',
      status: 'Scheduled',
      message: 'Hydrochloric acid and test tubes running low in Chemistry Lab 2.',
      assignedTo: 'Lab Assistant Tariq',
      actionTaken: 'Purchase requisition of PKR 12,500 submitted to accounts.',
    },
    {
      id: 'ALT-104',
      title: 'Faculty Monthly Meeting',
      type: 'HR',
      priority: 'Low',
      date: '2026-10-18',
      audience: 'Teachers',
      status: 'Resolved',
      message: 'All heads of departments gathered to review curriculum progression.',
      assignedTo: 'Principal Office',
      actionTaken: 'Minutes circulated to faculty members via WhatsApp group.',
    },
  ],
  enquiries: [
    {
      id: 'ENQ-201',
      studentName: 'Zubair Ahmed Channa',
      fatherName: 'Bashir Ahmed',
      phone: '+92 301 2345678',
      course: 'F.Sc Pre-Engineering',
      source: 'Walk-in',
      status: 'Contacted',
      enquiryDate: '2026-10-23',
      followUpDate: '2026-10-26',
      assignedTo: 'Receptionist Asma',
      actionTaken: 'Shared prospectus and fee structure via WhatsApp',
      remarks: 'Interested in morning batch; requested sibling discount inquiry',
    },
    {
      id: 'ENQ-202',
      studentName: 'Sanaullah Lashari',
      fatherName: 'Allah Dino Lashari',
      phone: '+92 313 7654321',
      course: 'ICS (Computer Science)',
      source: 'Facebook',
      status: 'New',
      enquiryDate: '2026-10-24',
      followUpDate: '2026-10-25',
      assignedTo: 'Receptionist Asma',
      actionTaken: 'Lead registered through Facebook Page form',
      remarks: 'Wants admission in Python & Web Development elective',
    },
    {
      id: 'ENQ-203',
      studentName: 'Ayesha Bibi',
      fatherName: 'Abdul Kareem',
      phone: '+92 334 1122334',
      course: 'F.Sc Pre-Medical',
      source: 'Referral',
      status: 'Follow-up',
      enquiryDate: '2026-10-21',
      followUpDate: '2026-10-25',
      assignedTo: 'Counselor Farhan',
      actionTaken: 'Parent visited campus; campus tour completed',
      remarks: 'Scored 94% in Matric BISE Larkana; applying for merit scholarship',
    },
    {
      id: 'ENQ-204',
      studentName: 'Farhan Ali Khoso',
      fatherName: 'Mumtaz Ali Khoso',
      phone: '+92 305 9988776',
      course: 'Full-Stack Web Development',
      source: 'WhatsApp',
      status: 'Admitted',
      enquiryDate: '2026-10-15',
      followUpDate: '2026-10-18',
      assignedTo: 'Counselor Farhan',
      actionTaken: 'Converted to Admission REC-1004',
      remarks: 'Paid admission fee and registered for Batch-A',
    },
    {
      id: 'ENQ-205',
      studentName: 'Komal Solangi',
      fatherName: 'Ghulam Qadir Solangi',
      phone: '+92 321 4455667',
      course: 'CIT (Information Tech Diploma)',
      source: 'Poster',
      status: 'Lost',
      enquiryDate: '2026-10-10',
      followUpDate: '2026-10-14',
      assignedTo: 'Receptionist Asma',
      actionTaken: 'Called twice, timing conflict with university',
      remarks: 'Cannot attend 9:00 AM slot; suggested weekend class',
    },
  ],
  admissions: [
    {
      id: 'ADM-1001',
      receiptNo: 'REC-1001',
      studentName: 'Muhammad Hamza Malik',
      fatherName: 'Malik Abdul Rehman',
      cnic: '43102-1234567-1',
      phone: '+92 300 7861122',
      course: 'F.Sc Pre-Engineering',
      batch: 'Batch 2026-A (Morning)',
      admissionDate: '2026-10-10',
      status: 'Confirmed',
      assignedTo: 'Front Desk Asma',
      admissionFee: 8000,
      discount: 1000,
      netFee: 7000,
      remarks: 'Merit scholarship discount applied. Documents verified.',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'ADM-1002',
      receiptNo: 'REC-1002',
      studentName: 'Dua Fatima Soomro',
      fatherName: 'Dr. Imtiaz Ahmed Soomro',
      cnic: '43102-8765432-2',
      phone: '+92 333 4455889',
      course: 'F.Sc Pre-Medical',
      batch: 'Batch 2026-B (Morning)',
      admissionDate: '2026-10-12',
      status: 'Confirmed',
      assignedTo: 'Counselor Farhan',
      admissionFee: 8500,
      discount: 500,
      netFee: 8000,
      remarks: 'Full payment cleared via Bank deposit.',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'ADM-1003',
      receiptNo: 'REC-1003',
      studentName: 'Shahzaib Khan Bangash',
      fatherName: 'Jahangir Khan',
      cnic: '43102-9988112-3',
      phone: '+92 312 6677889',
      course: 'ICS (Computer Science)',
      batch: 'Batch 2026-C (Afternoon)',
      admissionDate: '2026-10-14',
      status: 'Confirmed',
      assignedTo: 'Counselor Farhan',
      admissionFee: 7500,
      discount: 0,
      netFee: 7500,
      remarks: 'Regular admission without concession.',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'ADM-1004',
      receiptNo: 'REC-1004',
      studentName: 'Farhan Ali Khoso',
      fatherName: 'Mumtaz Ali Khoso',
      cnic: '43102-3344556-5',
      phone: '+92 305 9988776',
      course: 'Full-Stack Web Development',
      batch: 'Batch Web-04 (Evening)',
      admissionDate: '2026-10-18',
      status: 'Confirmed',
      assignedTo: 'Front Desk Asma',
      admissionFee: 12000,
      discount: 2000,
      netFee: 10000,
      remarks: 'Early bird promotion discount PKR 2,000.',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'ADM-1005',
      receiptNo: 'REC-1005',
      studentName: 'Mehwish Tariq Mahar',
      fatherName: 'Tariq Hussain Mahar',
      cnic: '43102-5566778-4',
      phone: '+92 345 8899001',
      course: 'CIT (Information Tech Diploma)',
      batch: 'Batch CIT-11 (Morning)',
      admissionDate: '2026-10-21',
      status: 'Pending',
      assignedTo: 'Receptionist Asma',
      admissionFee: 6500,
      discount: 500,
      netFee: 6000,
      remarks: 'Awaiting intermediate certificate copy for final verification.',
      photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'ADM-1006',
      receiptNo: 'REC-1006',
      studentName: 'Bilawal Bhutto Jamali',
      fatherName: 'Sikandar Jamali',
      cnic: '43102-4433221-9',
      phone: '+92 308 1239874',
      course: 'English Language & IELTS',
      batch: 'Batch IELTS-07 (Evening)',
      admissionDate: '2026-10-23',
      status: 'Pending',
      assignedTo: 'Receptionist Asma',
      admissionFee: 9000,
      discount: 1000,
      netFee: 8000,
      remarks: 'Discount > 500 submitted for Director approval.',
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    },
  ],
  batches: [
    {
      id: 'BAT-01',
      batchName: 'Batch 2026-A (Morning)',
      course: 'F.Sc Pre-Engineering',
      teacher: 'Sir Saeed Ahmed (Physics)',
      room: 'Room 101 - Lecture Hall A',
      capacity: 40,
      enrolled: 38,
      timing: '08:00 AM - 01:00 PM',
      status: 'Active',
      startDate: '2026-09-01',
      endDate: '2027-05-30',
      feeStructure: 'PKR 4,500/Month',
      remarks: '95% full. High academic performance cohort.',
    },
    {
      id: 'BAT-02',
      batchName: 'Batch 2026-B (Morning)',
      course: 'F.Sc Pre-Medical',
      teacher: 'Dr. Naila Jatoi (Biology)',
      room: 'Room 102 - Bio Lab Annex',
      capacity: 45,
      enrolled: 45,
      timing: '08:00 AM - 01:00 PM',
      status: 'Active',
      startDate: '2026-09-01',
      endDate: '2027-05-30',
      feeStructure: 'PKR 5,000/Month',
      remarks: 'Batch is 100% full. Waiting list active.',
    },
    {
      id: 'BAT-03',
      batchName: 'Batch 2026-C (Afternoon)',
      course: 'ICS (Computer Science)',
      teacher: 'Engr. Waqas Chachar (CS)',
      room: 'Lab 01 - Computer Center',
      capacity: 35,
      enrolled: 28,
      timing: '01:30 PM - 05:30 PM',
      status: 'Active',
      startDate: '2026-09-15',
      endDate: '2027-06-15',
      feeStructure: 'PKR 4,800/Month',
      remarks: '80% capacity reached. 7 seats available.',
    },
    {
      id: 'BAT-04',
      batchName: 'Batch Web-04 (Evening)',
      course: 'Full-Stack Web Development',
      teacher: 'Sir Danish Ali (MERN Stack)',
      room: 'Lab 02 - Coding Studio',
      capacity: 25,
      enrolled: 18,
      timing: '05:30 PM - 07:30 PM',
      status: 'Active',
      startDate: '2026-10-01',
      endDate: '2027-03-31',
      feeStructure: 'PKR 6,000/Month',
      remarks: 'Hands-on practical sessions in React & Node.js.',
    },
    {
      id: 'BAT-05',
      batchName: 'Batch CIT-11 (Morning)',
      course: 'CIT (Information Tech Diploma)',
      teacher: 'Miss Samina Shaikh (Office & IT)',
      room: 'Lab 01 - Computer Center',
      capacity: 30,
      enrolled: 22,
      timing: '09:00 AM - 11:30 AM',
      status: 'Active',
      startDate: '2026-09-20',
      endDate: '2027-03-20',
      feeStructure: 'PKR 3,500/Month',
      remarks: 'SBAAC certification preparatory batch.',
    },
    {
      id: 'BAT-06',
      batchName: 'Batch IELTS-07 (Evening)',
      course: 'English Language & IELTS',
      teacher: 'Prof. Javed Akhtar (Linguistics)',
      room: 'Room 204 - Seminar Room',
      capacity: 25,
      enrolled: 12,
      timing: '06:00 PM - 08:00 PM',
      status: 'Upcoming',
      startDate: '2026-11-01',
      endDate: '2027-02-01',
      feeStructure: 'PKR 5,500/Month',
      remarks: 'Registrations open. 13 seats remaining.',
    },
  ],
  students: [
    {
      id: 'STU-1001',
      rollNo: 'TAK-26-001',
      name: 'Muhammad Hamza Malik',
      fatherName: 'Malik Abdul Rehman',
      classBatch: 'Batch 2026-A (Morning)',
      course: 'F.Sc Pre-Engineering',
      phone: '+92 300 7861122',
      cnic: '43102-1234567-1',
      admissionDate: '2026-10-10',
      status: 'Active',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
      documents: [
        { title: 'Matric Certificate', url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400' },
        { title: 'Father CNIC Copy', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400' },
      ],
      address: 'Mohalla Balochabad, Kandhkot',
      bloodGroup: 'B+',
      gender: 'Male',
      feePaidTotal: 16000,
      feePendingTotal: 0,
    },
    {
      id: 'STU-1002',
      rollNo: 'TAK-26-002',
      name: 'Dua Fatima Soomro',
      fatherName: 'Dr. Imtiaz Ahmed Soomro',
      classBatch: 'Batch 2026-B (Morning)',
      course: 'F.Sc Pre-Medical',
      phone: '+92 333 4455889',
      cnic: '43102-8765432-2',
      admissionDate: '2026-10-12',
      status: 'Active',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      documents: [
        { title: 'Matric Marksheet', url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400' },
      ],
      address: 'Civil Hospital Road, Kandhkot',
      bloodGroup: 'O+',
      gender: 'Female',
      feePaidTotal: 18000,
      feePendingTotal: 0,
    },
    {
      id: 'STU-1003',
      rollNo: 'TAK-26-003',
      name: 'Shahzaib Khan Bangash',
      fatherName: 'Jahangir Khan',
      classBatch: 'Batch 2026-C (Afternoon)',
      course: 'ICS (Computer Science)',
      phone: '+92 312 6677889',
      cnic: '43102-9988112-3',
      admissionDate: '2026-10-14',
      status: 'Active',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      documents: [],
      address: 'Main Bazaar, Kandhkot',
      bloodGroup: 'A+',
      gender: 'Male',
      feePaidTotal: 12300,
      feePendingTotal: 4800,
    },
    {
      id: 'STU-1004',
      rollNo: 'TAK-26-004',
      name: 'Farhan Ali Khoso',
      fatherName: 'Mumtaz Ali Khoso',
      classBatch: 'Batch Web-04 (Evening)',
      course: 'Full-Stack Web Development',
      phone: '+92 305 9988776',
      cnic: '43102-3344556-5',
      admissionDate: '2026-10-18',
      status: 'Active',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      documents: [],
      address: 'Ghauspur Road, Kandhkot',
      bloodGroup: 'AB+',
      gender: 'Male',
      feePaidTotal: 16000,
      feePendingTotal: 0,
    },
    {
      id: 'STU-1005',
      rollNo: 'TAK-26-005',
      name: 'Mehwish Tariq Mahar',
      fatherName: 'Tariq Hussain Mahar',
      classBatch: 'Batch CIT-11 (Morning)',
      course: 'CIT (Information Tech Diploma)',
      phone: '+92 345 8899001',
      cnic: '43102-5566778-4',
      admissionDate: '2026-10-21',
      status: 'Active',
      photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80',
      documents: [],
      address: 'Station Colony, Kandhkot',
      bloodGroup: 'O-',
      gender: 'Female',
      feePaidTotal: 9500,
      feePendingTotal: 3500,
    },
  ],
  promotions: [
    {
      id: 'PRO-101',
      studentId: 'STU-1001',
      studentName: 'Muhammad Hamza Malik',
      currentClass: '1st Year F.Sc Engineering',
      targetClass: '2nd Year F.Sc Engineering',
      academicYear: '2026-2027',
      status: 'Pending',
      date: '2026-10-20',
      approver: 'Principal Office',
      remarks: 'Cleared annual exams with 87% marks; eligible for promotion.',
    },
    {
      id: 'PRO-102',
      studentId: 'STU-1002',
      studentName: 'Dua Fatima Soomro',
      currentClass: '1st Year F.Sc Medical',
      targetClass: '2nd Year F.Sc Medical',
      academicYear: '2026-2027',
      status: 'Approved',
      date: '2026-10-18',
      approver: 'Principal Dr. Qureshi',
      remarks: 'Top scorer (93%) in college midterm assessment.',
    },
  ],
  courses: [
    {
      id: 'CRS-01',
      name: 'F.Sc Pre-Engineering',
      code: 'FSC-ENG',
      duration: '2 Years',
      fee: 4500,
      subjects: ['Physics', 'Chemistry', 'Mathematics', 'English', 'Urdu', 'Islamiat'],
      department: 'Science & Engineering',
      status: 'Active',
      instructor: 'Sir Saeed Ahmed',
    },
    {
      id: 'CRS-02',
      name: 'F.Sc Pre-Medical',
      code: 'FSC-MED',
      duration: '2 Years',
      fee: 5000,
      subjects: ['Physics', 'Chemistry', 'Biology', 'English', 'Urdu', 'Pak Studies'],
      department: 'Medical & Life Sciences',
      status: 'Active',
      instructor: 'Dr. Naila Jatoi',
    },
    {
      id: 'CRS-03',
      name: 'ICS (Computer Science)',
      code: 'ICS-CS',
      duration: '2 Years',
      fee: 4800,
      subjects: ['Computer Science', 'Mathematics', 'Physics/Statistics', 'English', 'Urdu'],
      department: 'Information Technology',
      status: 'Active',
      instructor: 'Engr. Waqas Chachar',
    },
    {
      id: 'CRS-04',
      name: 'Full-Stack Web Development',
      code: 'WEB-DEV',
      duration: '6 Months',
      fee: 6000,
      subjects: ['HTML/CSS/Tailwind', 'JavaScript & TypeScript', 'React.js', 'Node & Express', 'MongoDB/Postgres'],
      department: 'Software Engineering',
      status: 'Active',
      instructor: 'Sir Danish Ali',
    },
    {
      id: 'CRS-05',
      name: 'CIT (Information Tech Diploma)',
      code: 'CIT-DIP',
      duration: '6 Months',
      fee: 3500,
      subjects: ['Office Automation', 'Graphic Design Basics', 'Database Fundamentals', 'Networking'],
      department: 'Vocational Training',
      status: 'Active',
      instructor: 'Miss Samina Shaikh',
    },
    {
      id: 'CRS-06',
      name: 'English Language & IELTS',
      code: 'ENG-IELTS',
      duration: '3 Months',
      fee: 5500,
      subjects: ['Grammar & Vocab', 'Spoken English', 'Listening Modules', 'Academic Writing'],
      department: 'Languages',
      status: 'Active',
      instructor: 'Prof. Javed Akhtar',
    },
  ],
  timetables: [
    { id: 'TT-01', batch: 'Batch 2026-A (Morning)', day: 'Monday', period: 1, timing: '08:00 - 08:50', subject: 'Mathematics', teacher: 'Sir Saeed Ahmed', room: 'Room 101' },
    { id: 'TT-02', batch: 'Batch 2026-A (Morning)', day: 'Monday', period: 2, timing: '08:50 - 09:40', subject: 'Physics', teacher: 'Prof. Ghulam Rasool', room: 'Room 101' },
    { id: 'TT-03', batch: 'Batch 2026-A (Morning)', day: 'Monday', period: 3, timing: '09:40 - 10:30', subject: 'Chemistry', teacher: 'Dr. Tariq Abbasi', room: 'Lab 02' },
    { id: 'TT-04', batch: 'Batch 2026-A (Morning)', day: 'Monday', period: 4, timing: '10:50 - 11:40', subject: 'English Compulsory', teacher: 'Prof. Javed Akhtar', room: 'Room 101' },
    { id: 'TT-05', batch: 'Batch 2026-A (Morning)', day: 'Monday', period: 5, timing: '11:40 - 12:30', subject: 'Physics Practical', teacher: 'Sir Saeed Ahmed', room: 'Physics Lab' },
    { id: 'TT-06', batch: 'Batch 2026-A (Morning)', day: 'Monday', period: 6, timing: '12:30 - 01:15', subject: 'Islamiat', teacher: 'Moulana Riaz', room: 'Room 101' },
  ],
  exams: [
    {
      id: 'EXM-101',
      examType: 'Monthly',
      classBatch: 'Batch 2026-A (Morning)',
      subject: 'Mathematics (Calculus & Vectors)',
      maxMarks: 50,
      passMarks: 20,
      date: '2026-10-28',
      room: 'Room 101',
      supervisor: 'Sir Saeed Ahmed',
      status: 'Scheduled',
    },
    {
      id: 'EXM-102',
      examType: 'Monthly',
      classBatch: 'Batch 2026-B (Morning)',
      subject: 'Biology (Cell Biology & Genetics)',
      maxMarks: 50,
      passMarks: 20,
      date: '2026-10-29',
      room: 'Room 102',
      supervisor: 'Dr. Naila Jatoi',
      status: 'Scheduled',
    },
    {
      id: 'EXM-103',
      examType: 'Term',
      classBatch: 'Batch Web-04 (Evening)',
      subject: 'React.js & Frontend Architecture',
      maxMarks: 100,
      passMarks: 50,
      date: '2026-10-15',
      room: 'Lab 02',
      supervisor: 'Sir Danish Ali',
      status: 'Marks Submitted',
    },
  ],
  reportCards: [
    {
      id: 'REP-101',
      rollNo: 'TAK-26-001',
      studentName: 'Muhammad Hamza Malik',
      fatherName: 'Malik Abdul Rehman',
      classBatch: 'Batch 2026-A (Morning)',
      examType: '1st Quarter Evaluation',
      marksObtained: 442,
      maxMarks: 500,
      percentage: 88.4,
      grade: 'A+',
      rank: 2,
      remarks: 'Outstanding analytical skills in Mathematics and Physics.',
      subjectsBreakdown: [
        { subject: 'Physics', marks: 92, max: 100, grade: 'A+' },
        { subject: 'Mathematics', marks: 96, max: 100, grade: 'A+' },
        { subject: 'Chemistry', marks: 84, max: 100, grade: 'A' },
        { subject: 'English', marks: 82, max: 100, grade: 'A' },
        { subject: 'Islamiat', marks: 88, max: 100, grade: 'A+' },
      ],
    },
    {
      id: 'REP-102',
      rollNo: 'TAK-26-002',
      studentName: 'Dua Fatima Soomro',
      fatherName: 'Dr. Imtiaz Ahmed Soomro',
      classBatch: 'Batch 2026-B (Morning)',
      examType: '1st Quarter Evaluation',
      marksObtained: 468,
      maxMarks: 500,
      percentage: 93.6,
      grade: 'A+',
      rank: 1,
      remarks: 'Class topper with consistent top percentile in all disciplines.',
      subjectsBreakdown: [
        { subject: 'Biology', marks: 98, max: 100, grade: 'A+' },
        { subject: 'Chemistry', marks: 94, max: 100, grade: 'A+' },
        { subject: 'Physics', marks: 90, max: 100, grade: 'A+' },
        { subject: 'English', marks: 92, max: 100, grade: 'A+' },
        { subject: 'Pak Studies', marks: 94, max: 100, grade: 'A+' },
      ],
    },
  ],
  library: [
    {
      id: 'LIB-01',
      title: 'Halliday & Resnick Fundamentals of Physics (10th Ed)',
      author: 'David Halliday, Jearl Walker',
      isbn: '978-1118230718',
      rackNo: 'PHY-04-A',
      category: 'Physics',
      totalQuantity: 15,
      availableQuantity: 12,
      finePerDay: 20,
      issuedTo: [
        { studentName: 'Muhammad Hamza Malik', rollNo: 'TAK-26-001', issueDate: '2026-10-15', dueDate: '2026-10-29' },
      ],
    },
    {
      id: 'LIB-02',
      title: 'Thomas Calculus (Early Transcendentals)',
      author: 'George B. Thomas',
      isbn: '978-0134439020',
      rackNo: 'MTH-02-B',
      category: 'Mathematics',
      totalQuantity: 20,
      availableQuantity: 14,
      finePerDay: 20,
    },
    {
      id: 'LIB-03',
      title: 'Guyton and Hall Textbook of Medical Physiology',
      author: 'John E. Hall',
      isbn: '978-1455770052',
      rackNo: 'BIO-01-C',
      category: 'Biology & Medicine',
      totalQuantity: 8,
      availableQuantity: 6,
      finePerDay: 30,
    },
    {
      id: 'LIB-04',
      title: 'Eloquent JavaScript (3rd Edition)',
      author: 'Marijn Haverbeke',
      isbn: '978-1593279509',
      rackNo: 'CS-03-D',
      category: 'Computer Science',
      totalQuantity: 10,
      availableQuantity: 8,
      finePerDay: 25,
    },
  ],
  attendance: [
    { id: 'ATT-001', date: '2026-10-21', batch: 'Batch 2026-A (Morning)', studentId: 'STU-1001', studentName: 'Muhammad Hamza Malik', rollNo: 'TAK-26-001', status: 'P' },
    { id: 'ATT-002', date: '2026-10-21', batch: 'Batch 2026-A (Morning)', studentId: 'STU-1003', studentName: 'Shahzaib Khan Bangash', rollNo: 'TAK-26-003', status: 'A', remarks: 'Unexcused absence' },
    { id: 'ATT-003', date: '2026-10-22', batch: 'Batch 2026-A (Morning)', studentId: 'STU-1001', studentName: 'Muhammad Hamza Malik', rollNo: 'TAK-26-001', status: 'P' },
    { id: 'ATT-004', date: '2026-10-22', batch: 'Batch 2026-A (Morning)', studentId: 'STU-1003', studentName: 'Shahzaib Khan Bangash', rollNo: 'TAK-26-003', status: 'A', remarks: 'Unexcused absence' },
    { id: 'ATT-005', date: '2026-10-23', batch: 'Batch 2026-A (Morning)', studentId: 'STU-1001', studentName: 'Muhammad Hamza Malik', rollNo: 'TAK-26-001', status: 'P' },
    { id: 'ATT-006', date: '2026-10-23', batch: 'Batch 2026-A (Morning)', studentId: 'STU-1003', studentName: 'Shahzaib Khan Bangash', rollNo: 'TAK-26-003', status: 'A', remarks: 'Unexcused absence' },
    { id: 'ATT-01', date: '2026-10-24', batch: 'Batch 2026-A (Morning)', studentId: 'STU-1001', studentName: 'Muhammad Hamza Malik', rollNo: 'TAK-26-001', status: 'P' },
    { id: 'ATT-02', date: '2026-10-24', batch: 'Batch 2026-A (Morning)', studentId: 'STU-1003', studentName: 'Shahzaib Khan Bangash', rollNo: 'TAK-26-003', status: 'A', remarks: 'Consecutive absence day 4' },
    { id: 'ATT-03', date: '2026-10-24', batch: 'Batch 2026-B (Morning)', studentId: 'STU-1002', studentName: 'Dua Fatima Soomro', rollNo: 'TAK-26-002', status: 'P' },
    { id: 'ATT-04', date: '2026-10-24', batch: 'Batch Web-04 (Evening)', studentId: 'STU-1004', studentName: 'Farhan Ali Khoso', rollNo: 'TAK-26-004', status: 'P' },
    { id: 'ATT-05', date: '2026-10-24', batch: 'Batch CIT-11 (Morning)', studentId: 'STU-1005', studentName: 'Mehwish Tariq Mahar', rollNo: 'TAK-26-005', status: 'L', remarks: 'Arrived 15 mins late' },
  ],
  staffAttendance: [
    { id: 'SA-01', date: '2026-10-24', staffName: 'Prof. Ghulam Rasool', staffId: 'STF-01', role: 'Director / Senior Physics Faculty', checkIn: '07:45 AM', checkOut: '03:15 PM', status: 'Present', overtimeHours: 1.5 },
    { id: 'SA-02', date: '2026-10-24', staffName: 'Dr. Naila Jatoi', staffId: 'STF-02', role: 'Head of Biology', checkIn: '07:55 AM', checkOut: '02:00 PM', status: 'Present', overtimeHours: 0 },
    { id: 'SA-03', date: '2026-10-24', staffName: 'Engr. Waqas Chachar', staffId: 'STF-03', role: 'Lead IT Instructor', checkIn: '08:15 AM', checkOut: '05:30 PM', status: 'Late', overtimeHours: 2.0 },
    { id: 'SA-04', date: '2026-10-24', staffName: 'Muhammad Ali', staffId: 'STF-04', role: 'Accountant', checkIn: '08:30 AM', checkOut: '04:30 PM', status: 'Present', overtimeHours: 0.5 },
    { id: 'SA-05', date: '2026-10-24', staffName: 'Asma Bibi', staffId: 'STF-05', role: 'Front Desk Receptionist', checkIn: '07:50 AM', checkOut: '04:00 PM', status: 'Present', overtimeHours: 0 },
  ],
  leaves: [
    {
      id: 'LEV-101',
      applicantType: 'Staff',
      applicantName: 'Engr. Waqas Chachar',
      applicantId: 'STF-03',
      leaveType: 'Casual',
      startDate: '2026-10-27',
      endDate: '2026-10-28',
      totalDays: 2,
      reason: 'Attending IEEE AI & Cloud Summit in Karachi.',
      status: 'Pending',
      appliedDate: '2026-10-23',
    },
    {
      id: 'LEV-102',
      applicantType: 'Student',
      applicantName: 'Shahzaib Khan Bangash',
      applicantId: 'STU-1003',
      leaveType: 'Sick',
      startDate: '2026-10-24',
      endDate: '2026-10-25',
      totalDays: 2,
      reason: 'Diagnosed with seasonal viral fever; physician advised rest.',
      status: 'Approved',
      approvedBy: 'Principal Dr. Qureshi',
      appliedDate: '2026-10-23',
    },
  ],
  fees: [
    {
      id: 'FEE-1001',
      voucherNo: 'VCH-26-801',
      studentName: 'Muhammad Hamza Malik',
      rollNo: 'TAK-26-001',
      batch: 'Batch 2026-A (Morning)',
      month: 'October 2026',
      feeHead: 'Monthly',
      amount: 4500,
      discount: 0,
      fine: 0,
      netPayable: 4500,
      status: 'Paid',
      paymentMethod: 'Bank Transfer',
      paidDate: '2026-10-10',
      collectedBy: 'Accountant M. Ali',
    },
    {
      id: 'FEE-1002',
      voucherNo: 'VCH-26-802',
      studentName: 'Dua Fatima Soomro',
      rollNo: 'TAK-26-002',
      batch: 'Batch 2026-B (Morning)',
      month: 'October 2026',
      feeHead: 'Monthly',
      amount: 5000,
      discount: 500,
      fine: 0,
      netPayable: 4500,
      status: 'Paid',
      paymentMethod: 'Cash',
      paidDate: '2026-10-12',
      collectedBy: 'Accountant M. Ali',
    },
    {
      id: 'FEE-1003',
      voucherNo: 'VCH-26-803',
      studentName: 'Shahzaib Khan Bangash',
      rollNo: 'TAK-26-003',
      batch: 'Batch 2026-C (Afternoon)',
      month: 'October 2026',
      feeHead: 'Monthly',
      amount: 4800,
      discount: 0,
      fine: 0,
      netPayable: 4800,
      status: 'Unpaid',
      paymentMethod: 'Cash',
      collectedBy: 'Accountant M. Ali',
    },
    {
      id: 'FEE-1004',
      voucherNo: 'VCH-26-804',
      studentName: 'Mehwish Tariq Mahar',
      rollNo: 'TAK-26-005',
      batch: 'Batch CIT-11 (Morning)',
      month: 'October 2026',
      feeHead: 'Monthly',
      amount: 3500,
      discount: 0,
      fine: 200,
      netPayable: 3700,
      status: 'Partial',
      paymentMethod: 'EasyPaisa',
      paidDate: '2026-10-22',
      collectedBy: 'Front Desk Asma',
    },
  ],
  expenses: [
    {
      id: 'EXP-101',
      title: 'Campus High-Speed Fiber Internet Bill',
      category: 'Utility',
      amount: 14500,
      date: '2026-10-15',
      paymentMode: 'Bank',
      status: 'Approved',
      approvedBy: 'Director Prof. Ghulam Rasool',
      recordedBy: 'Accountant M. Ali',
      remarks: 'PTCL Enterprise 100Mbps dedicated connection for IT Labs',
    },
    {
      id: 'EXP-102',
      title: 'Examination Answer Sheets Printing (5000 copies)',
      category: 'Stationery',
      amount: 28000,
      date: '2026-10-18',
      paymentMode: 'Cheque',
      status: 'Approved',
      approvedBy: 'Director Prof. Ghulam Rasool',
      recordedBy: 'Accountant M. Ali',
      remarks: 'Printed from Al-Mehran Printing Press Kandhkot',
    },
    {
      id: 'EXP-103',
      title: 'Chemistry Lab Consumable Reagents Purchase',
      category: 'Maintenance',
      amount: 12500,
      date: '2026-10-23',
      paymentMode: 'Cash',
      status: 'Pending Approval',
      approvedBy: 'Awaiting Director Approval (> 5000 rule)',
      recordedBy: 'Accountant M. Ali',
      remarks: 'Lab reagents invoice #9921 from Karachi Scientific',
    },
  ],
  payroll: [
    {
      id: 'PAY-101',
      staffName: 'Prof. Ghulam Rasool',
      designation: 'Director & Academic Dean',
      month: 'September 2026',
      basicSalary: 95000,
      allowances: 15000,
      deductions: 5000,
      netPay: 105000,
      status: 'Paid',
      paymentDate: '2026-10-01',
      paymentMethod: 'Direct Bank Transfer',
    },
    {
      id: 'PAY-102',
      staffName: 'Dr. Naila Jatoi',
      designation: 'Senior Biology Lecturer',
      month: 'September 2026',
      basicSalary: 70000,
      allowances: 8000,
      deductions: 2000,
      netPay: 76000,
      status: 'Paid',
      paymentDate: '2026-10-01',
      paymentMethod: 'Bank Transfer',
    },
    {
      id: 'PAY-103',
      staffName: 'Engr. Waqas Chachar',
      designation: 'Computer Science Instructor',
      month: 'September 2026',
      basicSalary: 65000,
      allowances: 7000,
      deductions: 0,
      netPay: 72000,
      status: 'Paid',
      paymentDate: '2026-10-01',
      paymentMethod: 'Bank Transfer',
    },
    {
      id: 'PAY-104',
      staffName: 'Muhammad Ali',
      designation: 'Chief Accountant',
      month: 'September 2026',
      basicSalary: 45000,
      allowances: 5000,
      deductions: 1000,
      netPay: 49000,
      status: 'Paid',
      paymentDate: '2026-10-01',
      paymentMethod: 'Cheque',
    },
    {
      id: 'PAY-105',
      staffName: 'Asma Bibi',
      designation: 'Front Desk Officer',
      month: 'October 2026',
      basicSalary: 30000,
      allowances: 3000,
      deductions: 500,
      netPay: 32500,
      status: 'Pending Approval',
      paymentMethod: 'Cash',
    },
  ],
  teachers: [
    {
      id: 'TCH-01',
      name: 'Prof. Ghulam Rasool',
      email: 'ghulam.rasool@taleemacademy.edu.pk',
      phone: '+92 300 1234567',
      qualification: 'M.Phil Physics (Univ of Sindh)',
      specialization: 'Classical & Modern Physics',
      department: 'Faculty of Science',
      assignedBatches: ['Batch 2026-A (Morning)'],
      assignedSubjects: ['Physics'],
      joiningDate: '2018-03-01',
      status: 'Active',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'TCH-02',
      name: 'Dr. Naila Jatoi',
      email: 'naila.jatoi@taleemacademy.edu.pk',
      phone: '+92 333 9988776',
      qualification: 'M.Sc, Ph.D Zoology (SALU Khairpur)',
      specialization: 'Biotechnology & Zoology',
      department: 'Faculty of Medical Sciences',
      assignedBatches: ['Batch 2026-B (Morning)'],
      assignedSubjects: ['Biology'],
      joiningDate: '2020-08-15',
      status: 'Active',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'TCH-03',
      name: 'Engr. Waqas Chachar',
      email: 'waqas.cs@taleemacademy.edu.pk',
      phone: '+92 312 5566778',
      qualification: 'B.E Computer Systems Engineering (QUEST)',
      specialization: 'Algorithms, Data Structures & Cloud',
      department: 'Faculty of Computer Science',
      assignedBatches: ['Batch 2026-C (Afternoon)'],
      assignedSubjects: ['Computer Science'],
      joiningDate: '2022-01-10',
      status: 'Active',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    },
    {
      id: 'TCH-04',
      name: 'Sir Danish Ali',
      email: 'danish.dev@taleemacademy.edu.pk',
      phone: '+92 305 7766554',
      qualification: 'BS Software Engineering (FAST NUCES)',
      specialization: 'Full Stack JavaScript & Mobile Apps',
      department: 'Software Engineering',
      assignedBatches: ['Batch Web-04 (Evening)'],
      assignedSubjects: ['React.js', 'Node.js', 'Database Systems'],
      joiningDate: '2023-04-01',
      status: 'Active',
      photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    },
  ],
  campus: [
    { id: 'CMP-01', building: 'Academic Block A', roomNumber: 'Room 101', type: 'Lecture Hall', capacity: 60, status: 'Occupied', facilities: ['Multimedia Projector', 'Whiteboard', 'Air Conditioned', 'Sound System'] },
    { id: 'CMP-02', building: 'Academic Block A', roomNumber: 'Room 102', type: 'Lecture Hall', capacity: 55, status: 'Occupied', facilities: ['Multimedia Projector', 'Smart Board', 'Air Conditioned'] },
    { id: 'CMP-03', building: 'IT & Innovation Wing', roomNumber: 'Lab 01', type: 'Computer Lab', capacity: 40, status: 'Available', facilities: ['40 Core i7 PCs', 'Gigabit LAN', 'UPS Backup', 'Dual Projectors'] },
    { id: 'CMP-04', building: 'IT & Innovation Wing', roomNumber: 'Lab 02', type: 'Computer Lab', capacity: 30, status: 'Occupied', facilities: ['30 Apple iMacs', 'High-Speed Internet', 'Air Conditioned'] },
    { id: 'CMP-05', building: 'Science Wing', roomNumber: 'Science Lab 1', type: 'Science Lab', capacity: 35, status: 'Available', facilities: ['Chemical Hood', 'Microscopes', 'Emergency Shower', 'Gas Lines'] },
    { id: 'CMP-06', building: 'Main Central Block', roomNumber: 'Auditorium', type: 'Auditorium', capacity: 300, status: 'Available', facilities: ['Cinema Projection', 'Digital Sound Console', 'Stage Lighting', 'Central AC'] },
  ],
  inventory: [
    { id: 'INV-01', name: 'A4 Printing Paper (Double A, 80gsm)', category: 'Stationery', currentStock: 48, minimumThreshold: 20, unit: 'Reams', costPerUnit: 1450, location: 'Admin Store Cupboard A1', lastUpdated: '2026-10-22' },
    { id: 'INV-02', name: 'Whiteboard Markers (Black, Blue, Red)', category: 'Stationery', currentStock: 85, minimumThreshold: 30, unit: 'Pieces', costPerUnit: 120, location: 'Faculty Room Dispatch', lastUpdated: '2026-10-23' },
    { id: 'INV-03', name: 'RJ45 Cat-6 Network Cable Reel (305m)', category: 'IT Equipment', currentStock: 3, minimumThreshold: 2, unit: 'Boxes', costPerUnit: 16500, location: 'IT Server Room Shelf 2', lastUpdated: '2026-10-18' },
    { id: 'INV-04', name: 'Student Armchairs (Steel Frame)', category: 'Furniture', currentStock: 12, minimumThreshold: 15, unit: 'Units', costPerUnit: 3800, location: 'Basement Storage', lastUpdated: '2026-10-10' },
    { id: 'INV-05', name: 'Glass Test Tubes (15x150mm Borosilicate)', category: 'Lab Consumable', currentStock: 6, minimumThreshold: 20, unit: 'Packs of 50', costPerUnit: 1800, location: 'Chemistry Prep Room', lastUpdated: '2026-10-24' },
  ],
  communications: [
    {
      id: 'COM-01',
      channel: 'SMS',
      audience: 'All Parents',
      title: 'October Monthly Fee Reminder Notice',
      message: 'Respected Parents, monthly fee vouchers for Oct 2026 have been issued. Kindly deposit at designated branch or fee counter by 28th Oct. Taleem Academy Kandhkot.',
      sentDate: '2026-10-22',
      sentBy: 'Accountant M. Ali',
      deliveryStatus: 'Delivered',
    },
    {
      id: 'COM-02',
      channel: 'WhatsApp',
      audience: 'Selected Batch',
      targetBatch: 'Batch 2026-A (Morning)',
      title: 'Calculus Assignment Chapter 4 Due',
      message: 'Dear Students, upload Assignment 4 on TaleemOS Portal by Sunday 10 PM. Solutions will be reviewed in Monday first period. Sir Saeed.',
      sentDate: '2026-10-23',
      sentBy: 'Sir Saeed Ahmed',
      deliveryStatus: 'Delivered',
    },
    {
      id: 'COM-03',
      channel: 'Notice Board',
      audience: 'All Students',
      title: 'Annual Sports & Science Gala 2026',
      message: 'Annual Gala registrations are now open in the Sports Office. Competitions include Cricket, Badminton, Science Exhibitions, and Coding Hackathon.',
      sentDate: '2026-10-20',
      sentBy: 'Student Affairs',
      deliveryStatus: 'Delivered',
    },
  ],
  approvals: [
    {
      id: 'APP-501',
      module: 'Fee Discount > 500',
      recordId: 'ADM-1006',
      title: 'Fee Discount Request: Bilawal Bhutto Jamali (PKR 1,000)',
      requestedBy: 'Receptionist Asma',
      requestedRole: 'Receptionist / Front Desk',
      currentApproverRole: 'Director / Owner',
      amountOrValue: 'Discount PKR 1,000 on PKR 9,000 Fee',
      status: 'Pending Approval',
      date: '2026-10-23',
      reason: 'Student demonstrated exceptional financial need; father is local municipal worker.',
      history: [
        {
          actor: 'Receptionist Asma',
          role: 'Receptionist / Front Desk',
          action: 'Created',
          timestamp: '2026-10-23 11:30 AM',
          reason: 'Initial discount proposal submitted',
        },
      ],
    },
    {
      id: 'APP-502',
      module: 'Expense > 5000',
      recordId: 'EXP-103',
      title: 'Expense Requisition: Chemistry Lab Reagents (PKR 12,500)',
      requestedBy: 'Accountant M. Ali',
      requestedRole: 'Accountant',
      currentApproverRole: 'Director / Owner',
      amountOrValue: 'PKR 12,500',
      status: 'Pending Approval',
      date: '2026-10-23',
      reason: 'Urgent restocking required for practical classes before board examination inspections.',
      history: [
        {
          actor: 'Accountant M. Ali',
          role: 'Accountant',
          action: 'Created',
          timestamp: '2026-10-23 02:15 PM',
        },
      ],
    },
    {
      id: 'APP-503',
      module: 'Staff Leave',
      recordId: 'LEV-101',
      title: 'Faculty Leave: Engr. Waqas Chachar (2 Days Casual Leave)',
      requestedBy: 'Engr. Waqas Chachar',
      requestedRole: 'Teacher',
      currentApproverRole: 'Principal',
      amountOrValue: '2 Days (27-28 Oct)',
      status: 'Pending Approval',
      date: '2026-10-23',
      reason: 'Invited as speaker at IEEE AI & Cloud Summit, Karachi.',
      history: [
        {
          actor: 'Engr. Waqas Chachar',
          role: 'Teacher',
          action: 'Created',
          timestamp: '2026-10-23 09:00 AM',
        },
      ],
    },
    {
      id: 'APP-504',
      module: 'Student Promotion',
      recordId: 'PRO-101',
      title: 'Promotion Approval: Muhammad Hamza Malik to 2nd Year',
      requestedBy: 'Academic Coordinator',
      requestedRole: 'Teacher',
      currentApproverRole: 'Principal',
      amountOrValue: '88.4% Aggregate',
      status: 'Pending Approval',
      date: '2026-10-20',
      reason: 'Cleared 1st year board prerequisites with grade A+.',
      history: [
        {
          actor: 'Academic Coordinator',
          role: 'Teacher',
          action: 'Created',
          timestamp: '2026-10-20 03:00 PM',
        },
      ],
    },
  ],
  auditLogs: [
    {
      id: 'LOG-01',
      user: 'Prof. Ghulam Rasool',
      role: 'Super Admin',
      action: 'SYSTEM_BOOT',
      module: 'Core System',
      timestamp: '2026-10-24 08:00 AM',
      details: 'TaleemOS Hub v5.0 initialized successfully with 23 enterprise ERP modules.',
    },
    {
      id: 'LOG-02',
      user: 'Accountant M. Ali',
      role: 'Accountant',
      action: 'VOUCHER_GENERATED',
      module: 'Finance Fees',
      timestamp: '2026-10-24 09:15 AM',
      details: 'Generated monthly fee voucher VCH-26-804 for student Mehwish Tariq Mahar.',
    },
    {
      id: 'LOG-03',
      user: 'Receptionist Asma',
      role: 'Receptionist / Front Desk',
      action: 'ENQUIRY_LOGGED',
      module: 'Admissions',
      timestamp: '2026-10-24 10:30 AM',
      details: 'Logged walk-in enquiry for student Sanaullah Lashari (ICS course).',
    },
  ],
  calendarEvents: [
    {
      id: 'EVT-CAL-01',
      title: 'Kashmir Solidarity Observance',
      date: '2026-10-24',
      type: 'Holiday',
      description: 'Institutional special assembly and solidarity observance.',
      location: 'Central Lawn',
      targetAudience: 'All',
      isNationalHoliday: false,
      status: 'Confirmed',
    },
    {
      id: 'EVT-CAL-02',
      title: 'Mid-Term Physics & Sciences Exam',
      date: '2026-10-27',
      startTime: '09:00',
      endTime: '12:00',
      type: 'Exam',
      description: 'Mid-term written examination for Pre-Engineering & Pre-Medical students.',
      location: 'Examination Hall A',
      classBatch: 'Batch 2026-A (Morning)',
      targetAudience: 'Students',
      status: 'Confirmed',
    },
    {
      id: 'EVT-CAL-03',
      title: 'Academic Council Curriculum Review',
      date: '2026-10-28',
      startTime: '14:00',
      endTime: '16:00',
      type: 'Meeting',
      description: 'Senior faculty and HODs review of syllabus completion and question papers.',
      location: 'Executive Boardroom',
      targetAudience: 'Faculty',
      status: 'Confirmed',
    },
    {
      id: 'EVT-CAL-04',
      title: 'Chemistry Lab Practical & Viva Voce',
      date: '2026-10-29',
      startTime: '09:30',
      endTime: '12:30',
      type: 'Exam',
      description: 'Practical lab examination in titration and qualitative analysis.',
      location: 'Science Lab 2',
      classBatch: 'F.Sc Pre-Medical',
      targetAudience: 'Students',
      status: 'Confirmed',
    },
    {
      id: 'EVT-CAL-05',
      title: 'Annual Science & Robotics Exhibition',
      date: '2026-10-31',
      startTime: '10:00',
      endTime: '16:00',
      type: 'Event',
      description: 'Student project showcase featuring automation, robotics, AI models, and biology exhibits.',
      location: 'Main Auditorium & Courtyard',
      targetAudience: 'All',
      status: 'Confirmed',
    },
    {
      id: 'EVT-CAL-06',
      title: 'Mathematics Term Assessment',
      date: '2026-11-04',
      startTime: '09:00',
      endTime: '12:00',
      type: 'Exam',
      description: 'Compulsory Math examination for Class 9th & 10th matriculation batches.',
      location: 'Hall B',
      classBatch: 'Matric Science',
      targetAudience: 'Students',
      status: 'Confirmed',
    },
    {
      id: 'EVT-CAL-07',
      title: 'All-Sindh Inter-School Debating Contest',
      date: '2026-11-06',
      startTime: '10:30',
      endTime: '15:00',
      type: 'Event',
      description: 'Bilingual parliamentary debate competition in English and Urdu.',
      location: 'Auditorium Hall',
      targetAudience: 'All',
      status: 'Confirmed',
    },
    {
      id: 'EVT-CAL-08',
      title: 'Iqbal Day (National Holiday)',
      date: '2026-11-09',
      type: 'Holiday',
      description: 'Official national holiday commemorating Allama Muhammad Iqbal. Institution closed.',
      targetAudience: 'All',
      isNationalHoliday: true,
      status: 'Confirmed',
    },
    {
      id: 'EVT-CAL-09',
      title: 'English Grammar & Literature Mock',
      date: '2026-11-12',
      startTime: '09:00',
      endTime: '12:00',
      type: 'Exam',
      description: 'Mock board examination for SSC & HSSC candidates.',
      location: 'Hall A & B',
      classBatch: 'Batch 2026-A',
      targetAudience: 'Students',
      status: 'Confirmed',
    },
    {
      id: 'EVT-CAL-10',
      title: 'Governing Body & Finance Review',
      date: '2026-11-15',
      startTime: '11:00',
      endTime: '13:00',
      type: 'Meeting',
      description: 'Quarterly financial audit, fee discount reports, and development budget.',
      location: 'Conference Room',
      targetAudience: 'Staff',
      status: 'Confirmed',
    },
    {
      id: 'EVT-CAL-11',
      title: 'Computer Science Practical & Web Hackathon',
      date: '2026-11-18',
      startTime: '09:30',
      endTime: '14:00',
      type: 'Exam',
      description: 'Hands-on practical coding test in Python and Web development.',
      location: 'Computer Lab 1',
      classBatch: 'ICS & IT Diploma',
      targetAudience: 'Students',
      status: 'Confirmed',
    },
    {
      id: 'EVT-CAL-12',
      title: 'Annual Sports Gala (Cricket & Athletics)',
      date: '2026-11-20',
      startTime: '08:30',
      endTime: '17:00',
      type: 'Sports',
      description: 'Inter-house cricket tournament, 100m sprint, relay race, tug-of-war, and badminton.',
      location: 'Taleem Sports Complex & Ground',
      targetAudience: 'All',
      status: 'Confirmed',
    },
    {
      id: 'EVT-CAL-13',
      title: 'Parent-Teacher Meeting (PTM)',
      date: '2026-11-28',
      startTime: '09:00',
      endTime: '14:00',
      type: 'Meeting',
      description: 'Mid-term progress discussion, attendance review, and report distribution with parents.',
      location: 'Respective Classrooms',
      targetAudience: 'Parents',
      status: 'Confirmed',
    },
    {
      id: 'EVT-CAL-14',
      title: 'First Term Final Examination Series',
      date: '2026-12-14',
      endDate: '2026-12-22',
      startTime: '09:00',
      endTime: '12:00',
      type: 'Exam',
      description: 'Comprehensive term-end examinations for all enrolled classes.',
      location: 'Exam Blocks A, B, and C',
      targetAudience: 'Students',
      status: 'Confirmed',
    },
    {
      id: 'EVT-CAL-15',
      title: 'Annual Prize Distribution Ceremony',
      date: '2026-12-23',
      startTime: '10:00',
      endTime: '14:00',
      type: 'Ceremony',
      description: 'Recognition of academic toppers, sports champions, and best educators.',
      location: 'Grand Auditorium',
      targetAudience: 'All',
      status: 'Confirmed',
    },
    {
      id: 'EVT-CAL-16',
      title: 'Quaid-e-Azam Day & Christmas',
      date: '2026-12-25',
      type: 'Holiday',
      description: 'Birthday of Quaid-e-Azam Muhammad Ali Jinnah and Christmas. Official holiday.',
      targetAudience: 'All',
      isNationalHoliday: true,
      status: 'Confirmed',
    },
    {
      id: 'EVT-CAL-17',
      title: 'Winter Vacation Closure',
      date: '2026-12-26',
      endDate: '2027-01-02',
      type: 'Holiday',
      description: 'Annual winter break for students and faculty. Administrative desk open 10am-1pm.',
      targetAudience: 'All',
      isNationalHoliday: true,
      status: 'Confirmed',
    },
  ],
};

class ERPStorage {
  private state: ERPStoreState;
  private listeners: Set<() => void> = new Set();
  private unsubscribeSnapshot: (() => void) | null = null;

  constructor() {
    this.state = this.loadState();
    this.initFirebaseSync();
  }

  private initFirebaseSync() {
    if (!isFirebaseEnabled() || !db) return;
    this.subscribeToAcademy(this.state.activeInstitutionId);
  }

  public subscribeToAcademy(academyId: string) {
    if (!isFirebaseEnabled() || !db) return;
    if (this.unsubscribeSnapshot) this.unsubscribeSnapshot();

    const docRef = doc(db, 'academies', academyId);
    
    // REAL-TIME LISTENER
    this.unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        this.state = {
          ...INITIAL_DATA,
          ...cloudData,
          activeInstitutionId: academyId,
        };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch {}
        this.notify();
      } else {
        // Agar Cloud mein document nahi hai, toh pehli baar data upload karo
        this.pushToCloud();
      }
    }, (error) => {
      console.warn('Firebase Sync Notice:', error.message);
    });
  }

  private async pushToCloud() {
    if (!isFirebaseEnabled() || !db) return;
    try {
      const docRef = doc(db, 'academies', this.state.activeInstitutionId);
      await setDoc(docRef, this.state);
      console.log("☁️ Data synced to Firebase Cloud!");
    } catch (e) {
      console.warn('Failed to save to Firebase:', e);
    }
  }

  private loadState(): ERPStoreState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure new structures or missing arrays exist
        return {
          ...INITIAL_DATA,
          ...parsed,
          calendarEvents:
            parsed.calendarEvents && parsed.calendarEvents.length > 0
              ? parsed.calendarEvents
              : INITIAL_DATA.calendarEvents,
        };
      }
    } catch (e) {
      console.warn('Failed to parse saved ERP state from localStorage:', e);
    }
    return INITIAL_DATA;
  }

  private saveState(): void {
    // Demo Account Read-Only Guard: Disallow any write when logged in as demo
    try {
      const currentUser = JSON.parse(localStorage.getItem('taleemos_current_user_v5') || 'null');
      if (currentUser?.isDemo || currentUser?.readOnly) {
        console.warn('Write blocked: Demo accounts operate in strict read-only mode.');
        window.dispatchEvent(
          new CustomEvent('taleemos_demo_write_blocked', {
            detail: {
              message:
                '🔒 Action Blocked: Demo accounts operate in strict read-only mode. Creating, editing, or deleting records is disabled.',
            },
          })
        );
        return;
      }
    } catch {}

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save ERP state to localStorage:', e);
    }
    this.pushToCloud();
    this.notify();
  }

  public getState(): ERPStoreState {
    return this.state;
  }

  public setAlerts(alerts: AlertNotification[]): void {
    this.state.alerts = alerts;
    this.saveState();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  public logAudit(action: string, module: string, details: string): void {
    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      user: this.state.userName,
      role: this.state.activeRole,
      action,
      module,
      timestamp: new Date().toLocaleString(),
      details,
    };
    this.state.auditLogs = [newLog, ...this.state.auditLogs.slice(0, 100)];
    this.saveState();
  }

  public setActiveRole(role: UserRole): void {
    this.state.activeRole = role;
    this.logAudit('ROLE_SWITCH', 'Auth / RBAC', `Switched active role to: ${role}`);
    this.saveState();
  }

  public setActiveInstitution(id: string): void {
    this.state.activeInstitutionId = id;
    const inst = INSTITUTIONS.find((i) => i.id === id);
    this.logAudit('CAMPUS_SWITCH', 'Multi-tenant', `Switched campus to: ${inst?.name || id}`);
    this.saveState();
    this.subscribeToAcademy(id); // Switch live listener to new academy
  }

  // Approvals
  public approveRequest(requestId: string, reason?: string): void {
    const req = this.state.approvals.find((a) => a.id === requestId);
    if (!req) return;

    req.status = 'Approved';
    req.history.push({
      actor: this.state.userName,
      role: this.state.activeRole,
      action: 'Approved',
      timestamp: new Date().toLocaleString(),
      reason,
    });

    // Cascade to related entities
    if (req.module === 'Admission Confirmed') {
      const adm = this.state.admissions.find((a) => a.id === req.recordId);
      if (adm) adm.status = 'Confirmed';
    } else if (req.module === 'Fee Discount > 500') {
      const adm = this.state.admissions.find((a) => a.id === req.recordId);
      if (adm) adm.status = 'Confirmed';
    } else if (req.module === 'Expense > 5000') {
      const exp = this.state.expenses.find((e) => e.id === req.recordId);
      if (exp) exp.status = 'Approved';
    } else if (req.module === 'Staff Leave') {
      const lev = this.state.leaves.find((l) => l.id === req.recordId);
      if (lev) {
        lev.status = 'Approved';
        lev.approvedBy = `${this.state.userName} (${this.state.activeRole})`;
      }
    } else if (req.module === 'Student Promotion') {
      const pro = this.state.promotions.find((p) => p.id === req.recordId);
      if (pro) {
        pro.status = 'Approved';
        pro.approver = `${this.state.userName} (${this.state.activeRole})`;
      }
    }

    this.logAudit('APPROVAL_APPROVED', 'Approval Workflow', `Approved request: ${req.title}`);
    this.saveState();
  }

  public rejectRequest(requestId: string, reason: string): void {
    const req = this.state.approvals.find((a) => a.id === requestId);
    if (!req) return;

    req.status = 'Rejected';
    req.history.push({
      actor: this.state.userName,
      role: this.state.activeRole,
      action: 'Rejected',
      timestamp: new Date().toLocaleString(),
      reason,
    });

    if (req.module === 'Expense > 5000') {
      const exp = this.state.expenses.find((e) => e.id === req.recordId);
      if (exp) exp.status = 'Rejected';
    } else if (req.module === 'Staff Leave') {
      const lev = this.state.leaves.find((l) => l.id === req.recordId);
      if (lev) lev.status = 'Rejected';
    } else if (req.module === 'Student Promotion') {
      const pro = this.state.promotions.find((p) => p.id === req.recordId);
      if (pro) pro.status = 'Retained';
    }

    this.logAudit('APPROVAL_REJECTED', 'Approval Workflow', `Rejected request: ${req.title}. Reason: ${reason}`);
    this.saveState();
  }

  // Generic Mutators
  public addItem<K extends keyof ERPStoreState>(key: K, item: any): void {
    if (Array.isArray(this.state[key])) {
      (this.state[key] as any[]) = [item, ...(this.state[key] as any[])];
      this.logAudit('ADD_ITEM', String(key), `Added new item into ${String(key)} with ID: ${item.id || 'N/A'}`);
      if (key === 'attendance') {
        this.checkAndTriggerConsecutiveAbsenceAlerts();
      }
      this.saveState();
    }
  }

  public updateItem<K extends keyof ERPStoreState>(key: K, id: string, updates: any): void {
    if (Array.isArray(this.state[key])) {
      (this.state[key] as any[]) = (this.state[key] as any[]).map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      this.logAudit('UPDATE_ITEM', String(key), `Updated item ID: ${id} in ${String(key)}`);
      if (key === 'attendance') {
        this.checkAndTriggerConsecutiveAbsenceAlerts();
      }
      this.saveState();
    }
  }

  public deleteItem<K extends keyof ERPStoreState>(key: K, id: string): void {
    if (Array.isArray(this.state[key])) {
      (this.state[key] as any[]) = (this.state[key] as any[]).filter((item) => item.id !== id);
      this.logAudit('DELETE_ITEM', String(key), `Deleted item ID: ${id} from ${String(key)}`);
      if (key === 'attendance') {
        this.checkAndTriggerConsecutiveAbsenceAlerts();
      }
      this.saveState();
    }
  }

  /**
   * Automated Alert System for Attendance:
   * Scans all student attendance records across dates chronologically.
   * If a student has missed more than 3 consecutive classes, triggers a Critical Alert in state.alerts.
   */
  public checkAndTriggerConsecutiveAbsenceAlerts(): AlertNotification[] {
    const records = this.state.attendance || [];
    const students = this.state.students || [];

    // Group attendance by student
    const studentAttendanceMap = new Map<string, AttendanceRecord[]>();
    records.forEach((r) => {
      const key = r.studentId || r.rollNo;
      if (!studentAttendanceMap.has(key)) studentAttendanceMap.set(key, []);
      studentAttendanceMap.get(key)!.push(r);
    });

    const triggeredAlerts: AlertNotification[] = [];

    studentAttendanceMap.forEach((recList, key) => {
      // Sort chronological ascending
      const sorted = [...recList].sort((a, b) => a.date.localeCompare(b.date));

      let currentStreak = 0;
      let maxStreak = 0;
      let latestDate = '';
      let streakBatch = '';

      sorted.forEach((rec) => {
        if (rec.status === 'A') {
          currentStreak++;
          latestDate = rec.date;
          streakBatch = rec.batch;
          if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
          }
        } else {
          currentStreak = 0;
        }
      });

      const consecutiveAbsences = currentStreak > 0 ? currentStreak : maxStreak;

      // Trigger if student has missed more than 3 consecutive classes (i.e. >= 4)
      if (consecutiveAbsences > 3) {
        const studentObj = students.find((s) => s.id === key || s.rollNo === key);
        const studentName = studentObj ? studentObj.name : (sorted[0]?.studentName || key);
        const rollNo = studentObj ? studentObj.rollNo : (sorted[0]?.rollNo || key);
        const batchName = streakBatch || studentObj?.classBatch || 'Assigned Cohort';

        const alertId = `ALT-ABS-${rollNo.replace(/[^a-zA-Z0-9]/g, '')}`;
        const existingIdx = this.state.alerts.findIndex((a) => a.id === alertId);

        const newAlert: AlertNotification = {
          id: alertId,
          title: `Consecutive Absence Alert: ${studentName} (${rollNo})`,
          type: 'Student Absenteeism',
          priority: 'Critical',
          date: latestDate || new Date().toISOString().split('T')[0],
          audience: 'Parents',
          status: existingIdx !== -1 ? this.state.alerts[existingIdx].status : 'Pending',
          message: `Automated Attendance Alert: Student ${studentName} (${rollNo}) has missed ${consecutiveAbsences} consecutive classes in ${batchName}. School regulatory framework mandates formal parental conference and explanation.`,
          assignedTo: 'Attendance Coordinator (Asma Bibi)',
          actionTaken:
            existingIdx !== -1
              ? this.state.alerts[existingIdx].actionTaken
              : 'Automated SMS & WhatsApp reminder queued; class teacher alerted.',
          studentId: studentObj?.id || key,
          rollNo,
          batch: batchName,
          consecutiveDays: consecutiveAbsences,
        };

        if (existingIdx !== -1) {
          this.state.alerts[existingIdx] = { ...this.state.alerts[existingIdx], ...newAlert };
        } else {
          this.state.alerts.unshift(newAlert);
          this.logAudit(
            'ATTENDANCE_ALERT_TRIGGERED',
            'Attendance & Alerts',
            `Triggered automated consecutive absence warning for ${studentName} (${consecutiveAbsences} missed classes)`
          );
        }
        triggeredAlerts.push(newAlert);
      }
    });

    return triggeredAlerts;
  }

  // Calendar Event operations (with drag & drop reschedule support)
  public addCalendarEvent(event: CalendarEvent): void {
    if (!this.state.calendarEvents) {
      this.state.calendarEvents = [];
    }
    this.state.calendarEvents.unshift(event);
    this.logAudit('EVENT_CREATED', 'Academic Calendar', `Created ${event.type}: "${event.title}" on ${event.date}`);
    this.saveState();
  }

  public moveCalendarEvent(id: string, newDate: string): void {
    if (!this.state.calendarEvents) return;
    const ev = this.state.calendarEvents.find((e) => e.id === id);
    if (ev) {
      const oldDate = ev.date;
      ev.date = newDate;
      this.logAudit('EVENT_RESCHEDULED', 'Academic Calendar', `Rescheduled "${ev.title}" from ${oldDate} to ${newDate}`);
      this.saveState();
    }
  }

  public updateCalendarEvent(id: string, updates: Partial<CalendarEvent>): void {
    if (!this.state.calendarEvents) return;
    const idx = this.state.calendarEvents.findIndex((e) => e.id === id);
    if (idx !== -1) {
      this.state.calendarEvents[idx] = { ...this.state.calendarEvents[idx], ...updates };
      this.logAudit('EVENT_UPDATED', 'Academic Calendar', `Updated details for: ${this.state.calendarEvents[idx].title}`);
      this.saveState();
    }
  }

  public deleteCalendarEvent(id: string): void {
    if (!this.state.calendarEvents) return;
    const ev = this.state.calendarEvents.find((e) => e.id === id);
    this.state.calendarEvents = this.state.calendarEvents.filter((e) => e.id !== id);
    if (ev) {
      this.logAudit('EVENT_DELETED', 'Academic Calendar', `Deleted ${ev.type}: "${ev.title}"`);
    }
    this.saveState();
  }

  // Reset to default
  public resetToDemo(): void {
    this.state = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveState();
  }

  // Backup JSON
  public exportToJson(): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `TaleemOS_Hub_v5_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Restore JSON
  public importFromJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.admissions && parsed.students) {
        this.state = { ...INITIAL_DATA, ...parsed };
        this.saveState();
        return true;
      }
    } catch (e) {
      console.error('Failed to import JSON backup:', e);
    }
    return false;
  }
}

export const erpStorage = new ERPStorage();
