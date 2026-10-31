import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, Building2, Users, CheckCircle2, XCircle, Plus, Search, ArrowRight, TrendingUp, MapPin, Phone, Mail, UserCheck, Clock, ExternalLink, RefreshCw, Trash2, Edit3, KeyRound, Sparkles, Copy, Shuffle, Ban, Lock, Eye, EyeOff, Check, Printer, CheckSquare, Square, X } from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { fetchActiveAcademies, createAcademy, updateAcademy, deleteAcademy, getPendingAdmins, setUserApprovalStatus, getLocalUsers, deleteUserAccount } from '../lib/academyService';
import { getDemoAccountsConfig, toggleDemoVisibility, resetRandomDemoCredentials, revokeDemoCredentials, restoreDemoCredentials, updateCustomDemoCredentials, type DemoRole, type DemoAccountsConfig } from '../lib/demoAccountService';
import { type Academy, type AppUser } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';

interface DeveloperModuleProps {
  onNavigate?: (path: string) => void;
  onSelectAcademy?: (academyId: string) => void;
}

export const DeveloperModule: React.FC<DeveloperModuleProps> = ({ onNavigate, onSelectAcademy }) => {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [pendingAdmins, setPendingAdmins] = useState<AppUser[]>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'academies' | 'pending' | 'users' | 'demo'>('academies');
  const [search, setSearch] = useState('');

  // Selection & Print State
  const [selectedAcademyIds, setSelectedAcademyIds] = useState<string[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<Academy[] | null>(null);

  // Demo Config State
  const [demoConfig, setDemoConfig] = useState<DemoAccountsConfig>(getDemoAccountsConfig);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customEditRole, setCustomEditRole] = useState<DemoRole | null>(null);
  const [customLoginInput, setCustomLoginInput] = useState('');
  const [customPasswordInput, setCustomPasswordInput] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAcademyName, setNewAcademyName] = useState('');
  const [newAcademyCode, setNewAcademyCode] = useState('');
  const [newAcademyAddress, setNewAcademyAddress] = useState('');
  const [newAcademyPhone, setNewAcademyPhone] = useState('');
  const [assignedAdminEmail, setAssignedAdminEmail] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAcademy, setEditingAcademy] = useState<Academy | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editAdminName, setEditAdminName] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  
  const [deletingAcademy, setDeletingAcademy] = useState<Academy | null>(null);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const state = erpStorage.getState();

  const loadData = async () => {
    setLoading(true);
    try {
      const [acadList, adminsList] = await Promise.all([fetchActiveAcademies(), getPendingAdmins()]);
      setAcademies(acadList);
      setPendingAdmins(adminsList);
      setAllUsers(getLocalUsers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleCreateAcademy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcademyName.trim() || !newAcademyCode.trim()) return;
    
    const newAcad = await createAcademy({
      academyId: `acad-${Date.now().toString().slice(-4)}`, academyName: newAcademyName.trim(), code: newAcademyCode.trim().toUpperCase(),
      address: newAcademyAddress.trim() || 'Sindh, Pakistan', phone: newAcademyPhone.trim() || '0300-0000000', adminEmail: assignedAdminEmail.trim() || undefined,
      createdBy: 'developer@hisaabkitaab.com',
    }, 'developer@hisaabkitaab.com');

    setIsCreateModalOpen(false); setNewAcademyName(''); setNewAcademyCode(''); setNewAcademyAddress(''); setNewAcademyPhone(''); setAssignedAdminEmail('');
    showToast(`✅ Created new Academy: ${newAcad.academyName} (${newAcad.code})`); loadData();
  };

  const handleApproveAdmin = async (adminUser: AppUser, allottedAcadId?: string) => {
    const targetAcademy = allottedAcadId || adminUser.academyId || academies[0]?.academyId;
    await setUserApprovalStatus(adminUser.uid, 'approved', targetAcademy || undefined);
    showToast(`🎉 Approved Admin: ${adminUser.name}`); loadData();
  };

  const handleRejectAdmin = async (adminUser: AppUser) => {
    await setUserApprovalStatus(adminUser.uid, 'rejected');
    showToast(`❌ Rejected Admin registration: ${adminUser.email}`); loadData();
  };

  const handleOpenEdit = (acad: Academy) => {
    setEditingAcademy(acad); setEditName(acad.academyName || ''); setEditCode(acad.code || ''); setEditAddress(acad.address || '');
    setEditPhone(acad.phone || ''); setEditAdminEmail(acad.adminEmail || ''); setEditAdminName(acad.adminName || ''); setEditIsActive(acad.isActive ?? true);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAcademy || !editName.trim() || !editCode.trim()) return;
    const res = await updateAcademy(editingAcademy.academyId, { academyName: editName.trim(), code: editCode.trim().toUpperCase(), address: editAddress.trim(), phone: editPhone.trim(), adminEmail: editAdminEmail.trim() || undefined, adminName: editAdminName.trim() || undefined, isActive: editIsActive });
    if (res.success) { showToast(`✏️ Updated "${editName.trim()}" successfully!`); setIsEditModalOpen(false); setEditingAcademy(null); loadData(); }
    else { showToast(`❌ Failed to update: ${res.error || 'Unknown error'}`); }
  };

  const confirmDeleteAcademy = async () => {
    if (!deletingAcademy) return;
    const target = deletingAcademy; setDeletingAcademy(null);
    const res = await deleteAcademy(target.academyId);
    if (res.success) { showToast(`🗑️ Deleted academy: ${target.academyName}`); loadData(); }
    else { showToast(`❌ Error: ${res.error || 'Failed to delete'}`); }
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;
    const target = deletingUser; setDeletingUser(null);
    const currentUser = { uid: 'dev-master', email: 'developer@hisaabkitaab.com', name: 'Developer', role: 'developer' as const, academyId: null, academyName: 'All', status: 'approved' as const, createdAt: Date.now() };
    const res = await deleteUserAccount(target.uid, target, currentUser);
    if (res.success) { showToast(`🗑️ Deleted user: ${target.name}`); loadData(); }
    else { showToast(`❌ Error: ${res.error || 'Failed to delete user'}`); }
  };

  // Bulk Selection Logic
  const filteredAcademies = academies.filter((a) => a.academyName.toLowerCase().includes(search.toLowerCase()) || a.code.toLowerCase().includes(search.toLowerCase()) || a.address.toLowerCase().includes(search.toLowerCase()));

  const toggleSelectAcademy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAcademyIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAllAcademies = () => {
    if (selectedAcademyIds.length === filteredAcademies.length && filteredAcademies.length > 0) setSelectedAcademyIds([]);
    else setSelectedAcademyIds(filteredAcademies.map(a => a.academyId));
  };

  const handleBulkDeleteAcademies = async () => {
    if (!confirm(`Are you sure you want to permanently delete ${selectedAcademyIds.length} selected academies?`)) return;
    for (const id of selectedAcademyIds) { await deleteAcademy(id); }
    setSelectedAcademyIds([]); showToast('Selected academies deleted.'); loadData();
  };

  const handleTriggerPrint = (recordsToPrint: Academy[]) => {
    setPrintData(recordsToPrint);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 300);
  };

  const PrintTableContent = ({ data }: { data: Academy[] }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead><tr className="bg-slate-100 text-slate-800 font-bold"><th className="border p-2">Code</th><th className="border p-2">Academy Name</th><th className="border p-2">Address</th><th className="border p-2">Phone</th><th className="border p-2">Admin Email</th><th className="border p-2">Status</th></tr></thead>
      <tbody>{data.map((a) => (<tr key={a.academyId}><td className="border p-2 font-mono font-bold text-indigo-700">{a.code}</td><td className="border p-2 font-bold">{a.academyName}</td><td className="border p-2">{a.address}</td><td className="border p-2 font-mono">{a.phone}</td><td className="border p-2 font-mono text-[10px]">{a.adminEmail || 'N/A'}</td><td className="border p-2">{a.isActive !== false ? 'Active' : 'Inactive'}</td></tr>))}</tbody>
    </table>
  );

  // Demo Actions
  const handleCopy = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopiedKey(id); showToast(`Copied: ${text}`); setTimeout(() => setCopiedKey(null), 2500); };
  const handleToggleDemoVisibility = () => { const updated = toggleDemoVisibility(!demoConfig.isEnabled); setDemoConfig({ ...updated }); showToast(!demoConfig.isEnabled ? '👁️ Demo Accounts VISIBLE' : '🙈 Demo Accounts HIDDEN'); };
  const handleResetAllRandom = () => { const updated = resetRandomDemoCredentials(); setDemoConfig({ ...updated }); showToast('🎲 Random logins generated!'); };
  const handleResetSingleRole = (role: DemoRole) => { const updated = resetRandomDemoCredentials(role); setDemoConfig({ ...updated }); showToast(`🎲 Random login for ${demoConfig.accounts[role].roleTitle}`); };
  const handleRevokeSingleRole = (role: DemoRole) => { const isRevoked = demoConfig.accounts[role].isRevoked; const updated = isRevoked ? restoreDemoCredentials(role) : revokeDemoCredentials(role); setDemoConfig({ ...updated }); showToast(isRevoked ? `✅ Restored access` : `⛔ Revoked credentials`); };
  const handleRevokeAll = () => { const updated = revokeDemoCredentials(); setDemoConfig({ ...updated }); showToast('⛔ All Demo Accounts REVOKED!'); };
  const handleRestoreAll = () => { const updated = restoreDemoCredentials(); setDemoConfig({ ...updated }); showToast('✅ All Demo Accounts RESTORED!'); };
  const handleOpenCustomEdit = (role: DemoRole) => { setCustomEditRole(role); setCustomLoginInput(demoConfig.accounts[role].loginId); setCustomPasswordInput(demoConfig.accounts[role].password); };
  const handleSaveCustomCredentials = (e: React.FormEvent) => { e.preventDefault(); if (!customEditRole || !customLoginInput.trim() || !customPasswordInput.trim()) return; const updated = updateCustomDemoCredentials(customEditRole, customLoginInput.trim(), customPasswordInput.trim()); setDemoConfig({ ...updated }); showToast(`✏️ Updated credentials`); setCustomEditRole(null); };
  return (
    <>
      <div className="space-y-6 print:hidden">
        {toast && <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-indigo-500/30 flex items-center gap-3 text-xs font-bold animate-fade-in"><span>{toast}</span></div>}

        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 p-6 md:p-8 text-white shadow-xl border border-indigo-900/50 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Developer Authority</span><span className="text-xs text-slate-400">developer@hisaabkitaab.com</span></div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Developer Central Control Hub</h1>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">Create academies, review admins, and monitor global multi-tenant operations.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button onClick={() => setIsPrintModalOpen(true)} className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-white/10 transition shadow-sm cursor-pointer"><Printer className="w-4 h-4 text-indigo-300" /><span>Print Directory</span></button>
              <button onClick={() => setIsCreateModalOpen(true)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"><Plus className="w-4 h-4" /><span>Create Academy</span></button>
              <button onClick={loadData} className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition border border-white/10 cursor-pointer"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><span className="text-[10px] font-bold uppercase text-slate-400 block">Total Academies</span><span className="text-2xl font-black text-indigo-300 font-mono mt-1 block">{academies.length} Branches</span></div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><span className="text-[10px] font-bold uppercase text-slate-400 block">Pending Admins</span><span className={`text-2xl font-black font-mono mt-1 block ${pendingAdmins.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{pendingAdmins.length} Requests</span></div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><span className="text-[10px] font-bold uppercase text-slate-400 block">Network Students</span><span className="text-2xl font-black text-emerald-300 font-mono mt-1 block">{state.students.length.toLocaleString()}</span></div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><span className="text-[10px] font-bold uppercase text-slate-400 block">ERP Modules</span><span className="text-2xl font-black text-sky-300 font-mono mt-1 block">29 Modules</span></div>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="bg-white rounded-2xl border p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold w-fit overflow-x-auto">
            <button onClick={() => setActiveTab('academies')} className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'academies' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><Building2 className="w-3.5 h-3.5" /><span>All Academies</span></button>
            <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><Clock className="w-3.5 h-3.5" /><span>Pending Admins</span>{pendingAdmins.length > 0 && <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">{pendingAdmins.length}</span>}</button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><Users className="w-3.5 h-3.5" /><span>Users</span></button>
            <button onClick={() => setActiveTab('demo')} className={`px-4 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${activeTab === 'demo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><KeyRound className="w-3.5 h-3.5 text-amber-500" /><span>Demo Sandbox</span><span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${demoConfig.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{demoConfig.isEnabled ? 'Visible' : 'Hidden'}</span></button>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search academy or code..." className="pl-8 pr-3 py-1.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-500 w-full sm:w-56" />
          </div>
        </div>

        {/* Tab 1: Academies */}
        {activeTab === 'academies' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                <button onClick={toggleSelectAllAcademies} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
                  {selectedAcademyIds.length === filteredAcademies.length && filteredAcademies.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All
                </button>
                {selectedAcademyIds.length > 0 && (
                  <button onClick={handleBulkDeleteAcademies} className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-4 h-4" /> Delete ({selectedAcademyIds.length})</button>
                )}
              </div>
              {selectedAcademyIds.length > 0 && (
                <button onClick={() => handleTriggerPrint(academies.filter(a => selectedAcademyIds.includes(a.academyId)))} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print Selected</button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAcademies.map((acad) => {
                const isSelected = selectedAcademyIds.includes(acad.academyId);
                return (
                  <div key={acad.academyId} className={`bg-white rounded-3xl border p-5 shadow-sm transition flex flex-col justify-between group ${isSelected ? 'border-indigo-400 ring-2 ring-indigo-400/30 bg-indigo-50/30' : 'border-slate-200 hover:shadow-md'}`}>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <label className="p-1 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 shadow-sm" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelectAcademy(acad.academyId, e as any)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                          </label>
                          <span className="font-mono text-xs font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">{acad.code}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                      </div>
                      <h3 className="font-black text-base text-slate-900 group-hover:text-indigo-600 transition">{acad.academyName}</h3>
                      <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                        <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{acad.address}</span></p>
                        <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" /><span>{acad.phone}</span></p>
                        {acad.adminEmail && <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 shrink-0" /><span className="font-medium text-slate-700">{acad.adminEmail}</span></p>}
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">ID: {acad.academyId}</span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleOpenEdit(acad)} className="px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-amber-200/70"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                        <button onClick={() => setDeletingAcademy(acad)} className="px-2.5 py-1.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-rose-200/70"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                        <button onClick={() => { erpStorage.setActiveInstitution(acad.academyId); onSelectAcademy?.(acad.academyId); showToast(`Switched to ${acad.academyName}`); }} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-indigo-200/70">Enter <ArrowRight className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Tab 2: Pending Admins */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div><h3 className="font-black text-base text-slate-900">Pending Admin Registrations</h3><p className="text-xs text-slate-500">Approve to grant database access.</p></div>
              <span className="text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full">{pendingAdmins.length} Awaiting</span>
            </div>
            {pendingAdmins.length === 0 ? (
              <div className="py-12 text-center space-y-2"><CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" /><p className="font-bold text-sm text-slate-800">All Admin registrations are approved!</p></div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingAdmins.map((admin) => (
                  <div key={admin.uid} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div><div className="flex items-center gap-2"><span className="font-extrabold text-sm text-slate-900">{admin.name}</span><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">Admin Applicant</span></div><p className="text-xs text-slate-500 mt-0.5">Email: <b>{admin.email}</b></p><p className="text-xs text-indigo-600 font-medium mt-1">Target: {admin.academyName || 'New Academy Proposed'}</p></div>
                    <div className="flex items-center gap-2"><button onClick={() => handleRejectAdmin(admin)} className="px-3.5 py-2 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200">Reject</button><button onClick={() => handleApproveAdmin(admin)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md">Authorize</button></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Users */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
              <div><h3 className="font-black text-base text-slate-900">Network User Directory</h3><p className="text-xs text-slate-500">Developer privileges: Delete any role.</p></div>
              <button onClick={() => onNavigate?.('users')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"><Users className="w-4 h-4" /> Open Printable Users Section →</button>
            </div>
            <div className="divide-y divide-slate-100">
              {allUsers.map((u) => (
                <div key={u.uid} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div><p className="font-extrabold text-slate-900">{u.name}</p><p className="text-slate-500 text-[11px]">{u.email} &bull; {u.academyName}</p></div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">{u.role}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : u.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>{u.status}</span>
                    <button onClick={() => setDeletingUser(u)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Demo Accounts */}
        {activeTab === 'demo' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-indigo-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-2"><span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Sandbox Access Governance</span><span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${demoConfig.isEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>{demoConfig.isEnabled ? 'Login: VISIBLE' : 'Login: HIDDEN'}</span></div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight">Demo Accounts Authority</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">Configure sandbox access. All demo sessions operate in strict <b>Read-Only Mode</b>.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button type="button" onClick={handleToggleDemoVisibility} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md ${demoConfig.isEnabled ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{demoConfig.isEnabled ? <Ban className="w-4 h-4" /> : <Eye className="w-4 h-4" />}<span>{demoConfig.isEnabled ? 'Hide Demo' : 'Show Demo'}</span></button>
                <button type="button" onClick={handleResetAllRandom} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg"><Shuffle className="w-4 h-4" /><span>Randomize All</span></button>
                <button type="button" onClick={handleRevokeAll} className="px-3.5 py-2.5 bg-white/10 hover:bg-rose-600/30 text-rose-300 hover:text-white rounded-xl text-xs font-bold border border-rose-500/40"><span>Revoke All</span></button>
                <button type="button" onClick={handleRestoreAll} className="px-3.5 py-2.5 bg-white/10 hover:bg-emerald-600/30 text-emerald-300 hover:text-white rounded-xl text-xs font-bold border border-emerald-500/40"><span>Restore All</span></button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['admin', 'teacher', 'student', 'parent'] as DemoRole[]).map((r) => {
                const creds = demoConfig.accounts[r]; const isRevoked = creds.isRevoked;
                const roleIcons: Record<DemoRole, string> = { admin: '🎓', teacher: '👨‍🏫', student: '👨‍🎓', parent: '👨‍👩‍👧' };
                return (
                  <div key={r} className={`bg-white rounded-3xl border p-5 shadow-sm transition flex flex-col justify-between group ${isRevoked ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200 hover:shadow-md'}`}>
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5"><span className="text-2xl">{roleIcons[r]}</span><div><h3 className="font-black text-sm text-slate-900">{creds.roleTitle}</h3><p className="text-[11px] text-slate-400 font-medium">{creds.userName}</p></div></div>
                        {isRevoked ? <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1"><Ban className="w-3 h-3" /> REVOKED</span> : <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><Check className="w-3 h-3" /> ACTIVE</span>}
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between"><div><span className="text-[10px] font-bold uppercase text-slate-400 block">Login ID</span><span className="font-mono font-bold text-xs text-slate-900 select-all">{creds.loginId}</span></div><button type="button" onClick={() => handleCopy(creds.loginId, `${r}-login`)} className="px-2.5 py-1 bg-white hover:bg-slate-100 border rounded-lg text-[11px] font-bold text-slate-600 flex items-center gap-1"><Copy className="w-3 h-3" /><span>{copiedKey === `${r}-login` ? 'Copied!' : 'Copy'}</span></button></div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between"><div><span className="text-[10px] font-bold uppercase text-slate-400 block">Password</span><span className="font-mono font-bold text-xs text-indigo-700 select-all">{creds.password}</span></div><button type="button" onClick={() => handleCopy(creds.password, `${r}-pass`)} className="px-2.5 py-1 bg-white hover:bg-slate-100 border rounded-lg text-[11px] font-bold text-indigo-700 flex items-center gap-1"><Copy className="w-3 h-3" /><span>{copiedKey === `${r}-pass` ? 'Copied!' : 'Copy'}</span></button></div>
                      </div>
                    </div>
                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <button type="button" onClick={() => handleOpenCustomEdit(r)} className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1"><Edit3 className="w-3.5 h-3.5" /><span>Edit</span></button>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => handleResetSingleRole(r)} className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1"><Shuffle className="w-3.5 h-3.5" /><span>Random</span></button>
                        <button type="button" onClick={() => handleRevokeSingleRole(r)} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${isRevoked ? 'bg-emerald-600 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>{isRevoked ? <><Check className="w-3.5 h-3.5" /><span>Reactivate</span></> : <><Ban className="w-3.5 h-3.5" /><span>Revoke</span></>}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {/* MODALS */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Academy (Developer Only)">
        <form onSubmit={handleCreateAcademy} className="space-y-4 text-xs">
          <div><label className="block font-bold text-slate-700 mb-1">Academy Name *</label><input type="text" required value={newAcademyName} onChange={(e) => setNewAcademyName(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl outline-none focus:border-indigo-500 font-medium" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="block font-bold text-slate-700 mb-1">Branch Code *</label><input type="text" required value={newAcademyCode} onChange={(e) => setNewAcademyCode(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono uppercase font-bold" /></div><div><label className="block font-bold text-slate-700 mb-1">Phone</label><input type="text" value={newAcademyPhone} onChange={(e) => setNewAcademyPhone(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl" /></div></div>
          <div><label className="block font-bold text-slate-700 mb-1">Address</label><input type="text" value={newAcademyAddress} onChange={(e) => setNewAcademyAddress(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl" /></div>
          <div><label className="block font-bold text-slate-700 mb-1">Admin Email (Optional)</label><input type="email" value={assignedAdminEmail} onChange={(e) => setAssignedAdminEmail(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl" /></div>
          <div className="flex justify-end gap-2 pt-3 border-t"><button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancel</button><button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black shadow-md">Confirm</button></div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingAcademy(null); }} title={`Edit Academy: ${editingAcademy?.academyName || ''}`}>
        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-800 border border-amber-200">Modifying ID: <b>{editingAcademy?.academyId}</b></div>
          <div><label className="block font-bold text-slate-700 mb-1">Academy Name *</label><input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="block font-bold text-slate-700 mb-1">Code *</label><input type="text" required value={editCode} onChange={(e) => setEditCode(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono uppercase" /></div><div><label className="block font-bold text-slate-700 mb-1">Phone</label><input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl" /></div></div>
          <div><label className="block font-bold text-slate-700 mb-1">Address</label><input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="block font-bold text-slate-700 mb-1">Admin Email</label><input type="email" value={editAdminEmail} onChange={(e) => setEditAdminEmail(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl" /></div><div><label className="block font-bold text-slate-700 mb-1">Admin Name</label><input type="text" value={editAdminName} onChange={(e) => setEditAdminName(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl" /></div></div>
          <div className="flex items-center gap-2.5 p-3 bg-slate-50 border rounded-xl"><input type="checkbox" id="editIsActive" checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} className="w-4 h-4 rounded text-indigo-600" /><label htmlFor="editIsActive" className="font-bold text-slate-700 cursor-pointer">Active Status</label></div>
          <div className="flex justify-end gap-2 pt-3 border-t"><button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button><button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black">Save Changes</button></div>
        </form>
      </Modal>

      <Modal isOpen={!!customEditRole} onClose={() => setCustomEditRole(null)} title="Custom Demo Credentials">
        <form onSubmit={handleSaveCustomCredentials} className="space-y-4 text-xs">
          <div><label className="block font-bold text-slate-700 mb-1">Login ID *</label><input type="text" required value={customLoginInput} onChange={(e) => setCustomLoginInput(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono" /></div>
          <div><label className="block font-bold text-slate-700 mb-1">Password *</label><input type="text" required value={customPasswordInput} onChange={(e) => setCustomPasswordInput(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono" /></div>
          <div className="flex justify-end gap-2 pt-3 border-t"><button type="button" onClick={() => setCustomEditRole(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button><button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black">Save</button></div>
        </form>
      </Modal>

      <Modal isOpen={!!deletingAcademy} onClose={() => setDeletingAcademy(null)} title="Confirm Academy Deletion">
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl"><p className="font-bold text-rose-900">Delete {deletingAcademy?.academyName}?</p><p className="text-rose-700 mt-1">This will unregister the branch permanently.</p></div>
          <div className="flex justify-end gap-2"><button onClick={() => setDeletingAcademy(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button><button onClick={confirmDeleteAcademy} className="px-5 py-2 bg-rose-600 text-white rounded-xl font-black">Delete Academy</button></div>
        </div>
      </Modal>

      <Modal isOpen={!!deletingUser} onClose={() => setDeletingUser(null)} title="Confirm User Deletion">
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl"><p className="font-bold text-rose-900">Delete {deletingUser?.name}?</p><p className="text-rose-700 mt-1">Role: {deletingUser?.role.toUpperCase()}</p></div>
          <div className="flex justify-end gap-2"><button onClick={() => setDeletingUser(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button><button onClick={confirmDeleteUser} className="px-5 py-2 bg-rose-600 text-white rounded-xl font-black">Delete User</button></div>
        </div>
      </Modal>

      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div><h3 className="font-bold text-base text-slate-900">Print System Directory</h3><p className="text-[11px] text-slate-500">Export multi-tenant academies to A4.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => handleTriggerPrint(filteredAcademies)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print Filtered</button>
                <button type="button" onClick={() => handleTriggerPrint(academies)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print All</button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div className="bg-white shadow-md mx-auto pointer-events-none min-w-[800px]">
                <div className="p-8">
                  <LetterheadPrint title="MULTI-TENANT ACADEMY NETWORK DIRECTORY" documentNo="NET-DIR-2026" summaryStats={[{ label: 'Total Academies', value: filteredAcademies.length }]}>
                    <PrintTableContent data={filteredAcademies} />
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
            <LetterheadPrint title="MULTI-TENANT ACADEMY NETWORK DIRECTORY" documentNo="NET-DIR-2026" summaryStats={[{ label: 'Total Records', value: printData.length }]}>
              <PrintTableContent data={printData} />
            </LetterheadPrint>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default DeveloperModule;
