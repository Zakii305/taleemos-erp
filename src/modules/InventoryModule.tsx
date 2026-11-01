import { getCurrentUser } from '../components/auth/AuthSystem';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Package, Plus, Printer, Download, Search, AlertTriangle, ArrowUpRight, ArrowDownLeft, Trash2, Edit2, CheckSquare, Square, X, CheckCircle2 } from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type InventoryItem } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';

export const InventoryModule: React.FC = () => {
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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<InventoryItem[] | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('Stationery');
  const [currentStock, setCurrentStock] = useState(50);
  const [minimumThreshold, setMinimumThreshold] = useState(20);
  const [unit, setUnit] = useState('Pieces');
  const [costPerUnit, setCostPerUnit] = useState(150);
  const [location, setLocation] = useState('Main Store Cupboard B');

  const filtered = state.inventory.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.location.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || item.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const lowStockItems = state.inventory.filter((i) => i.currentStock <= i.minimumThreshold);

  // Selection Logic
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) setSelectedIds([]);
    else setSelectedIds(filtered.map((i) => i.id));
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} selected inventory items?`)) {
      selectedIds.forEach((id) => erpStorage.deleteItem('inventory', id));
      setSelectedIds([]);
      setActionNotice('Selected items deleted.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  // Form Logic
  const resetForm = () => {
    setName(''); setCategory('Stationery'); setCurrentStock(50); setMinimumThreshold(20);
    setUnit('Pieces'); setCostPerUnit(150); setLocation('Main Store Cupboard B');
    setIsEditMode(false); setEditingItemId(null);
  };

  const handleOpenEdit = (item: InventoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true); setEditingItemId(item.id);
    setName(item.name); setCategory(item.category); setCurrentStock(item.currentStock);
    setMinimumThreshold(item.minimumThreshold); setUnit(item.unit); setCostPerUnit(item.costPerUnit); setLocation(item.location);
    setIsAddModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditMode && editingItemId) {
      erpStorage.updateItem('inventory', editingItemId, {
        name, category, currentStock: Number(currentStock), minimumThreshold: Number(minimumThreshold),
        unit, costPerUnit: Number(costPerUnit), location, lastUpdated: new Date().toISOString().split('T')[0],
      });
      setActionNotice(`Updated inventory item: ${name}`);
    } else {
      const newItem: InventoryItem = {
        id: `INV-${Date.now().toString().slice(-4)}`, name, category, currentStock: Number(currentStock),
        minimumThreshold: Number(minimumThreshold), unit, costPerUnit: Number(costPerUnit),
        location, lastUpdated: new Date().toISOString().split('T')[0],
      };
      erpStorage.addItem('inventory', newItem);
      setActionNotice(`Stocked in item: ${name}`);
    }
    setIsAddModalOpen(false); resetForm();
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleStockAdjust = (id: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = state.inventory.find((i) => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, item.currentStock + delta);
    erpStorage.updateItem('inventory', id, { currentStock: newStock, lastUpdated: new Date().toISOString().split('T')[0] });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this inventory item?')) {
      erpStorage.deleteItem('inventory', id);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      setActionNotice('Item removed from inventory.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleTriggerPrint = (recordsToPrint: InventoryItem[]) => {
    setPrintData(recordsToPrint);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 300);
  };

  const PrintTableContent = ({ data }: { data: InventoryItem[] }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead>
        <tr className="bg-slate-100 text-slate-800 font-bold">
          <th className="border border-slate-300 p-2">Item Name</th>
          <th className="border border-slate-300 p-2">Category</th>
          <th className="border border-slate-300 p-2">Location</th>
          <th className="border border-slate-300 p-2 text-right">Current Stock</th>
          <th className="border border-slate-300 p-2 text-right">Threshold</th>
          <th className="border border-slate-300 p-2 text-right">Unit Price</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            <td className="border border-slate-300 p-2 font-bold">{item.name}</td>
            <td className="border border-slate-300 p-2">{item.category}</td>
            <td className="border border-slate-300 p-2">{item.location}</td>
            <td className="border border-slate-300 p-2 text-right font-mono font-bold">{item.currentStock} {item.unit}</td>
            <td className="border border-slate-300 p-2 text-right font-mono text-rose-600">{item.minimumThreshold}</td>
            <td className="border border-slate-300 p-2 text-right font-mono">PKR {item.costPerUnit}</td>
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
              <span className="p-2 bg-indigo-600 rounded-xl"><Package className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Institutional Inventory & Stationery</h1>
              <span className="px-2 py-0.5 bg-indigo-500 text-white font-black text-[10px] rounded uppercase">STOCK AUDIT</span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">Stationery reams, examination answer sheets, IT hardware, lab reagents, and automated low-stock warnings.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIsPrintModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Ledger</button>
            <button type="button" onClick={() => { resetForm(); setIsAddModalOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"><Plus className="w-4 h-4" /> Stock In Item</button>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div><span className="font-bold">Low Stock Warning: </span>{lowStockItems.map((i) => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')}</div>
            </div>
            <span className="px-2.5 py-1 bg-amber-200 text-amber-900 font-bold rounded-lg shrink-0">Reorder Suggested</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items by name, category, or store location..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500" />
            </div>
            <button type="button" onClick={toggleSelectAll} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0">
              {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />}
              <span>Select All ({filtered.length})</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Category:</span>
            {['All', 'Stationery', 'IT Equipment', 'Furniture', 'Lab Consumable'].map((c) => (
              <button key={c} type="button" onClick={() => setCategoryFilter(c)} className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${categoryFilter === c ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{c}</button>
            ))}
          </div>
        </div>

        {/* Floating Toolbar */}
        {selectedIds.length > 0 && (
          <div className="p-3.5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg border border-indigo-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold"><span className="px-2.5 py-1 bg-indigo-500 text-white rounded-lg font-mono">{selectedIds.length}</span><span>Items Selected</span></div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => handleTriggerPrint(state.inventory.filter(i => selectedIds.includes(i.id)))} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-3.5 h-3.5" /> Print Selected</button>
              <button type="button" onClick={handleBulkDelete} className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              <button type="button" onClick={() => setSelectedIds([])} className="p-1.5 text-slate-400 hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Item Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const isLow = item.currentStock <= item.minimumThreshold;
            const isSelected = selectedIds.includes(item.id);
            return (
              <div key={item.id} className={`p-5 rounded-[22px] border shadow-sm transition-all flex flex-col justify-between ${isSelected ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-400/40' : 'bg-white border-slate-200 hover:shadow-lg'}`}>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <label className="p-1 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 shadow-sm" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(item.id, e as any)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                      </label>
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg">{item.category}</span>
                    </div>
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-black uppercase ${isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>{isLow ? 'Low Stock' : 'In Stock'}</span>
                  </div>
                  <h3 className="mt-2 text-base font-extrabold text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Location: {item.location}</p>
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs font-mono">
                    <div><span className="text-[10px] text-slate-400 block font-sans">Current Balance</span><span className={`text-base font-black ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>{item.currentStock} {item.unit}</span></div>
                    <div className="text-right"><span className="text-[10px] text-slate-400 block font-sans">Unit Price</span><span className="font-bold text-slate-700">PKR {item.costPerUnit}</span></div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={(e) => handleStockAdjust(item.id, 5, e)} className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[10px] flex items-center gap-0.5"><ArrowDownLeft className="w-3 h-3" /> +5 In</button>
                    <button type="button" onClick={(e) => handleStockAdjust(item.id, -5, e)} className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[10px] flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> -5 Out</button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={(e) => handleOpenEdit(item, e)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={(e) => handleDelete(item.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* ADD / EDIT ITEM MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); resetForm(); }} title={isEditMode ? 'Edit Inventory Item' : 'Stock In New Inventory Item'} subtitle="Catalog supply consumables and threshold alert limits" badge={isEditMode ? 'MODIFY' : 'INVENTORY ENTRY'}>
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Item Title *</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 font-bold" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label><select value={category} onChange={(e) => setCategory(e.target.value as InventoryItem['category'])} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"><option value="Stationery">Stationery</option><option value="IT Equipment">IT Equipment</option><option value="Furniture">Furniture</option><option value="Sports">Sports Equipment</option><option value="Lab Consumable">Lab Consumable</option></select></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quantity Stocked</label><input type="number" min={1} value={currentStock} onChange={(e) => setCurrentStock(Number(e.target.value))} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono font-bold" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Low Threshold</label><input type="number" min={1} value={minimumThreshold} onChange={(e) => setMinimumThreshold(Number(e.target.value))} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono font-bold text-rose-600" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unit of Measure</label><input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cost Per Unit (PKR)</label><input type="number" min={0} value={costPerUnit} onChange={(e) => setCostPerUnit(Number(e.target.value))} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Storage Location</label><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg">{isEditMode ? 'Update Item' : 'Catalog Inventory'}</button>
          </div>
        </form>
      </Modal>

      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div><h3 className="font-bold text-base text-slate-900">Print Stock Ledger</h3><p className="text-[11px] text-slate-500">Export inventory records to A4.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => handleTriggerPrint(filtered)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print Filtered</button>
                <button type="button" onClick={() => handleTriggerPrint(state.inventory)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print All</button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div className="bg-white shadow-md mx-auto pointer-events-none">
                <div className="p-8">
                  <LetterheadPrint title="INSTITUTIONAL ASSET & INVENTORY STOCK REPORT" documentNo="INV-AUDIT-2026" summaryStats={[{ label: 'Stock Items', value: filtered.length }, { label: 'Low Stock Alerts', value: filtered.filter(i => i.currentStock <= i.minimumThreshold).length }]}>
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
            <LetterheadPrint title="INSTITUTIONAL ASSET & INVENTORY STOCK REPORT" documentNo="INV-AUDIT-2026" summaryStats={[{ label: 'Total Records', value: printData.length }, { label: 'Low Stock', value: printData.filter(i => i.currentStock <= i.minimumThreshold).length }]}>
              <PrintTableContent data={printData} />
            </LetterheadPrint>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default InventoryModule;
