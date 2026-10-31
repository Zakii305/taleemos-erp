import React, { useState, useEffect } from 'react';
import { Bell, Megaphone, Plus, X, Trash2, Edit2, CheckCircle2, AlertTriangle, Clock, Send, Building2, Globe, Radio, ExternalLink, ShieldCheck, CheckSquare } from 'lucide-react';
import { erpStorage, INSTITUTIONS } from '../../lib/storage';
import { type AlertNotification, type ApprovalRequest } from '../../types';
import { getCurrentUser } from '../auth/AuthSystem';
import { saveNoticeToFirestore, deleteNoticeFromFirestore } from '../../lib/academyService';
import { logAuditEvent } from '../../lib/auditLogger';

interface TopbarNoticesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const TopbarNoticesModal: React.FC<TopbarNoticesModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const currentUser = getCurrentUser();
  const isDev = currentUser?.role === 'developer';
  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher';
  const canPostNotices = isDev || isAdmin || isTeacher;

  const userAcademyId = currentUser?.academyId || 'inst-1';
  const userAcademyName = currentUser?.academyName || INSTITUTIONS.find((i) => i.academyId === userAcademyId)?.academyName || 'Taleem Academy';

  // Tab State
  const [activeTab, setActiveTab] = useState<'notices' | 'approvals'>('notices');

  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<AlertNotification['priority']>('Medium');
  const [type, setType] = useState<AlertNotification['type']>('General');
  const [audience, setAudience] = useState<AlertNotification['audience']>('All');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = () => {
    const state = erpStorage.getState();
    const filteredAlerts = state.alerts.filter((item) => {
      if (isDev) return true;
      const belongsToOwn = item.academyId === userAcademyId;
      const isGlobal = item.academyId === 'all';
      const isLegacy = !item.academyId;
      return belongsToOwn || isGlobal || isLegacy;
    });
    setAlerts(filteredAlerts);

    const pendingAppr = state.approvals.filter(a => a.status === 'Pending Approval');
    setApprovals(pendingAppr);
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [userAcademyId, isDev]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handleKeyDown);
      return () => { document.body.style.overflow = ''; document.body.style.touchAction = ''; window.removeEventListener('keydown', handleKeyDown); };
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canModify = (item: AlertNotification) => {
    if (isDev) return true;
    if ((isAdmin || isTeacher) && (item.academyId === userAcademyId || (!item.academyId && userAcademyId === 'inst-1'))) return true;
    if (item.postedById && (item.postedById === currentUser?.uid || item.postedById === currentUser?.id)) return true;
    return false;
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    if (editingAlertId) {
      const existing = alerts.find((a) => a.id === editingAlertId);
      if (existing) {
        const updated = { ...existing, title: title.trim(), message: message.trim(), priority, type, audience };
        erpStorage.updateItem('alerts', existing.id, updated);
        saveNoticeToFirestore(updated);
        logAuditEvent({ action: 'NOTICE_UPDATE', module: 'Alerts & Notices', targetRecord: title, details: `Updated notice ${existing.id} via Topbar Quick Panel` });
        setSuccessMsg('Notice updated successfully!');
      }
      setEditingAlertId(null);
    } else {
      const targetAcadId = isDev ? 'all' : userAcademyId;
      const targetAcadName = isDev ? 'Global Broadcast (All Academies)' : userAcademyName;
      const newAlert: AlertNotification = {
        id: `ALT-${Date.now().toString().slice(-4)}`, title: title.trim(), type, priority, date: new Date().toISOString().split('T')[0], audience, status: 'New',
        message: message.trim(), assignedTo: isTeacher ? `${currentUser?.name || 'Teacher'} (Faculty)` : 'Academy Administration', actionTaken: 'Published via Topbar',
        academyId: targetAcadId, academyName: targetAcadName, postedBy: currentUser?.name || (isDev ? 'Developer' : isTeacher ? 'Teacher' : 'Admin'),
        postedByRole: currentUser?.role || (isDev ? 'developer' : isTeacher ? 'teacher' : 'admin'), postedById: currentUser?.uid || currentUser?.id || 'usr-quick',
      };
      erpStorage.addItem('alerts', newAlert);
      saveNoticeToFirestore(newAlert);
      logAuditEvent({ action: 'NOTICE_CREATE', module: 'Alerts & Notices', targetRecord: title, details: `Published notice for ${targetAcadName} via Topbar Quick Panel` });
      setSuccessMsg(`Notice published to ${targetAcadName}!`);
    }
    loadData(); setTitle(''); setMessage(''); setShowPostForm(false); setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleStartEdit = (item: AlertNotification) => {
    setEditingAlertId(item.id); setTitle(item.title); setMessage(item.message); setPriority(item.priority); setType(item.type); setAudience(item.audience); setShowPostForm(true);
  };

  const handleDelete = async (item: AlertNotification) => {
    if (confirm(`Delete notice "${item.title}"?`)) {
      erpStorage.deleteItem('alerts', item.id);
      await deleteNoticeFromFirestore(item.id);
      logAuditEvent({ action: 'NOTICE_DELETE', module: 'Alerts & Notices', targetRecord: item.title, details: `Deleted notice ${item.id}` });
      loadData(); setSuccessMsg('Notice deleted.'); setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'Critical': return <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-black uppercase border border-rose-200">Critical</span>;
      case 'High': return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-black uppercase border border-amber-200">High</span>;
      case 'Medium': return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-black uppercase border border-blue-200">Medium</span>;
      default: return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-black uppercase border border-slate-200">Low</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center items-center overflow-y-auto no-print overscroll-contain touch-pan-y">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-t-[28px] md:rounded-[24px] shadow-2xl border border-slate-200/80 max-h-[88vh] flex flex-col z-10 my-0 md:my-8 overflow-hidden overscroll-contain">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-xl shrink-0">📥</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-white">Notification Center</h3>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-md">
                  {isDev ? 'Global' : userAcademyName.split(' ')[0]}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">Stay updated with notices & approvals</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-200 px-2 pt-2 bg-slate-50 shrink-0">
          <button onClick={() => setActiveTab('notices')} className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 ${activeTab === 'notices' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <Megaphone className="w-4 h-4" /> Notices ({alerts.length})
          </button>
          <button onClick={() => setActiveTab('approvals')} className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 ${activeTab === 'approvals' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <CheckSquare className="w-4 h-4" /> Approvals ({approvals.length})
          </button>
        </div>

        {successMsg && (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /><span>{successMsg}</span>
          </div>
        )}

        {/* TAB CONTENT: NOTICES */}
        {activeTab === 'notices' && (
          <>
            <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-600 font-semibold"><span>{alerts.length} Active Notices</span></div>
              <div className="flex items-center gap-2">
                {canPostNotices && (
                  <button type="button" onClick={() => { if (showPostForm) { setShowPostForm(false); setEditingAlertId(null); setTitle(''); setMessage(''); } else { setShowPostForm(true); } }} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /><span>{showPostForm ? 'Cancel Post' : '+ Post Notice'}</span>
                  </button>
                )}
                <button type="button" onClick={() => { onClose(); onNavigate('alerts'); }} className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                  <span>Full Center</span><ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
              {showPostForm && canPostNotices && (
                <form onSubmit={handlePublish} className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5 text-indigo-600" />{editingAlertId ? 'Edit Notice' : 'Post New Notice'}</span><span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">Scope: {isDev ? 'Global' : userAcademyName}</span></div>
                  <div><label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Notice Title *</label><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mid-Term Examination Routine Announced" className="w-full px-3 py-2 bg-white border rounded-xl text-xs outline-none focus:border-indigo-500 font-medium" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div><label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Priority</label><select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="w-full px-2.5 py-1.5 bg-white border rounded-lg font-bold"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select></div>
                    <div><label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Category</label><select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full px-2.5 py-1.5 bg-white border rounded-lg font-bold"><option value="General">General</option><option value="Exam">Exam</option><option value="Fee">Fee</option><option value="Holiday">Holiday</option><option value="Emergency">Emergency</option></select></div>
                    <div><label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Audience</label><select value={audience} onChange={(e) => setAudience(e.target.value as any)} className="w-full px-2.5 py-1.5 bg-white border rounded-lg font-bold"><option value="All">All</option><option value="Students">Students</option><option value="Parents">Parents</option><option value="Faculty">Faculty</option></select></div>
                  </div>
                  <div><label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Message Content *</label><textarea required rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type official announcement here..." className="w-full px-3 py-2 bg-white border rounded-xl text-xs outline-none focus:border-indigo-500" /></div>
                  <div className="flex justify-end pt-1"><button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"><Send className="w-3.5 h-3.5" /> {editingAlertId ? 'Update Notice' : 'Publish Notice'}</button></div>
                </form>
              )}

              {alerts.length === 0 ? (
                <div className="py-12 text-center text-slate-400"><Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm font-bold">No notices posted yet.</p></div>
              ) : (
                alerts.map((item) => (
                  <div key={item.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">{getPriorityBadge(item.priority)}<span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{item.type}</span><span className="text-[10px] text-slate-400 font-mono flex items-center gap-1"><Clock className="w-3 h-3" />{item.date}</span></div>
                      {canModify(item) && (<div className="flex items-center gap-1"><button onClick={() => handleStartEdit(item)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(item)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button></div>)}
                    </div>
                    <h4 className="font-black text-sm text-slate-900 mt-2">{item.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">{item.message}</p>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400"><span>By {item.postedBy} ({item.postedByRole})</span><span>To: {item.audience}</span></div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* TAB CONTENT: APPROVALS */}
        {activeTab === 'approvals' && (
          <>
            <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-600 font-semibold"><span>{approvals.length} Pending Approvals</span></div>
              <button type="button" onClick={() => { onClose(); onNavigate('approvals'); }} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                <span>Approvals Center</span><ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-3 overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
              {approvals.length === 0 ? (
                <div className="py-12 text-center text-slate-400"><CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400 opacity-50" /><p className="text-sm font-bold">All caught up!</p><p className="text-xs mt-1">No pending approvals.</p></div>
              ) : (
                approvals.map((appr) => (
                  <div key={appr.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between gap-2"><span className="px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded text-[10px] font-black uppercase">Pending</span><span className="text-[10px] text-slate-400 font-mono">{appr.date}</span></div>
                      <h4 className="font-black text-sm text-slate-900 mt-2">{appr.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{appr.reason || 'Requires approval'}</p>
                      <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100"><span className="font-bold">Requested By:</span> {appr.requestedBy} ({appr.requestedRole})</div>
                    </div>
                    <div className="flex justify-end pt-2 border-t border-slate-100"><button onClick={() => { onClose(); onNavigate('approvals'); }} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">Review Now →</button></div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
