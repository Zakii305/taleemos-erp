import { getCurrentUser } from '../components/auth/AuthSystem';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, Plus, Printer, Download, Search, Upload, CheckCircle, Clock, Trash2, Edit2, CheckSquare, Square, X } from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type Expense, type ApprovalRequest } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
import { CloudinaryUploader } from '../components/common/CloudinaryUploader';

export const ExpensesModule: React.FC = () => {
  const state = erpStorage.getState();
  const currentUser = getCurrentUser();
  const isParent = currentUser?.role === 'parent';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<Expense[] | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Utility');
  const [amount, setAmount] = useState(15000);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<Expense['paymentMode']>('Bank');
  const [billUrl, setBillUrl] = useState('');
  const [remarks, setRemarks] = useState('');

  const totalExpense = state.expenses.filter((e) => e.status === 'Approved').reduce((sum, e) => sum + e.amount, 0);

  const filtered = state.expenses.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.remarks.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // Selection Logic
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) setSelectedIds([]);
    else setSelectedIds(filtered.map(e => e.id));
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} selected expenses?`)) {
      selectedIds.forEach(id => erpStorage.deleteItem('expenses', id));
      setSelectedIds([]);
    }
  };

  const resetForm = () => {
    setTitle(''); setAmount(15000); setBillUrl(''); setRemarks('');
    setIsEditMode(false); setEditingExpenseId(null);
  };

  const handleOpenEdit = (exp: Expense, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true);
    setEditingExpenseId(exp.id);
    setTitle(exp.title); setCategory(exp.category); setAmount(exp.amount);
    setDate(exp.date); setPaymentMode(exp.paymentMode); setBillUrl(exp.receiptUrl);
    setRemarks(exp.remarks);
    setIsAddModalOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const numAmount = Number(amount);

    if (isEditMode && editingExpenseId) {
      erpStorage.updateItem('expenses', editingExpenseId, {
        title, category, amount: numAmount, date, paymentMode, receiptUrl: billUrl, remarks,
      });
    } else {
      const expId = `EXP-${Date.now().toString().slice(-4)}`;
      const requiresApproval = numAmount > 5000;
      const initialStatus: Expense['status'] = requiresApproval ? 'Pending Approval' : 'Approved';

      const newExpense: Expense = {
        id: expId, title, category, amount: numAmount, date, paymentMode, receiptUrl: billUrl,
        status: initialStatus, approvedBy: requiresApproval ? 'Awaiting Director' : state.userName,
        recordedBy: state.userName, remarks,
      };
      erpStorage.addItem('expenses', newExpense);

      if (requiresApproval) {
        erpStorage.addItem('approvals', {
          id: `APP-${Date.now().toString().slice(-4)}`, module: 'Expense > 5000', recordId: expId,
          title: `Expense Requisition: ${title} (PKR ${numAmount.toLocaleString()})`,
          requestedBy: state.userName, requestedRole: state.activeRole, currentApproverRole: 'Director / Owner',
          amountOrValue: `PKR ${numAmount.toLocaleString()}`, status: 'Pending Approval', date,
          reason: remarks || 'Institutional operating expenditure exceeding PKR 5,000 threshold.',
          history: [{ actor: state.userName, role: state.activeRole, action: 'Created', timestamp: new Date().toLocaleString() }],
        });
      }
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this expense voucher?')) {
      erpStorage.deleteItem('expenses', id);
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleTriggerPrint = (recordsToPrint: Expense[]) => {
    setPrintData(recordsToPrint);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 300);
  };

  const PrintTableContent = ({ data }: { data: Expense[] }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead>
        <tr className="bg-slate-100 text-slate-800 font-bold">
          <th className="border border-slate-300 p-2">Voucher</th><th className="border border-slate-300 p-2">Title</th>
          <th className="border border-slate-300 p-2">Category</th><th className="border border-slate-300 p-2">Date</th>
          <th className="border border-slate-300 p-2">Mode</th><th className="border border-slate-300 p-2 text-right">Amount</th>
          <th className="border border-slate-300 p-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {data.map((e) => (
          <tr key={e.id}>
            <td className="border border-slate-300 p-2 font-mono font-bold text-rose-700">{e.id}</td>
            <td className="border border-slate-300 p-2 font-bold">{e.title}</td>
            <td className="border border-slate-300 p-2">{e.category}</td>
            <td className="border border-slate-300 p-2 font-mono">{e.date}</td>
            <td className="border border-slate-300 p-2">{e.paymentMode}</td>
            <td className="border border-slate-300 p-2 font-mono font-bold text-right text-rose-700">PKR {e.amount.toLocaleString()}</td>
            <td className="border border-slate-300 p-2 font-bold">{e.status}</td>
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
              <span className="p-2 bg-rose-600 rounded-xl"><CreditCard className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Institutional Expenses ERP</h1>
              <span className="px-2 py-0.5 bg-rose-500 text-white font-black text-[10px] rounded uppercase">DISBURSEMENTS</span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">Operational overheads, utility bills, Cloudinary receipts, and Director authorization workflow.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIsPrintModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Ledger</button>
            <button type="button" onClick={() => { resetForm(); setIsAddModalOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"><Plus className="w-4 h-4" /> Record Expense</button>
          </div>
        </div>

        {/* KPI */}
        <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Total Approved Fiscal Disbursements</span>
            <div className="text-2xl md:text-3xl font-black text-rose-600 font-mono mt-1">PKR {totalExpense.toLocaleString()}</div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>Strict Threshold: Expenses &gt; PKR 5,000</div>
            <div className="font-bold text-indigo-600">Routed to Director for Approval</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expenses by invoice title, remarks..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleSelectAll} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
                {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All
              </button>
              {selectedIds.length > 0 && (
                <>
                  <button onClick={() => handleTriggerPrint(state.expenses.filter(e => selectedIds.includes(e.id)))} className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"><Printer className="w-4 h-4" /> Print ({selectedIds.length})</button>
                  <button onClick={handleBulkDelete} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"><Trash2 className="w-4 h-4" /> Delete</button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Category:</span>
            {['All', 'Rent', 'Salary', 'Utility', 'Stationery', 'Maintenance'].map((c) => (
              <button key={c} type="button" onClick={() => setCategoryFilter(c)} className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${categoryFilter === c ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{c}</button>
            ))}
          </div>
        </div>
        {/* Expense Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div key={item.id} className={`p-5 rounded-[22px] border transition-all flex flex-col justify-between ${isSelected ? 'bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-400/30' : 'bg-white border-slate-200 hover:shadow-lg'}`}>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="p-1 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 shadow-sm" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(item.id, e as any)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                      </label>
                      <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-700">{item.category}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase ${item.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{item.status}</span>
                  </div>
                  <h3 className="mt-2 text-base font-extrabold text-slate-900">{item.title}</h3>
                  <div className="mt-1 text-xl font-black text-rose-600 font-mono">PKR {item.amount.toLocaleString()}</div>
                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <div>Date: <span className="font-mono">{item.date}</span></div>
                    <div>Payment Mode: <strong className="text-slate-800">{item.paymentMode}</strong></div>
                    <div>Authorized By: <span className="text-slate-700">{item.approvedBy}</span></div>
                    {item.remarks && <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg mt-1">"{item.remarks}"</p>}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[10px]">{item.id}</span>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={(e) => handleOpenEdit(item, e)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={(e) => handleDelete(item.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RECORD / EDIT EXPENSE MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); resetForm(); }} title={isEditMode ? "Edit Institutional Expenditure" : "Record Institutional Expenditure"} subtitle="Automatic escalation for Director authorization if > PKR 5,000" badge={isEditMode ? "EDIT" : "DISBURSEMENT"}>
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expense Title / Purpose *</label><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Science Lab Reagent Restocking" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-600" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label><select value={category} onChange={(e) => setCategory(e.target.value as Expense['category'])} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"><option value="Rent">Campus Building Rent</option><option value="Salary">Faculty / Staff Salary</option><option value="Utility">PTCL / Electricity / Water</option><option value="Stationery">Printing & Exam Papers</option><option value="Maintenance">Lab & IT Maintenance</option><option value="Marketing">Marketing / Prospectus</option></select></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Disbursement Amount (PKR) *</label><input type="number" required min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none" />{amount > 5000 && <span className="text-[10px] text-amber-700 font-bold block mt-1">⚠️ Amount exceeds PKR 5,000. Will require Director authorization before clearance.</span>}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Disbursement Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Mode</label><select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as Expense['paymentMode'])} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"><option value="Cash">Cash</option><option value="Bank">Direct Bank Transfer</option><option value="Cheque">Crossed Cheque</option></select></div>
          </div>
          <CloudinaryUploader label="Bill / Receipt Invoice (Cloudinary Direct Integration)" description="Direct cloud upload to preset TaleemOS" value={billUrl} accept="application/pdf,image/*" mode="document" folder="taleemos_expenses" onUpload={(url) => setBillUrl(url)} />
          <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vendor & Invoice Remarks</label><input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Vendor invoice number, voucher notes..." className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-lg">{isEditMode ? 'Update Expense' : 'Submit Voucher'}</button>
          </div>
        </form>
      </Modal>
      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div><h3 className="font-bold text-base text-slate-900">Print Expenses Ledger</h3><p className="text-[11px] text-slate-500">Export records to A4.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => handleTriggerPrint(filtered)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print Filtered</button>
                <button type="button" onClick={() => handleTriggerPrint(state.expenses)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print All</button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div className="bg-white shadow-md mx-auto pointer-events-none">
                <div className="p-8">
                  <LetterheadPrint title="INSTITUTIONAL OPERATING EXPENDITURES AUDIT LEDGER" documentNo="EXP-LEDGER-2026" summaryStats={[{ label: 'Total Vouchers', value: filtered.length }, { label: 'Approved Total', value: `PKR ${filtered.filter(e => e.status === 'Approved').reduce((s, e) => s + e.amount, 0).toLocaleString()}` }]}>
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
            <LetterheadPrint title="INSTITUTIONAL OPERATING EXPENDITURES AUDIT LEDGER" documentNo="EXP-LEDGER-2026" summaryStats={[{ label: 'Total Records', value: printData.length }, { label: 'Approved Total', value: `PKR ${printData.filter(e => e.status === 'Approved').reduce((s, e) => s + e.amount, 0).toLocaleString()}` }]}>
              <PrintTableContent data={printData} />
            </LetterheadPrint>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ExpensesModule;
