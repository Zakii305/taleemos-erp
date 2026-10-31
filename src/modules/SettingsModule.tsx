import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Shield, Database, Building2, RefreshCw, Download, Upload, CheckCircle2, Terminal, Activity, Plus, Edit2, Trash2, Calendar, Type, AlertCircle, FileText, Sliders, Printer, CheckSquare, Square, X, KeyRound, Copy, Shuffle, Ban, Eye, Check } from 'lucide-react';
import { erpStorage, INSTITUTIONS } from '../lib/storage';
import { type UserRole, type CustomFieldDefinition } from '../types';
import { isFirebaseConfigured } from '../lib/firebase';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../lib/cloudinary';
import { getCustomFieldsForAcademy, addCustomField, updateCustomField, deleteCustomField } from '../lib/customFields';
import { getCurrentUser } from '../components/auth/AuthSystem';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
// Demo Accounts Imports
import { getDemoAccountsConfig, toggleDemoVisibility, resetRandomDemoCredentials, revokeDemoCredentials, restoreDemoCredentials, updateCustomDemoCredentials, type DemoRole, type DemoAccountsConfig } from '../lib/demoAccountService';

export const SettingsModule: React.FC = () => {
  const state = erpStorage.getState();
  const currentUser = getCurrentUser();
  const academyId = currentUser?.academyId || state.activeInstitutionId || 'inst-1';
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Custom Fields State
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'date'>('text');
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  // Print State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<{ type: 'config', academyId: string } | null>(null);

  // --- DEMO ACCOUNTS STATE ---
  const [demoConfig, setDemoConfig] = useState<DemoAccountsConfig>(getDemoAccountsConfig);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customEditRole, setCustomEditRole] = useState<DemoRole | null>(null);
  const [customLoginInput, setCustomLoginInput] = useState('');
  const [customPasswordInput, setCustomPasswordInput] = useState('');
  
  const showToast = (msg: string) => { setImportStatus(msg); setTimeout(() => setImportStatus(null), 3000); };

  const loadFields = () => setCustomFields(getCustomFieldsForAcademy(academyId));

  useEffect(() => {
    loadFields();
    const handleFieldChange = () => loadFields();
    window.addEventListener('taleemos_custom_fields_changed', handleFieldChange);
    return () => window.removeEventListener('taleemos_custom_fields_changed', handleFieldChange);
  }, [academyId]);

  // Custom Field Selection Logic
  const toggleSelectField = (id: string) => {
    setSelectedFieldIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAllFields = () => {
    if (selectedFieldIds.length === customFields.length && customFields.length > 0) setSelectedFieldIds([]);
    else setSelectedFieldIds(customFields.map(f => f.id));
  };

  const handleBulkDeleteFields = () => {
    if (confirm(`Are you sure you want to delete ${selectedFieldIds.length} custom fields?`)) {
      selectedFieldIds.forEach(id => deleteCustomField(academyId, id));
      setSelectedFieldIds([]);
      loadFields();
      showToast('Selected custom fields removed.');
    }
  };

  const handleOpenAddField = () => {
    if (customFields.length >= 5) { alert('Maximum of 5 custom fields reached.'); return; }
    setEditingFieldId(null); setFieldLabel(''); setFieldType('text'); setFieldPlaceholder(''); setFieldRequired(false); setFieldError(null); setIsFieldModalOpen(true);
  };

  const handleOpenEditField = (field: CustomFieldDefinition) => {
    setEditingFieldId(field.id); setFieldLabel(field.label); setFieldType(field.type); setFieldPlaceholder(field.placeholder || ''); setFieldRequired(Boolean(field.isRequired)); setFieldError(null); setIsFieldModalOpen(true);
  };

  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault(); setFieldError(null);
    if (!fieldLabel.trim()) { setFieldError('Field label cannot be empty.'); return; }

    if (editingFieldId) {
      const res = updateCustomField(academyId, editingFieldId, { label: fieldLabel.trim(), type: fieldType, placeholder: fieldPlaceholder.trim(), isRequired: fieldRequired });
      if (!res.success) { setFieldError(res.error || 'Failed to update field.'); return; }
    } else {
      const res = addCustomField(academyId, { label: fieldLabel.trim(), type: fieldType, placeholder: fieldPlaceholder.trim(), isRequired: fieldRequired });
      if (!res.success) { setFieldError(res.error || 'Failed to add field.'); return; }
    }
    loadFields(); setIsFieldModalOpen(false);
    showToast(editingFieldId ? 'Custom field updated!' : 'New custom field added!');
  };

  const handleDeleteField = (id: string, label: string) => {
    if (confirm(`Delete custom field "${label}"?`)) {
      const res = deleteCustomField(academyId, id);
      if (res.success) { loadFields(); showToast(`Removed field "${label}".`); }
      else { alert(res.error || 'Could not delete custom field.'); }
    }
  };

  const rolesMatrix: { role: UserRole; description: string; permissions: string[]; }[] = [
    { role: 'Super Admin', description: 'Full institutional authority.', permissions: ['Manage All Settings', 'All Modules'] },
    { role: 'Director / Owner', description: 'Executive governance.', permissions: ['Approve Admissions', 'Payroll'] },
    { role: 'Principal', description: 'Chief Academic Officer.', permissions: ['Academic Approval', 'Staff Leave'] },
    { role: 'Accountant', description: 'Financial ledger maintenance.', permissions: ['Fee Invoices', 'Payroll'] },
    { role: 'Teacher', description: 'Batch instructor.', permissions: ['Attendance', 'Marks Entry'] },
    { role: 'Student', description: 'Student portal profile.', permissions: ['View Own Records'] },
    { role: 'Parent', description: 'Parent guardian portal.', permissions: ['Monitor Child'] },
  ];

  const handleExportBackup = () => erpStorage.exportToJson();
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const ok = erpStorage.importFromJson(text);
        if (ok) { showToast('Backup restored successfully!'); } else { alert('Failed to parse backup JSON file.'); }
      };
      reader.readAsText(e.target.files[0]);
    }
  };
  const handleResetData = () => { if (confirm('Reset system database?')) { erpStorage.resetToDemo(); showToast('Database reset to demo state.'); } };
  const handleTriggerPrint = () => { setPrintData({ type: 'config', academyId }); setIsPrintModalOpen(false); setTimeout(() => window.print(), 300); };

  // --- DEMO ACTION HANDLERS ---
  const handleCopy = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopiedKey(id); showToast(`Copied: ${text}`); setTimeout(() => setCopiedKey(null), 2500); };
  const handleToggleDemoVisibility = () => { const updated = toggleDemoVisibility(!demoConfig.isEnabled); setDemoConfig({ ...updated }); showToast(!demoConfig.isEnabled ? 'Demo Accounts VISIBLE' : 'Demo Accounts HIDDEN'); };
  const handleResetAllRandom = () => { const updated = resetRandomDemoCredentials(); setDemoConfig({ ...updated }); showToast('Random logins generated!'); };
  const handleResetSingleRole = (role: DemoRole) => { const updated = resetRandomDemoCredentials(role); setDemoConfig({ ...updated }); showToast(`Random login for ${demoConfig.accounts[role].roleTitle}`); };
  const handleRevokeSingleRole = (role: DemoRole) => { const isRevoked = demoConfig.accounts[role].isRevoked; const updated = isRevoked ? restoreDemoCredentials(role) : revokeDemoCredentials(role); setDemoConfig({ ...updated }); showToast(isRevoked ? `Restored access` : `Revoked credentials`); };
  const handleRevokeAll = () => { const updated = revokeDemoCredentials(); setDemoConfig({ ...updated }); showToast('All Demo Accounts REVOKED!'); };
  const handleRestoreAll = () => { const updated = restoreDemoCredentials(); setDemoConfig({ ...updated }); showToast('All Demo Accounts RESTORED!'); };
  const handleOpenCustomEdit = (role: DemoRole) => { setCustomEditRole(role); setCustomLoginInput(demoConfig.accounts[role].loginId); setCustomPasswordInput(demoConfig.accounts[role].password); };
  const handleSaveCustomCredentials = (e: React.FormEvent) => { e.preventDefault(); if (!customEditRole || !customLoginInput.trim() || !customPasswordInput.trim()) return; const updated = updateCustomDemoCredentials(customEditRole, customLoginInput.trim(), customPasswordInput.trim()); setDemoConfig({ ...updated }); showToast(`Updated credentials`); setCustomEditRole(null); };

  const PrintConfigContent = () => (
    <div className="space-y-6 text-xs text-slate-800">
      <div>
        <h3 className="font-bold text-sm uppercase text-indigo-800 border-b-2 border-indigo-200 pb-1 mb-2">System & Cloud Infrastructure</h3>
        <table className="w-full border-collapse border border-slate-300 text-left">
          <tbody>
            <tr><td className="border p-2 font-bold w-1/3 bg-slate-50">Firebase Database</td><td className="border p-2">{isFirebaseConfigured() ? 'Connected' : 'LocalStorage Active'}</td></tr>
            <tr><td className="border p-2 font-bold bg-slate-50">Cloudinary Cloud Name</td><td className="border p-2 font-mono">{CLOUDINARY_CLOUD_NAME}</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <h3 className="font-bold text-sm uppercase text-indigo-800 border-b-2 border-indigo-200 pb-1 mb-2">Multi-Tenant Academic Campuses</h3>
        <table className="w-full border-collapse border border-slate-300 text-left">
          <thead><tr className="bg-slate-100 font-bold"><th className="border p-2">Code</th><th className="border p-2">Name</th><th className="border p-2">Address</th></tr></thead>
          <tbody>{INSTITUTIONS.map(inst => (<tr key={inst.id}><td className="border p-2 font-mono font-bold">{inst.code}</td><td className="border p-2 font-bold">{inst.name}</td><td className="border p-2">{inst.address}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-200 print:hidden">
        {/* Header */}
        <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-600 rounded-xl"><Settings className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">System Settings & Governance</h1>
            </div>
            <p className="text-xs text-indigo-200 mt-1">Enterprise configurations, backups, RBAC, and Demo Sandbox management.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIsPrintModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Configuration</button>
            <button type="button" onClick={handleResetData} className="px-3.5 py-2 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold transition-colors cursor-pointer">Reset to Demo</button>
          </div>
        </div>

        {importStatus && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span>{importStatus}</span></div>}

        {/* DEMO ACCOUNTS GOVERNANCE SECTION (NEW) */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-indigo-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><KeyRound className="w-3.5 h-3.5" /> Demo Sandbox Governance</span>
                <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${demoConfig.isEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>{demoConfig.isEnabled ? 'Login Page: VISIBLE' : 'Login Page: HIDDEN'}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">Demo Account Credentials</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">Share these credentials with potential clients for testing. All demo sessions operate in strict <b>Read-Only Mode</b>.</p>
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
                    <button type="button" onClick={() => handleOpenCustomEdit(r)} className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /><span>Edit</span></button>
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

        {/* Cloud & Backup Settings... (Rest of the code remains same) */}
        {/* Cloud & Termux Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between"><h4 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Database className="w-4 h-4 text-indigo-600" /> Firebase Database</h4><span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isFirebaseConfigured() ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>{isFirebaseConfigured() ? 'Connected' : 'LocalStorage'}</span></div>
            <p className="text-xs text-slate-500 leading-relaxed">All records persist instantaneously in browser offline storage and sync with Firestore automatically.</p>
          </div>
          <div className="p-5 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between"><h4 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Upload className="w-4 h-4 text-emerald-600" /> Cloudinary Uploads</h4><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase">Unsigned Preset</span></div>
            <p className="text-xs text-slate-500 leading-relaxed">Student photos, ID cards, and expense receipts upload directly to Cloudinary.</p>
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-sm space-y-4">
          <div><h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2"><Database className="w-4 h-4 text-indigo-600" /> Disaster Recovery & JSON Backups</h3></div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button type="button" onClick={handleExportBackup} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"><Download className="w-4 h-4" /> Export Full Database (.JSON)</button>
            <label className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer border border-slate-200"><Upload className="w-4 h-4 text-indigo-600" /><span>Restore from JSON</span><input type="file" accept=".json" onChange={handleImportBackup} className="hidden" /></label>
          </div>
        </div>

        {/* Custom Fields */}
        <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div><div className="flex items-center gap-2 flex-wrap"><h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2"><Sliders className="w-4 h-4 text-indigo-600" /> Student Records Custom Fields</h3><span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${customFields.length >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>{customFields.length} / 5 Configured</span></div></div>
            <div className="flex items-center gap-2">
              <button onClick={toggleSelectAllFields} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">{selectedFieldIds.length === customFields.length && customFields.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All</button>
              {selectedFieldIds.length > 0 && <button onClick={handleBulkDeleteFields} className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-4 h-4" /> Delete ({selectedFieldIds.length})</button>}
              <button type="button" onClick={handleOpenAddField} disabled={customFields.length >= 5} className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 ${customFields.length >= 5 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'}`}><Plus className="w-4 h-4" /> Add Field</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead><tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200"><th className="p-3 w-10"></th><th className="p-3">Field Label</th><th className="p-3">Data Type</th><th className="p-3">Placeholder</th><th className="p-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {customFields.map((field) => (
                  <tr key={field.id} className={`hover:bg-slate-50/60 transition-colors ${selectedFieldIds.includes(field.id) ? 'bg-indigo-50/30' : ''}`}>
                    <td className="p-3 text-center"><input type="checkbox" checked={selectedFieldIds.includes(field.id)} onChange={() => toggleSelectField(field.id)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" /></td>
                    <td className="p-3 font-bold text-slate-900">{field.label}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100">{field.type}</span></td>
                    <td className="p-3 font-mono text-slate-500 text-[11px]">{field.placeholder || '—'}</td>
                    <td className="p-3 text-right"><div className="flex items-center justify-end gap-1"><button type="button" onClick={() => handleOpenEditField(field)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button><button type="button" onClick={() => handleDeleteField(field.id, field.label)} className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {isFieldModalOpen && (
        <Modal isOpen={isFieldModalOpen} onClose={() => setIsFieldModalOpen(false)} title={editingFieldId ? 'Edit Field' : 'Add Field'}>
          <form onSubmit={handleSaveField} className="space-y-4 text-xs">
            {fieldError && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">{fieldError}</div>}
            <div><label className="block font-bold text-slate-700 mb-1">Field Label *</label><input type="text" required value={fieldLabel} onChange={(e) => setFieldLabel(e.target.value)} className="w-full px-3.5 py-2 border rounded-xl" /></div>
            <div><label className="block font-bold text-slate-700 mb-1">Placeholder</label><input type="text" value={fieldPlaceholder} onChange={(e) => setFieldPlaceholder(e.target.value)} className="w-full px-3.5 py-2 border rounded-xl" /></div>
            <div className="flex justify-end gap-2 pt-3 border-t"><button type="button" onClick={() => setIsFieldModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button><button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black">Save Field</button></div>
          </form>
        </Modal>
      )}

      {/* Custom Demo Credentials Modal */}
      {!!customEditRole && (
        <Modal isOpen={!!customEditRole} onClose={() => setCustomEditRole(null)} title="Custom Demo Credentials">
          <form onSubmit={handleSaveCustomCredentials} className="space-y-4 text-xs">
            <div><label className="block font-bold text-slate-700 mb-1">Login ID *</label><input type="text" required value={customLoginInput} onChange={(e) => setCustomLoginInput(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono" /></div>
            <div><label className="block font-bold text-slate-700 mb-1">Password *</label><input type="text" required value={customPasswordInput} onChange={(e) => setCustomPasswordInput(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono" /></div>
            <div className="flex justify-end gap-2 pt-3 border-t"><button type="button" onClick={() => setCustomEditRole(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button><button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black">Save</button></div>
          </form>
        </Modal>
      )}

      {/* Print Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
            <div className="p-4 border-b flex justify-between"><h3 className="font-bold">Print Configuration</h3><button onClick={() => setIsPrintModalOpen(false)} className="text-rose-500 font-bold">Close</button></div>
            <div className="p-4 overflow-auto"><LetterheadPrint title="SYSTEM CONFIGURATION" documentNo="SYS-2026"><PrintConfigContent /></LetterheadPrint></div>
          </div>
        </div>
      )}
      
      {printData && createPortal(<div className="hidden print:block"><LetterheadPrint title="CONFIG" documentNo="SYS"><PrintConfigContent /></LetterheadPrint></div>, document.body)}
    </>
  );
};

export default SettingsModule;
