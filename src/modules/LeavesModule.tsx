import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Printer, Plus, Search, Trash2, CheckSquare, Square, CheckCircle, XCircle, Clock, Calendar, ShieldAlert } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';

interface LeaveRecord {
  id: string; applicantType: 'Staff' | 'Student'; applicantName: string; leaveType: string;
  fromDate: string; toDate: string; totalDays: number; reason: string;
  status: 'Pending' | 'Approved' | 'Rejected'; appliedDate: string; sanctionedBy?: string;
}

const INITIAL_DATA: LeaveRecord[] = [
  { id: 'LEV-101', applicantType: 'Staff', applicantName: 'Engr. Waqas Chachar', leaveType: 'Casual Leave', fromDate: '2026-10-27', toDate: '2026-10-28', totalDays: 2, reason: 'Attending IEEE AI & Cloud Summit in Karachi.', status: 'Pending', appliedDate: '2026-10-23' },
  { id: 'LEV-102', applicantType: 'Student', applicantName: 'Shahzaib Khan Bangash', leaveType: 'Sick Leave', fromDate: '2026-10-24', toDate: '2026-10-25', totalDays: 2, reason: 'Diagnosed with seasonal viral fever.', status: 'Approved', appliedDate: '2026-10-23', sanctionedBy: 'Principal Dr. Qureshi' },
];

