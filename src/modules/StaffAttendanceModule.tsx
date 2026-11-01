import { getCurrentUser } from '../components/auth/AuthSystem';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { UserCheck, Plus, Printer, Download, Clock, LogIn, LogOut, CheckCircle, AlertCircle, Edit2, Trash2, CheckSquare, Square, X } from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type StaffAttendanceRecord } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';

export const StaffAttendanceModule: React.FC = () => {
  const state = erpStorage.getState();
  const currentUser = getCurrentUser();
  const isParent = currentUser?.role === 'parent';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Print State
  const [printData, setPrintData] = useState<StaffAttendanceRecord[] | null>(null);

  // Form State
  const [staffName, setStaffName] = useState('Prof. Ghulam Rasool');
  const [staffId, setStaffId] = useState('STF-01');
  const [role, setRole] = useState('Director / Senior Physics Faculty');
  const [checkIn, setCheckIn] = useState('08:00 AM');
  const [checkOut, setCheckOut] = useState('03:30 PM');
  const [status, setStatus] = useState<StaffAttendanceRecord['status']>('Present');
  const [overtimeHours, setOvertimeHours] = useState(0);

  const filtered = state.staffAttendance;

  // Selection Logic
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) setSelectedIds([]);
    else setSelectedIds(filtered.map(s => s.id));
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} staff records?`)) {
      selectedIds.forEach(id => erpStorage.deleteItem('staffAttendance', id));
      setSelectedIds([]);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this staff attendance record?')) {
      erpStorage.deleteItem('staffAttendance', id);
    }
  };

  // Form Logic
  const resetForm = () => {
    setEditingId(null);
    setStaffName('Prof. Ghulam Rasool'); setStaffId('STF-01'); setRole('Director / Senior Physics Faculty');
    setCheckIn('08:00 AM'); setCheckOut('03:30 PM'); setStatus('Present'); setOvertimeHours(0);
  };

  const openEditModal = (record: StaffAttendanceRecord) => {
    setEditingId(record.id);
    setStaffName(record.staffName); setStaffId(record.staffId); setRole(record.role);
    setCheckIn(record.checkIn); setCheckOut(record.checkOut); setStatus(record.status); setOvertimeHours(record.overtimeHours);
    setIsLogModalOpen(true);
  };

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      erpStorage.updateItem('staffAttendance', editingId, {
        staffName, staffId, role, checkIn, checkOut, status, overtimeHours: Number(overtimeHours)
      });
    } else {
      const newRecord: StaffAttendanceRecord = {
        id: `SA-${Date.now().toString().slice(-4)}`, date: selectedDate,
        staffName, staffId, role, checkIn, checkOut, status, overtimeHours: Number(overtimeHours),
      };
      erpStorage.addItem('staffAttendance', newRecord);
    }
    setIsLogModalOpen(false);
    resetForm();
  };

  const handleTriggerPrint = (recordsToPrint: StaffAttendanceRecord[]) => {
    setPrintData(recordsToPrint);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 300);
  };

  // Reusable Print Table
  const PrintTableContent = ({ data }: { data: StaffAttendanceRecord[] }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead>
        <tr className="bg-slate-100 text-slate-800 font-bold">
          <th className="border border-slate-300 p-2">Staff ID</th><th className="border border-slate-300 p-2">Name</th>
          <th className="border border-slate-300 p-2">Designation</th><th className="border border-slate-300 p-2">Check-In</th>
          <th className="border border-slate-300 p-2">Check-Out</th><th className="border border-slate-300 p-2">Overtime</th>
          <th className="border border-slate-300 p-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {data.map((s) => (
          <tr key={s.id}>
            <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-700">{s.staffId}</td>
            <td className="border border-slate-300 p-2 font-bold">{s.staffName}</td>
            <td className="border border-slate-300 p-2">{s.role}</td>
            <td className="border border-slate-300 p-2 font-mono">{s.checkIn}</td>
            <td className="border border-slate-300 p-2 font-mono">{s.checkOut}</td>
            <td className="border border-slate-300 p-2 font-mono">{s.overtimeHours > 0 ? `+${s.overtimeHours} hrs` : '-'}</td>
            <td className="border border-slate-300 p-2 font-bold">{s.status}</td>
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
              <span className="p-2 bg-indigo-600 rounded-xl"><UserCheck className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Staff & Faculty Attendance</h1>
              <span className="px-2 py-0.5 bg-indigo-500 text-white font-black text-[10px] rounded uppercase">BIOMETRIC LOGS</span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">Faculty check-in & check-out logs, punctuality metrics, late arrivals, and overtime calculations.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => { resetForm(); setIsPrintModalOpen(true); }} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Staff Ledger</button>
            <button onClick={() => { resetForm(); setIsLogModalOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"><Plus className="w-4 h-4" /> Log Biometric Entry</button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={toggleSelectAll} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
              {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All
            </button>
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"><Trash2 className="w-4 h-4" /> Delete ({selectedIds.length})</button>
            )}
          </div>
          {selectedIds.length > 0 && (
            <button onClick={() => handleTriggerPrint(filtered.filter(s => selectedIds.includes(s.id)))} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md"><Printer className="w-4 h-4" /> Print Selected</button>
          )}
        </div>

        {/* Staff Log Table */}
        <div className="p-6 bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3 w-10"><input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" /></th>
                <th className="p-3">Staff ID</th><th className="p-3">Staff / Faculty Name</th><th className="p-3">Designation</th>
                <th className="p-3">Check In</th><th className="p-3">Check Out</th><th className="p-3">Overtime</th><th className="p-3 text-center">Status</th><th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr key={item.id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                    <td className="p-3 text-center">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(item.id)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                    </td>
                    <td className="p-3 font-mono font-bold text-indigo-700">{item.staffId}</td>
                    <td className="p-3 font-bold text-slate-900">{item.staffName}</td>
                    <td className="p-3 text-slate-600">{item.role}</td>
                    <td className="p-3 font-mono text-emerald-700 font-bold">{item.checkIn}</td>
                    <td className="p-3 font-mono text-indigo-700 font-bold">{item.checkOut}</td>
                    <td className="p-3 font-mono text-slate-700">{item.overtimeHours > 0 ? `+${item.overtimeHours} hrs` : '-'}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${item.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Late' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>{item.status}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => openEditModal(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => handleDelete(item.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-lg" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOG / EDIT MODAL */}
      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title={editingId ? "Edit Staff Attendance" : "Log Staff Check-In / Out Entry"} subtitle="Record faculty presence or manual biometric override" badge={editingId ? "EDIT" : "FACULTY LOG"}>
        <form onSubmit={handleSaveAttendance} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Staff Member</label><input type="text" required value={staffName} onChange={(e) => setStaffName(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Staff ID</label><input type="text" value={staffId} onChange={(e) => setStaffId(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Check In Time</label><input type="text" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Check Out Time</label><input type="text" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label><select value={status} onChange={(e) => setStatus(e.target.value as StaffAttendanceRecord['status'])} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"><option value="Present">Present</option><option value="Late">Late</option><option value="Absent">Absent</option><option value="On Leave">On Leave</option></select></div>
          </div>
          <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Overtime Hours Worked</label><input type="number" step="0.5" min={0} value={overtimeHours} onChange={(e) => setOvertimeHours(Number(e.target.value))} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono" /></div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsLogModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg">{editingId ? 'Update Entry' : 'Log Entry'}</button>
          </div>
        </form>
      </Modal>
      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div><h3 className="font-bold text-base text-slate-900">Staff Ledger Preview</h3><p className="text-[11px] text-slate-500">Export timecards to A4.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => handleTriggerPrint(filtered)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print All</button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div className="bg-white shadow-md mx-auto pointer-events-none">
                <div className="p-8">
                  <LetterheadPrint title="FACULTY & ADMINISTRATIVE STAFF DAILY TIMECARD" documentNo="STF-TIMECARD-2026" summaryStats={[{ label: 'Staff Logged', value: filtered.length }, { label: 'Present Today', value: filtered.filter((s) => s.status === 'Present').length }]}>
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
            <LetterheadPrint title="FACULTY & ADMINISTRATIVE STAFF DAILY TIMECARD" documentNo="STF-TIMECARD-2026" summaryStats={[{ label: 'Staff Logged', value: printData.length }, { label: 'Present', value: printData.filter((s) => s.status === 'Present').length }]}>
              <PrintTableContent data={printData} />
            </LetterheadPrint>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default StaffAttendanceModule;
