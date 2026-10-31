import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, TrendingUp, TrendingDown, Search, Plus, X, DollarSign, Edit2, Trash2, Printer, CheckSquare, Square } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';

type Entry = { id: string; date: string; head: string; type: 'Income' | 'Expense'; amount: number; method: string; desc: string; };

const INITIAL_ENTRIES: Entry[] = [
  { id:'ACC-001', date:'2026-01-15', head:'Tuition Fees Jan', type:'Income', amount:720000, method:'Bank', desc:'Monthly fees collection' },
  { id:'ACC-002', date:'2026-01-16', head:'Staff Salaries', type:'Expense', amount:320000, method:'Bank Transfer', desc:'Jan salaries' },
  { id:'ACC-003', date:'2026-01-18', head:'Library Books', type:'Expense', amount:45000, method:'Cash', desc:'New books purchase' },
];

export default function AccountsModule() {
  const [entries, setEntries] = useState<Entry[]>(INITIAL_ENTRIES);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<Entry[] | null>(null);

  // Form State
  const [head, setHead] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Income');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Bank');
  const [desc, setDesc] = useState('');

  const totalIncome = entries.filter(e => e.type === 'Income').reduce((a, b) => a + b.amount, 0);
  const totalExpense = entries.filter(e => e.type === 'Expense').reduce((a, b) => a + b.amount, 0);
  const balance = totalIncome - totalExpense;

  const filtered = entries.filter(e => 
    e.head.toLowerCase().includes(search.toLowerCase()) || 
    e.id.toLowerCase().includes(search.toLowerCase())
  );

  // Selection
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) setSelectedIds([]);
    else setSelectedIds(filtered.map(e => e.id));
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} selected ledger entries?`)) {
      setEntries(prev => prev.filter(e => !selectedIds.includes(e.id)));
      setSelectedIds([]);
    }
  };

  // CRUD Logic
  const resetForm = () => {
    setHead(''); setType('Income'); setAmount(''); setMethod('Bank'); setDesc('');
    setIsEditMode(false); setEditingId(null);
  };

  const handleOpenEdit = (entry: Entry, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true);
    setEditingId(entry.id);
    setHead(entry.head); setType(entry.type); setAmount(entry.amount.toString());
    setMethod(entry.method); setDesc(entry.desc);
    setIsFormModalOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!head || !amount) return;

    if (isEditMode && editingId) {
      setEntries(prev => prev.map(entry => entry.id === editingId ? { ...entry, head, type, amount: Number(amount), method, desc } : entry));
    } else {
      const newEntry: Entry = {
        id: `ACC-${String(entries.length + 1).padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        head, type, amount: Number(amount), method, desc
      };
      setEntries([newEntry, ...entries]);
    }
    setIsFormModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this entry?')) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleTriggerPrint = (recordsToPrint: Entry[]) => {
    setPrintData(recordsToPrint);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 300);
  };

  const PrintTableContent = ({ data }: { data: Entry[] }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead>
        <tr className="bg-slate-100 text-slate-800 font-bold">
          <th className="border border-slate-300 p-2">Date</th>
          <th className="border border-slate-300 p-2">ID</th>
          <th className="border border-slate-300 p-2">Head</th>
          <th className="border border-slate-300 p-2">Type</th>
          <th className="border border-slate-300 p-2">Method</th>
          <th className="border border-slate-300 p-2">Description</th>
          <th className="border border-slate-300 p-2 text-right">Amount (PKR)</th>
        </tr>
      </thead>
      <tbody>
        {data.map((e) => (
          <tr key={e.id}>
            <td className="border border-slate-300 p-2 font-mono">{e.date}</td>
            <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-700">{e.id}</td>
            <td className="border border-slate-300 p-2 font-bold">{e.head}</td>
            <td className={`border border-slate-300 p-2 font-bold ${e.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>{e.type}</td>
            <td className="border border-slate-300 p-2">{e.method}</td>
            <td className="border border-slate-300 p-2 text-slate-500 italic max-w-[200px] truncate">{e.desc}</td>
            <td className={`border border-slate-300 p-2 text-right font-mono font-bold ${e.type === 'Income' ? 'text-emerald-700' : 'text-rose-700'}`}>
              {e.type === 'Income' ? '+' : '-'} {e.amount.toLocaleString()}
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
              <span className="p-2 bg-indigo-600 rounded-xl"><Wallet className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Accounts • Ledger & Audit</h1>
            </div>
            <p className="text-xs text-indigo-200 mt-1">Institutional income statements, expense tracking, and net balance sheet.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIsPrintModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Ledger</button>
            <button type="button" onClick={() => { resetForm(); setIsFormModalOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"><Plus className="w-4 h-4" /> Add Entry</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-white rounded-[20px] border border-emerald-200 shadow-sm">
            <div className="text-[11px] font-semibold text-emerald-600 uppercase">Total Income</div>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-1">PKR {totalIncome.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-white rounded-[20px] border border-rose-200 shadow-sm">
            <div className="text-[11px] font-semibold text-rose-600 uppercase">Total Expense</div>
            <div className="text-2xl font-black text-rose-700 font-mono mt-1">PKR {totalExpense.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-slate-900 rounded-[20px] border border-slate-800 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Net Balance</div>
            <div className="text-2xl font-black text-white font-mono mt-1">PKR {balance.toLocaleString()}</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ledger by head, ID, or description..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleSelectAll} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
              {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All
            </button>
            {selectedIds.length > 0 && (
              <>
                <button onClick={() => handleTriggerPrint(entries.filter(e => selectedIds.includes(e.id)))} className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"><Printer className="w-4 h-4" /> Print ({selectedIds.length})</button>
                <button onClick={handleBulkDelete} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"><Trash2 className="w-4 h-4" /> Delete</button>
              </>
            )}
          </div>
        </div>
        {/* Entries List */}
        <div className="space-y-3">
          {filtered.map((e) => {
            const isSelected = selectedIds.includes(e.id);
            return (
              <div key={e.id} className={`p-4 rounded-[18px] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isSelected ? 'bg-indigo-50/50 border-indigo-400 ring-1 ring-indigo-400/30' : 'bg-white border-slate-200 hover:shadow-sm'}`}>
                <div className="flex items-center gap-3">
                  <label className="p-1 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 shadow-sm" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={(ev) => toggleSelect(e.id, ev as any)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                  </label>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${e.type === 'Income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {e.type === 'Income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">
                      {e.head} <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-1">{e.id}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{e.date} • {e.method} • {e.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 justify-between sm:justify-end w-full sm:w-auto pl-10 sm:pl-0">
                  <p className={`font-black font-mono text-sm ${e.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {e.type === 'Income' ? '+' : '-'} PKR {e.amount.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                    <button type="button" onClick={(ev) => handleOpenEdit(e, ev)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></button>
                    <button type="button" onClick={(ev) => handleDelete(e.id, ev)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD / EDIT ENTRY MODAL */}
      <Modal isOpen={isFormModalOpen} onClose={() => { setIsFormModalOpen(false); resetForm(); }} title={isEditMode ? "Edit Ledger Entry" : "Add Ledger Entry"} subtitle="Record institutional income or expense">
        <form onSubmit={handleSaveEntry} className="space-y-4">
          <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Head *</label><input required type="text" value={head} onChange={e => setHead(e.target.value)} placeholder="e.g. Tuition Fees, Utility Bills" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Transaction Type</label><select value={type} onChange={e => setType(e.target.value as any)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-bold"><option value="Income">Income (Credit)</option><option value="Expense">Expense (Debit)</option></select></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount (PKR) *</label><input required type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label><select value={method} onChange={e => setMethod(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"><option value="Bank">Bank</option><option value="Cash">Cash</option><option value="Cheque">Cheque</option><option value="Online">Online Transfer</option></select></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label><input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional details..." className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={() => { setIsFormModalOpen(false); resetForm(); }} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg">{isEditMode ? 'Update Entry' : 'Save Entry'}</button>
          </div>
        </form>
      </Modal>
      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div><h3 className="font-bold text-base text-slate-900">Print Accounts Ledger</h3><p className="text-[11px] text-slate-500">Export financial records to A4.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => handleTriggerPrint(filtered)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print Filtered</button>
                <button type="button" onClick={() => handleTriggerPrint(entries)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print All</button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div className="bg-white shadow-md mx-auto pointer-events-none">
                <div className="p-8">
                  <LetterheadPrint title="INSTITUTIONAL ACCOUNTS & FINANCIAL AUDIT LEDGER" documentNo="ACC-LEDGER-2026" summaryStats={[{ label: 'Total Income', value: `PKR ${filtered.filter(e => e.type === 'Income').reduce((s, e) => s + e.amount, 0).toLocaleString()}` }, { label: 'Total Expense', value: `PKR ${filtered.filter(e => e.type === 'Expense').reduce((s, e) => s + e.amount, 0).toLocaleString()}` }, { label: 'Net Balance', value: `PKR ${filtered.reduce((s, e) => s + (e.type === 'Income' ? e.amount : -e.amount), 0).toLocaleString()}` }]}>
                    <PrintTableContent data={filtered} />
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
            <LetterheadPrint title="INSTITUTIONAL ACCOUNTS & FINANCIAL AUDIT LEDGER" documentNo="ACC-LEDGER-2026" summaryStats={[{ label: 'Total Records', value: printData.length }, { label: 'Net Balance', value: `PKR ${printData.reduce((s, e) => s + (e.type === 'Income' ? e.amount : -e.amount), 0).toLocaleString()}` }]}>
              <PrintTableContent data={printData} />
            </LetterheadPrint>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export { AccountsModule };
