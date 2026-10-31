import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Search, Plus, X, Wrench, Calendar, MapPin, DollarSign, TrendingDown, ShieldAlert, Percent, Download, Printer, Sparkles, Layers, CheckCircle2, Sliders, Clock, Trash2, Edit2, CheckSquare, Square } from 'lucide-react';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
import { Modal } from '../components/common/Modal';

export interface CampusAsset {
  id: string;
  name: string;
  category: 'Vehicle' | 'Electronics & IT' | 'Lab Equipment' | 'Campus Furniture' | 'HVAC & Solar Power';
  location: string;
  purchaseDate: string;
  originalCost: number;
  usefulLifeYears: number;
  salvageValue: number;
  depreciationMethod: 'Straight-Line' | 'Reducing-Balance';
  condition: 'Good' | 'Needs Repair' | 'Damaged' | 'Surplus';
  assignedTo: string;
}

const INITIAL_ASSETS: CampusAsset[] = [
  { id: 'AST-001', name: 'School Bus - Toyota Coaster (52 Seater)', category: 'Vehicle', location: 'Campus Parking Bay 1', purchaseDate: '2021-06-15', originalCost: 4800000, usefulLifeYears: 10, salvageValue: 800000, depreciationMethod: 'Straight-Line', condition: 'Good', assignedTo: 'Transport Department' },
  { id: 'AST-002', name: 'Interactive Smart Panels 75" 4K (Set of 6)', category: 'Electronics & IT', location: 'Senior Wing Classrooms', purchaseDate: '2023-02-10', originalCost: 1650000, usefulLifeYears: 5, salvageValue: 150000, depreciationMethod: 'Straight-Line', condition: 'Good', assignedTo: 'IT & Smart Classroom Incharge' },
  { id: 'AST-003', name: '30kW On-Grid Hybrid Solar Inverter System', category: 'HVAC & Solar Power', location: 'Main Academic Block Rooftop', purchaseDate: '2022-08-20', originalCost: 3200000, usefulLifeYears: 15, salvageValue: 400000, depreciationMethod: 'Straight-Line', condition: 'Good', assignedTo: 'Campus Facilities Head' },
  { id: 'AST-004', name: 'Advanced Optical Microscopes & Centrifuge Lab', category: 'Lab Equipment', location: 'Senior Biology & Biotech Lab', purchaseDate: '2022-11-05', originalCost: 750000, usefulLifeYears: 7, salvageValue: 80000, depreciationMethod: 'Straight-Line', condition: 'Needs Repair', assignedTo: 'Senior Science Faculty' },
  { id: 'AST-005', name: 'Ergonomic Student Dual Desks & Benches (120 Sets)', category: 'Campus Furniture', location: 'Classes 9 & 10 Wings', purchaseDate: '2020-03-12', originalCost: 960000, usefulLifeYears: 8, salvageValue: 100000, depreciationMethod: 'Straight-Line', condition: 'Good', assignedTo: 'Estate & Logistics' },
  { id: 'AST-006', name: 'High-Volume Enterprise Xerox Photocopier & Scanner', category: 'Electronics & IT', location: 'Exam Cell & Staff Room', purchaseDate: '2023-09-01', originalCost: 450000, usefulLifeYears: 4, salvageValue: 50000, depreciationMethod: 'Straight-Line', condition: 'Good', assignedTo: 'Examination Controller' },
];

