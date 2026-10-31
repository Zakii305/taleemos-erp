import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { DollarSign, Plus, Printer, Download, Search, Receipt, CheckCircle, AlertTriangle, User, QrCode, Trash2, Edit2, CheckSquare, Square, X, CheckCircle2, BarChart3, Filter } from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type FeeVoucher } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
import { logAuditEvent } from '../lib/auditLogger';
import { FeeCollectionAnalysisD3 } from '../components/finance/FeeCollectionAnalysisD3';

export const FeesModule: React.FC = () => {
  const state = erpStorage.getState();
  const [activeTab, setActiveTab] = useState<'vouchers' | 'analysis'>('vouchers');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<FeeVoucher | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Print Portal State
  const [printData, setPrintData] = useState<{ type: 'ledger' | 'single' | 'batch', records: FeeVoucher[] } | null>(null);

  // Form fields
  const [studentRoll, setStudentRoll] = useState(state.students[0]?.rollNo || 'TAK-26-001');
  const [month, setMonth] = useState('October 2026');
  const [feeHead, setFeeHead] = useState<FeeVoucher['feeHead']>('Monthly');
  const [amount, setAmount] = useState(4500);
  const [discount, setDiscount] = useState(0);
  const [fine, setFine] = useState(0);
  const [status, setStatus] = useState<FeeVoucher['status']>('Paid');
  const [paymentMethod, setPaymentMethod] = useState<FeeVoucher['paymentMethod']>('Cash');

  const targetStudent = state.students.find((s) => s.rollNo === studentRoll);
  const netPayable = Math.max(0, amount - discount + fine);

  const totalVouchers = state.fees.length;
  const totalPaidRevenue = state.fees.filter((f) => f.status === 'Paid').reduce((sum, f) => sum + f.netPayable, 0);
  const totalUnpaidDues = state.fees.filter((f) => f.status === 'Unpaid' || f.status === 'Partial').reduce((sum, f) => sum + f.netPayable, 0);

  const filtered = state.fees.filter((f) => {
    const matchSearch = f.studentName.toLowerCase().includes(search.toLowerCase()) || f.rollNo.toLowerCase().includes(search.toLowerCase()) || f.voucherNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || f.status === statusFilter;
    const matchMonth = monthFilter === 'All' || f.month === monthFilter;
    return matchSearch && matchStatus && matchMonth;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) setSelectedIds([]);
    else setSelectedIds(filtered.map((f) => f.id));
  };

  const handleOpenEdit = (v: FeeVoucher, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true);
    setEditingVoucherId(v.id);
    setStudentRoll(v.rollNo);
    setMonth(v.month);
    setFeeHead(v.feeHead);
    setAmount(v.amount);
    setDiscount(v.discount);
    setFine(v.fine);
    setStatus(v.status);
    setPaymentMethod(v.paymentMethod);
    setIsAddModalOpen(true);
  };

  const handleSaveVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudent) return;

    if (isEditMode && editingVoucherId) {
      erpStorage.updateItem('fees', editingVoucherId, {
        studentName: targetStudent.name, rollNo: targetStudent.rollNo, batch: targetStudent.classBatch,
        month, feeHead, amount: Number(amount), discount: Number(discount), fine: Number(fine),
        netPayable, status, paymentMethod, paidDate: status === 'Paid' ? new Date().toISOString().split('T')[0] : undefined,
      });
      setActionNotice(`Updated fee voucher for ${targetStudent.name}`);
    } else {
      const voucherNum = `VCH-26-${String(800 + state.fees.length + 1)}`;
      const newVoucher: FeeVoucher = {
        id: `FEE-${Date.now().toString().slice(-4)}`, voucherNo: voucherNum, studentName: targetStudent.name,
        rollNo: targetStudent.rollNo, batch: targetStudent.classBatch, month, feeHead, amount: Number(amount),
        discount: Number(discount), fine: Number(fine), netPayable, status, paymentMethod,
        paidDate: status === 'Paid' ? new Date().toISOString().split('T')[0] : undefined, collectedBy: state.userName,
      };
      erpStorage.addItem('fees', newVoucher);
      setActionNotice(`Generated new fee voucher: ${voucherNum}`);
    }
    setIsAddModalOpen(false); setIsEditMode(false); setEditingVoucherId(null);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this fee voucher record?')) {
      erpStorage.deleteItem('fees', id);
      if (selectedVoucher?.id === id) setSelectedVoucher(null);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      setActionNotice('Voucher deleted.'); setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleBulkMarkPaid = () => {
    selectedIds.forEach((id) => {
      erpStorage.updateItem('fees', id, { status: 'Paid', paidDate: new Date().toISOString().split('T')[0] });
    });
    setActionNotice(`Marked ${selectedIds.length} vouchers as Paid.`);
    setSelectedIds([]); setTimeout(() => setActionNotice(null), 3500);
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} selected vouchers?`)) {
      selectedIds.forEach((id) => erpStorage.deleteItem('fees', id));
      setSelectedIds([]); setActionNotice('Selected vouchers deleted.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const triggerPrint = (type: 'ledger' | 'single' | 'batch', records: FeeVoucher[]) => {
    setPrintData({ type, records });
    setTimeout(() => window.print(), 300);
  };
  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-200 relative print:hidden">
        {actionNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl animate-in fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> <span>{actionNotice}</span>
          </div>
        )}

        {/* Header */}
        <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-600 rounded-xl"><DollarSign className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Fee Vouchers & Collections</h1>
              <span className="px-2 py-0.5 bg-emerald-500 text-white font-black text-[10px] rounded uppercase">FINANCE ERP</span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">Student tuition invoices, bank challans, discount waivers, fines, and automated defaulter tracking.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => triggerPrint('ledger', filtered)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Ledger</button>
            <button type="button" onClick={() => { setIsEditMode(false); setEditingVoucherId(null); setIsAddModalOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"><Plus className="w-4 h-4" /> Issue Voucher</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button type="button" onClick={() => setActiveTab('vouchers')} className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === 'vouchers' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><Receipt className="w-4 h-4" /> Vouchers & Challans</button>
          <button type="button" onClick={() => setActiveTab('analysis')} className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${activeTab === 'analysis' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}><BarChart3 className="w-4 h-4" /> Fee Collection Analysis (D3)</button>
        </div>

        {activeTab === 'analysis' ? (
          <FeeCollectionAnalysisD3 />
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-slate-500 uppercase">Total Issued Vouchers</div><div className="text-2xl font-black text-slate-900 font-mono mt-1">{totalVouchers} Invoices</div></div>
              <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-emerald-600 uppercase">Total Verified Revenue</div><div className="text-2xl font-black text-emerald-600 font-mono mt-1">PKR {totalPaidRevenue.toLocaleString()}</div></div>
              <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-rose-600 uppercase">Outstanding Defaulter Dues</div><div className="text-2xl font-black text-rose-600 font-mono mt-1">PKR {totalUnpaidDues.toLocaleString()}</div></div>
            </div>

            {/* Filters & Search */}
            <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by Voucher No, student name, or roll no..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500" />
                </div>
                <div className="flex items-center gap-2">
                  <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer">
                    <option value="All">All Months</option>
                    <option value="October 2026">October 2026</option>
                    <option value="November 2026">November 2026</option>
                  </select>
                  <button type="button" onClick={toggleSelectAll} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0">
                    {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1"><Filter className="w-3 h-3"/> Status:</span>
                {['All', 'Paid', 'Unpaid', 'Partial'].map((st) => (
                  <button key={st} type="button" onClick={() => setStatusFilter(st)} className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${statusFilter === st ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{st}</button>
                ))}
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
              <div className="p-3.5 bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl shadow-lg border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold"><span className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg font-mono">{selectedIds.length}</span><span>Vouchers Selected</span></div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleBulkMarkPaid} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"><CheckCircle className="w-3.5 h-3.5" /> Mark Paid</button>
                  <button type="button" onClick={() => triggerPrint('batch', state.fees.filter(f => selectedIds.includes(f.id)))} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-3.5 h-3.5" /> Batch Print Challans ({selectedIds.length})</button>
                  <button type="button" onClick={handleBulkDelete} className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                  <button type="button" onClick={() => setSelectedIds([])} className="p-1.5 text-slate-400 hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
                </div>
              </div>
            )}
            {/* Results Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div key={item.id} onClick={() => setSelectedVoucher(item)} className={`p-5 rounded-[22px] border shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between ${isSelected ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/40' : 'bg-white border-slate-200'}`}>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={isSelected} onChange={(e) => { e.stopPropagation(); toggleSelect(item.id); }} className="w-4 h-4 rounded text-emerald-600 cursor-pointer" />
                          <span className="px-2.5 py-0.5 font-mono text-xs font-black bg-indigo-50 text-indigo-700 rounded-lg">{item.voucherNo}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase ${item.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Unpaid' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{item.status}</span>
                      </div>
                      <h3 className="mt-2 text-base font-extrabold text-slate-900">{item.studentName}</h3>
                      <p className="text-xs text-slate-500 font-mono">Roll: {item.rollNo} &bull; {item.batch}</p>
                      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                        <div className="flex justify-between"><span className="text-slate-400">Fee Head / Month:</span><span className="font-bold text-slate-800">{item.feeHead} ({item.month})</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Payment Mode:</span><span className="font-medium text-slate-700">{item.paymentMethod}</span></div>
                        <div className="pt-1.5 border-t border-slate-200 flex justify-between font-mono"><span className="text-slate-500 font-sans font-semibold">Net Payable:</span><span className="font-black text-emerald-700 text-sm">PKR {item.netPayable.toLocaleString()}</span></div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span className="truncate max-w-[160px]">Officer: {item.collectedBy}</span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={(e) => handleOpenEdit(item, e)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={(e) => handleDelete(item.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ISSUE / EDIT VOUCHER MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setIsEditMode(false); setEditingVoucherId(null); }} title={isEditMode ? 'Edit / Modify Fee Voucher' : 'Issue Fee Voucher / Bank Challan'} subtitle="Generates institutional voucher reference VCH-26-XXX" badge={isEditMode ? 'MODIFY' : 'FEE VOUCHER'} maxWidth="max-w-3xl">
        <form onSubmit={handleSaveVoucher} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Candidate Student *</label><select value={studentRoll} onChange={(e) => setStudentRoll(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-mono">{state.students.map((s) => (<option key={s.id} value={s.rollNo}>{s.rollNo} - {s.name} ({s.classBatch})</option>))}</select></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Billing Month *</label><input type="text" required value={month} onChange={(e) => setMonth(e.target.value)} placeholder="e.g. October 2026" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-bold" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fee Head</label><select value={feeHead} onChange={(e) => setFeeHead(e.target.value as FeeVoucher['feeHead'])} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"><option value="Monthly">Monthly Tuition</option><option value="Admission">Admission Fee</option><option value="Exam">Exam Fee</option><option value="Library">Library Caution</option><option value="Lab">Lab Practical Fee</option><option value="Annual">Annual Sports/Gala</option></select></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as FeeVoucher['paymentMethod'])} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"><option value="Cash">Cash at Counter</option><option value="Bank Transfer">Bank Deposit / Transfer</option><option value="EasyPaisa">EasyPaisa</option><option value="JazzCash">JazzCash</option><option value="Cheque">Bank Cheque</option></select></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label><select value={status} onChange={(e) => setStatus(e.target.value as FeeVoucher['status'])} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-bold"><option value="Paid">Paid</option><option value="Unpaid">Unpaid</option><option value="Partial">Partial</option></select></div>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div><label className="block text-[11px] font-bold text-slate-600 mb-1">Base Amount (PKR)</label><input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold" /></div>
            <div><label className="block text-[11px] font-bold text-slate-600 mb-1">Discount (PKR)</label><input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-rose-600" /></div>
            <div><label className="block text-[11px] font-bold text-slate-600 mb-1">Late Fine (PKR)</label><input type="number" min={0} value={fine} onChange={(e) => setFine(Number(e.target.value))} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-amber-600" /></div>
            <div><label className="block text-[11px] font-bold text-slate-600 mb-1">Net Total (PKR)</label><div className="w-full px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-mono font-black text-emerald-800">PKR {netPayable.toLocaleString()}</div></div>
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditMode(false); setEditingVoucherId(null); }} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-lg">{isEditMode ? 'Update Voucher' : 'Generate Voucher'}</button>
          </div>
        </form>
      </Modal>
      {/* DETAIL MODAL */}
      {selectedVoucher && (
        <Modal isOpen={Boolean(selectedVoucher)} onClose={() => setSelectedVoucher(null)} title={`Official Fee Voucher: ${selectedVoucher.voucherNo}`} subtitle={`Student: ${selectedVoucher.studentName} • ${selectedVoucher.month}`} badge={selectedVoucher.status} maxWidth="max-w-4xl">
          <div className="space-y-4">
            <div className="flex justify-end gap-2 pb-2 border-b no-print">
              <button type="button" onClick={() => triggerPrint('single', [selectedVoucher])} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print Voucher</button>
              <button type="button" onClick={() => setSelectedVoucher(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200">Close</button>
            </div>
            <div className="pointer-events-none overflow-auto max-h-[70vh]">
              <LetterheadPrint title="OFFICIAL INSTITUTIONAL TUITION FEE RECEIPT" documentNo={selectedVoucher.voucherNo} signatures={['Accounts Officer', 'Student / Guardian', 'Principal Seal']}>
                <PrintSingleVoucher voucher={selectedVoucher} />
              </LetterheadPrint>
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* SECRET PRINT PORTAL - ONLY RENDERED WHEN PRINTING */}
      {/* ======================================================== */}
      {printData && createPortal(
        <div id="print-mount" className="hidden print:block w-full bg-white text-slate-900">
          
          {/* Mode 1: Master Ledger */}
          {printData.type === 'ledger' && (
            <div className="print-page">
              <LetterheadPrint title="INSTITUTIONAL FEE INVOICES & COLLECTION AUDIT LEDGER" documentNo="FEE-AUDIT-2026" summaryStats={[{ label: 'Total Invoices', value: printData.records.length }, { label: 'Collected', value: `PKR ${totalPaidRevenue.toLocaleString()}` }, { label: 'Dues', value: `PKR ${totalUnpaidDues.toLocaleString()}` }]}>
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead><tr className="bg-slate-100 text-slate-800 font-bold"><th className="border p-2">Voucher No</th><th className="border p-2">Roll No</th><th className="border p-2">Student Name</th><th className="border p-2">Month</th><th className="border p-2">Head</th><th className="border p-2 text-right">Net Amount</th><th className="border p-2">Status</th></tr></thead>
                  <tbody>
                    {printData.records.map((f) => (
                      <tr key={f.id}><td className="border p-2 font-mono font-bold text-indigo-700">{f.voucherNo}</td><td className="border p-2 font-mono">{f.rollNo}</td><td className="border p-2 font-bold">{f.studentName}</td><td className="border p-2">{f.month}</td><td className="border p-2">{f.feeHead}</td><td className="border p-2 text-right font-mono font-bold text-emerald-800">PKR {f.netPayable.toLocaleString()}</td><td className="border p-2 font-bold">{f.status}</td></tr>
                    ))}
                  </tbody>
                </table>
              </LetterheadPrint>
            </div>
          )}

          {/* Mode 2: Single Voucher */}
          {printData.type === 'single' && printData.records[0] && (
            <div className="print-page">
              <LetterheadPrint title="OFFICIAL INSTITUTIONAL TUITION FEE RECEIPT" documentNo={printData.records[0].voucherNo} signatures={['Accounts Officer', 'Student / Guardian', 'Principal Seal']}>
                <PrintSingleVoucher voucher={printData.records[0]} />
              </LetterheadPrint>
            </div>
          )}

          {/* Mode 3: Batch Concatenated Challans */}
          {printData.type === 'batch' && printData.records.map((voucher) => (
            <div key={voucher.id} className="print-page">
              <LetterheadPrint title="OFFICIAL INSTITUTIONAL TUITION FEE CHALLAN" documentNo={voucher.voucherNo} signatures={['Accounts Officer', 'Bank / Receiving Stamp', 'Principal / Auditor Seal']} subtitle={`Billing Month: ${voucher.month} • Head: ${voucher.feeHead} • ${voucher.batch}`}>
                <PrintSingleVoucher voucher={voucher} />
              </LetterheadPrint>
            </div>
          ))}

        </div>,
        document.body
      )}
    </>
  );
};

// Helper Component for printing the voucher layout (Used in both Modal and Portal)
const PrintSingleVoucher = ({ voucher }: { voucher: FeeVoucher }) => (
  <div className="space-y-4 text-xs">
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div><span className="text-slate-400 block font-semibold text-[10px]">STUDENT NAME</span><strong className="text-slate-900 text-sm uppercase">{voucher.studentName}</strong></div>
      <div><span className="text-slate-400 block font-semibold text-[10px]">ROLL NUMBER</span><strong className="text-indigo-700 font-mono text-sm">{voucher.rollNo}</strong></div>
      <div><span className="text-slate-400 block font-semibold text-[10px]">CLASS / BATCH</span><strong className="text-slate-900">{voucher.batch}</strong></div>
      <div><span className="text-slate-400 block font-semibold text-[10px]">FEE HEAD / MONTH</span><strong className="text-slate-900">{voucher.feeHead} ({voucher.month})</strong></div>
    </div>
    <table className="w-full border-collapse border border-slate-300 text-left">
      <thead><tr className="bg-slate-100 text-slate-800 font-bold"><th className="border p-2">Item Description</th><th className="border p-2 text-right">Amount (PKR)</th></tr></thead>
      <tbody>
        <tr><td className="border p-2 font-semibold">Base Tuition Charge</td><td className="border p-2 text-right font-mono">PKR {voucher.amount.toLocaleString()}</td></tr>
        {voucher.discount > 0 && <tr><td className="border p-2 text-rose-700 font-semibold">Scholarship / Concession</td><td className="border p-2 text-right font-mono text-rose-700 font-bold">-PKR {voucher.discount.toLocaleString()}</td></tr>}
        {voucher.fine > 0 && <tr><td className="border p-2 text-amber-700 font-semibold">Late Deposit Fine</td><td className="border p-2 text-right font-mono text-amber-700 font-bold">+PKR {voucher.fine.toLocaleString()}</td></tr>}
        <tr className="bg-slate-50 font-bold"><td className="border p-2 uppercase">Net Amount Deposited</td><td className="border p-2 text-right font-mono font-black text-emerald-800 text-sm">PKR {voucher.netPayable.toLocaleString()}</td></tr>
      </tbody>
    </table>
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-[11px]">
      <div>Payment Instrument: <strong>{voucher.paymentMethod}</strong> &bull; Received by: <strong>{voucher.collectedBy}</strong></div>
      <div className="font-mono text-slate-500">Status: <span className="font-bold text-emerald-700 uppercase">{voucher.status}</span></div>
    </div>
    <div className="grid grid-cols-2 gap-4 pt-2">
      <div className="p-3 border border-dashed border-slate-300 rounded-xl bg-white text-[10px] space-y-1">
        <div className="font-bold text-slate-800 uppercase flex items-center justify-between"><span>PART A: BANK / OFFICE RECORD</span><span className="font-mono text-indigo-700">{voucher.voucherNo}</span></div>
        <p className="text-slate-500">Deposited at fee collection counter or authorized partner bank branch.</p>
        <div className="pt-3 flex justify-between text-slate-400 font-mono"><span>Cashier Sign: ________</span><span>Date: ________</span></div>
      </div>
      <div className="p-3 border border-dashed border-slate-300 rounded-xl bg-white text-[10px] space-y-1">
        <div className="font-bold text-slate-800 uppercase flex items-center justify-between"><span>PART B: STUDENT / GUARDIAN COPY</span><span className="font-mono text-indigo-700">{voucher.voucherNo}</span></div>
        <p className="text-slate-500">Retain this receipt for clearance at term-end and roll number slip collection.</p>
        <div className="pt-3 flex justify-between text-slate-400 font-mono"><span>Received Stamp: ________</span><span>Seal: ________</span></div>
      </div>
    </div>
  </div>
);

export default FeesModule;
