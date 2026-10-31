import React, { useState } from 'react';
import { 
  ArrowUpRight, Search, CheckSquare, Square, Clock, CheckCircle, 
  XCircle, User, Printer, Filter, ShieldCheck, Edit2, Trash2, Download
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
import { triggerBrowserPrint, downloadElementAsPdf } from '../lib/pdf';

interface PromotionRecord {
  id: string;
  studentName: string;
  rollNo: string;
  currentBatch: string;
  targetBatch: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
  reason: string;
  marks: string;
}

export const PromoteModule: React.FC = () => {
  const [records, setRecords] = useState<PromotionRecord[]>([
    { id: 'PRO-101', studentName: 'Muhammad Hamza Malik', rollNo: 'TAK-26-001', currentBatch: '1st Year F.Sc Engineering', targetBatch: '2nd Year F.Sc Engineering', status: 'Pending', date: '2026-10-20', reason: 'Cleared annual exams with 87% marks; eligible for promotion.', marks: '87%' },
    { id: 'PRO-102', studentName: 'Ayesha Khan', rollNo: 'TAK-26-042', currentBatch: 'Matric (Science)', targetBatch: '1st Year Pre-Medical', status: 'Pending', date: '2026-10-21', reason: 'Passed with A+ grade. Highly recommended for Pre-Medical.', marks: '92%' },
    { id: 'PRO-103', studentName: 'Zainab Bibi', rollNo: 'TAK-26-088', currentBatch: 'Batch 2026-A (Morning)', targetBatch: 'Batch 2027-A (Morning)', status: 'Approved', date: '2026-10-15', reason: 'Promoted based on principal approval.', marks: '78%' },
    { id: 'PRO-104', studentName: 'Ali Raza', rollNo: 'TAK-26-105', currentBatch: 'F.Sc Pre-Engineering', targetBatch: 'F.Sc Pre-Medical', status: 'Rejected', date: '2026-10-18', reason: 'Failed to meet minimum attendance criteria (below 75%).', marks: '65%' },
  ]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals State
  const [selectedRecord, setSelectedRecord] = useState<PromotionRecord | null>(null); // For Viewing
  const [isFormModalOpen, setIsFormModalOpen] = useState(false); // For Add/Edit
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printRecords, setPrintRecords] = useState<PromotionRecord[]>([]);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [formStudentName, setFormStudentName] = useState('');
  const [formRollNo, setFormRollNo] = useState('');
  const [formCurrentBatch, setFormCurrentBatch] = useState('');
  const [formTargetBatch, setFormTargetBatch] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formMarks, setFormMarks] = useState('');

  const filteredRecords = records.filter((r) => {
    const matchesSearch = r.studentName.toLowerCase().includes(search.toLowerCase()) || r.rollNo.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length && filteredRecords.length > 0) setSelectedIds([]);
    else setSelectedIds(filteredRecords.map(r => r.id));
  };

  const handleUpdateStatus = (id: string, newStatus: 'Approved' | 'Rejected', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    if (selectedRecord?.id === id) setSelectedRecord(prev => prev ? { ...prev, status: newStatus } : null);
  };

  const handleBulkAction = (newStatus: 'Approved' | 'Rejected') => {
    setRecords(prev => prev.map(r => selectedIds.includes(r.id) ? { ...r, status: newStatus } : r));
    setSelectedIds([]);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('Delete this promotion record?')) {
      setRecords(prev => prev.filter(r => r.id !== id));
      if (selectedRecord?.id === id) setSelectedRecord(null);
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} records?`)) {
      setRecords(prev => prev.filter(r => !selectedIds.includes(r.id)));
      setSelectedIds([]);
    }
  };

  const openEditModal = (record: PromotionRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditId(record.id);
    setFormStudentName(record.studentName);
    setFormRollNo(record.rollNo);
    setFormCurrentBatch(record.currentBatch);
    setFormTargetBatch(record.targetBatch);
    setFormReason(record.reason);
    setFormMarks(record.marks);
    setIsFormModalOpen(true);
  };

  const openAddModal = () => {
    setEditId(null);
    setFormStudentName(''); setFormRollNo(''); setFormCurrentBatch(''); setFormTargetBatch(''); setFormReason(''); setFormMarks('');
    setIsFormModalOpen(true);
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      setRecords(prev => prev.map(r => r.id === editId ? { ...r, studentName: formStudentName, rollNo: formRollNo, currentBatch: formCurrentBatch, targetBatch: formTargetBatch, reason: formReason, marks: formMarks } : r));
    } else {
      const newRecord: PromotionRecord = { id: `PRO-${Math.floor(Math.random() * 900) + 100}`, studentName: formStudentName, rollNo: formRollNo, currentBatch: formCurrentBatch, targetBatch: formTargetBatch, status: 'Pending', date: new Date().toISOString().split('T')[0], reason: formReason, marks: formMarks };
      setRecords([newRecord, ...records]);
    }
    setIsFormModalOpen(false);
  };

  const openPrintModal = (scope: 'all' | 'single' | 'selected', record?: PromotionRecord) => {
    if (scope === 'single' && record) setPrintRecords([record]);
    else if (scope === 'selected') setPrintRecords(records.filter(r => selectedIds.includes(r.id)));
    else setPrintRecords(records);
    setIsPrintModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending</span>;
      case 'Approved': return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'Rejected': return <span className="px-2.5 py-1 bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Rejected</span>;
      default: return null;
    }
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 rounded-xl"><ArrowUpRight className="w-5 h-5 text-white" /></span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Student Promotion Workflow</h1>
          </div>
          <p className="text-xs text-indigo-200 mt-1 max-w-xl">Cohort progression, academic prerequisites validation, and approval governance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => openPrintModal('all')} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print All</button>
          <button onClick={openAddModal} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer shrink-0"><User className="w-4 h-4" /> Request Promotion</button>
        </div>
      </div>

      <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student name or roll number..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button onClick={toggleSelectAll} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition">
              {selectedIds.length === filteredRecords.length && filteredRecords.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All
            </button>
            {selectedIds.length > 0 && (
              <>
                <button onClick={() => openPrintModal('selected')} className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1"><Printer className="w-3.5 h-3.5" /> Print ({selectedIds.length})</button>
                <button onClick={() => handleBulkAction('Approved')} className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold shrink-0 transition">Approve</button>
                <button onClick={() => handleBulkAction('Rejected')} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold shrink-0 transition">Reject</button>
                <button onClick={handleBulkDelete} className="px-3 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shrink-0 transition">Delete</button>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1"><Filter className="w-3 h-3" /> Filter:</span>
          {['All', 'Pending', 'Approved', 'Rejected'].map((st) => (
            <button key={st} onClick={() => setStatusFilter(st)} className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${statusFilter === st ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{st}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-[22px] border border-slate-200">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold">No promotion records found.</p>
          </div>
        ) : (
          filteredRecords.map((record) => {
            const isSelected = selectedIds.includes(record.id);
            return (
              <div key={record.id} onClick={() => setSelectedRecord(record)} className={`p-5 bg-white rounded-[22px] border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/30' : 'border-slate-200 hover:shadow-md'}`}>
                <div className="flex items-start gap-4 flex-1">
                  <label className="mt-1 p-1 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-200 transition" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(record.id, e as any)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                  </label>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{record.id}</span>
                      <h3 className="text-sm font-black text-slate-900">{record.studentName}</h3>
                      {getStatusBadge(record.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 mt-2">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{record.currentBatch}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded">{record.targetBatch}</span>
                      <span className="text-slate-400 text-[10px] ml-auto sm:ml-0">({record.date})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic mt-2">"{record.reason}"</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 md:ml-4 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                  {record.status === 'Pending' && (
                    <>
                      <button onClick={(e) => handleUpdateStatus(record.id, 'Approved', e)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Approve</button>
                      <button onClick={(e) => handleUpdateStatus(record.id, 'Rejected', e)} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Reject</button>
                    </>
                  )}
                  <button onClick={(e) => openPrintModal('single', record)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg" title="Print"><Printer className="w-4 h-4" /></button>
                  <button onClick={(e) => openEditModal(record, e)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={(e) => handleDelete(record.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })
        )}
      </div>
      {selectedRecord && (
        <Modal isOpen={Boolean(selectedRecord)} onClose={() => setSelectedRecord(null)} title="Promotion Details" subtitle={`Reviewing record ${selectedRecord.id}`} badge={selectedRecord.status}>
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200"><span className="font-bold text-slate-500 uppercase">Student Name</span><span className="font-black text-slate-900 text-sm">{selectedRecord.studentName}</span></div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200"><span className="font-bold text-slate-500 uppercase">Roll Number</span><span className="font-mono font-bold text-indigo-600">{selectedRecord.rollNo}</span></div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200"><span className="font-bold text-slate-500 uppercase">Academic Marks</span><span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{selectedRecord.marks}</span></div>
              <div className="pt-2">
                <span className="font-bold text-slate-500 uppercase block mb-2">Progression Path</span>
                <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200"><span className="text-slate-700 font-bold text-center flex-1">{selectedRecord.currentBatch}</span><ArrowUpRight className="w-5 h-5 text-indigo-500 shrink-0" /><span className="text-indigo-700 font-bold text-center flex-1">{selectedRecord.targetBatch}</span></div>
              </div>
              <div className="pt-2"><span className="font-bold text-slate-500 uppercase block mb-1">Justification / Remarks</span><p className="text-slate-800 italic bg-white p-3 rounded-xl border border-slate-200">"{selectedRecord.reason}"</p></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {selectedRecord.status === 'Pending' ? (
                <><button onClick={() => handleUpdateStatus(selectedRecord.id, 'Rejected')} className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold hover:bg-rose-100">Reject</button><button onClick={() => handleUpdateStatus(selectedRecord.id, 'Approved')} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-black shadow-md hover:bg-emerald-700 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Approve</button></>
              ) : (
                <button onClick={() => setSelectedRecord(null)} className="px-5 py-2 bg-slate-800 text-white rounded-xl font-bold">Close</button>
              )}
            </div>
          </div>
        </Modal>
      )}

      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editId ? 'Edit Promotion Record' : 'Request Promotion'} subtitle={editId ? 'Update details' : 'Create new request'} badge={editId ? 'EDIT' : 'NEW'}>
        <form onSubmit={handleSaveRecord} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block font-bold text-slate-700 mb-1 uppercase">Student Name *</label><input required type="text" value={formStudentName} onChange={e => setFormStudentName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none font-bold" /></div>
            <div><label className="block font-bold text-slate-700 mb-1 uppercase">Roll Number *</label><input required type="text" value={formRollNo} onChange={e => setFormRollNo(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none font-mono" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block font-bold text-slate-700 mb-1 uppercase">Current Batch *</label><input required type="text" value={formCurrentBatch} onChange={e => setFormCurrentBatch(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none font-bold" /></div>
            <div><label className="block font-bold text-slate-700 mb-1 uppercase">Target Batch *</label><input required type="text" value={formTargetBatch} onChange={e => setFormTargetBatch(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none font-bold" /></div>
          </div>
          <div><label className="block font-bold text-slate-700 mb-1 uppercase">Academic Marks / Grade</label><input type="text" value={formMarks} onChange={e => setFormMarks(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none font-bold" /></div>
          <div><label className="block font-bold text-slate-700 mb-1 uppercase">Reason / Remarks</label><textarea required value={formReason} onChange={e => setFormReason(e.target.value)} rows={3} className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none"></textarea></div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black shadow-md hover:bg-indigo-700 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> {editId ? 'Update Record' : 'Submit Request'}</button>
          </div>
        </form>
      </Modal>

      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div><h3 className="font-bold text-base text-slate-900">Print Preview</h3><p className="text-[11px] text-slate-500">Export promotion records to A4 paper.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => triggerBrowserPrint()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print</button>
                <button type="button" onClick={() => downloadElementAsPdf('promote-print-table', `Promotions`)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Download className="w-4 h-4" /> PDF</button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div id="promote-print-table" className="min-w-[800px] bg-white p-8 shadow-md mx-auto">
                <LetterheadPrint title="Student Promotion Ledger" documentNo="PROMO-LEDGER-2026" summaryStats={[{ label: 'Total Records', value: printRecords.length }]}>
                  <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold">
                        <th className="border border-slate-300 p-2">ID</th><th className="border border-slate-300 p-2">Student</th><th className="border border-slate-300 p-2">From Batch</th><th className="border border-slate-300 p-2">To Batch</th><th className="border border-slate-300 p-2">Status</th><th className="border border-slate-300 p-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printRecords.map((r) => (
                        <tr key={r.id}>
                          <td className="border border-slate-300 p-2 font-mono">{r.id}</td><td className="border border-slate-300 p-2 font-bold">{r.studentName}</td><td className="border border-slate-300 p-2">{r.currentBatch}</td><td className="border border-slate-300 p-2">{r.targetBatch}</td><td className="border border-slate-300 p-2 font-bold">{r.status}</td><td className="border border-slate-300 p-2 font-mono">{r.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </LetterheadPrint>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoteModule;
