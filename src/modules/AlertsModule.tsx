import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Printer,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Send,
  Eye,
  Trash2,
  ShieldAlert,
  ArrowRight,
  Phone,
  MessageSquare,
  Edit2,
  Building2,
  Globe,
  Lock,
} from 'lucide-react';
import { erpStorage, INSTITUTIONS } from '../lib/storage';
import { type AlertNotification } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
import { triggerBrowserPrint, downloadElementAsPdf } from '../lib/pdf';
import { getCurrentUser } from '../components/auth/AuthSystem';
import { logAuditEvent } from '../lib/auditLogger';
import {
  fetchNoticesFromFirestore,
  saveNoticeToFirestore,
  deleteNoticeFromFirestore,
} from '../lib/academyService';

interface AlertsModuleProps {
  onNavigate?: (path: string) => void;
}

export const AlertsModule: React.FC<AlertsModuleProps> = ({ onNavigate }) => {
  const currentUser = getCurrentUser();
  const isParent = currentUser?.role === 'parent';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  
  const isDev = currentUser?.role === 'developer';
  const userAcademyId = currentUser?.academyId || 'inst-1';
  const userAcademyName =
    currentUser?.academyName ||
    INSTITUTIONS.find((i) => i.academyId === userAcademyId)?.academyName ||
    'Taleem Academy Kandhkot';

  const state = erpStorage.getState();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [devAcademyFilter, setDevAcademyFilter] = useState<string>('all');
  const [quickFilterConsecutive, setQuickFilterConsecutive] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertNotification | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertNotification | null>(null);
  const [deletingAlert, setDeletingAlert] = useState<AlertNotification | null>(null);
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Auto evaluate attendance streaks and sync Firestore notices on mount
  useEffect(() => {
    erpStorage.checkAndTriggerConsecutiveAbsenceAlerts();
    fetchNoticesFromFirestore(userAcademyId, isDev);
  }, [userAcademyId, isDev]);

  // Target Academy Scope for Posting
  // Developer can choose 'all' or specific academy; Admin is locked to own academy
  const [formTargetAcademy, setFormTargetAcademy] = useState<string>(
    isDev ? 'all' : userAcademyId
  );

  // New form fields (9 fields as required)
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<AlertNotification['type']>('General');
  const [formPriority, setFormPriority] = useState<AlertNotification['priority']>('Medium');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formAudience, setFormAudience] = useState<AlertNotification['audience']>('All');
  const [formStatus, setFormStatus] = useState<AlertNotification['status']>('New');
  const [formMessage, setFormMessage] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formActionTaken, setFormActionTaken] = useState('');

  // Edit form fields
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<AlertNotification['type']>('General');
  const [editPriority, setEditPriority] = useState<AlertNotification['priority']>('Medium');
  const [editAudience, setEditAudience] = useState<AlertNotification['audience']>('All');
  const [editStatus, setEditStatus] = useState<AlertNotification['status']>('New');
  const [editMessage, setEditMessage] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editActionTaken, setEditActionTaken] = useState('');

  // Stats
  const totalAlerts = state.alerts.length;
  const criticalCount = state.alerts.filter((a) => a.priority === 'Critical').length;
  const pendingCount = state.alerts.filter((a) => a.status === 'Pending' || a.status === 'New').length;
  const resolvedCount = state.alerts.filter((a) => a.status === 'Resolved').length;
  const consecutiveAbsencesCount = state.alerts.filter(
    (a) => a.type === 'Student Absenteeism' || (a.consecutiveDays || 0) > 3
  ).length;

  // Filtered
  const filteredAlerts = state.alerts.filter((item) => {
    // 1. Strict Tenant Isolation
    if (isDev) {
      if (devAcademyFilter !== 'all') {
        const isMatch =
          item.academyId === devAcademyFilter ||
          (!item.academyId && devAcademyFilter === 'inst-1');
        if (!isMatch) return false;
      }
    } else {
      // Non-developer: strictly isolated to own academy OR global broadcast
      const belongsToOwnAcademy = item.academyId === userAcademyId;
      const isGlobal = item.academyId === 'all';
      const isLegacyDefault = !item.academyId; // defaults to primary institution
      if (!belongsToOwnAcademy && !isGlobal && !isLegacyDefault) {
        return false;
      }
    }

    if (quickFilterConsecutive) {
      if (item.type !== 'Student Absenteeism' && (item.consecutiveDays || 0) <= 3) {
        return false;
      }
    }
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.message.toLowerCase().includes(search.toLowerCase()) ||
      item.assignedTo.toLowerCase().includes(search.toLowerCase()) ||
      (item.rollNo && item.rollNo.toLowerCase().includes(search.toLowerCase()));
    const matchesPriority = priorityFilter === 'All' || item.priority === priorityFilter;
    const matchesType = typeFilter === 'All' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesPriority && matchesType && matchesStatus;
  });

  // Permission check: Developer can modify any notice; Admin can modify their academy notices; Author can modify own notices
  const canUserModifyAlert = (item: AlertNotification) => {
    // 1. Developer has global modification authority across all notices
    if (isDev) return true;

    // 2. Academy Admin or Teacher can modify/delete any notice belonging to their own academy
    if (
      (currentUser?.role === 'admin' || currentUser?.role === 'teacher') &&
      (item.academyId === userAcademyId || (!item.academyId && userAcademyId === 'inst-1'))
    ) {
      return true;
    }

    // 3. Notice author can modify their own post
    if (
      item.postedById &&
      (item.postedById === currentUser?.uid || "" || item.postedById === currentUser?.id)
    ) {
      return true;
    }
    if (item.postedBy && item.postedBy === currentUser?.name) {
      return true;
    }

    // 4. Backward compatibility for sample alerts within own academy
    if (!item.postedById && (!item.academyId || item.academyId === userAcademyId)) {
      return true;
    }
    return false;
  };

  const handleOpenEdit = (item: AlertNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canUserModifyAlert(item)) {
      setActionNotice('You do not have permission to edit this notice.');
      setTimeout(() => setActionNotice(null), 3000);
      return;
    }
    setEditingAlert(item);
    setEditTitle(item.title);
    setEditType(item.type);
    setEditPriority(item.priority);
    setEditAudience(item.audience);
    setEditStatus(item.status);
    setEditMessage(item.message);
    setEditAssignedTo(item.assignedTo);
    setEditActionTaken(item.actionTaken);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlert) return;

    const updatedFields = {
      title: editTitle,
      type: editType,
      priority: editPriority,
      audience: editAudience,
      status: editStatus,
      message: editMessage,
      assignedTo: editAssignedTo,
      actionTaken: editActionTaken,
    };

    erpStorage.updateItem('alerts', editingAlert.id, updatedFields);

    const fullUpdatedAlert: AlertNotification = {
      ...editingAlert,
      ...updatedFields,
    };
    saveNoticeToFirestore(fullUpdatedAlert);

    logAuditEvent({
      action: 'NOTICE_UPDATE',
      module: 'Alerts & Notices',
      targetRecord: editTitle,
      details: `Updated notice ${editingAlert.id}`,
    });

    setIsEditModalOpen(false);
    setEditingAlert(null);
    setActionNotice('Notice updated successfully.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formMessage.trim()) return;

    // Resolve target academy
    let targetAcadId = formTargetAcademy;
    let targetAcadName = 'Global Broadcast (All Academies)';

    if (!isDev) {
      // Non-developer (Admin) is strictly locked to their own academy
      targetAcadId = userAcademyId;
      targetAcadName = userAcademyName;
    } else if (formTargetAcademy !== 'all') {
      const matchInst = INSTITUTIONS.find((i) => i.academyId === formTargetAcademy);
      targetAcadName = matchInst?.academyName || formTargetAcademy;
    }

    const newAlert: AlertNotification = {
      id: `ALT-${Date.now().toString().slice(-4)}`,
      title: formTitle,
      type: formType,
      priority: formPriority,
      date: formDate,
      audience: formAudience,
      status: formStatus,
      message: formMessage,
      assignedTo: formAssignedTo || 'General Administration',
      actionTaken: formActionTaken || 'Pending review',
      academyId: targetAcadId,
      academyName: targetAcadName,
      postedBy: currentUser?.name || (isDev ? 'Developer Head' : currentUser?.role === 'teacher' ? 'Faculty Member' : 'Academy Administrator'),
      postedByRole: currentUser?.role || (isDev ? 'developer' : 'teacher'),
      postedById: currentUser?.uid || "" || currentUser?.id || (isDev ? 'dev-master' : 'user-staff-1'),
    };

    erpStorage.addItem('alerts', newAlert);
    saveNoticeToFirestore(newAlert);

    logAuditEvent({
      action: 'NOTICE_CREATE',
      module: 'Alerts & Notices',
      targetRecord: formTitle,
      details: `Created notice for target: ${targetAcadName}`,
    });

    setIsAddModalOpen(false);
    setActionNotice(`Notice published to ${targetAcadName}`);
    setTimeout(() => setActionNotice(null), 3500);

    // Reset form
    setFormTitle('');
    setFormMessage('');
    setFormAssignedTo('');
    setFormActionTaken('');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetAlert = state.alerts.find((a) => a.id === id);
    if (!targetAlert) return;
    if (!canUserModifyAlert(targetAlert)) {
      setActionNotice('You do not have permission to delete this notice.');
      setTimeout(() => setActionNotice(null), 3000);
      return;
    }
    setDeletingAlert(targetAlert);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAlert) return;
    const alertId = deletingAlert.id;
    erpStorage.deleteItem('alerts', alertId);
    await deleteNoticeFromFirestore(alertId);

    logAuditEvent({
      action: 'NOTICE_DELETE',
      module: 'Alerts & Notices',
      targetRecord: deletingAlert.title,
      details: `Deleted notice ${alertId}`,
    });

    if (selectedAlert?.id === alertId) setSelectedAlert(null);
    setActionNotice('Notice deleted successfully.');
    setTimeout(() => setActionNotice(null), 3000);
    setDeletingAlert(null);
  };

  const handleWhatsAppParent = (alert: AlertNotification, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const student = state.students.find((s) => s.rollNo === alert.rollNo || s.id === alert.studentId);
    const parentPhone = student?.phone || '0300-1234567';
    const msg = encodeURIComponent(
      `Assalam-o-Alaikum Respected Parent of ${student?.name || alert.rollNo || 'Student'} (${alert.rollNo || ''}),\n\nThis is an urgent notice from Taleem Academy Kandhkot. Your child has missed ${alert.consecutiveDays || 'more than 3'} consecutive classes in ${alert.batch || 'class'}.\n\nKindly contact the Academy Administration immediately.`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
    setActionNotice(`Opened WhatsApp dispatch for parent of ${alert.rollNo}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast */}
      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Gradient Header with KPIs */}
      <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 rounded-xl">
              <Bell className="w-5 h-5 text-white" />
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Alerts & Notifications PRO</h1>
            <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded uppercase">
              PRO
            </span>
          </div>
          <p className="text-xs text-indigo-200 mt-1">
            Institutional broadcast center, automated consecutive absence warnings, fee dues, exam notices, and staff escalations.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPrintAllOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print All
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      {/* KPI Stats Bar with Consecutive Absence Highlight */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Alerts</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">{totalAlerts}</div>
        </div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-rose-500 uppercase">Critical Priority</div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">{criticalCount}</div>
        </div>
        <div
          onClick={() => setQuickFilterConsecutive(!quickFilterConsecutive)}
          className={`p-4 rounded-[20px] border shadow-sm cursor-pointer transition ${
            quickFilterConsecutive
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="text-[11px] font-black text-rose-600 uppercase flex items-center justify-between">
            <span>Absenteeism</span>
            <span className="text-[9px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded-full font-bold">&gt;3 Days</span>
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono mt-1">
            {consecutiveAbsencesCount}
          </div>
        </div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-amber-500 uppercase">Pending Actions</div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">{pendingCount}</div>
        </div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-500 uppercase">Resolved</div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">{resolvedCount}</div>
        </div>
      </div>

      {/* Search & Smart Filter Pills */}
      <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alerts by title, assignee, roll number, or message..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Pills with Consecutive Absence Quick Toggle */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Quick Filter: Consecutive Absences */}
          <button
            type="button"
            onClick={() => {
              setQuickFilterConsecutive(!quickFilterConsecutive);
              if (!quickFilterConsecutive) {
                setTypeFilter('All');
                setPriorityFilter('All');
              }
            }}
            className={`px-3 py-1 rounded-full text-[11px] font-black cursor-pointer transition-all flex items-center gap-1.5 ${
              quickFilterConsecutive
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Consecutive Absences (&gt;3 Classes)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${quickFilterConsecutive ? 'bg-white text-rose-700' : 'bg-rose-200 text-rose-900'}`}>
              {consecutiveAbsencesCount}
            </span>
          </button>

          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 mr-1">
            Priority:
          </span>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPriorityFilter(p);
                setQuickFilterConsecutive(false);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                priorityFilter === p && !quickFilterConsecutive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          ))}

          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-2 mr-1">
            Type:
          </span>
          {['All', 'Student Absenteeism', 'Fee Due', 'Exam', 'Admission', 'HR', 'Library', 'General'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTypeFilter(t);
                setQuickFilterConsecutive(false);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                typeFilter === t && !quickFilterConsecutive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}

          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-2 mr-1">
            Status:
          </span>
          {['All', 'New', 'Pending', 'Scheduled', 'Resolved'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatusFilter(s);
                setQuickFilterConsecutive(false);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                statusFilter === s && !quickFilterConsecutive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Results Cards (Tappable to detail modal) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAlerts.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-[22px] border border-slate-200 text-slate-400">
            <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
            <p className="text-sm font-semibold">No alerts found matching your criteria</p>
          </div>
        ) : (
          filteredAlerts.map((item) => {
            const isAbsenteeism = item.type === 'Student Absenteeism' || (item.consecutiveDays || 0) > 3;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedAlert(item)}
                className={`p-5 rounded-[22px] border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between ${
                  isAbsenteeism
                    ? 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-300/60'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase ${
                          item.priority === 'Critical'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : item.priority === 'High'
                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                            : item.priority === 'Medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.priority}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          isAbsenteeism
                            ? 'bg-rose-600 text-white font-black'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {isAbsenteeism ? `🚨 Absenteeism (>3 Missed)` : item.type}
                      </span>
                      {item.consecutiveDays && (
                        <span className="px-2 py-0.5 text-[10px] font-black bg-rose-200 text-rose-950 rounded-md">
                          {item.consecutiveDays} Consecutive Classes
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{item.date}</span>
                  </div>

                  <h3 className="mt-2.5 text-base font-extrabold text-slate-900 line-clamp-1 flex items-center gap-1.5">
                    {isAbsenteeism && <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span>{item.title}</span>
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>

                  {/* Special Absenteeism Action Box */}
                  {isAbsenteeism && (
                    <div className="mt-3 p-3 bg-white/90 rounded-xl border border-rose-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="text-[11px] text-slate-700 font-semibold">
                        <span>Roll: <strong className="text-indigo-700 font-mono">{item.rollNo || 'N/A'}</strong></span>
                        {item.batch && <span className="ml-2 text-slate-500 font-normal">({item.batch})</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleWhatsAppParent(item, e)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp Parent</span>
                        </button>
                        {onNavigate && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('attendance');
                            }}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[10px] flex items-center gap-1 border border-indigo-200 cursor-pointer"
                          >
                            <span>Attendance Module</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-semibold text-slate-700">{item.assignedTo}</span>
                    </div>
                    {/* Destination Academy Scope & Author info */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.academyId === 'all' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-0.5">
                          <Globe className="w-2.5 h-2.5" /> Global Broadcast
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-0.5 truncate max-w-[150px]">
                          <Building2 className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.academyName || item.academyId || 'Academy'}</span>
                        </span>
                      )}
                      {item.postedBy && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                          By: {item.postedBy} ({item.postedByRole || 'Admin'})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        item.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>

                    {/* Poster or Developer Edit & Delete Actions */}
                    {canUserModifyAlert(item) ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEdit(item, e)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                          title="Edit Notice (Author / Dev)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete Notice (Author / Dev)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="p-1.5 text-slate-300 flex items-center"
                        title="Read only - Posted by another user"
                      >
                        <Lock className="w-3 h-3 text-slate-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD NEW MODAL (Form with 9 fields as strictly required by prompt) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Alert / Notification"
        subtitle="Broadcast institutional alert, notice, or task assignment"
        badge="ERP ALERT"
      >
        <form onSubmit={handleCreateAlert} className="space-y-4">
          {/* Target Destination Academy Scope */}
          {isDev ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Target Academy / Broadcast Scope * (Developer Hierarchy)
              </label>
              <select
                value={formTargetAcademy}
                onChange={(e) => setFormTargetAcademy(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-indigo-50/50 font-bold text-indigo-900 focus:border-indigo-600 cursor-pointer"
              >
                <option value="all">🌐 All Academies (Global Broadcast to All Tenancies)</option>
                {INSTITUTIONS.map((inst) => (
                  <option key={inst.academyId} value={inst.academyId}>
                    🏫 {inst.academyName} ({inst.academyId})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                As Developer, choose to broadcast globally or scope to a single academy.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Target Academy: {userAcademyName}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Notices posted by Academy Admins are strictly scoped to your academy and hidden from other academies.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. October Fee Collection Deadline"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as AlertNotification['type'])}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              >
                <option value="General">General</option>
                <option value="Fee Due">Fee Due</option>
                <option value="Exam">Exam</option>
                <option value="Admission">Admission</option>
                <option value="HR">HR</option>
                <option value="Library">Library</option>
                <option value="Student Absenteeism">Student Absenteeism (&gt;3 Days)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as AlertNotification['priority'])}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Audience</label>
              <select
                value={formAudience}
                onChange={(e) => setFormAudience(e.target.value as AlertNotification['audience'])}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              >
                <option value="All">All</option>
                <option value="Teachers">Teachers</option>
                <option value="Students">Students</option>
                <option value="Parents">Parents</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as AlertNotification['status'])}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              >
                <option value="New">New</option>
                <option value="Pending">Pending</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Message Content *
            </label>
            <textarea
              required
              rows={3}
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
              placeholder="Enter comprehensive notice text..."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Assigned To
              </label>
              <input
                type="text"
                value={formAssignedTo}
                onChange={(e) => setFormAssignedTo(e.target.value)}
                placeholder="e.g. Accountant (M. Ali)"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Action Taken
              </label>
              <input
                type="text"
                value={formActionTaken}
                onChange={(e) => setFormActionTaken(e.target.value)}
                placeholder="e.g. Notice pinned on board, SMS queued"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Publish Alert
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT NOTICE MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAlert(null);
        }}
        title="Edit / Modify Institutional Notice"
        subtitle={`Updating notice reference: ${editingAlert?.id || ''}`}
        badge="MODIFY NOTICE"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Type</label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as AlertNotification['type'])}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              >
                <option value="General">General</option>
                <option value="Fee Due">Fee Due</option>
                <option value="Exam">Exam</option>
                <option value="Admission">Admission</option>
                <option value="HR">HR</option>
                <option value="Library">Library</option>
                <option value="Student Absenteeism">Student Absenteeism (&gt;3 Days)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as AlertNotification['priority'])}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Audience</label>
              <select
                value={editAudience}
                onChange={(e) => setEditAudience(e.target.value as AlertNotification['audience'])}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              >
                <option value="All">All Academy</option>
                <option value="Teachers">Teachers</option>
                <option value="Students">Students</option>
                <option value="Parents">Parents</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as AlertNotification['status'])}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              >
                <option value="New">New</option>
                <option value="Pending">Pending</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Message Body *</label>
            <textarea
              required
              rows={3}
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Department / Staff</label>
              <input
                type="text"
                value={editAssignedTo}
                onChange={(e) => setEditAssignedTo(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Action Notes</label>
              <input
                type="text"
                value={editActionTaken}
                onChange={(e) => setEditActionTaken(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingAlert(null);
              }}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* DETAIL MODAL with Single Print & Actions */}
      {selectedAlert && (
        <Modal
          isOpen={Boolean(selectedAlert)}
          onClose={() => setSelectedAlert(null)}
          title={selectedAlert.title}
          subtitle={`Alert ID: ${selectedAlert.id} • ${selectedAlert.date}`}
          badge={selectedAlert.priority}
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                <div>
                  <span className="text-slate-400 block font-semibold">Type:</span>
                  <strong className="text-slate-800">{selectedAlert.type}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Priority:</span>
                  <strong className="text-slate-800">{selectedAlert.priority}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Audience:</span>
                  <strong className="text-slate-800">{selectedAlert.audience}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Status:</span>
                  <strong className="text-slate-800">{selectedAlert.status}</strong>
                </div>
              </div>

              {/* Absenteeism specifics */}
              {selectedAlert.rollNo && (
                <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold">Student Roll No: </span>
                    <span className="font-mono font-bold text-indigo-700">{selectedAlert.rollNo}</span>
                    {selectedAlert.batch && <span className="ml-2 font-medium">({selectedAlert.batch})</span>}
                  </div>
                  {selectedAlert.consecutiveDays && (
                    <span className="font-black text-rose-700 bg-rose-200/80 px-2 py-0.5 rounded-full">
                      {selectedAlert.consecutiveDays} Missed Classes
                    </span>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200">
                <span className="text-slate-400 block text-xs font-semibold mb-1">Message:</span>
                <p className="text-xs text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-slate-100 font-medium">
                  {selectedAlert.message}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3">
                <div>
                  <span className="text-slate-400 block font-semibold">Assigned To:</span>
                  <span className="text-slate-800 font-medium">{selectedAlert.assignedTo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Action Taken:</span>
                  <span className="text-slate-800 font-medium">{selectedAlert.actionTaken}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerBrowserPrint()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  Print Single Notice
                </button>
                {(selectedAlert.type === 'Student Absenteeism' || (selectedAlert.consecutiveDays || 0) > 3) && (
                  <button
                    type="button"
                    onClick={() => handleWhatsAppParent(selectedAlert)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Parent</span>
                  </button>
                )}
                {onNavigate && (selectedAlert.type === 'Student Absenteeism' || (selectedAlert.consecutiveDays || 0) > 3) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAlert(null);
                      onNavigate('attendance');
                    }}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>Open Attendance</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PRINT ALL MODAL */}
      {isPrintAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 no-print overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">Official Alerts Ledger (A4 Table)</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerBrowserPrint()}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print A4
                </button>
                <button
                  type="button"
                  onClick={() => downloadElementAsPdf('alerts-print-table', 'TaleemOS_Alerts_Ledger')}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF Download
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
            <div id="alerts-print-table">
              <LetterheadPrint
                title="Institutional Alerts & Priority Communications Ledger"
                documentNo="NOTIF-LEDGER-2026"
                summaryStats={[
                  { label: 'Total Alerts', value: totalAlerts },
                  { label: 'Critical Alerts', value: criticalCount },
                  { label: 'Pending Action', value: pendingCount },
                  { label: 'Resolved', value: resolvedCount },
                ]}
              >
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold">
                      <th className="border border-slate-300 p-2">Ref ID</th>
                      <th className="border border-slate-300 p-2">Title</th>
                      <th className="border border-slate-300 p-2">Type</th>
                      <th className="border border-slate-300 p-2">Priority</th>
                      <th className="border border-slate-300 p-2">Date</th>
                      <th className="border border-slate-300 p-2">Assigned To</th>
                      <th className="border border-slate-300 p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map((a) => (
                      <tr key={a.id}>
                        <td className="border border-slate-300 p-2 font-mono font-bold">{a.id}</td>
                        <td className="border border-slate-300 p-2 font-bold">{a.title}</td>
                        <td className="border border-slate-300 p-2">{a.type}</td>
                        <td className="border border-slate-300 p-2 font-semibold">{a.priority}</td>
                        <td className="border border-slate-300 p-2 font-mono">{a.date}</td>
                        <td className="border border-slate-300 p-2">{a.assignedTo}</td>
                        <td className="border border-slate-300 p-2 font-bold">{a.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </LetterheadPrint>
            </div>
          </div>
        </div>
      )}

      {/* Delete Notice Confirmation Modal */}
      {deletingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Notice</h3>
                <p className="text-xs text-slate-500">Are you sure you want to permanently remove this notice?</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{deletingAlert.title}</div>
              <div className="text-[11px] text-slate-500 line-clamp-2">{deletingAlert.message}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Scope: {deletingAlert.academyId === 'all' ? '🌐 Entire App (All Users)' : `🏫 ${deletingAlert.academyName || deletingAlert.academyId}`}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAlert(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm"
              >
                Yes, Delete Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsModule;
