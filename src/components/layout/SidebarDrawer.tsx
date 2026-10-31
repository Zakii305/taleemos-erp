import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { logout } from '../auth/AuthSystem';
import {
  setUserApprovalStatus,
  getLocalUsers,
  deleteUserAccount,
  fetchPendingUsers,
} from '../../lib/academyService';
import { type AppUser } from '../../types';

interface Props {
  currentPath: string;
  setCurrentPath: (p: string) => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (v: boolean) => void;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  institutionId: string;
  institutionName: string;
  status: string;
}

function formatSince(id: string) {
  try {
    const ts = parseInt(id.replace(/\D/g, '').slice(0, 13), 10);
    if (!isNaN(ts) && ts > 1000000000000) {
      const d = new Date(ts);
      const diff = Date.now() - d.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Today';
      if (days === 1) return '1d ago';
      if (days < 30) return `${days}d ago`;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    }
  } catch {}
  return 'Recently';
}

export const SidebarDrawer: React.FC<Props> = ({
  currentPath,
  setCurrentPath,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
}) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [showUsers, setShowUsers] = useState(false);
  const [showApprovals, setShowApprovals] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadLocal = () => {
    try {
      const u = JSON.parse(localStorage.getItem('taleemos_current_user_v5') || 'null');
      setCurrentUser(u);
      const coll = getLocalUsers();
      setUsers(coll);
    } catch {}
  };

  const syncRemote = async () => {
    try {
      const u = JSON.parse(localStorage.getItem('taleemos_current_user_v5') || 'null');
      if (u) {
        const isDev = u.role === 'developer';
        const acadId = u.academyId || u.institutionId;
        const pending = await fetchPendingUsers(acadId, isDev);
        if (pending && pending.length > 0) {
          setUsers(getLocalUsers());
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadLocal();
    syncRemote();
    const onStorage = () => loadLocal();
    window.addEventListener('storage', onStorage);
    // Sync Firestore periodically every 15 seconds instead of spamming every 2s
    const interval = setInterval(syncRemote, 15000);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMobileDrawerOpen]);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    await setUserApprovalStatus(id, status);
    loadLocal();
    syncRemote();
  };

  const handleDeleteUser = async (targetUser: AppUser) => {
    if (!currentUser) return;
    const isDev = currentUser.role === 'developer';
    const confirmPrompt = isDev
      ? `👑 Developer Override: Are you sure you want to permanently delete user "${targetUser.name}" (${targetUser.role.toUpperCase()})?`
      : `Are you sure you want to delete ${targetUser.name}?`;

    if (confirm(confirmPrompt)) {
      const res = await deleteUserAccount(targetUser.uid || targetUser.id || '', targetUser, currentUser);
      if (res.success) {
        loadLocal();
        syncRemote();
      } else {
        alert(res.error || 'Could not delete user.');
      }
    }
  };

  const userRole = currentUser?.role || 'admin';
  const isDev = userRole === 'developer';
  const isAdmin = userRole === 'admin';
  const isTeacher = userRole === 'teacher';
  const isStudent = userRole === 'student';
  const isParent = userRole === 'parent';
  const userAcadId = currentUser?.academyId || currentUser?.institutionId;

  // Filter approvals as per rules
  const approvalList = users.filter((u) => {
    if (u.status !== 'pending') return false;
    if (isDev) return true; // Developer sees all pending (including admin)
    if (isAdmin) return u.academyId === userAcadId && u.role !== 'admin' && u.role !== 'developer';
    return false;
  });

  const adminRequests = users.filter((u) => u.role === 'admin' && u.status === 'pending');

  // Role-tailored menus based on user requirement:
  // "Parent ko us ke hisaab se data show ho aur Student ko is ke hisaab se Is tarah se Teacher ko is ke hisaab se aur Admin ko poori academy jo us ki hai sirf wo wali academy show ho jab ke Developer ko poori app ki har cheez show ho"
  const getMenuForRole = () => {
    if (isTeacher) {
      return [
        {
          section: 'TEACHER WORKSPACE',
          items: [
            { id: 'dashboard', label: 'Faculty Dashboard', icon: '👨‍🏫' },
            { id: 'attendance', label: 'Student Attendance', icon: '📅' },
            { id: 'timetable', label: 'My Timetable', icon: '🕒', pro: true },
            { id: 'exams', label: 'Exams & Date Sheets', icon: '📝' },
            { id: 'reportCards', label: 'Marks & Grading', icon: '📄', pro: true },
          ],
        },
        {
          section: 'ACADEMICS & LEAVES',
          items: [
            { id: 'calendar', label: 'Academic Calendar', icon: '📅', pro: true },
            { id: 'courses', label: 'Course Syllabi', icon: '📚' },
            { id: 'library', label: 'Library Accession', icon: '📖' },
            { id: 'leaves', label: 'My Leave Requests', icon: '🌴', pro: true },
          ],
        },
        {
          section: 'COMMUNICATION',
          items: [
            { id: 'alerts', label: 'Faculty Notices', icon: '🔔', pro: true },
            { id: 'communication', label: 'Send Announcements', icon: '💬', pro: true },
          ],
        },
      ];
    }

    if (isStudent) {
      return [
        {
          section: 'STUDENT PORTAL',
          items: [
            { id: 'dashboard', label: 'My Student Profile', icon: '🎓' },
            { id: 'attendance', label: 'My Attendance Record', icon: '📅' },
            { id: 'fees', label: 'My Fee Invoices & Receipts', icon: '💰', pro: true },
            { id: 'timetable', label: 'Class Timetable', icon: '🕒' },
            { id: 'reportCards', label: 'My Report Cards & Grades', icon: '📄', pro: true },
            { id: 'library', label: 'My Library Books', icon: '📖' },
            { id: 'calendar', label: 'Academic Calendar', icon: '📅', pro: true },
            { id: 'alerts', label: 'Campus Notices', icon: '🔔' },
          ],
        },
      ];
    }

    if (isParent) {
      return [
        {
          section: 'PARENT GUARDIAN PORTAL',
          items: [
            { id: 'dashboard', label: 'Ward Progress Overview', icon: '👨‍👩‍👧' },
            { id: 'attendance', label: 'Child Attendance Tracker', icon: '📅' },
            { id: 'fees', label: 'Fee Vouchers & Bank Challan', icon: '💰', pro: true },
            { id: 'reportCards', label: 'Child Report Card & Marks', icon: '📄', pro: true },
            { id: 'timetable', label: 'Class Timings & Routine', icon: '🕒' },
            { id: 'calendar', label: 'Academic Calendar', icon: '📅', pro: true },
            { id: 'alerts', label: 'School Announcements', icon: '🔔' },
            { id: 'communication', label: 'Contact Administration', icon: '💬' },
          ],
        },
      ];
    }

    // Default for Developer & Admin (Full Administration)
    return [
      ...(isDev
        ? [
            {
              section: 'DEVELOPER SUPER ADMIN',
              items: [
                { id: 'developer', label: 'Developer Master Hub', icon: '👑', pro: true },
                { id: 'users', label: 'Users Directory (Delete Any Role)', icon: '👥', pro: true },
                { id: 'auditlogs', label: 'Global Audit Trail', icon: '🛡️', pro: true },
              ],
            },
          ]
        : [
            {
              section: 'ACADEMY MANAGEMENT',
              items: [
                { id: 'dashboard', label: 'Academy Dashboard', icon: '📊' },
                { id: 'users', label: 'Users Directory (Printable)', icon: '👥', pro: true },
                { id: 'alerts', label: 'Alerts & Notifications', icon: '🔔', pro: true },
                { id: 'auditlogs', label: 'Academy Audit Logs', icon: '🛡️', pro: true },
              ],
            },
          ]),
      {
        section: 'ADMISSIONS',
        items: [
          { id: 'enquiries', label: 'New Enquiries', icon: '📝', pro: true },
          { id: 'admissions', label: 'Admissions', icon: '✅', pro: true },
          { id: 'batches', label: 'Batches', icon: '👥', pro: true },
        ],
      },
      {
        section: 'STUDENTS',
        items: [
          { id: 'students', label: 'Students Directory', icon: '🎓' },
          { id: 'idCards', label: 'ID Cards', icon: '🪪' },
          { id: 'transfers', label: 'Transfers / TC', icon: '🔄', pro: true },
          { id: 'promote', label: 'Promote', icon: '⬆️' },
          { id: 'certificates', label: 'Certificates', icon: '🏅' },
        ],
      },
      {
        section: 'ACADEMICS',
        items: [
          { id: 'calendar', label: 'Academic Calendar', icon: '📅', pro: true },
          { id: 'courses', label: 'Courses', icon: '📚' },
          { id: 'timetable', label: 'Timetable', icon: '🕒', pro: true },
          { id: 'exams', label: 'Exams', icon: '📝' },
          { id: 'reportCards', label: 'Report Cards', icon: '📄', pro: true },
          { id: 'library', label: 'Library', icon: '📚' },
        ],
      },
      {
        section: 'ATTENDANCE',
        items: [
          { id: 'attendance', label: 'Student Attend', icon: '📅' },
          { id: 'staffAttendance', label: 'Staff Attend', icon: '👔' },
          { id: 'leaves', label: 'Leave Mgmt', icon: '🌴', pro: true },
        ],
      },
      {
        section: 'FINANCE',
        items: [
          { id: 'fees', label: 'Fees & Challans', icon: '💰' },
          { id: 'defaulters', label: 'Fee Defaulters', icon: '⚠️' },
          { id: 'expenses', label: 'Expenses Ledger', icon: '💸' },
          { id: 'payroll', label: 'Payroll & Salaries', icon: '💵' },
          { id: 'accounts', label: 'Accounts & Ledger', icon: '📒', pro: true },
        ],
      },
      {
        section: 'OPERATIONS',
        items: [
          { id: 'teachers', label: 'Teacher Zone', icon: '👨‍🏫' },
          { id: 'campus', label: 'Campus Facilities', icon: '🏫' },
          { id: 'inventory', label: 'Inventory Stock', icon: '📦' },
          { id: 'assets', label: 'Assets & Equipment', icon: '🏛️' },
          { id: 'communication', label: 'Broadcast SMS / WhatsApp', icon: '💬', pro: true },
          { id: 'auditlogs', label: 'Audit Logs & Security', icon: '🛡️', pro: true },
          { id: 'settings', label: 'Settings', icon: '⚙️' },
        ],
      },
    ];
  };

  const MENU = getMenuForRole();

  return (
    <>
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}
      <div
        className={`fixed left-0 top-0 h-full w-[290px] bg-[#0f172a] text-white z-50 transform transition-transform duration-300 md:translate-x-0 ${
          isMobileDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } flex flex-col overscroll-contain touch-pan-y`}
      >
        {/* Header Drawer Branding - User Customized */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-indigo-800 rounded-xl flex items-center justify-center font-black text-xs shadow-md border border-indigo-400/30 shrink-0">
              {isDev
                ? 'DEV'
                : (currentUser?.academyName || 'TA')
                    .split(' ')
                    .slice(0, 2)
                    .map((w: string) => w[0])
                    .join('')
                    .toUpperCase() || 'TA'}
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-sm text-white truncate max-w-[185px]">
                {isDev ? 'TaleemOS Hub' : (currentUser?.academyName || 'Taleem Academy')}
              </div>
              <div className="text-[10px] text-indigo-300 font-medium flex items-center gap-1.5 mt-0.5">
                <span>By TaleemOS</span>
                <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-[8px] px-1.5 py-0.2 rounded font-bold uppercase">
                  {userRole}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Quick Approvals (For Dev & Admin) */}
          {(isDev || isAdmin) && (
            <div className="p-3 border-b border-white/10 bg-gradient-to-br from-amber-500/10 to-indigo-600/10">
              <button
                onClick={() => setShowApprovals(!showApprovals)}
                className="w-full flex justify-between items-center text-[11px] font-bold tracking-widest text-amber-300 mb-2 cursor-pointer"
              >
                <span>✅ PENDING APPROVALS • {approvalList.length}</span>
                <span className="flex items-center gap-2">
                  {approvalList.length > 0 && (
                    <span className="bg-amber-500 text-slate-950 text-[10px] px-2 py-0.2 rounded-full font-black animate-pulse">
                      {approvalList.length} NEW
                    </span>
                  )}
                  <span>{showApprovals ? '▼' : '▶'}</span>
                </span>
              </button>

              {showApprovals && (
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-400 bg-black/30 p-2 rounded-xl">
                    {isDev
                      ? '👑 Dev: You approve Admins of any institution'
                      : `🛡️ Admin: You approve members of ${currentUser?.academyName || 'Your Academy'}`}
                  </div>

                  {approvalList.length === 0 && (
                    <div className="text-[11px] text-slate-500 text-center py-3 bg-white/5 rounded-xl">
                      ✅ All pending requests cleared!
                    </div>
                  )}

                  {approvalList.map((u) => (
                    <div
                      key={u.uid || u.id}
                      className="bg-white/10 hover:bg-white/[0.15] border border-amber-500/20 rounded-xl p-2.5"
                    >
                      <div className="flex gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            u.role === 'admin'
                              ? 'bg-blue-600'
                              : u.role === 'teacher'
                              ? 'bg-green-600'
                              : 'bg-slate-600'
                          }`}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold truncate">
                            {u.name}{' '}
                            <span className="text-[8px] bg-white/20 px-1 py-0.2 rounded uppercase">
                              {u.role}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-300 truncate">{u.email}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                            {u.academyName}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <button
                          onClick={() => updateStatus(u.uid || u.id || '', 'approved')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] py-1 rounded-lg font-bold cursor-pointer"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => updateStatus(u.uid || u.id || '', 'rejected')}
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white text-[10px] py-1 rounded-lg cursor-pointer"
                        >
                          ✕ Reject
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          title="Delete request"
                          className="bg-rose-600/80 hover:bg-rose-600 text-white text-[10px] px-2 py-1 rounded-lg cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Dev-Only Admin Requests */}
                  {isDev && adminRequests.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <div className="text-[10px] font-bold text-blue-300 mb-1.5">
                        👑 ADMIN REQUESTS ({adminRequests.length})
                      </div>
                      {adminRequests.map((u) => (
                        <div
                          key={u.uid || u.id}
                          className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-2 mb-1.5 flex justify-between items-center text-[10px]"
                        >
                          <div>
                            <b>{u.name}</b>
                            <div className="text-slate-400 text-[9px]">{u.academyName}</div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => updateStatus(u.uid || u.id || '', 'approved')}
                              className="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="bg-rose-600 text-white px-1.5 py-0.5 rounded cursor-pointer"
                            >
                              Del
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setCurrentPath('approvals');
                      setIsMobileDrawerOpen(false);
                    }}
                    className="w-full text-[10px] text-amber-300 hover:text-amber-200 py-1.5 bg-white/5 rounded-lg mt-1 text-center cursor-pointer"
                  >
                    Open Approvals Center →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick User Section Drawer Accordion */}
          {(isDev || isAdmin) && (
            <div className="p-3 border-b border-white/10">
              <button
                onClick={() => setShowUsers(!showUsers)}
                className="w-full flex justify-between items-center text-[11px] font-bold tracking-widest text-slate-400 mb-2 cursor-pointer"
              >
                <span>👥 USER SECTION • {users.length}</span>
                <span>{showUsers ? '▼' : '▶'}</span>
              </button>
              {showUsers && (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {users.slice(0, 10).map((u) => {
                    const canDelete =
                      isDev ||
                      (isAdmin &&
                        u.academyId === userAcadId &&
                        u.role !== 'admin' &&
                        u.role !== 'developer');

                    return (
                      <div
                        key={u.uid || u.id}
                        className="bg-white/5 hover:bg-white/10 rounded-lg p-2 flex items-center gap-2 text-[11px]"
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            u.role === 'developer'
                              ? 'bg-purple-600'
                              : u.role === 'admin'
                              ? 'bg-blue-600'
                              : u.role === 'teacher'
                              ? 'bg-emerald-600'
                              : u.role === 'student'
                              ? 'bg-cyan-600'
                              : 'bg-amber-600'
                          }`}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="truncate font-medium">{u.name}</span>
                            <span
                              className={`text-[7px] px-1 rounded ${
                                u.status === 'approved' ? 'bg-emerald-600' : 'bg-amber-500'
                              }`}
                            >
                              {u.status}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 flex items-center gap-1">
                            <span className="bg-white/10 px-1 rounded uppercase">{u.role}</span>
                            <span className="truncate">{u.academyName?.split(' ')[0]}</span>
                          </div>
                        </div>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title={isDev ? 'Developer: Delete this role' : 'Delete user'}
                            className="text-[11px] text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={() => {
                      setCurrentPath('users');
                      setIsMobileDrawerOpen(false);
                    }}
                    className="w-full text-[11px] text-indigo-400 hover:text-indigo-300 font-bold py-2 bg-indigo-950/40 rounded-xl mt-1 text-center cursor-pointer border border-indigo-500/20"
                  >
                    Open Printable Users Section ({users.length}) →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Categorized Nav Menu Items */}
          <div className="p-3 space-y-4">
            {MENU.map((sec) => (
              <div key={sec.section}>
                <div className="text-[10px] tracking-widest text-slate-500 font-bold mb-2">
                  {sec.section}
                </div>
                <div className="space-y-0.5">
                  {sec.items.map((item) => {
                    const isSelected =
                      currentPath.toLowerCase().replace(/[-_]/g, '') ===
                      item.id.toLowerCase().replace(/[-_]/g, '');
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentPath(item.id);
                          setIsMobileDrawerOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-[12px] flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-md shadow-indigo-900/40'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className="text-[14px]">{item.icon}</span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {(item as any).pro && (
                          <span className="text-[8px] bg-indigo-400/20 text-indigo-300 border border-indigo-400/30 px-1.5 py-0.2 rounded font-bold">
                            PRO
                          </span>
                        )}
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Footer in drawer with green Online status & Logout button */}
        <div className="p-3 border-t border-white/10 bg-[#0b1120] text-xs shrink-0 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <div className="truncate pr-2 flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-white uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded bg-white/10 shrink-0">
                {userRole}
              </span>
              <span className="truncate text-slate-300 font-medium text-[11px]">
                {currentUser?.academyName || 'Taleem Academy'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-mono text-[10px] font-semibold">Online</span>
            </div>
          </div>

          {/* Logout Button Fixed at Drawer Bottom */}
          <button
            type="button"
            onClick={() => {
              setIsMobileDrawerOpen(false);
              logout();
            }}
            title="Sign out of TaleemOS account"
            className="w-full py-2 px-3 bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35 text-rose-200 hover:text-white border border-rose-500/30 hover:border-rose-500/50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-rose-950/20 group active:scale-[0.99]"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400 group-hover:text-rose-200 transition-colors" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SidebarDrawer;
