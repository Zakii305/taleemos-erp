import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Users, Search, Filter, Printer, Download, Plus, Trash2, Edit2, ShieldCheck, CheckCircle2, XCircle, Clock, Building2, Phone, Mail, UserCheck, Calendar, AlertCircle, Lock, ArrowRight, Shield, FileSpreadsheet, CheckSquare, Square, X, RefreshCw } from 'lucide-react';
import { getLocalUsers, saveLocalUsers, deleteUserAccount, updateUserRole, updateUserAccount, registerUserAccount, fetchActiveAcademies, fetchPendingUsers, setUserApprovalStatus, DEV_EMAILS } from '../lib/academyService';
import { getCurrentUser, type User } from '../components/auth/AuthSystem';
import { type AppUser, type Academy, type UserRole } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';

interface UsersModuleProps {
  onNavigate?: (path: string) => void;
}

export const UsersModule: React.FC<UsersModuleProps> = ({ onNavigate }) => {
    
  
  

  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [users, setUsers] = useState<AppUser[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [academyFilter, setAcademyFilter] = useState<string>('All');

  // Multi-select state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<AppUser[] | null>(null);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<AppUser['role']>('teacher');
  const [formAcademyId, setFormAcademyId] = useState('');
  const [formPassword, setFormPassword] = useState('pass123');

  // Edit form fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<AppUser['role']>('teacher');
  const [editStatus, setEditStatus] = useState<AppUser['status']>('approved');
  const [editAcademyId, setEditAcademyId] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const loadAll = async () => {
    const u = getCurrentUser();
    setCurrentUser(u);
    const isDeveloper = Boolean(u?.role === 'developer' || (u?.email && DEV_EMAILS.includes(u.email.toLowerCase())));
    try { await fetchPendingUsers(u?.academyId, isDeveloper); } catch (err) { console.warn(err); }
    const [userList, acadList] = await Promise.all([Promise.resolve(getLocalUsers()), fetchActiveAcademies()]);
    setUsers(userList);
    setAcademies(acadList);
    if (acadList.length > 0 && !formAcademyId) setFormAcademyId(acadList[0].academyId);
  };

  const handleManualFirestoreRefresh = async () => {
    setIsRefreshing(true);
    const u = getCurrentUser();
    const isDeveloper = Boolean(u?.role === 'developer' || (u?.email && DEV_EMAILS.includes(u.email.toLowerCase())));
    const fetched = await fetchPendingUsers(u?.academyId, isDeveloper);
    setUsers(getLocalUsers());
    setIsRefreshing(false);
    showToast(`✓ Synced! Found ${fetched?.length || 0} pending registration(s).`);
  };

  const handleApproveUser = async (target: AppUser) => {
    await setUserApprovalStatus(target.uid || target.id || '', 'approved');
    showToast(`✓ Account for ${target.name} approved!`); loadAll();
  };

  const handleRejectUser = async (target: AppUser) => {
    await setUserApprovalStatus(target.uid || target.id || '', 'rejected');
    showToast(`✕ Account for ${target.name} rejected.`); loadAll();
  };

  useEffect(() => {
    loadAll();
    const handleStorage = () => loadAll();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isDev = currentUser?.role === 'developer' || (currentUser?.email && DEV_EMAILS.includes(currentUser.email.toLowerCase()));
  const isAdmin = currentUser?.role === 'admin';
  const userAcadId = currentUser?.academyId;

  const visibleUsers = useMemo(() => {
    let list = users;
    if (!isDev && isAdmin && userAcadId) list = users.filter((u) => u.academyId === userAcadId || u.uid === currentUser?.uid || "");
    return list.filter((u) => {
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (u.phone && u.phone.includes(search)) || (u.academyName && u.academyName.toLowerCase().includes(search.toLowerCase())) || (u.uid && u.uid.toLowerCase().includes(search.toLowerCase()));
      const matchRole = roleFilter === 'All' || u.role === roleFilter;
      const matchStatus = statusFilter === 'All' || u.status === statusFilter;
      const matchAcademy = academyFilter === 'All' || u.academyId === academyFilter;
      return matchSearch && matchRole && matchStatus && matchAcademy;
    });
  }, [users, isDev, isAdmin, userAcadId, currentUser, search, roleFilter, statusFilter, academyFilter]);

  const pendingUsers = useMemo(() => {
    let list = users.filter((u) => u.status === 'pending');
    if (!isDev && isAdmin && userAcadId) list = list.filter((u) => u.academyId === userAcadId && u.role !== 'admin' && u.role !== 'developer');
    return list;
  }, [users, isDev, isAdmin, userAcadId]);

  const totalCount = visibleUsers.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const teacherCount = visibleUsers.filter((u) => u.role === 'teacher').length;
  const studentCount = visibleUsers.filter((u) => u.role === 'student').length;
  const pendingCount = pendingUsers.length;

  // Selection
  const toggleUserSelect = (uid: string) => setSelectedUserIds((prev) => prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]);
  const toggleUserSelectAll = () => { if (selectedUserIds.length === visibleUsers.length && visibleUsers.length > 0) setSelectedUserIds([]); else setSelectedUserIds(visibleUsers.map((u) => u.uid || u.id || '')); };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedUserIds.length} selected user accounts permanently?`)) return;
    for (const uid of selectedUserIds) {
      const target = users.find(u => (u.uid || u.id) === uid);
      if (target && currentUser) await deleteUserAccount(uid, target, currentUser);
    }
    setSelectedUserIds([]); showToast('Selected users deleted.'); loadAll();
  };

  const handleTriggerPrint = (recordsToPrint: AppUser[]) => {
    setPrintData(recordsToPrint);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 300);
  };

  const handleOpenEditUser = (u: AppUser) => {
    setEditingUser(u); setEditName(u.name); setEditPhone(u.phone || ''); setEditRole(u.role); setEditStatus(u.status); setEditAcademyId(u.academyId || academies[0]?.academyId || ''); setIsEditUserModalOpen(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingUser) return;
    const chosenAcad = academies.find((a) => a.academyId === editAcademyId);
    await updateUserAccount(editingUser.uid || editingUser.id || '', { name: editName.trim(), phone: editPhone.trim(), role: editRole, status: editStatus, academyId: editRole === 'developer' ? null : editAcademyId, academyName: editRole === 'developer' ? 'All Academies Network' : (chosenAcad?.academyName || editingUser.academyName) });
    setIsEditUserModalOpen(false); setEditingUser(null); showToast(`Updated user: ${editName}`); loadAll();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault(); if (!formName.trim() || !formEmail.trim()) return;
    const targetAcad = academies.find((a) => a.academyId === formAcademyId);
    await registerUserAccount({ uid: `usr-${Date.now()}`, email: formEmail.trim().toLowerCase(), name: formName.trim(), phone: formPhone.trim(), role: formRole as UserRole, academyId: formRole === 'developer' ? null : formAcademyId, academyName: formRole === 'developer' ? 'All Academies Network' : (targetAcad?.academyName || 'Taleem Academy'), password: formPassword });
    setIsAddModalOpen(false); setFormName(''); setFormEmail(''); setFormPhone('');
    showToast(`Registered new user: ${formName}`); loadAll();
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete || !currentUser) return;
    const res = await deleteUserAccount(userToDelete.uid || userToDelete.id || '', userToDelete, currentUser);
    if (res.success) { showToast(`User ${userToDelete.name} removed.`); setUserToDelete(null); loadAll(); } else { alert(res.error || 'Failed to delete user.'); }
  };

  const formatJoinedDateTime = (ts: number | string | undefined) => {
    if (!ts) return 'Earlier Session';
    const num = typeof ts === 'string' ? parseInt(ts, 10) : ts;
    if (isNaN(num)) return String(ts);
    const d = new Date(num);
    return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const PrintTableContent = ({ data }: { data: AppUser[] }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead><tr className="bg-slate-100 text-slate-800 font-bold"><th className="border p-2 w-8">#</th><th className="border p-2">Name</th><th className="border p-2">Email / Phone</th><th className="border p-2">Role</th><th className="border p-2">Academy</th><th className="border p-2">Status</th></tr></thead>
      <tbody>{data.map((u, idx) => (<tr key={u.uid || u.id}><td className="border p-2 font-mono text-center">{idx + 1}</td><td className="border p-2 font-bold">{u.name}</td><td className="border p-2 font-mono">{u.email}<br/>{u.phone || '-'}</td><td className="border p-2 font-bold uppercase">{u.role}</td><td className="border p-2">{u.academyName || 'Global'}</td><td className="border p-2 font-bold uppercase">{u.status}</td></tr>))}</tbody>
    </table>
  );
  return (
    <>
      <div className="space-y-6 print:hidden">
        {toast && <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-indigo-500/30 flex items-center gap-3 text-xs font-bold animate-fade-in"><span>{toast}</span></div>}

        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Stakeholders Roster & RBAC</span><span className="text-xs text-slate-400">{isDev ? 'Global Scope' : (currentUser?.academyName || 'My Academy')}</span></div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Institutional Users Directory</h1>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">Complete stakeholder directory with full joined timestamps, contact details, and role permissions.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setIsPrintModalOpen(true)} className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-white/10 transition shadow-sm cursor-pointer"><Printer className="w-4 h-4 text-indigo-300" /><span>Print Roster</span></button>
              <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"><Plus className="w-4 h-4" /><span>Register User</span></button>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><span className="text-[10px] font-bold uppercase text-slate-400 block">Total Users</span><span className="text-2xl font-black text-indigo-300 font-mono mt-0.5 block">{totalCount}</span></div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><span className="text-[10px] font-bold uppercase text-slate-400 block">Admins</span><span className="text-2xl font-black text-blue-300 font-mono mt-0.5 block">{adminCount}</span></div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><span className="text-[10px] font-bold uppercase text-slate-400 block">Teachers</span><span className="text-2xl font-black text-emerald-300 font-mono mt-0.5 block">{teacherCount}</span></div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><span className="text-[10px] font-bold uppercase text-slate-400 block">Students</span><span className="text-2xl font-black text-cyan-300 font-mono mt-0.5 block">{studentCount}</span></div>
            <button type="button" onClick={() => setStatusFilter(statusFilter === 'pending' ? 'All' : 'pending')} className={`p-3 rounded-2xl border transition text-left cursor-pointer ${statusFilter === 'pending' ? 'bg-amber-500 text-white border-amber-400 shadow-md' : 'bg-amber-500/15 text-amber-200 border-amber-500/30 hover:bg-amber-500/25'}`}><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase block opacity-80">Pending Queue</span>{pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}</div><span className="text-2xl font-black font-mono mt-0.5 block">{pendingCount}</span></button>
          </div>
        </div>

        {/* Filters & Toolbar */}
        <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, phone, UID, or academy..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-500" />
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button onClick={handleManualFirestoreRefresh} disabled={isRefreshing} className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"><RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /><span>{isRefreshing ? 'Syncing...' : 'Sync'}</span></button>
              <button onClick={toggleUserSelectAll} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0">{selectedUserIds.length === visibleUsers.length && visibleUsers.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />}<span>Select All ({visibleUsers.length})</span></button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5 text-xs"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Role:</span>{['All', 'developer', 'admin', 'teacher', 'student', 'parent'].map((r) => (<button key={r} onClick={() => setRoleFilter(r)} className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition capitalize cursor-pointer ${roleFilter === r ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{r === 'All' ? 'All Roles' : r}</button>))}</div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>{['All', 'approved', 'pending', 'rejected'].map((st) => (<button key={st} onClick={() => setStatusFilter(st)} className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition capitalize cursor-pointer flex items-center gap-1 ${statusFilter === st ? (st === 'pending' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-900 text-white shadow-sm') : (st === 'pending' && pendingCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300 font-extrabold hover:bg-amber-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}><span>{st === 'All' ? 'All Status' : st}</span>{st === 'pending' && pendingCount > 0 && <span className="px-1.5 py-0.2 text-[9px] bg-amber-500 text-white rounded-full font-mono">{pendingCount}</span>}</button>))}</div>
          </div>
        </div>

        {/* Floating Bulk Actions */}
        {selectedUserIds.length > 0 && (
          <div className="p-3.5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg border border-indigo-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold"><span className="px-2.5 py-1 bg-indigo-500 text-white rounded-lg font-mono">{selectedUserIds.length}</span><span>Users Selected</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleTriggerPrint(visibleUsers.filter(u => selectedUserIds.includes(u.uid || u.id || '')))} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-3.5 h-3.5" /> Print Selected</button>
              <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              <button onClick={() => setSelectedUserIds([])} className="p-1.5 text-slate-400 hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Pending Approvals */}
        {pendingUsers.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
              <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm"><Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} /></div><div><h3 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">Pending Approvals <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 border border-amber-300">{pendingUsers.length} in Queue</span></h3><p className="text-[11px] text-amber-800">{isDev ? 'Approve or reject Admins across branches.' : `Authorize users for ${currentUser?.academyName}`}</p></div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingUsers.map((pUser) => (
                <div key={pUser.uid || pUser.id} className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-sm flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2.5 min-w-0"><div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">{pUser.name.charAt(0).toUpperCase()}</div><div className="min-w-0"><h4 className="font-extrabold text-slate-900 text-xs truncate">{pUser.name}</h4><span className="text-[10px] text-slate-500 font-mono block truncate">{pUser.email}</span></div></div><span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 shrink-0">{pUser.role}</span></div>
                    <div className="text-[11px] text-slate-600 bg-slate-50 rounded-xl p-2.5 space-y-1 border border-slate-100"><div className="flex justify-between"><span className="text-slate-400 text-[10px]">Academy:</span><span className="font-semibold text-slate-800 truncate">{pUser.academyName || 'Unassigned'}</span></div><div className="flex justify-between"><span className="text-slate-400 text-[10px]">Applied:</span><span className="text-[10px] text-slate-500">{formatJoinedDateTime(pUser.createdAt)}</span></div></div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button onClick={() => handleApproveUser(pUser)} className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"><CheckCircle2 className="w-3.5 h-3.5" /><span>Approve</span></button>
                    <button onClick={() => handleRejectUser(pUser)} className="py-1.5 px-3 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1"><XCircle className="w-3.5 h-3.5" /><span>Reject</span></button>
                    <button onClick={() => setUserToDelete(pUser)} className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Users Table */}
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead><tr className="bg-slate-100 text-slate-700 font-bold border-b"><th className="p-3 w-10 text-center"><input type="checkbox" checked={selectedUserIds.length === visibleUsers.length && visibleUsers.length > 0} onChange={toggleUserSelectAll} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" /></th><th className="p-3">User Details</th><th className="p-3">Role</th><th className="p-3">Academy</th><th className="p-3">Phone</th><th className="p-3">When Joined</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visibleUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.uid || u.id || '');
                  return (
                    <tr key={u.uid || u.id} className={`transition ${isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50/60'}`}>
                      <td className="p-3 text-center"><input type="checkbox" checked={isSelected} onChange={() => toggleUserSelect(u.uid || u.id || '')} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" /></td>
                      <td className="p-3"><div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 ${u.role === 'developer' ? 'bg-purple-600' : u.role === 'admin' ? 'bg-blue-600' : u.role === 'teacher' ? 'bg-emerald-600' : u.role === 'student' ? 'bg-cyan-600' : 'bg-amber-600'}`}>{u.name.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="font-extrabold text-slate-900 truncate">{u.name}</p><p className="text-[11px] text-slate-500 font-mono truncate">{u.email}</p></div></div></td>
                      <td className="p-3"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border bg-slate-100 text-slate-700`}>{u.role}</span></td>
                      <td className="p-3 text-slate-800 line-clamp-1">{u.academyName || 'Global'}</td>
                      <td className="p-3 font-mono text-slate-600">{u.phone || 'N/A'}</td>
                      <td className="p-3 whitespace-nowrap text-[11px] text-slate-600">{formatJoinedDateTime(u.createdAt)}</td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${u.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : u.status === 'pending' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-rose-100 text-rose-800'}`}>{u.status}</span></td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.status === 'pending' && (<><button onClick={() => handleApproveUser(u)} className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approve</button><button onClick={() => handleRejectUser(u)} className="px-2 py-1 bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> Reject</button></>)}
                          <button onClick={() => handleOpenEditUser(u)} className="p-1.5 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setUserToDelete(u)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <Modal isOpen={isEditUserModalOpen} onClose={() => { setIsEditUserModalOpen(false); setEditingUser(null); }} title={`Edit User: ${editingUser.name}`} subtitle={`UID: ${editingUser.uid || editingUser.id}`} badge="MODIFY USER">
          <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
            <div><label className="block font-bold text-slate-700 uppercase mb-1">Full Name *</label><input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-bold outline-none focus:border-indigo-600" /></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="block font-bold text-slate-700 uppercase mb-1">Phone</label><input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl outline-none font-mono" /></div><div><label className="block font-bold text-slate-700 uppercase mb-1">Status</label><select value={editStatus} onChange={(e) => setEditStatus(e.target.value as AppUser['status'])} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-bold outline-none"><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option></select></div></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="block font-bold text-slate-700 uppercase mb-1">Role *</label><select value={editRole} onChange={(e) => setEditRole(e.target.value as AppUser['role'])} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-bold outline-none"><option value="developer">👑 Developer</option><option value="admin">🛡️ Admin</option><option value="teacher">👨‍🏫 Teacher</option><option value="student">🎓 Student</option><option value="parent">👨‍👩‍👧 Parent</option></select></div><div><label className="block font-bold text-slate-700 uppercase mb-1">Academy</label><select value={editAcademyId} onChange={(e) => setEditAcademyId(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-bold outline-none truncate">{academies.map((a) => (<option key={a.academyId} value={a.academyId}>{a.academyName}</option>))}</select></div></div>
            <div className="pt-3 flex justify-end gap-2 border-t"><button type="button" onClick={() => { setIsEditUserModalOpen(false); setEditingUser(null); }} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button><button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black shadow-md">Save Changes</button></div>
          </form>
        </Modal>
      )}

      {/* CREATE USER MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New User" subtitle="Provision account credentials" badge="PROVISION">
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div><label className="block font-bold text-slate-700 mb-1">Full Name *</label><input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-medium outline-none" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="block font-bold text-slate-700 mb-1">Email *</label><input type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-medium outline-none" /></div><div><label className="block font-bold text-slate-700 mb-1">Phone</label><input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-medium outline-none" /></div></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="block font-bold text-slate-700 mb-1">Role *</label><select value={formRole} onChange={(e) => setFormRole(e.target.value as AppUser['role'])} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-bold outline-none"><option value="developer">👑 Developer</option><option value="admin">🛡️ Admin</option><option value="teacher">👨‍🏫 Teacher</option><option value="student">🎓 Student</option><option value="parent">👨‍👩‍👧 Parent</option></select></div><div><label className="block font-bold text-slate-700 mb-1">Academy</label><select value={formAcademyId} onChange={(e) => setFormAcademyId(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-bold outline-none truncate">{academies.map((a) => (<option key={a.academyId} value={a.academyId}>{a.academyName}</option>))}</select></div></div>
          <div><label className="block font-bold text-slate-700 mb-1">Password *</label><input type="text" required value={formPassword} onChange={(e) => setFormPassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono text-slate-800 outline-none" /></div>
          <div className="flex justify-end gap-2 pt-3 border-t"><button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button><button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black shadow-md">Confirm</button></div>
        </form>
      </Modal>

      {/* DELETE MODAL */}
      {userToDelete && (
        <Modal isOpen={Boolean(userToDelete)} onClose={() => setUserToDelete(null)} title="Confirm Deletion">
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3"><AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" /><div><p className="font-extrabold text-rose-900 text-sm">Delete {userToDelete.name}?</p><p className="text-rose-700 mt-1">Role: <b>{userToDelete.role.toUpperCase()}</b> • Email: <b>{userToDelete.email}</b></p></div></div>
            <div className="flex justify-end gap-2 pt-2 border-t"><button onClick={() => setUserToDelete(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button><button onClick={handleConfirmDelete} className="px-5 py-2 bg-rose-600 text-white rounded-xl font-black shadow-md">Delete Account</button></div>
          </div>
        </Modal>
      )}
      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div><h3 className="font-bold text-base text-slate-900">Print Users Directory</h3><p className="text-[11px] text-slate-500">Export user roster to A4.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => handleTriggerPrint(visibleUsers)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print Filtered</button>
                <button type="button" onClick={() => handleTriggerPrint(users)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print All</button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div className="bg-white shadow-md mx-auto pointer-events-none min-w-[800px]">
                <div className="p-8">
                  <LetterheadPrint title="INSTITUTIONAL USER ACCOUNTS & ROLES DIRECTORY" documentNo="USR-LEDGER-2026" summaryStats={[{ label: 'Total Users', value: visibleUsers.length }]}>
                    <PrintTableContent data={visibleUsers} />
                  </LetterheadPrint>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECRET PRINT PORTAL - ONLY RENDERED WHEN PRINTING */}
      {/* ======================================================== */}
      {printData && createPortal(
        <div id="print-mount" className="hidden print:block w-full bg-white text-slate-900">
          <div className="print-page">
            <LetterheadPrint title="INSTITUTIONAL USER ACCOUNTS & ROLES DIRECTORY" documentNo="USR-LEDGER-2026" summaryStats={[{ label: 'Total Records', value: printData.length }]}>
              <PrintTableContent data={printData} />
            </LetterheadPrint>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default UsersModule;
