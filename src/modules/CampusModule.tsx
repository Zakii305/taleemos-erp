import { getCurrentUser } from '../components/auth/AuthSystem';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Plus, Printer, Download, Search, DoorOpen, Users, CheckCircle, Trash2, Edit2, CheckSquare, Square, X, CheckCircle2 } from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type CampusRoom } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';

export const CampusModule: React.FC = () => {
  const state = erpStorage.getState();
  const currentUser = getCurrentUser();
  const isParent = currentUser?.role === 'parent';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<CampusRoom[] | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Form fields
  const [building, setBuilding] = useState('Academic Block A');
  const [roomNumber, setRoomNumber] = useState('Room 103');
  const [type, setType] = useState<CampusRoom['type']>('Lecture Hall');
  const [capacity, setCapacity] = useState(50);
  const [status, setStatus] = useState<CampusRoom['status']>('Available');
  const [facilitiesStr, setFacilitiesStr] = useState('Multimedia Projector, Whiteboard, Air Conditioned');

  const totalRooms = state.campus.length;
  const totalCapacity = state.campus.reduce((sum, r) => sum + r.capacity, 0);

  const filtered = state.campus.filter((r) => {
    const matchSearch = r.roomNumber.toLowerCase().includes(search.toLowerCase()) || r.building.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || r.type === typeFilter;
    return matchSearch && matchType;
  });

  // Selection Logic
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) setSelectedIds([]);
    else setSelectedIds(filtered.map((r) => r.id));
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} selected facilities?`)) {
      selectedIds.forEach((id) => erpStorage.deleteItem('campus', id));
      setSelectedIds([]);
      setActionNotice('Selected facilities deleted.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  // Form Logic
  const resetForm = () => {
    setBuilding('Academic Block A'); setRoomNumber('Room 103'); setType('Lecture Hall');
    setCapacity(50); setStatus('Available'); setFacilitiesStr('Multimedia Projector, Whiteboard, Air Conditioned');
    setIsEditMode(false); setEditingRoomId(null);
  };

  const handleOpenEdit = (r: CampusRoom, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true);
    setEditingRoomId(r.id);
    setBuilding(r.building); setRoomNumber(r.roomNumber); setType(r.type);
    setCapacity(r.capacity); setStatus(r.status); setFacilitiesStr(r.facilities.join(', '));
    setIsAddModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) return;

    if (isEditMode && editingRoomId) {
      erpStorage.updateItem('campus', editingRoomId, {
        building, roomNumber, type, capacity: Number(capacity), status,
        facilities: facilitiesStr.split(',').map((f) => f.trim()).filter(Boolean),
      });
      setActionNotice(`Updated facility: ${roomNumber} (${building})`);
    } else {
      const newRoom: CampusRoom = {
        id: `CMP-${Date.now().toString().slice(-4)}`, building, roomNumber, type, capacity: Number(capacity), status,
        facilities: facilitiesStr.split(',').map((f) => f.trim()).filter(Boolean),
      };
      erpStorage.addItem('campus', newRoom);
      setActionNotice(`Registered facility: ${roomNumber}`);
    }
    
    setIsAddModalOpen(false); resetForm();
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this room from campus facilities?')) {
      erpStorage.deleteItem('campus', id);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      setActionNotice('Facility removed.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleTriggerPrint = (recordsToPrint: CampusRoom[]) => {
    setPrintData(recordsToPrint);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 300);
  };

  const PrintTableContent = ({ data }: { data: CampusRoom[] }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead>
        <tr className="bg-slate-100 text-slate-800 font-bold">
          <th className="border border-slate-300 p-2">Building</th>
          <th className="border border-slate-300 p-2">Room / Lab</th>
          <th className="border border-slate-300 p-2">Type</th>
          <th className="border border-slate-300 p-2 text-right">Capacity</th>
          <th className="border border-slate-300 p-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {data.map((r) => (
          <tr key={r.id}>
            <td className="border border-slate-300 p-2 font-bold">{r.building}</td>
            <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-700">{r.roomNumber}</td>
            <td className="border border-slate-300 p-2">{r.type}</td>
            <td className="border border-slate-300 p-2 text-right font-mono font-bold">{r.capacity}</td>
            <td className="border border-slate-300 p-2 font-bold">{r.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-200 print:hidden">
        {actionNotice && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span>{actionNotice}</span></div>}

        {/* Header */}
        <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-600 rounded-xl"><Building2 className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Campus & Infrastructure ERP</h1>
              <span className="px-2 py-0.5 bg-indigo-500 text-white font-black text-[10px] rounded uppercase">FACILITIES</span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">Lecture halls, computer laboratories, science wings, auditoriums, and seating capacity allocations.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIsPrintModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Facilities</button>
            <button type="button" onClick={() => { resetForm(); setIsAddModalOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"><Plus className="w-4 h-4" /> Add Room / Lab</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-slate-500 uppercase">Total Rooms & Labs</div><div className="text-2xl font-black text-slate-900 font-mono mt-1">{totalRooms} Venues</div></div>
          <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-indigo-600 uppercase">Campus Seating Capacity</div><div className="text-2xl font-black text-indigo-600 font-mono mt-1">{totalCapacity} Desks</div></div>
          <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-emerald-600 uppercase">Available Right Now</div><div className="text-2xl font-black text-emerald-600 font-mono mt-1">{state.campus.filter((r) => r.status === 'Available').length} Venues</div></div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by room name, building..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500" />
            </div>
            <button type="button" onClick={toggleSelectAll} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0">
              {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />}
              <span>Select All ({filtered.length})</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Facility Type:</span>
            {['All', 'Lecture Hall', 'Computer Lab', 'Science Lab', 'Auditorium'].map((t) => (
              <button key={t} type="button" onClick={() => setTypeFilter(t)} className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${typeFilter === t ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Floating Toolbar when selected */}
        {selectedIds.length > 0 && (
          <div className="p-3.5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg border border-indigo-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold"><span className="px-2.5 py-1 bg-indigo-500 text-white rounded-lg font-mono">{selectedIds.length}</span><span>Venues Selected</span></div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => handleTriggerPrint(state.campus.filter(r => selectedIds.includes(r.id)))} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-3.5 h-3.5" /> Print Selected</button>
              <button type="button" onClick={handleBulkDelete} className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              <button type="button" onClick={() => setSelectedIds([])} className="p-1.5 text-slate-400 hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Room Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div key={item.id} className={`p-5 rounded-[22px] border shadow-sm transition-all flex flex-col justify-between ${isSelected ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-400/40' : 'bg-white border-slate-200 hover:shadow-lg'}`}>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="p-1 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 shadow-sm" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(item.id)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                      </label>
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg">{item.building}</span>
                    </div>
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-black uppercase ${item.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Occupied' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>{item.status}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-black text-slate-900">{item.roomNumber}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{item.type}</p>
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-500 font-sans font-semibold">Max Seating Capacity:</span>
                    <span className="font-black text-indigo-700 text-sm">{item.capacity} Students</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Installed Amenities:</span>
                    <div className="flex flex-wrap gap-1">
                      {item.facilities.map((fac, i) => <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">{fac}</span>)}
                    </div>
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
      {/* ADD / EDIT ROOM MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); resetForm(); }} title={isEditMode ? 'Edit Campus Facility' : 'Register Campus Facility'} subtitle="Define room numbers, building blocks, and capacity limits" badge={isEditMode ? 'MODIFY' : 'CAMPUS INFRA'}>
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Building Block</label><input type="text" required value={building} onChange={(e) => setBuilding(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-bold" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Room / Lab Number *</label><input type="text" required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 font-bold" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Facility Type</label><select value={type} onChange={(e) => setType(e.target.value as CampusRoom['type'])} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"><option value="Lecture Hall">Lecture Hall</option><option value="Computer Lab">Computer Lab</option><option value="Science Lab">Science Lab</option><option value="Auditorium">Auditorium</option><option value="Staff Room">Staff Room</option><option value="Library">Library</option></select></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Capacity</label><input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono font-bold" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Status</label><select value={status} onChange={(e) => setStatus(e.target.value as CampusRoom['status'])} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"><option value="Available">Available</option><option value="Occupied">Occupied</option><option value="Under Maintenance">Under Maintenance</option></select></div>
          </div>
          <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Facilities (Comma separated)</label><input type="text" value={facilitiesStr} onChange={(e) => setFacilitiesStr(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg">{isEditMode ? 'Update Facility' : 'Add Facility'}</button>
          </div>
        </form>
      </Modal>

      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div><h3 className="font-bold text-base text-slate-900">Print Facilities Roster</h3><p className="text-[11px] text-slate-500">Export campus records to A4.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => handleTriggerPrint(filtered)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print Filtered</button>
                <button type="button" onClick={() => handleTriggerPrint(state.campus)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print All</button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div className="bg-white shadow-md mx-auto pointer-events-none">
                <div className="p-8">
                  <LetterheadPrint title="INSTITUTIONAL CAMPUS BUILDINGS & VENUES ROSTER" documentNo="CAMPUS-FAC-2026" summaryStats={[{ label: 'Total Venues', value: filtered.length }, { label: 'Campus Capacity', value: filtered.reduce((s, r) => s + r.capacity, 0) }]}>
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
            <LetterheadPrint title="INSTITUTIONAL CAMPUS BUILDINGS & VENUES ROSTER" documentNo="CAMPUS-FAC-2026" summaryStats={[{ label: 'Total Records', value: printData.length }]}>
              <PrintTableContent data={printData} />
            </LetterheadPrint>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default CampusModule;
