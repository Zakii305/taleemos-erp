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
import { getDemoAccountsConfig, toggleDemoVisibility, resetRandomDemoCredentials, revokeDemoCredentials, restoreDemoCredentials, updateCustomDemoCredentials, type DemoRole, type DemoAccountsConfig } from '../lib/demoAccountService';

export const SettingsModule: React.FC = () => {
  const state = erpStorage.getState();
  const currentUser = getCurrentUser();
  const isParent = currentUser?.role === 'parent';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  
  const isDev = currentUser?.role === 'developer';
  const academyId = currentUser?.academyId || state.activeInstitutionId || 'inst-1';
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'date'>('text');
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [demoConfig, setDemoConfig] = useState<DemoAccountsConfig>(() => getDemoAccountsConfig() || { isEnabled: false, accounts: {} });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customEditRole, setCustomEditRole] = useState<DemoRole | null>(null);
  const [customLoginInput, setCustomLoginInput] = useState('');
  const [customPasswordInput, setCustomPasswordInput] = useState('');

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<{ type: 'config', academyId: string } | null>(null);

  const loadFields = () => setCustomFields(getCustomFieldsForAcademy(academyId));

  useEffect(() => {
    loadFields();
    const handleFieldChange = () => loadFields();
    window.addEventListener('taleemos_custom_fields_changed', handleFieldChange);
    return () => window.removeEventListener('taleemos_custom_fields_changed', handleFieldChange);
  }, [academyId]);

  const toggleSelectField = (id: string) => setSelectedFieldIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSelectAllFields = () => { if (selectedFieldIds.length === customFields.length && customFields.length > 0) setSelectedFieldIds([]); else setSelectedFieldIds(customFields.map(f => f.id)); };

  const handleBulkDeleteFields = () => {
    if (confirm(`Are you sure you want to delete ${selectedFieldIds.length} custom fields?`)) {
      selectedFieldIds.forEach(id => deleteCustomField(academyId, id));
      setSelectedFieldIds([]); loadFields(); setImportStatus('Selected custom fields removed.'); setTimeout(() => setImportStatus(null), 3000);
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
    loadFields(); setIsFieldModalOpen(false); setImportStatus(editingFieldId ? 'Custom student field updated!' : 'New custom student field added!'); setTimeout(() => setImportStatus(null), 3500);
  };

  const handleDeleteField = (id: string, label: string) => {
    if (confirm(`Delete custom field "${label}"?`)) {
      const res = deleteCustomField(academyId, id);
      if (res.success) { loadFields(); setImportStatus(`Removed custom field "${label}".`); setTimeout(() => setImportStatus(null), 3000); }
      else { alert(res.error || 'Could not delete custom field.'); }
    }
  };

  const rolesMatrix: { role: UserRole; description: string; permissions: string[]; }[] = [
    { role: 'Super Admin', description: 'Full authority', permissions: ['Manage All'] },
    { role: 'Director', description: 'Executive governance', permissions: ['Approve'] },
    { role: 'Principal', description: 'Academic officer', permissions: ['Academic Approval'] },
    { role: 'Accountant', description: 'Financial ledger', permissions: ['Fee Invoices'] },
    { role: 'Teacher', description: 'Batch instructor', permissions: ['Attendance'] },
    { role: 'Student', description: 'Student portal', permissions: ['View Own'] },
    { role: 'Parent', description: 'Parent portal', permissions: ['Monitor Child'] },
  ];

  const handleExportBackup = () => erpStorage.exportToJson();
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const ok = erpStorage.importFromJson(text);
        if (ok) { setImportStatus('Backup restored!'); setTimeout(() => setImportStatus(null), 4000); }
        else { alert('Failed to parse backup JSON.'); }
      };
      reader.readAsText(e.target.files[0]);
    }
  };
  const handleResetData = () => { if (confirm('Reset database?')) { erpStorage.resetToDemo(); setImportStatus('Database reset.'); setTimeout(() => setImportStatus(null), 4000); } };
  const handleTriggerPrint = () => { setPrintData({ type: 'config', academyId }); setIsPrintModalOpen(false); setTimeout(() => window.print(), 300); };

  const handleCopy = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopiedKey(id); setImportStatus(`Copied: ${text}`); setTimeout(() => setCopiedKey(null), 2500); };
  const handleToggleDemoVisibility = () => { const updated = toggleDemoVisibility(!demoConfig.isEnabled); setDemoConfig({ ...updated }); setImportStatus(!demoConfig.isEnabled ? 'Demo VISIBLE' : 'Demo HIDDEN'); };
  const handleResetAllRandom = () => { const updated = resetRandomDemoCredentials(); setDemoConfig({ ...updated }); setImportStatus('Random logins generated!'); };
  const handleResetSingleRole = (role: DemoRole) => { const updated = resetRandomDemoCredentials(role); setDemoConfig({ ...updated }); setImportStatus(`Random login for ${demoConfig.accounts[role].roleTitle}`); };
  const handleRevokeSingleRole = (role: DemoRole) => { const isRevoked = demoConfig.accounts[role].isRevoked; const updated = isRevoked ? restoreDemoCredentials(role) : revokeDemoCredentials(role); setDemoConfig({ ...updated }); setImportStatus(isRevoked ? `Restored` : `Revoked`); };
  const handleRevokeAll = () => { const updated = revokeDemoCredentials(); setDemoConfig({ ...updated }); setImportStatus('All Demo REVOKED!'); };
  const handleRestoreAll = () => { const updated = restoreDemoCredentials(); setDemoConfig({ ...updated }); setImportStatus('All Demo RESTORED!'); };
  const handleOpenCustomEdit = (role: DemoRole) => { setCustomEditRole(role); setCustomLoginInput(demoConfig.accounts[role].loginId); setCustomPasswordInput(demoConfig.accounts[role].password); };
  const handleSaveCustomCredentials = (e: React.FormEvent) => { e.preventDefault(); if (!customEditRole || !customLoginInput.trim() || !customPasswordInput.trim()) return; const updated = updateCustomDemoCredentials(customEditRole, customLoginInput.trim(), customPasswordInput.trim()); setDemoConfig({ ...updated }); setImportStatus(`Updated credentials`); setCustomEditRole(null); };

  const PrintConfigContent = () => (
    <div className="space-y-6 text-xs text-slate-800">
      <div>
        <h3 className="font-bold text-sm uppercase text-indigo-800 border-b-2 border-indigo-200 pb-1 mb-2">System & Cloud Infrastructure</h3>
        <table className="w-full border-collapse border border-slate-300 text-left">
          <tbody>
            <tr><td className="border p-2 font-bold w-1/3 bg-slate-50">Firebase Database</td><td className="border p-2">{isFirebaseConfigured() ? 'Connected' : 'Offline'}</td></tr>
            <tr><td className="border p-2 font-bold bg-slate-50">Cloudinary Cloud Name</td><td className="border p-2 font-mono">{CLOUDINARY_CLOUD_NAME}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-200 print:hidden">
        <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-600 rounded-xl"><Settings className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">System Settings</h1>
            </div>
            <p className="text-xs text-indigo-200 mt-1">Enterprise role-based permissions matrix, multi-tenant campus configuration, and JSON backup/restore.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIsPrintModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Configuration</button>
            <button type="button" onClick={handleResetData} className="px-3.5 py-2 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold transition-colors cursor-pointer">Reset to Demo</button>
          </div>
        </div>

        {importStatus && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span>{importStatus}</span></div>}

        {isDev && (
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
                const creds = demoConfig?.accounts?.[r] || { roleTitle: 'Demo', userName: '', isRevoked: false, loginId: '', password: '' }; const isRevoked = creds.isRevoked;
                return (
                  <div key={r} className={`bg-white rounded-3xl border p-5 shadow-sm transition flex flex-col justify-between group ${isRevoked ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200 hover:shadow-md'}`}>
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5"><div><h3 className="font-black text-sm text-slate-900">{creds.roleTitle}</h3><p className="text-[11px] text-slate-400 font-medium">{creds.userName}</p></div></div>
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
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between"><h4 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Database className="w-4 h-4 text-indigo-600" /> Firebase Database</h4><span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isFirebaseConfigured() ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}`}>{isFirebaseConfigured() ? 'Connected' : 'LocalStorage Active'}</span></div>
            <p className="text-xs text-slate-500 leading-relaxed">All records persist instantaneously in browser offline storage and sync with Firestore automatically when environment credentials are provided.</p>
            <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200"><div>Auth Domain: {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'taleemos-hub.firebaseapp.com'}</div><div>Project ID: {import.meta.env.VITE_FIREBASE_PROJECT_ID || 'taleemos-hub'}</div></div>
          </div>
          <div className="p-5 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between"><h4 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Upload className="w-4 h-4 text-emerald-600" /> Cloudinary Uploads</h4><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase">Unsigned Preset</span></div>
            <p className="text-xs text-slate-500 leading-relaxed">Student photos, ID cards, and expense receipts upload directly to Cloudinary without exposing API secrets.</p>
            <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200"><div>Cloud Name: {CLOUDINARY_CLOUD_NAME}</div><div>Upload Preset: {CLOUDINARY_UPLOAD_PRESET}</div></div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-sm space-y-4">
          <div><h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2"><Database className="w-4 h-4 text-indigo-600" /> Institutional Disaster Recovery & JSON Backups</h3><p className="text-xs text-slate-500 mt-0.5">Export a full JSON snapshot of all modules or restore an earlier institutional archive.</p></div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button type="button" onClick={handleExportBackup} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"><Download className="w-4 h-4" /> Export Full Database (.JSON)</button>
            <label className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer border border-slate-200"><Upload className="w-4 h-4 text-indigo-600" /><span>Restore from JSON</span><input type="file" accept=".json" onChange={handleImportBackup} className="hidden" /></label>
          </div>
        </div>

        <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap"><h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2"><Sliders className="w-4 h-4 text-indigo-600" /> Student Records Custom Fields</h3><span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${customFields.length >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>{customFields.length} / 5 Configured</span></div>
              <p className="text-xs text-slate-500 mt-1">Add up to 5 custom text or date fields to student profiles.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleSelectAllFields} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">{selectedFieldIds.length === customFields.length && customFields.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All</button>
              {selectedFieldIds.length > 0 && <button onClick={handleBulkDeleteFields} className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-4 h-4" /> Delete ({selectedFieldIds.length})</button>}
              <button type="button" onClick={handleOpenAddField} disabled={customFields.length >= 5} className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 ${customFields.length >= 5 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'}`}><Plus className="w-4 h-4" /> Add Field</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead><tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200"><th className="p-3 w-10"></th><th className="p-3">Field Label</th><th className="p-3">Data Type</th><th className="p-3">Placeholder</th><th className="p-3">Validation</th><th className="p-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {customFields.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-slate-400">No custom student fields defined yet.</td></tr> : customFields.map((field) => (
                  <tr key={field.id} className={`hover:bg-slate-50/60 transition-colors ${selectedFieldIds.includes(field.id) ? 'bg-indigo-50/30' : ''}`}>
                    <td className="p-3 text-center"><input type="checkbox" checked={selectedFieldIds.includes(field.id)} onChange={() => toggleSelectField(field.id)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" /></td>
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" /><span>{field.label}</span></td>
                    <td className="p-3"><span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${field.type === 'date' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{field.type === 'date' ? <Calendar className="w-3 h-3" /> : <Type className="w-3 h-3" />}<span className="capitalize">{field.type}</span></span></td>
                    <td className="p-3 font-mono text-slate-500 text-[11px]">{field.placeholder || '—'}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${field.isRequired ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>{field.isRequired ? 'Mandatory' : 'Optional'}</span></td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => handleOpenEditField(field)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => handleDeleteField(field.id, field.label)} className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isFieldModalOpen && (
        <Modal isOpen={isFieldModalOpen} onClose={() => setIsFieldModalOpen(false)} title={editingFieldId ? 'Edit Custom Student Field' : 'Add Custom Student Field'} subtitle={`Limit: Maximum 5 custom fields per academy (${customFields.length}/5 used)`} badge="STUDENT SCHEMA" maxWidth="max-w-md">
          <form onSubmit={handleSaveField} className="space-y-4">
            {fieldError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /><span>{fieldError}</span></div>}
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Field Label *</label><input type="text" required value={fieldLabel} onChange={(e) => setFieldLabel(e.target.value)} placeholder="e.g. Emergency Contact Person" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Data Type *</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${fieldType === 'text' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}><input type="radio" name="fieldType" value="text" checked={fieldType === 'text'} onChange={() => setFieldType('text')} className="text-indigo-600" /><div className="text-xs"><div className="flex items-center gap-1 font-bold"><Type className="w-3.5 h-3.5" /> Text Field</div><span className="text-[10px] text-slate-500 font-normal">Single-line text</span></div></label>
                <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${fieldType === 'date' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}><input type="radio" name="fieldType" value="date" checked={fieldType === 'date'} onChange={() => setFieldType('date')} className="text-indigo-600" /><div className="text-xs"><div className="flex items-center gap-1 font-bold"><Calendar className="w-3.5 h-3.5" /> Date Field</div><span className="text-[10px] text-slate-500 font-normal">Calendar date</span></div></label>
              </div>
            </div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Placeholder / Hint</label><input type="text" value={fieldPlaceholder} onChange={(e) => setFieldPlaceholder(e.target.value)} placeholder={fieldType === 'date' ? 'YYYY-MM-DD' : 'e.g. Uncle / Legal Guardian name'} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
            <div className="pt-1"><label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"><input type="checkbox" checked={fieldRequired} onChange={(e) => setFieldRequired(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded" /><span>Mark field as mandatory</span></label></div>
            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsFieldModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md">{editingFieldId ? 'Save Changes' : 'Create Field'}</button>
            </div>
          </form>
        </Modal>
      )}

      {!!customEditRole && (
        <Modal isOpen={!!customEditRole} onClose={() => setCustomEditRole(null)} title="Custom Demo Credentials">
          <form onSubmit={handleSaveCustomCredentials} className="space-y-4 text-xs">
            <div><label className="block font-bold text-slate-700 mb-1">Login ID *</label><input type="text" required value={customLoginInput} onChange={(e) => setCustomLoginInput(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono" /></div>
            <div><label className="block font-bold text-slate-700 mb-1">Password *</label><input type="text" required value={customPasswordInput} onChange={(e) => setCustomPasswordInput(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl font-mono" /></div>
            <div className="flex justify-end gap-2 pt-3 border-t"><button type="button" onClick={() => setCustomEditRole(null)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button><button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black">Save</button></div>
          </form>
        </Modal>
      )}

      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div><h3 className="font-bold text-base text-slate-900">Print System Configuration</h3><p className="text-[11px] text-slate-500">Export RBAC, Campuses, and Cloud config to A4.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={handleTriggerPrint} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print Configuration</button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div className="bg-white shadow-md mx-auto pointer-events-none min-w-[800px]">
                <div className="p-8">
                  <LetterheadPrint title="SYSTEM CONFIGURATION & SECURITY GOVERNANCE REPORT" documentNo="SYS-CONFIG-2026" summaryStats={[]}>
                    <PrintConfigContent />
                  </LetterheadPrint>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {printData && createPortal(
        <div id="print-mount" className="hidden print:block w-full bg-white text-slate-900">
          <div className="print-page">
            <LetterheadPrint title="SYSTEM CONFIGURATION & SECURITY GOVERNANCE REPORT" documentNo="SYS-CONFIG-2026" summaryStats={[]}>
              <PrintConfigContent />
            </LetterheadPrint>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default SettingsModule;