export const LeavesModule: React.FC = () => {
  const [records, setRecords] = useState<LeaveRecord[]>(INITIAL_DATA);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LeaveRecord | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<LeaveRecord[] | null>(null);

  const [formType, setFormType] = useState<'Staff' | 'Student'>('Staff');
  const [formName, setFormName] = useState('');
  const [formLeaveType, setFormLeaveType] = useState('Casual Leave');
  const [formFrom, setFormFrom] = useState('');
  const [formTo, setFormTo] = useState('');
  const [formDays, setFormDays] = useState(1);
  const [formReason, setFormReason] = useState('');

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.applicantName.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = records.filter(r => r.status === 'Pending').length;
  const approvedCount = records.filter(r => r.status === 'Approved').length;
  const rejectedCount = records.filter(r => r.status === 'Rejected').length;

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length && filteredRecords.length > 0) setSelectedIds([]);
    else setSelectedIds(filteredRecords.map(r => r.id));
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} leave records?`)) {
      setRecords(prev => prev.filter(r => !selectedIds.includes(r.id)));
      setSelectedIds([]);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: 'Approved' | 'Rejected', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, sanctionedBy: 'Principal Office' } : r));
    if (selectedRecord?.id === id) setSelectedRecord(prev => prev ? { ...prev, status: newStatus, sanctionedBy: 'Principal Office' } : null);
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: LeaveRecord = {
      id: `LEV-${Math.floor(Math.random() * 900) + 100}`, applicantType: formType, applicantName: formName,
      leaveType: formLeaveType, fromDate: formFrom, toDate: formTo, totalDays: Number(formDays),
      reason: formReason, status: 'Pending', appliedDate: new Date().toISOString().split('T')[0],
    };
    setRecords([newRecord, ...records]);
    setIsApplyModalOpen(false);
    setFormName(''); setFormFrom(''); setFormTo(''); setFormDays(1); setFormReason('');
  };

  const handleTriggerPrint = (dataToPrint: LeaveRecord[]) => {
    setPrintData(dataToPrint);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 300);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending</span>;
      case 'Approved': return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'Rejected': return <span className="px-2.5 py-1 bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Rejected</span>;
      default: return null;
    }
  };

  const PrintTableContent = ({ data }: { data: LeaveRecord[] }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead>
        <tr className="bg-slate-100 text-slate-800 font-bold">
          <th className="border border-slate-300 p-2">ID</th><th className="border border-slate-300 p-2">Applicant</th>
          <th className="border border-slate-300 p-2">Type</th><th className="border border-slate-300 p-2">Dates</th>
          <th className="border border-slate-300 p-2 text-center">Days</th><th className="border border-slate-300 p-2 text-center">Status</th>
          <th className="border border-slate-300 p-2">Sanctioned By</th>
        </tr>
      </thead>
      <tbody>
        {data.map((r) => (
          <tr key={r.id}>
            <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-700">{r.id}</td>
            <td className="border border-slate-300 p-2 font-bold">{r.applicantName} ({r.applicantType})</td>
            <td className="border border-slate-300 p-2">{r.leaveType}</td>
            <td className="border border-slate-300 p-2 font-mono">{r.fromDate} to {r.toDate}</td>
            <td className="border border-slate-300 p-2 text-center font-mono">{r.totalDays}</td>
            <td className="border border-slate-300 p-2 text-center font-bold">{r.status}</td>
            <td className="border border-slate-300 p-2 text-[10px] italic">{r.sanctionedBy || 'Awaiting'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-200 print:hidden">
        <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-600 rounded-xl"><FileText className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Leave Management ERP</h1>
            </div>
            <p className="text-xs text-indigo-200 mt-1">Faculty & student leave applications, quota tracking.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setIsPrintModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Ledger</button>
            <button onClick={() => setIsApplyModalOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"><Plus className="w-4 h-4" /> Apply For Leave</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-300" onClick={() => setStatusFilter('All')}><div className="text-[11px] font-semibold text-slate-500 uppercase">Total Requests</div><div className="text-2xl font-black text-slate-900 font-mono mt-1">{records.length}</div></div>
          <div className={`p-4 bg-white rounded-[20px] border shadow-sm cursor-pointer hover:border-amber-300 ${statusFilter === 'Pending' ? 'border-amber-400 ring-1 ring-amber-400' : 'border-slate-200'}`} onClick={() => setStatusFilter('Pending')}><div className="text-[11px] font-semibold text-amber-600 uppercase">Pending</div><div className="text-2xl font-black text-amber-600 font-mono mt-1">{pendingCount}</div></div>
          <div className={`p-4 bg-white rounded-[20px] border shadow-sm cursor-pointer hover:border-emerald-300 ${statusFilter === 'Approved' ? 'border-emerald-400 ring-1 ring-emerald-400' : 'border-slate-200'}`} onClick={() => setStatusFilter('Approved')}><div className="text-[11px] font-semibold text-emerald-600 uppercase">Approved</div><div className="text-2xl font-black text-emerald-600 font-mono mt-1">{approvedCount}</div></div>
          <div className={`p-4 bg-white rounded-[20px] border shadow-sm cursor-pointer hover:border-rose-300 ${statusFilter === 'Rejected' ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200'}`} onClick={() => setStatusFilter('Rejected')}><div className="text-[11px] font-semibold text-rose-600 uppercase">Rejected</div><div className="text-2xl font-black text-rose-600 font-mono mt-1">{rejectedCount}</div></div>
        </div>

        <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleSelectAll} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"><Square className="w-4 h-4" /> Select All</button>
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-4 h-4" /> Delete ({selectedIds.length})</button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map(record => (
            <div key={record.id} onClick={() => setSelectedRecord(record)} className="p-5 bg-white rounded-[22px] border border-slate-200 hover:shadow-md cursor-pointer flex flex-col md:flex-row justify-between gap-4">
              <div className="flex gap-4">
                <input type="checkbox" checked={selectedIds.includes(record.id)} onChange={(e) => toggleSelect(record.id, e as any)} className="w-4 h-4 mt-1 rounded text-indigo-600 cursor-pointer" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{record.id}</span>
                    <h3 className="text-sm font-black text-slate-900">{record.applicantName}</h3>
                    {getStatusBadge(record.status)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{record.leaveType} • {record.fromDate} to {record.toDate} ({record.totalDays} days)</p>
                </div>
              </div>
              {record.status === 'Pending' && (
                <div className="flex items-center gap-2">
                  <button onClick={(e) => handleUpdateStatus(record.id, 'Approved', e)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"><CheckCircle className="w-3.5 h-3.5 inline mr-1" /> Approve</button>
                  <button onClick={(e) => handleUpdateStatus(record.id, 'Rejected', e)} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold"><XCircle className="w-3.5 h-3.5 inline mr-1" /> Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Apply For Leave">
        <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
          <input required type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Applicant Name" className="w-full px-3 py-2 border rounded-xl" />
          <div className="flex gap-4">
            <input required type="date" value={formFrom} onChange={e => setFormFrom(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
            <input required type="date" value={formTo} onChange={e => setFormTo(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
          </div>
          <textarea required value={formReason} onChange={e => setFormReason(e.target.value)} placeholder="Reason" className="w-full px-3 py-2 border rounded-xl"></textarea>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">Submit</button>
        </form>
      </Modal>

      {selectedRecord && (
        <Modal isOpen={Boolean(selectedRecord)} onClose={() => setSelectedRecord(null)} title="Leave Details">
          <div className="p-4 bg-slate-50 border rounded-xl space-y-2 text-xs">
            <p><strong>Applicant:</strong> {selectedRecord.applicantName}</p>
            <p><strong>Reason:</strong> {selectedRecord.reason}</p>
          </div>
        </Modal>
      )}

      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold">Print Preview</h3>
              <button onClick={() => handleTriggerPrint(filteredRecords)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">Print Now</button>
            </div>
            <div className="pointer-events-none overflow-auto max-h-[60vh]">
              <LetterheadPrint title="LEAVE LEDGER" documentNo="LV-2026">
                <PrintTableContent data={filteredRecords} />
              </LetterheadPrint>
            </div>
          </div>
        </div>
      )}

      {printData && createPortal(
        <div id="print-mount" className="hidden print:block w-full bg-white text-slate-900">
          <div className="print-page">
            <LetterheadPrint title="INSTITUTIONAL LEAVE REGISTER" documentNo="LEAVE-LEDGER-2026" summaryStats={[{ label: 'Total Records', value: printData.length }]}>
              <PrintTableContent data={printData} />
            </LetterheadPrint>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default LeavesModule;
