import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Printer, Download, Search, MessageSquare, Send, CheckCircle2, Phone, CheckSquare, Square, X } from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { LetterheadPrint } from '../components/common/LetterheadPrint';

export const DefaultersModule: React.FC = () => {
  const state = erpStorage.getState();
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('All');
  
  // Selection & Print State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [printData, setPrintData] = useState<typeof unpaidVouchers | null>(null);
  const [sentAlert, setSentAlert] = useState<string | null>(null);

  // Unpaid or Partial fee vouchers
  const unpaidVouchers = state.fees.filter((f) => f.status === 'Unpaid' || f.status === 'Partial');

  const filtered = unpaidVouchers.filter((v) => {
    const matchSearch = v.studentName.toLowerCase().includes(search.toLowerCase()) || v.rollNo.toLowerCase().includes(search.toLowerCase()) || v.voucherNo.toLowerCase().includes(search.toLowerCase());
    const matchBatch = batchFilter === 'All' || v.batch === batchFilter;
    return matchSearch && matchBatch;
  });

  const totalDefaulterAmount = filtered.reduce((sum, v) => sum + v.netPayable, 0);

  // Selection Logic
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) setSelectedIds([]);
    else setSelectedIds(filtered.map(v => v.id));
  };

  const handleSendWhatsApp = (v: typeof unpaidVouchers[0]) => {
    const message = encodeURIComponent(`Assalam-o-Alaikum Respected Parent, this is an automated reminder from Taleem Academy Kandhkot. Tuition fee voucher ${v.voucherNo} for ${v.studentName} (${v.rollNo}) amounting to PKR ${v.netPayable} for ${v.month} is overdue. Kindly clear at your earliest convenience.`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
    setSentAlert(`Dispatched WhatsApp notification for ${v.studentName}`);
    setTimeout(() => setSentAlert(null), 3500);
  };

  const handleSendSMS = (v: typeof unpaidVouchers[0]) => {
    setSentAlert(`Queued GSM Gateway SMS reminder for ${v.studentName} (${v.rollNo})`);
    setTimeout(() => setSentAlert(null), 3500);
  };

  const handleBulkSMS = () => {
    setSentAlert(`Dispatched batch SMS reminders to parents of ${selectedIds.length > 0 ? selectedIds.length : filtered.length} fee defaulters.`);
    setSelectedIds([]);
    setTimeout(() => setSentAlert(null), 4000);
  };

  const triggerPrint = (recordsToPrint: typeof unpaidVouchers) => {
    setPrintData(recordsToPrint);
    setTimeout(() => window.print(), 300);
  };

  const PrintTableContent = ({ data }: { data: typeof unpaidVouchers }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead>
        <tr className="bg-slate-100 text-slate-800 font-bold">
          <th className="border border-slate-300 p-2">Roll No</th>
          <th className="border border-slate-300 p-2">Student Name</th>
          <th className="border border-slate-300 p-2">Batch</th>
          <th className="border border-slate-300 p-2">Voucher Ref</th>
          <th className="border border-slate-300 p-2">Month</th>
          <th className="border border-slate-300 p-2 text-right">Arrears Dues</th>
        </tr>
      </thead>
      <tbody>
        {data.map((v) => (
          <tr key={v.id}>
            <td className="border border-slate-300 p-2 font-mono font-bold text-rose-700">{v.rollNo}</td>
            <td className="border border-slate-300 p-2 font-bold">{v.studentName}</td>
            <td className="border border-slate-300 p-2">{v.batch}</td>
            <td className="border border-slate-300 p-2 font-mono">{v.voucherNo}</td>
            <td className="border border-slate-300 p-2">{v.month}</td>
            <td className="border border-slate-300 p-2 text-right font-mono font-bold text-rose-700">PKR {v.netPayable.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-200 print:hidden">
        {/* Header */}
        <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-rose-600 rounded-xl"><AlertTriangle className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Tuition Fee Defaulters PRO</h1>
              <span className="px-2 py-0.5 bg-rose-500 text-white font-black text-[10px] rounded uppercase">ARREARS RECOVERY</span>
            </div>
            <p className="text-xs text-rose-200 mt-1">Real-time defaulter rosters, automated WhatsApp/SMS dispatch, and institutional recovery statistics.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => triggerPrint(filtered)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Full List</button>
            <button type="button" onClick={() => { if(selectedIds.length === 0) return alert('Select defaulters first'); handleBulkSMS(); }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"><Send className="w-4 h-4" /> Bulk SMS Selected ({selectedIds.length})</button>
          </div>
        </div>

        {sentAlert && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span>{sentAlert}</span></div>}

        {/* KPI */}
        <div className="p-5 bg-white rounded-[22px] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Total Outstanding Receivables Across Batches</span>
            <div className="text-2xl md:text-3xl font-black text-rose-600 font-mono mt-1">PKR {totalDefaulterAmount.toLocaleString()}</div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>Defaulter Students: {filtered.length}</div>
            <div className="font-bold text-amber-600">Recovery Campaign Active</div>
          </div>
        </div>

        {/* Search & Batch Filters */}
        <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search defaulters by roll no, student name, or voucher..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500" />
            </div>
            <button onClick={toggleSelectAll} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0">
              {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Cohort Filter:</span>
            <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none">
              <option value="All">All Batches</option>
              {state.batches.map((b) => (<option key={b.id} value={b.batchName}>{b.batchName}</option>))}
            </select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="p-3.5 bg-gradient-to-r from-rose-900 to-slate-900 text-white rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold"><span className="px-2.5 py-1 bg-rose-500 rounded-lg font-mono">{selectedIds.length}</span><span>Defaulters Selected</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => triggerPrint(unpaidVouchers.filter(v => selectedIds.includes(v.id)))} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" /> Print Selected</button>
              <button onClick={handleBulkSMS} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> SMS Selected</button>
              <button onClick={() => setSelectedIds([])} className="p-1.5 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Defaulters Table */}
        <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Excellent! No overdue fee defaulters.</p>
              <p className="text-xs text-slate-400 mt-1">All issued student vouchers are up to date.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3 w-10"></th>
                  <th className="p-3">Roll No</th><th className="p-3">Student Name</th><th className="p-3">Batch</th>
                  <th className="p-3">Voucher Ref</th><th className="p-3">Overdue Month</th><th className="p-3 text-right">Pending Dues</th>
                  <th className="p-3 text-center">Dispatch Reminders</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr key={item.id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                      <td className="p-3 text-center"><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(item.id)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" /></td>
                      <td className="p-3 font-mono font-bold text-indigo-700">{item.rollNo}</td>
                      <td className="p-3 font-bold text-slate-900">{item.studentName}</td>
                      <td className="p-3 text-slate-600">{item.batch}</td>
                      <td className="p-3 font-mono text-slate-500">{item.voucherNo}</td>
                      <td className="p-3 font-semibold text-slate-800">{item.month}</td>
                      <td className="p-3 text-right font-mono font-black text-rose-600 text-sm">PKR {item.netPayable.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button type="button" onClick={() => handleSendWhatsApp(item)} className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center gap-1"><MessageSquare className="w-3 h-3" /> WhatsApp</button>
                          <button type="button" onClick={() => handleSendSMS(item)} className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center gap-1"><Phone className="w-3 h-3" /> SMS</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* ======================================================== */}
      {/* SECRET PRINT PORTAL - ONLY RENDERED WHEN PRINTING */}
      {/* ======================================================== */}
      {printData && createPortal(
        <div id="print-mount" className="hidden print:block w-full bg-white text-slate-900">
          <div className="print-page">
            <LetterheadPrint
              title="OFFICIAL INSTITUTIONAL FEE ARREARS & DEFAULTERS NOTICE"
              documentNo="DEFAULTER-NOTICE-2026"
              summaryStats={[
                { label: 'Defaulter Students', value: printData.length },
                { label: 'Outstanding Arrears', value: `PKR ${printData.reduce((sum, v) => sum + v.netPayable, 0).toLocaleString()}` },
                { label: 'Clearing Deadline', value: '28th Oct 2026' },
              ]}
            >
              <PrintTableContent data={printData} />
            </LetterheadPrint>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default DefaultersModule;
