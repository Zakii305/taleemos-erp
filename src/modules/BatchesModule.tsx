import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Printer,
  Download,
  Search,
  User,
  Clock,
  DoorOpen,
  UserPlus,
  Trash2,
  Edit2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type Batch } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
import { triggerBrowserPrint, downloadElementAsPdf } from '../lib/pdf';

export const BatchesModule: React.FC = () => {
  const state = erpStorage.getState();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printBatches, setPrintBatches] = useState<Batch[]>([]);
  const [printScope, setPrintScope] = useState<'all' | 'year' | 'single' | 'selected'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Form State
  const [batchName, setBatchName] = useState('');
  const [course, setCourse] = useState('F.Sc Pre-Engineering');
  const [teacher, setTeacher] = useState('Sir Saeed Ahmed (Physics)');
  const [room, setRoom] = useState('Room 101 - Lecture Hall A');
  const [capacity, setCapacity] = useState(40);
  const [enrolled, setEnrolled] = useState(0);
  const [timing, setTiming] = useState('08:00 AM - 01:00 PM');
  const [status, setStatus] = useState<Batch['status']>('Active');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [feeStructure, setFeeStructure] = useState('PKR 4,500/Month');
  const [remarks, setRemarks] = useState('');

  const availableYears = useMemo(() => {
    const years = state.batches.map((b) => b.startDate.split('-')[0]);
    return Array.from(new Set(years)).sort().reverse();
  }, [state.batches]);

  const totalBatches = state.batches.length;
  const activeCount = state.batches.filter((b) => b.status === 'Active').length;
  const upcomingCount = state.batches.filter((b) => b.status === 'Upcoming').length;
  const totalEnrolled = state.batches.reduce((sum, b) => sum + b.enrolled, 0);
  const totalCapacity = state.batches.reduce((sum, b) => sum + b.capacity, 0);
  const overallOccupancy = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  const filtered = state.batches.filter((b) => {
    const matchSearch = b.batchName.toLowerCase().includes(search.toLowerCase()) || b.teacher.toLowerCase().includes(search.toLowerCase()) || b.room.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Selection Logic
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(b => b.id));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} selected batches?`)) {
      selectedIds.forEach(id => erpStorage.deleteItem('batches', id));
      setSelectedIds([]);
    }
  };

  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim() || !course.trim()) return;
    if (isEditMode && selectedBatch) {
      erpStorage.updateItem('batches', selectedBatch.id, { batchName, course, teacher, room, capacity: Number(capacity), enrolled: Number(enrolled), timing, status, startDate, endDate: endDate || '2027-05-30', feeStructure, remarks });
    } else {
      const newBatch: Batch = { id: `BAT-0${state.batches.length + 1}`, batchName, course, teacher, room, capacity: Number(capacity), enrolled: Number(enrolled), timing, status, startDate, endDate: endDate || '2027-05-30', feeStructure, remarks };
      erpStorage.addItem('batches', newBatch);
    }
    setIsAddModalOpen(false); setIsEditMode(false); setSelectedBatch(null); resetForm();
  };

  const resetForm = () => {
    setBatchName(''); setCapacity(40); setEnrolled(0); setRemarks('');
  };

  const handlePlusOneEnroll = (b: Batch, e: React.MouseEvent) => {
    e.stopPropagation();
    if (b.enrolled < b.capacity) erpStorage.updateItem('batches', b.id, { enrolled: b.enrolled + 1 });
    else alert(`Batch ${b.batchName} is full.`);
  };

  const handleOpenEdit = (b: Batch, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBatch(b); setIsEditMode(true);
    setBatchName(b.batchName); setCourse(b.course); setTeacher(b.teacher); setRoom(b.room); setCapacity(b.capacity); setEnrolled(b.enrolled); setTiming(b.timing); setStatus(b.status); setStartDate(b.startDate); setEndDate(b.endDate); setFeeStructure(b.feeStructure); setRemarks(b.remarks);
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this batch?')) {
      erpStorage.deleteItem('batches', id);
      if (selectedBatch?.id === id) setSelectedBatch(null);
    }
  };

  const openPrintModal = (scope: 'all' | 'year' | 'single' | 'selected', specificBatch?: Batch) => {
    setPrintScope(scope);
    if (scope === 'single' && specificBatch) setPrintBatches([specificBatch]);
    else if (scope === 'selected') setPrintBatches(state.batches.filter(b => selectedIds.includes(b.id)));
    else setPrintBatches(state.batches);
    setIsPrintModalOpen(true);
  };

  const finalPrintBatches = printBatches.filter((b) => {
    if (printScope === 'all' || printScope === 'single' || printScope === 'selected') return true;
    if (printScope === 'year') return b.startDate.startsWith(selectedYear);
    return true;
  });

  const printStats = [
    { label: 'Total Batches', value: finalPrintBatches.length },
    { label: 'Active Cohorts', value: finalPrintBatches.filter(b => b.status === 'Active').length },
    { label: 'Seats Filled', value: `${finalPrintBatches.reduce((s, b) => s + b.enrolled, 0)} / ${finalPrintBatches.reduce((s, b) => s + b.capacity, 0)}` },
    { label: 'Occupancy Rate', value: `${finalPrintBatches.reduce((s, b) => s + b.capacity, 0) > 0 ? Math.round((finalPrintBatches.reduce((s, b) => s + b.enrolled, 0) / finalPrintBatches.reduce((s, b) => s + b.capacity, 0)) * 100) : 0}%` },
  ];
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 rounded-xl"><Layers className="w-5 h-5 text-white" /></span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Batches PRO</h1>
          </div>
          <p className="text-xs text-indigo-200 mt-1">Section capacities, occupancy monitoring, faculty assignments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => openPrintModal('all')} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Bulk</button>
          <button type="button" onClick={() => { setIsEditMode(false); resetForm(); setIsAddModalOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"><Plus className="w-4 h-4" /> Add New</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-slate-500 uppercase">Total</div><div className="text-2xl font-black text-slate-900 font-mono mt-1">{totalBatches}</div></div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-emerald-600 uppercase">Active</div><div className="text-2xl font-black text-emerald-600 font-mono mt-1">{activeCount}</div></div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-blue-500 uppercase">Upcoming</div><div className="text-2xl font-black text-blue-600 font-mono mt-1">{upcomingCount}</div></div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-indigo-500 uppercase">Enrolled</div><div className="text-xl md:text-2xl font-black text-indigo-600 font-mono mt-1">{totalEnrolled} / {totalCapacity}</div></div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-purple-500 uppercase">Occupancy</div><div className="text-2xl font-black text-purple-600 font-mono mt-1">{overallOccupancy}%</div></div>
      </div>

      <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search batches..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500" />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleSelectAll} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
              {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All
            </button>
            {selectedIds.length > 0 && (
              <>
                <button type="button" onClick={() => openPrintModal('selected')} className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
                  <Printer className="w-4 h-4" /> Print Selected ({selectedIds.length})
                </button>
                <button type="button" onClick={handleBulkDelete} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {['All', 'Active', 'Upcoming', 'Completed', 'Cancelled'].map((st) => (
            <button key={st} type="button" onClick={() => setStatusFilter(st)} className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${statusFilter === st ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}`}>{st}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const occ = Math.round((item.enrolled / item.capacity) * 100);
          const isSelected = selectedIds.includes(item.id);
          return (
            <div key={item.id} onClick={() => setSelectedBatch(item)} className={`p-5 bg-white rounded-[22px] border transition-all cursor-pointer flex flex-col justify-between ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/30' : 'border-slate-200 hover:shadow-lg'}`}>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700">{item.course}</span>
                  <label className="p-1 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-200 transition flex items-center justify-center" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(item.id, e as any)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                  </label>
                </div>
                <h3 className="mt-2 text-base font-black text-slate-900">{item.batchName}</h3>
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium"><User className="w-3.5 h-3.5 text-indigo-600" /><span>{item.teacher}</span></div>
                  <div className="flex items-center gap-1.5"><DoorOpen className="w-3.5 h-3.5 text-slate-400" /><span>{item.room}</span></div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500"><Clock className="w-3.5 h-3.5 text-amber-500" /><span>{item.timing}</span></div>
                </div>
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs mb-1.5"><span className="font-semibold text-slate-500">Occupancy</span><span className="font-black text-slate-700">{item.enrolled} / {item.capacity} ({occ}%)</span></div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden"><div className={`h-full ${occ >= 100 ? 'bg-rose-500' : occ >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, occ)}%` }} /></div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-mono">{item.startDate} to {item.endDate}</span>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={(e) => handlePlusOneEnroll(item, e)} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-black rounded-lg text-[10px] flex items-center gap-1"><UserPlus className="w-3 h-3" /> +1</button>
                  <button type="button" onClick={(e) => handleOpenEdit(item, e)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={(e) => handleDelete(item.id, e)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={isEditMode ? 'Edit Batch Cohort' : 'Add New Academic Batch'} subtitle="Configure schedule, instructor assignment, and capacity quotas" badge="12 FIELDS" maxWidth="max-w-4xl">
        <form onSubmit={handleSaveBatch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Batch Name *</label><input type="text" required value={batchName} onChange={(e) => setBatchName(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Course Program *</label><select value={course} onChange={(e) => setCourse(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white">{state.courses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lead Teacher / Faculty *</label><input type="text" required value={teacher} onChange={(e) => setTeacher(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Classroom / Lab</label><input type="text" value={room} onChange={(e) => setRoom(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Student Capacity *</label><input type="number" required min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Enrolled</label><input type="number" min={0} value={enrolled} onChange={(e) => setEnrolled(Number(e.target.value))} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Class Timing *</label><input type="text" required value={timing} onChange={(e) => setTiming(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label><select value={status} onChange={(e) => setStatus(e.target.value as Batch['status'])} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white"><option value="Active">Active</option><option value="Upcoming">Upcoming</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></select></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monthly Fee Structure</label><input type="text" value={feeStructure} onChange={(e) => setFeeStructure(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Remarks</label><input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl shadow-lg">{isEditMode ? 'Update Batch' : 'Save Batch'}</button>
          </div>
        </form>
      </Modal>

      {selectedBatch && (
        <Modal isOpen={Boolean(selectedBatch)} onClose={() => setSelectedBatch(null)} title={`Batch Cohort: ${selectedBatch.batchName}`} subtitle={`${selectedBatch.course} • Lead Instructor: ${selectedBatch.teacher}`} badge={selectedBatch.status}>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-slate-400 block font-semibold">Classroom:</span><span className="font-bold text-slate-900">{selectedBatch.room}</span></div>
                <div><span className="text-slate-400 block font-semibold">Timing:</span><span className="font-mono text-slate-900 font-bold">{selectedBatch.timing}</span></div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between font-bold mb-1"><span>Enrolled Capacity</span><span className="text-indigo-600">{selectedBatch.enrolled} / {selectedBatch.capacity} ({Math.round((selectedBatch.enrolled / selectedBatch.capacity) * 100)}%)</span></div>
                <div className="text-slate-500 text-[11px]">Fee: {selectedBatch.feeStructure}</div>
              </div>
              <div><span className="text-slate-400 block font-semibold">Remarks:</span><p className="text-slate-800 italic">{selectedBatch.remarks}</p></div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button type="button" onClick={() => openPrintModal('single', selectedBatch)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Printer className="w-4 h-4" /> Print Batch Roster</button>
              <button type="button" onClick={() => setSelectedBatch(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Close</button>
            </div>
          </div>
        </Modal>
      )}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl">
            
            {/* Header - Sticky so Close button is always accessible */}
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-base text-slate-900">Print Preview</h3>
                <p className="text-[11px] text-slate-500">Configure what to include in the printable ledger.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {printScope !== 'single' && (
                  <>
                    <select value={printScope} onChange={(e) => setPrintScope(e.target.value as any)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none">
                      <option value="all">All Batches</option>
                      <option value="selected">Selected Only ({selectedIds.length})</option>
                      <option value="year">Academic Year Wise</option>
                    </select>
                    {printScope === 'year' && (
                      <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none">
                        <option value="" disabled>Select Year</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    )}
                  </>
                )}
                <button type="button" onClick={() => triggerBrowserPrint()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print</button>
                <button type="button" onClick={() => downloadElementAsPdf('batches-print-table', `Batches_${printScope}`)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Download className="w-4 h-4" /> PDF</button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>

            {/* Printable Area - Scrollable both vertically and horizontally */}
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div id="batches-print-table" className="min-w-[800px] bg-white p-8 shadow-md mx-auto">
                <LetterheadPrint title={printScope === 'single' ? "Individual Batch Roster" : "Academic Batches & Classroom Allocation Ledger"} documentNo="BATCH-LEDGER-2026" summaryStats={printStats}>
                  <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold">
                        <th className="border border-slate-300 p-2">Batch Name</th><th className="border border-slate-300 p-2">Course</th><th className="border border-slate-300 p-2">Faculty Lead</th><th className="border border-slate-300 p-2">Room</th><th className="border border-slate-300 p-2">Timing</th><th className="border border-slate-300 p-2">Enrolled / Cap</th><th className="border border-slate-300 p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finalPrintBatches.length === 0 ? (
                        <tr><td colSpan={7} className="text-center p-4 text-slate-500 italic">No batches found for this selection.</td></tr>
                      ) : (
                        finalPrintBatches.map((b) => (
                          <tr key={b.id}>
                            <td className="border border-slate-300 p-2 font-bold">{b.batchName}</td><td className="border border-slate-300 p-2">{b.course}</td><td className="border border-slate-300 p-2">{b.teacher}</td><td className="border border-slate-300 p-2">{b.room}</td><td className="border border-slate-300 p-2 font-mono">{b.timing}</td><td className="border border-slate-300 p-2 font-mono font-bold">{b.enrolled} / {b.capacity}</td><td className="border border-slate-300 p-2 font-bold">{b.status}</td>
                          </tr>
                        ))
                      )}
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
export default BatchesModule;