export const AssetsModule: React.FC = () => {
  const [assets, setAssets] = useState<CampusAsset[]>(INITIAL_ASSETS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [depreciationMode, setDepreciationMode] = useState<'Straight-Line' | 'Reducing-Balance'>('Straight-Line');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<CampusAsset[] | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<CampusAsset['category']>('Electronics & IT');
  const [formLocation, setFormLocation] = useState('');
  const [formOriginalCost, setFormOriginalCost] = useState(150000);
  const [formUsefulLifeYears, setFormUsefulLifeYears] = useState(5);
  const [formSalvageValue, setFormSalvageValue] = useState(20000);
  const [formCondition, setFormCondition] = useState<CampusAsset['condition']>('Good');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const now = new Date();
  const calculateDepreciation = (asset: CampusAsset) => {
    const pDate = new Date(asset.purchaseDate);
    const diffTime = Math.max(0, now.getTime() - pDate.getTime());
    const ageYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    
    let currentBookValue = asset.originalCost;
    let accumulatedDepreciation = 0;
    
    if (depreciationMode === 'Straight-Line') {
      const depreciableAmount = Math.max(0, asset.originalCost - asset.salvageValue);
      const annualDepreciation = depreciableAmount / (asset.usefulLifeYears || 1);
      accumulatedDepreciation = Math.min(depreciableAmount, annualDepreciation * ageYears);
      currentBookValue = Math.max(asset.salvageValue, asset.originalCost - accumulatedDepreciation);
    } else {
      const rate = 1 - Math.pow(Math.max(0.01, asset.salvageValue / asset.originalCost), 1 / (asset.usefulLifeYears || 5));
      currentBookValue = Math.max(asset.salvageValue, asset.originalCost * Math.pow(1 - rate, ageYears));
      accumulatedDepreciation = asset.originalCost - currentBookValue;
    }
    
    const writtenOffPercentage = Math.min(100, Math.round((accumulatedDepreciation / asset.originalCost) * 100));
    const remainingUsefulLife = Math.max(0, Number((asset.usefulLifeYears - ageYears).toFixed(1)));

    return { ageYears: Number(ageYears.toFixed(1)), currentBookValue: Math.round(currentBookValue), accumulatedDepreciation: Math.round(accumulatedDepreciation), writtenOffPercentage, remainingUsefulLife };
  };

  const totalOriginalCost = assets.reduce((sum, a) => sum + a.originalCost, 0);
  const totalBookValue = assets.reduce((sum, a) => sum + calculateDepreciation(a).currentBookValue, 0);
  const totalDepreciation = totalOriginalCost - totalBookValue;
  const overallRetentionRate = totalOriginalCost > 0 ? Math.round((totalBookValue / totalOriginalCost) * 100) : 0;

  const filteredAssets = assets.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()) || a.location.toLowerCase().includes(search.toLowerCase()) || a.assignedTo.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Selection Logic
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAssets.length && filteredAssets.length > 0) setSelectedIds([]);
    else setSelectedIds(filteredAssets.map(a => a.id));
  };

  const handleBulkDelete = () => {
    if (confirm(`Remove ${selectedIds.length} selected assets from the schedule?`)) {
      setAssets(prev => prev.filter(a => !selectedIds.includes(a.id)));
      setSelectedIds([]);
      setToastMessage('Selected assets retired from ledger.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Form Logic
  const resetForm = () => {
    setFormName(''); setFormCategory('Electronics & IT'); setFormLocation(''); setFormOriginalCost(150000);
    setFormUsefulLifeYears(5); setFormSalvageValue(20000); setFormCondition('Good'); setFormAssignedTo('');
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setIsEditMode(false); setEditingAssetId(null);
  };

  const handleOpenEdit = (asset: CampusAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true); setEditingAssetId(asset.id);
    setFormName(asset.name); setFormCategory(asset.category); setFormLocation(asset.location);
    setFormOriginalCost(asset.originalCost); setFormUsefulLifeYears(asset.usefulLifeYears);
    setFormSalvageValue(asset.salvageValue); setFormCondition(asset.condition);
    setFormAssignedTo(asset.assignedTo); setFormPurchaseDate(asset.purchaseDate);
    setIsAddModalOpen(true);
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formOriginalCost <= 0) return;

    if (isEditMode && editingAssetId) {
      setAssets(prev => prev.map(a => a.id === editingAssetId ? {
        ...a, name: formName, category: formCategory, location: formLocation || 'Main Campus',
        purchaseDate: formPurchaseDate, originalCost: Number(formOriginalCost),
        usefulLifeYears: Number(formUsefulLifeYears), salvageValue: Number(formSalvageValue),
        condition: formCondition, assignedTo: formAssignedTo || 'Facilities Management',
      } : a));
      setToastMessage(`Updated asset ${formName}.`);
    } else {
      const newAsset: CampusAsset = {
        id: `AST-00${assets.length + 1}`, name: formName, category: formCategory,
        location: formLocation || 'Main Campus', purchaseDate: formPurchaseDate,
        originalCost: Number(formOriginalCost), usefulLifeYears: Number(formUsefulLifeYears),
        salvageValue: Number(formSalvageValue), depreciationMethod: depreciationMode,
        condition: formCondition, assignedTo: formAssignedTo || 'Facilities Management',
      };
      setAssets([newAsset, ...assets]);
      setToastMessage(`Capitalized asset ${newAsset.name} successfully.`);
    }
    setIsAddModalOpen(false); resetForm();
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteAsset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = assets.find((a) => a.id === id);
    if (confirm(`Remove asset ${target?.name || id}?`)) {
      setAssets(assets.filter((a) => a.id !== id));
      setSelectedIds(prev => prev.filter(i => i !== id));
      setToastMessage('Asset retired from ledger.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleTriggerPrint = (recordsToPrint: CampusAsset[]) => {
    setPrintData(recordsToPrint);
    setIsPrintModalOpen(false);
    setTimeout(() => window.print(), 300);
  };

  const PrintTableContent = ({ data }: { data: CampusAsset[] }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead>
        <tr className="bg-slate-100 text-slate-800 font-bold">
          <th className="border border-slate-300 p-2">Asset ID</th>
          <th className="border border-slate-300 p-2">Description & Custodian</th>
          <th className="border border-slate-300 p-2">Category / Location</th>
          <th className="border border-slate-300 p-2">Acquisition / Age</th>
          <th className="border border-slate-300 p-2 text-right">Original Cost</th>
          <th className="border border-slate-300 p-2 text-right">Net Book Value</th>
        </tr>
      </thead>
      <tbody>
        {data.map((asset) => {
          const dep = calculateDepreciation(asset);
          return (
            <tr key={asset.id}>
              <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-700">{asset.id}</td>
              <td className="border border-slate-300 p-2"><div className="font-bold">{asset.name}</div><div className="text-[10px] text-slate-500">{asset.assignedTo}</div></td>
              <td className="border border-slate-300 p-2">{asset.category}<div className="text-[10px] text-slate-500">{asset.location}</div></td>
              <td className="border border-slate-300 p-2 font-mono">{asset.purchaseDate}<div className="text-[10px] text-slate-500">Age: {dep.ageYears} yrs</div></td>
              <td className="border border-slate-300 p-2 text-right font-mono font-bold">PKR {asset.originalCost.toLocaleString()}</td>
              <td className="border border-slate-300 p-2 text-right font-mono font-bold text-emerald-700">PKR {dep.currentBookValue.toLocaleString()}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-200 print:hidden">
        {toastMessage && <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span>{toastMessage}</span></div>}

        {/* Header */}
        <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-600 rounded-xl"><Building2 className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Campus Assets & Depreciation</h1>
              <span className="px-2 py-0.5 bg-emerald-500 text-white font-black text-[10px] rounded uppercase">GAAP / IFRS</span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">Real-time physical asset capitalization, accumulated amortization, and dynamic book value tracking.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setIsPrintModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Schedule</button>
            <button type="button" onClick={() => { resetForm(); setIsAddModalOpen(true); }} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"><Plus className="w-4 h-4" /> Capitalize Asset</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-slate-500 uppercase">Original Capital Outlay</div><div className="text-2xl font-black text-slate-900 font-mono mt-1">PKR {totalOriginalCost.toLocaleString()}</div></div>
          <div className="p-4 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm"><div className="text-[11px] font-semibold text-emerald-700 uppercase">Current Book Value</div><div className="text-2xl font-black text-emerald-700 font-mono mt-1">PKR {totalBookValue.toLocaleString()}</div><div className="text-[11px] text-emerald-600 font-bold mt-0.5">{overallRetentionRate}% Residual Net Worth</div></div>
          <div className="p-4 bg-white rounded-2xl border border-rose-200 bg-rose-50/20 shadow-sm"><div className="text-[11px] font-semibold text-rose-700 uppercase">Accumulated Depreciation</div><div className="text-2xl font-black text-rose-700 font-mono mt-1">PKR {totalDepreciation.toLocaleString()}</div><div className="text-[11px] text-rose-600 font-bold mt-0.5">{100 - overallRetentionRate}% Total Value Amortized</div></div>
          <div className="p-4 bg-white rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-sm"><div className="text-[11px] font-semibold text-indigo-700 uppercase">Depreciation Model</div><div className="flex items-center justify-between mt-1.5"><span className="text-sm font-black text-indigo-900 font-mono">{depreciationMode}</span><button type="button" onClick={() => setDepreciationMode(depreciationMode === 'Straight-Line' ? 'Reducing-Balance' : 'Straight-Line')} className="text-[10px] font-bold px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm cursor-pointer">Switch Model</button></div></div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets by name, code (AST-001), custodian, or location..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500" />
            </div>
            <div className="flex items-center gap-2">
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer">
                <option value="All">All Categories</option><option value="Vehicle">Vehicle</option><option value="Electronics & IT">Electronics & IT</option><option value="Lab Equipment">Lab Equipment</option><option value="Campus Furniture">Campus Furniture</option><option value="HVAC & Solar Power">HVAC & Solar Power</option>
              </select>
              <button onClick={toggleSelectAll} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
                {selectedIds.length === filteredAssets.length && filteredAssets.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All
              </button>
            </div>
          </div>
        </div>

        {/* Floating Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="p-3.5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg border border-indigo-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold"><span className="px-2.5 py-1 bg-indigo-500 text-white rounded-lg font-mono">{selectedIds.length}</span><span>Assets Selected</span></div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => handleTriggerPrint(assets.filter(a => selectedIds.includes(a.id)))} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-3.5 h-3.5" /> Print Selected</button>
              <button type="button" onClick={handleBulkDelete} className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              <button type="button" onClick={() => setSelectedIds([])} className="p-1.5 text-slate-400 hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 w-10"></th>
                  <th className="py-3 px-4">Asset ID & Item</th><th className="py-3 px-4">Category & Location</th><th className="py-3 px-4">Acquisition & Age</th>
                  <th className="py-3 px-4 text-right">Original Cost</th><th className="py-3 px-4 text-right">Amortized</th><th className="py-3 px-4 text-right">Net Book Value</th>
                  <th className="py-3 px-4 text-center">Life</th><th className="py-3 px-4 text-center">Condition</th><th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredAssets.map((asset) => {
                  const dep = calculateDepreciation(asset);
                  const isSelected = selectedIds.includes(asset.id);
                  return (
                    <tr key={asset.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                      <td className="py-3.5 px-4 text-center">
                        <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(asset.id, e as any)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block">{asset.id}</div>
                        <div className="font-extrabold text-slate-900 mt-1">{asset.name}</div>
                        <div className="text-[10px] text-slate-400">Custodian: {asset.assignedTo}</div>
                      </td>
                      <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{asset.category}</span><div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /><span>{asset.location}</span></div></td>
                      <td className="py-3.5 px-4"><div className="font-mono text-slate-800">{asset.purchaseDate}</div><div className="text-[10px] text-slate-500 mt-0.5">Age: <strong>{dep.ageYears} yrs</strong></div></td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">PKR {asset.originalCost.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-rose-600 font-bold">-PKR {dep.accumulatedDepreciation.toLocaleString()}<div className="text-[10px] text-rose-500 font-normal">({dep.writtenOffPercentage}%)</div></td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 text-sm">PKR {dep.currentBookValue.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-700">{dep.remainingUsefulLife} yrs</td>
                      <td className="py-3.5 px-4 text-center"><span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${asset.condition === 'Good' ? 'bg-emerald-100 text-emerald-800' : asset.condition === 'Needs Repair' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>{asset.condition}</span></td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button type="button" onClick={(e) => handleOpenEdit(asset, e)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={(e) => handleDeleteAsset(asset.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* ADD / EDIT ASSET MODAL */}
      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); resetForm(); }} title={isEditMode ? "Edit Campus Asset" : "Capitalize New Campus Asset"} subtitle="Add infrastructure or equipment to the real-time depreciation schedule" badge={isEditMode ? "EDIT" : "CAPITAL EXPENDITURE"}>
        <form onSubmit={handleSaveAsset} className="space-y-4">
          <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Asset Title / Specification *</label><input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. 50-KVA Silent Backup Diesel Generator" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Asset Category</label><select value={formCategory} onChange={(e) => setFormCategory(e.target.value as CampusAsset['category'])} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"><option value="Electronics & IT">Electronics & IT</option><option value="Vehicle">Vehicle / Transport</option><option value="HVAC & Solar Power">HVAC & Solar Power</option><option value="Lab Equipment">Lab Equipment</option><option value="Campus Furniture">Campus Furniture</option></select></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Installation Location *</label><input type="text" required value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="e.g. Generator Yard / Ground Floor" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Original Cost (PKR) *</label><input type="number" required min={1000} value={formOriginalCost} onChange={(e) => setFormOriginalCost(Number(e.target.value))} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Useful Life (Years) *</label><input type="number" required min={1} max={50} value={formUsefulLifeYears} onChange={(e) => setFormUsefulLifeYears(Number(e.target.value))} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Salvage Value (PKR)</label><input type="number" min={0} value={formSalvageValue} onChange={(e) => setFormSalvageValue(Number(e.target.value))} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Acquisition Date *</label><input type="date" required value={formPurchaseDate} onChange={(e) => setFormPurchaseDate(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Physical Condition</label><select value={formCondition} onChange={(e) => setFormCondition(e.target.value as CampusAsset['condition'])} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"><option value="Good">Good / Operational</option><option value="Needs Repair">Needs Repair</option><option value="Damaged">Damaged</option><option value="Surplus">Surplus / Standby</option></select></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Custodian</label><input type="text" value={formAssignedTo} onChange={(e) => setFormAssignedTo(e.target.value)} placeholder="e.g. Electrical Incharge" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md">{isEditMode ? 'Update Asset' : 'Capitalize Asset'}</button>
          </div>
        </form>
      </Modal>

      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div><h3 className="font-bold text-base text-slate-900">Print Asset Schedule</h3><p className="text-[11px] text-slate-500">Export asset valuation ledger to A4.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => handleTriggerPrint(filteredAssets)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print Filtered</button>
                <button type="button" onClick={() => handleTriggerPrint(assets)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print All</button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div className="bg-white shadow-md mx-auto pointer-events-none min-w-[800px]">
                <div className="p-8">
                  <LetterheadPrint title="CAMPUS ASSET VALUATION & DEPRECIATION LEDGER" documentNo="AST-LEDGER-2026" summaryStats={[{ label: 'Original Cost', value: `PKR ${filteredAssets.reduce((s, a) => s + a.originalCost, 0).toLocaleString()}` }, { label: 'Net Book Value', value: `PKR ${filteredAssets.reduce((s, a) => s + calculateDepreciation(a).currentBookValue, 0).toLocaleString()}` }]}>
                    <PrintTableContent data={filteredAssets} />
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
            <LetterheadPrint title="CAMPUS ASSET VALUATION & DEPRECIATION LEDGER" documentNo="AST-LEDGER-2026" summaryStats={[{ label: 'Total Records', value: printData.length }, { label: 'Net Book Value', value: `PKR ${printData.reduce((s, a) => s + calculateDepreciation(a).currentBookValue, 0).toLocaleString()}` }]}>
              <PrintTableContent data={printData} />
            </LetterheadPrint>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AssetsModule;
