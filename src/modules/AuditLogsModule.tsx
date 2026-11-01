import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shield, Search, User, Clock, Database, Activity, Download, Filter, Globe, Printer, CheckSquare, Square, Trash2, X } from 'lucide-react';
import { getScopedAuditLogs } from '../lib/auditLogger';
import { type AuditLog } from '../types';
import { erpStorage } from '../lib/storage';
import { getCurrentUser } from '../components/auth/AuthSystem';
import { LetterheadPrint } from '../components/common/LetterheadPrint';

export const AuditLogsModule: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Print State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<AuditLog[] | null>(null);

  
  const state = erpStorage.getState();
  const currentUser = getCurrentUser();
  const isParent = currentUser?.role === 'parent';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  const isDev = currentUser?.role === 'developer';
  const activeAcadId = state.activeInstitutionId;

  const loadLogs = () => {
    const fetchedLogs = getScopedAuditLogs(currentUser?.academyId, isDev, activeAcadId);
    setLogs(fetchedLogs);
  };

  useEffect(() => {
    loadLogs();
    const handleUpdate = () => loadLogs();
    window.addEventListener('taleemos_audit_log_changed', handleUpdate);
    return () => {
      window.removeEventListener('taleemos_audit_log_changed', handleUpdate);
    };
  }, [activeAcadId, currentUser?.academyId, isDev]);

  // Filter Logic
  const filteredLogs = logs.filter((log) => {
    const searchString = `${log.user} ${log.details} ${log.module} ${log.targetRecord || ''} ${log.action}`.toLowerCase();
    const matchesSearch = searchString.includes(search.toLowerCase());
    const matchesAction = filterAction === 'All' || log.action.includes(filterAction.toUpperCase());
    return matchesSearch && matchesAction;
  });

  // Selection Logic
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLogs.length && filteredLogs.length > 0) setSelectedIds([]);
    else setSelectedIds(filteredLogs.map(l => l.id));
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to permanently delete ${selectedIds.length} audit logs? This action cannot be undone.`)) {
      // Note: Depending on your backend, you might just mark them as hidden.
      // Here we remove them from the local array and ideally you'd sync with storage.
      const remainingLogs = logs.filter(l => !selectedIds.includes(l.id));
      setLogs(remainingLogs);
      setSelectedIds([]);
      // Note: You may need a specific function in your auditLogger to actually delete them from localStorage
      // e.g., saveAuditLogsToStorage(remainingLogs);
    }
  };

  const handleTriggerPrint = (recordsToPrint: AuditLog[]) => {
    setPrintData(recordsToPrint);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 300);
  };

  // Helper for Action Badges
  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('REJECT'))
      return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-lg text-[10px] font-black tracking-wide w-fit border border-rose-200">{action}</span>;
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('APPROVE') || act.includes('ADMISSION'))
      return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black tracking-wide w-fit border border-emerald-200">{action}</span>;
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('CONFIG'))
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black tracking-wide w-fit border border-blue-200">{action}</span>;
    if (act.includes('LOGIN') || act.includes('SWITCH') || act.includes('AUTH'))
      return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black tracking-wide w-fit border border-amber-200">{action}</span>;
    return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black tracking-wide w-fit border border-slate-200">{action}</span>;
  };

  const PrintTableContent = ({ data }: { data: AuditLog[] }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead>
        <tr className="bg-slate-100 text-slate-800 font-bold">
          <th className="border border-slate-300 p-2">Timestamp</th>
          <th className="border border-slate-300 p-2">User / Role</th>
          <th className="border border-slate-300 p-2">Action</th>
          <th className="border border-slate-300 p-2">Module</th>
          <th className="border border-slate-300 p-2">Details & Target</th>
        </tr>
      </thead>
      <tbody>
        {data.map((log) => (
          <tr key={log.id}>
            <td className="border border-slate-300 p-2 font-mono whitespace-nowrap">{log.timestamp}</td>
            <td className="border border-slate-300 p-2"><div className="font-bold">{log.user}</div><div className="text-[10px] text-slate-500 uppercase">{log.role}</div></td>
            <td className="border border-slate-300 p-2 font-bold text-indigo-700">{log.action}</td>
            <td className="border border-slate-300 p-2">{log.module}</td>
            <td className="border border-slate-300 p-2">
              <div className="text-slate-800">{log.details}</div>
              {log.targetRecord && <div className="text-[10px] text-slate-500 mt-1 font-mono">Target: {log.targetRecord}</div>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-200 print:hidden">
        {/* Header */}
        <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-600 rounded-xl"><Shield className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">{isDev ? 'Global Audit Trail' : 'Academy Audit Logs'}</h1>
              {isDev && activeAcadId === 'all' && (
                <span className="px-2 py-0.5 bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[10px] rounded uppercase font-bold flex items-center gap-1"><Globe className="w-3 h-3" /> All Networks</span>
              )}
            </div>
            <p className="text-xs text-indigo-200 mt-1">Track all system activities, updates, and security events.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setIsPrintModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold transition cursor-pointer"><Printer className="w-4 h-4" /> Print Logs</button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition cursor-pointer"><Download className="w-4 h-4" /> Export CSV</button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user, action, module, or details..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500" />
            </div>
            <div className="flex items-center gap-2">
              <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none cursor-pointer">
                <option value="All">All Actions</option>
                <option value="CREATE">Create / Add</option>
                <option value="UPDATE">Update / Edit</option>
                <option value="DELETE">Delete / Remove</option>
                <option value="LOGIN">Login / Auth</option>
              </select>
              <button onClick={toggleSelectAll} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
                {selectedIds.length === filteredLogs.length && filteredLogs.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All
              </button>
            </div>
          </div>
        </div>

        {/* Floating Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="p-3.5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg border border-indigo-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold"><span className="px-2.5 py-1 bg-indigo-500 text-white rounded-lg font-mono">{selectedIds.length}</span><span>Logs Selected</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleTriggerPrint(logs.filter(l => selectedIds.includes(l.id)))} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-3.5 h-3.5" /> Print Selected</button>
              <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Clear Logs</button>
              <button onClick={() => setSelectedIds([])} className="p-1.5 text-slate-400 hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Logs List */}
        <div className="bg-white rounded-[22px] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2"><Filter className="w-4 h-4" /> Results ({filteredLogs.length})</span>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                <Activity className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-bold">No audit logs found.</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedIds.includes(log.id);
                return (
                  <div key={log.id} className={`p-4 hover:bg-slate-50 transition flex flex-col gap-2 ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <label className="mt-1 p-1 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 shadow-sm" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(log.id, e as any)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                        </label>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {getActionBadge(log.action)}
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium"><Clock className="w-3 h-3" /><span>{log.timestamp}</span></div>
                          </div>
                          <div className="text-xs text-slate-700 font-medium leading-relaxed mt-1.5">{log.details}</div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-800"><User className="w-3 h-3 text-indigo-500" /><span>{log.user}</span><span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] uppercase tracking-wide text-slate-500">{log.role}</span></div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><Database className="w-3 h-3" /> {log.module}</div>
                            {log.targetRecord && <div className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">Target: <span className="font-mono text-slate-700">{log.targetRecord}</span></div>}
                            {isDev && activeAcadId === 'all' && log.academyName && <div className="text-[10px] font-bold text-indigo-600 ml-auto">{log.academyName}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div><h3 className="font-bold text-base text-slate-900">Print Audit Logs</h3><p className="text-[11px] text-slate-500">Export security records to A4.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => handleTriggerPrint(filteredLogs)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print Filtered</button>
                <button type="button" onClick={() => handleTriggerPrint(logs)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print All</button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div className="bg-white shadow-md mx-auto pointer-events-none min-w-[800px]">
                <div className="p-8">
                  <LetterheadPrint title="INSTITUTIONAL SECURITY & AUDIT TRAIL LOG" documentNo="AUDIT-LOG-2026" summaryStats={[{ label: 'Total Logs', value: filteredLogs.length }]}>
                    <PrintTableContent data={filteredLogs} />
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
            <LetterheadPrint title="INSTITUTIONAL SECURITY & AUDIT TRAIL LOG" documentNo="AUDIT-LOG-2026" summaryStats={[{ label: 'Total Records', value: printData.length }]}>
              <PrintTableContent data={printData} />
            </LetterheadPrint>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AuditLogsModule;
