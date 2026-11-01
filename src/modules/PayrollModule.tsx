import { getCurrentUser } from '../components/auth/AuthSystem';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { DollarSign, Plus, Printer, Download, Search, UserCheck, ShieldCheck, Trash2, Edit2, CheckSquare, Square, X } from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type PayrollRecord } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';

export const PayrollModule: React.FC = () => {
  const state = erpStorage.getState();
  const currentUser = getCurrentUser();
  const isParent = currentUser?.role === 'parent';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPayId, setEditingPayId] = useState<string | null>(null);
  const [selectedPayRecord, setSelectedPayRecord] = useState<PayrollRecord | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<PayrollRecord[] | null>(null);

  // Form fields
  const [staffName, setStaffName] = useState('Prof. Ghulam Rasool');
  const [designation, setDesignation] = useState('Director & Academic Dean');
  const [month, setMonth] = useState('October 2026');
  const [basicSalary, setBasicSalary] = useState(75000);
  const [allowances, setAllowances] = useState(10000);
  const [deductions, setDeductions] = useState(2000);
  const [paymentMethod, setPaymentMethod] = useState('Direct Bank Transfer');

  const netPay = Math.max(0, basicSalary + allowances - deductions);
  const totalPayroll = state.payroll.reduce((sum, p) => sum + p.netPay, 0);

  const filtered = state.payroll.filter(
    (p) => p.staffName.toLowerCase().includes(search.toLowerCase()) || p.designation.toLowerCase().includes(search.toLowerCase()) || p.month.toLowerCase().includes(search.toLowerCase())
  );

  // Selection Logic
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) setSelectedIds([]);
    else setSelectedIds(filtered.map(p => p.id));
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} selected payroll records?`)) {
      selectedIds.forEach(id => erpStorage.deleteItem('payroll', id));
      setSelectedIds([]);
    }
  };

  // Form Logic
  const resetForm = () => {
    setStaffName('Prof. Ghulam Rasool'); setDesignation('Director & Academic Dean');
    setMonth('October 2026'); setBasicSalary(75000); setAllowances(10000);
    setDeductions(2000); setPaymentMethod('Direct Bank Transfer');
    setIsEditMode(false); setEditingPayId(null);
  };

  const handleOpenEdit = (p: PayrollRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true); setEditingPayId(p.id);
    setStaffName(p.staffName); setDesignation(p.designation); setMonth(p.month);
    setBasicSalary(p.basicSalary); setAllowances(p.allowances); setDeductions(p.deductions);
    setPaymentMethod(p.paymentMethod);
    setIsAddModalOpen(true);
  };

  const handleSavePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode && editingPayId) {
      erpStorage.updateItem('payroll', editingPayId, {
        staffName, designation, month, basicSalary: Number(basicSalary),
        allowances: Number(allowances), deductions: Number(deductions), netPay, paymentMethod,
      });
    } else {
      const newPay: PayrollRecord = {
        id: `PAY-${Date.now().toString().slice(-4)}`, staffName, designation, month,
        basicSalary: Number(basicSalary), allowances: Number(allowances), deductions: Number(deductions),
        netPay, status: 'Paid', paymentDate: new Date().toISOString().split('T')[0], paymentMethod,
      };
      erpStorage.addItem('payroll', newPay);
    }
    
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this payroll record?')) {
      erpStorage.deleteItem('payroll', id);
      if (selectedPayRecord?.id === id) setSelectedPayRecord(null);
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleTriggerPrint = (recordsToPrint: PayrollRecord[]) => {
    setPrintData(recordsToPrint);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 300);
  };

  const PrintTableContent = ({ data }: { data: PayrollRecord[] }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead>
        <tr className="bg-slate-100 text-slate-800 font-bold">
          <th className="border border-slate-300 p-2">Staff Member</th><th className="border border-slate-300 p-2">Designation</th>
          <th className="border border-slate-300 p-2">Month</th><th className="border border-slate-300 p-2 text-right">Basic</th>
          <th className="border border-slate-300 p-2 text-right">Allowances</th><th className="border border-slate-300 p-2 text-right">Deductions</th>
          <th className="border border-slate-300 p-2 text-right">Net Pay</th>
        </tr>
      </thead>
      <tbody>
        {data.map((p) => (
          <tr key={p.id}>
            <td className="border border-slate-300 p-2 font-bold">{p.staffName}</td>
            <td className="border border-slate-300 p-2">{p.designation}</td>
            <td className="border border-slate-300 p-2">{p.month}</td>
            <td className="border border-slate-300 p-2 text-right font-mono">PKR {p.basicSalary.toLocaleString()}</td>
            <td className="border border-slate-300 p-2 text-right font-mono text-emerald-700">PKR {p.allowances.toLocaleString()}</td>
            <td className="border border-slate-300 p-2 text-right font-mono text-rose-700">PKR {p.deductions.toLocaleString()}</td>
            <td className="border border-slate-300 p-2 text-right font-mono font-black text-indigo-900">PKR {p.netPay.toLocaleString()}</td>
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
              <span className="p-2 bg-indigo-600 rounded-xl"><DollarSign className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Staff Salary & Payroll PRO</h1>
              <span className="px-2 py-0.5 bg-indigo-500 text-white font-black text-[10px] rounded uppercase">PAYROLL SLIPS</span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">Faculty remuneration, basic pay structures, allowances, tax deductions, and official pay slips.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIsPrintModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Master Payroll</button>
            <button type="button" onClick={() => { resetForm(); setIsAddModalOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"><Plus className="w-4 h-4" /> Process Salary</button>
          </div>
        </div>

        {/* KPI */}
        <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Total Net Staff Remuneration</span>
            <div className="text-2xl md:text-3xl font-black text-indigo-700 font-mono mt-1">PKR {totalPayroll.toLocaleString()}</div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>Disbursement Status: 100% Processed</div>
            <div className="font-bold text-emerald-600">Audited via TaleemOS Hub</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search salary records by staff name, designation, or month..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleSelectAll} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
                {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All
              </button>
              {selectedIds.length > 0 && (
                <>
                  <button onClick={() => handleTriggerPrint(state.payroll.filter(p => selectedIds.includes(p.id)))} className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"><Printer className="w-4 h-4" /> Print ({selectedIds.length})</button>
                  <button onClick={handleBulkDelete} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"><Trash2 className="w-4 h-4" /> Delete</button>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div key={item.id} onClick={() => setSelectedPayRecord(item)} className={`p-5 rounded-[22px] border transition-all cursor-pointer flex flex-col justify-between ${isSelected ? 'bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-400/30' : 'bg-white border-slate-200 hover:shadow-lg'}`}>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="p-1 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 shadow-sm" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(item.id, e as any)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                      </label>
                      <span className="px-2.5 py-0.5 font-bold text-xs bg-indigo-50 text-indigo-700 rounded-lg">{item.month}</span>
                    </div>
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-black uppercase ${item.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{item.status}</span>
                  </div>
                  <h3 className="mt-2 text-base font-extrabold text-slate-900">{item.staffName}</h3>
                  <p className="text-xs text-slate-500">{item.designation}</p>
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs font-mono">
                    <div className="flex justify-between"><span className="text-slate-400 font-sans">Basic Pay:</span><span>PKR {item.basicSalary.toLocaleString()}</span></div>
                    <div className="flex justify-between text-emerald-700"><span className="text-slate-400 font-sans">Allowances:</span><span>+PKR {item.allowances.toLocaleString()}</span></div>
                    <div className="flex justify-between text-rose-600"><span className="text-slate-400 font-sans">Deductions:</span><span>-PKR {item.deductions.toLocaleString()}</span></div>
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900"><span className="font-sans">Net Salary:</span><span className="text-indigo-700 font-black">PKR {item.netPay.toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[10px]">{item.paymentMethod}</span>
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

      {/* PROCESS / EDIT SALARY MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); resetForm(); }} title={isEditMode ? "Edit Staff Salary Record" : "Process Staff Salary Disbursement"} subtitle="Calculates gross compensation, tax/provident deductions, and net credit" badge={isEditMode ? "EDIT" : "PAYROLL"}>
        <form onSubmit={handleSavePayroll} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Staff / Faculty Member *</label><input type="text" required value={staffName} onChange={(e) => setStaffName(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Designation *</label><input type="text" required value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Salary Month</label><input type="text" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="October 2026" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Channel</label><input type="text" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} placeholder="Direct Bank Transfer" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div><label className="block text-[11px] font-bold text-slate-600 mb-1">Basic Salary (PKR)</label><input type="number" min={0} value={basicSalary} onChange={(e) => setBasicSalary(Number(e.target.value))} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold" /></div>
            <div><label className="block text-[11px] font-bold text-slate-600 mb-1">Allowances (PKR)</label><input type="number" min={0} value={allowances} onChange={(e) => setAllowances(Number(e.target.value))} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-emerald-700" /></div>
            <div><label className="block text-[11px] font-bold text-slate-600 mb-1">Deductions (PKR)</label><input type="number" min={0} value={deductions} onChange={(e) => setDeductions(Number(e.target.value))} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-rose-600" /></div>
            <div><label className="block text-[11px] font-bold text-slate-600 mb-1">Net Pay (PKR)</label><div className="w-full px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-mono font-black text-indigo-900">PKR {netPay.toLocaleString()}</div></div>
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg">{isEditMode ? 'Update Pay Record' : 'Issue Pay Record'}</button>
          </div>
        </form>
      </Modal>
      {/* DETAIL MODAL */}
      {selectedPayRecord && (
        <Modal isOpen={Boolean(selectedPayRecord)} onClose={() => setSelectedPayRecord(null)} title={`Official Salary Slip: ${selectedPayRecord.staffName}`} subtitle={`Month: ${selectedPayRecord.month} • Designation: ${selectedPayRecord.designation}`} badge={selectedPayRecord.status} maxWidth="max-w-4xl">
          <div className="space-y-4">
            <div className="flex justify-end gap-2 pb-2 border-b no-print">
              <button type="button" onClick={() => handleTriggerPrint([selectedPayRecord])} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print Salary Slip</button>
              <button type="button" onClick={() => setSelectedPayRecord(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200">Close</button>
            </div>
            <div className="pointer-events-none overflow-auto max-h-[70vh]">
              <LetterheadPrint title="OFFICIAL FACULTY & STAFF CONFIDENTIAL PAY SLIP" documentNo={selectedPayRecord.id} signatures={['Staff Signature', 'Accounts Officer', 'Director']}>
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div><span className="text-slate-400 block font-semibold text-[10px]">EMPLOYEE NAME</span><strong className="text-slate-900 text-sm uppercase">{selectedPayRecord.staffName}</strong></div>
                    <div><span className="text-slate-400 block font-semibold text-[10px]">DESIGNATION</span><strong className="text-slate-900">{selectedPayRecord.designation}</strong></div>
                    <div><span className="text-slate-400 block font-semibold text-[10px]">PAYROLL MONTH</span><strong className="text-indigo-700 font-bold">{selectedPayRecord.month}</strong></div>
                    <div><span className="text-slate-400 block font-semibold text-[10px]">DISBURSEMENT METHOD</span><strong className="text-slate-900">{selectedPayRecord.paymentMethod}</strong></div>
                  </div>
                  <table className="w-full border-collapse border border-slate-300 text-left">
                    <thead><tr className="bg-slate-100 text-slate-800 font-bold"><th className="border p-2">Earnings Head</th><th className="border p-2 text-right">Amount (PKR)</th><th className="border p-2">Deductions Head</th><th className="border p-2 text-right">Amount (PKR)</th></tr></thead>
                    <tbody>
                      <tr><td className="border p-2 font-semibold">Basic Pay</td><td className="border p-2 text-right font-mono">PKR {selectedPayRecord.basicSalary.toLocaleString()}</td><td className="border p-2 text-rose-700 font-semibold">Income Tax / Provident</td><td className="border p-2 text-right font-mono text-rose-700">PKR {selectedPayRecord.deductions.toLocaleString()}</td></tr>
                      <tr><td className="border p-2 font-semibold text-emerald-700">Special & Medical Allowances</td><td className="border p-2 text-right font-mono text-emerald-700">PKR {selectedPayRecord.allowances.toLocaleString()}</td><td className="border p-2 text-slate-400">Other Deductions</td><td className="border p-2 text-right font-mono text-slate-400">PKR 0</td></tr>
                      <tr className="bg-slate-50 font-bold"><td className="border p-2 uppercase">Total Gross Remuneration</td><td className="border p-2 text-right font-mono text-indigo-900 font-black">PKR {(selectedPayRecord.basicSalary + selectedPayRecord.allowances).toLocaleString()}</td><td className="border p-2 uppercase">Net Bank Credit Amount</td><td className="border p-2 text-right font-mono text-emerald-800 font-black text-sm">PKR {selectedPayRecord.netPay.toLocaleString()}</td></tr>
                    </tbody>
                  </table>
                </div>
              </LetterheadPrint>
            </div>
          </div>
        </Modal>
      )}

      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div><h3 className="font-bold text-base text-slate-900">Print Payroll Ledger</h3><p className="text-[11px] text-slate-500">Export records to A4.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => handleTriggerPrint(filtered)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print Filtered</button>
                <button type="button" onClick={() => handleTriggerPrint(state.payroll)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print All</button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div className="bg-white shadow-md mx-auto pointer-events-none">
                <div className="p-8">
                  <LetterheadPrint title="INSTITUTIONAL FACULTY & STAFF MASTER PAYROLL REGISTER" documentNo="PAY-REGISTER-2026" summaryStats={[{ label: 'Staff Count', value: filtered.length }, { label: 'Total Payroll', value: `PKR ${filtered.reduce((s, p) => s + p.netPay, 0).toLocaleString()}` }]}>
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
            <LetterheadPrint title={printData.length === 1 ? "OFFICIAL FACULTY & STAFF CONFIDENTIAL PAY SLIP" : "INSTITUTIONAL FACULTY & STAFF MASTER PAYROLL REGISTER"} documentNo={printData.length === 1 ? printData[0].id : "PAY-REGISTER-2026"} summaryStats={printData.length > 1 ? [{ label: 'Staff Count', value: printData.length }, { label: 'Total Payroll', value: `PKR ${printData.reduce((s, p) => s + p.netPay, 0).toLocaleString()}` }] : []}>
              {printData.length === 1 ? (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div><span className="text-slate-400 block font-semibold text-[10px]">EMPLOYEE NAME</span><strong className="text-slate-900 text-sm uppercase">{printData[0].staffName}</strong></div>
                    <div><span className="text-slate-400 block font-semibold text-[10px]">DESIGNATION</span><strong className="text-slate-900">{printData[0].designation}</strong></div>
                    <div><span className="text-slate-400 block font-semibold text-[10px]">PAYROLL MONTH</span><strong className="text-indigo-700 font-bold">{printData[0].month}</strong></div>
                    <div><span className="text-slate-400 block font-semibold text-[10px]">DISBURSEMENT METHOD</span><strong className="text-slate-900">{printData[0].paymentMethod}</strong></div>
                  </div>
                  <table className="w-full border-collapse border border-slate-300 text-left">
                    <thead><tr className="bg-slate-100 text-slate-800 font-bold"><th className="border p-2">Earnings Head</th><th className="border p-2 text-right">Amount (PKR)</th><th className="border p-2">Deductions Head</th><th className="border p-2 text-right">Amount (PKR)</th></tr></thead>
                    <tbody>
                      <tr><td className="border p-2 font-semibold">Basic Pay</td><td className="border p-2 text-right font-mono">PKR {printData[0].basicSalary.toLocaleString()}</td><td className="border p-2 text-rose-700 font-semibold">Income Tax / Provident</td><td className="border p-2 text-right font-mono text-rose-700">PKR {printData[0].deductions.toLocaleString()}</td></tr>
                      <tr><td className="border p-2 font-semibold text-emerald-700">Special & Medical Allowances</td><td className="border p-2 text-right font-mono text-emerald-700">PKR {printData[0].allowances.toLocaleString()}</td><td className="border p-2 text-slate-400">Other Deductions</td><td className="border p-2 text-right font-mono text-slate-400">PKR 0</td></tr>
                      <tr className="bg-slate-50 font-bold"><td className="border p-2 uppercase">Total Gross Remuneration</td><td className="border p-2 text-right font-mono text-indigo-900 font-black">PKR {(printData[0].basicSalary + printData[0].allowances).toLocaleString()}</td><td className="border p-2 uppercase">Net Bank Credit Amount</td><td className="border p-2 text-right font-mono text-emerald-800 font-black text-sm">PKR {printData[0].netPay.toLocaleString()}</td></tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <PrintTableContent data={printData} />
              )}
            </LetterheadPrint>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default PayrollModule;
