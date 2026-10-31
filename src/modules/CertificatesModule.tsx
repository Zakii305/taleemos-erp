import React, { useState } from 'react';
import {
  Award, Search, Printer, Download, FileText, Plus, X, Edit2, Trash2, CheckSquare, Square, CheckCircle2, Filter
} from 'lucide-react';
import { triggerBrowserPrint, downloadElementAsPdf } from '../lib/pdf';
import { Modal } from '../components/common/Modal';
import { getCurrentUser } from '../components/auth/AuthSystem';
import { CloudinaryUploader } from '../components/common/CloudinaryUploader';

type CertType = 'Bonafide' | 'Character' | 'Achievement' | 'Course Completion' | 'Transfer Certificate' | 'Merit';

type Certificate = {
  id: string;
  studentName: string;
  fatherName?: string;
  rollNo: string;
  class: string;
  type: CertType;
  issueDate: string;
  status: 'Issued' | 'Draft';
  achievement?: string;
  fileUrl?: string;
  fileName?: string;
  photoUrl?: string;
};

const INITIAL_CERTS: Certificate[] = [
  {
    id: 'CERT-001',
    studentName: 'Ahmed Ali Qasmi',
    fatherName: 'Muhammad Qasim',
    rollNo: 'TAK-26-001',
    class: 'F.Sc Pre-Engineering',
    type: 'Achievement',
    issueDate: '2026-10-15',
    status: 'Issued',
    achievement: '1st Position in All-Sindh Science & Robotics Gala',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'CERT-002',
    studentName: 'Fatima Noor',
    fatherName: 'Dr. Imtiaz Ahmed Soomro',
    rollNo: 'TAK-26-002',
    class: 'F.Sc Pre-Medical',
    type: 'Character',
    issueDate: '2026-10-18',
    status: 'Issued',
    achievement: 'Exemplary Conduct and Academic Distinction',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
];

export default function CertificatesModule() {
  const currentUser = getCurrentUser();
  const [certs, setCerts] = useState<Certificate[]>(INITIAL_CERTS);
  const [showNew, setShowNew] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
    const [printableCerts, setPrintableCerts] = useState<Certificate[]>([]);
  
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const [form, setForm] = useState({
    studentName: '', fatherName: '', rollNo: '', class: 'F.Sc Pre-Engineering',
    type: 'Bonafide' as CertType, achievement: '', fileUrl: '', fileName: '', photoUrl: '',
  });

  const uniqueClasses = Array.from(new Set(certs.map(c => c.class)));

  const filtered = certs.filter((c) => {
    const matchSearch = c.studentName.toLowerCase().includes(search.toLowerCase()) ||
      c.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === 'All' || c.class === classFilter;
    return matchSearch && matchClass;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => c.id));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Permanently delete ${selectedIds.length} selected certificates?`)) {
      setCerts(certs.filter((c) => !selectedIds.includes(c.id)));
      setSelectedIds([]);
      setNotice('Selected certificates deleted.');
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleOpenEdit = (c: Certificate, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditMode(true);
    setEditingCertId(c.id);
    setForm({ ...c, fatherName: c.fatherName || '', achievement: c.achievement || '', fileUrl: c.fileUrl || '', fileName: c.fileName || '', photoUrl: c.photoUrl || '' });
    setShowNew(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName.trim() || !form.rollNo.trim()) return;
    if (isEditMode && editingCertId) {
      setCerts(certs.map((c) => c.id === editingCertId ? { ...c, ...form } : c));
      setNotice(`Updated certificate for ${form.studentName}`);
    } else {
      const newCert: Certificate = { ...form, id: `CERT-${String(certs.length + 1).padStart(3, '0')}`, issueDate: new Date().toISOString().split('T')[0], status: 'Issued' };
      setCerts([newCert, ...certs]);
      setNotice(`Issued new ${form.type} Certificate`);
    }
    setShowNew(false); setIsEditMode(false); setEditingCertId(null);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this certificate record?')) {
      setCerts(certs.filter((c) => c.id !== id));
            setSelectedIds((prev) => prev.filter((item) => item !== id));
      setNotice('Certificate deleted.'); setTimeout(() => setNotice(null), 3000);
    }
  };

  const academyName = currentUser?.academyName || 'Taleem Academy Kandhkot';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 rounded-xl">
              <Award className="w-5 h-5 text-white" />
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Certificates & Awards</h1>
            <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded uppercase">A4 PRINT</span>
          </div>
          <p className="text-xs text-indigo-200 mt-1">
            Manage and print beautiful certificates for <strong className="text-white">{academyName}</strong>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPrintableCerts(selectedIds.length > 0 ? filtered.filter(c => selectedIds.includes(c.id)) : filtered);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print {selectedIds.length > 0 ? `Selected (${selectedIds.length})` : 'All (Class-wise)'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditMode(false); setEditingCertId(null);
              setForm({ studentName: '', fatherName: '', rollNo: '', class: 'F.Sc Pre-Engineering', type: 'Bonafide', achievement: '', fileUrl: '', fileName: '', photoUrl: '' });
              setShowNew(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-black rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Certificate</span>
          </button>
        </div>
      </div>

      {/* Toolbar - Mobile Responsive */}
      <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, roll number..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <select
              value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
              className="w-full pl-8 pr-6 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer appearance-none"
            >
              <option value="All">All Classes</option>
              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <button
            type="button" onClick={toggleSelectAll}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition shrink-0 flex-1 sm:flex-none"
          >
            {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />}
            <span>Select All</span>
          </button>
        </div>
      </div>

      {/* Floating Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg border border-indigo-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 bg-indigo-500 text-white rounded-lg font-mono">{selectedIds.length}</span>
            <span>Certificates Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPrintableCerts(filtered.filter(c => selectedIds.includes(c.id)))}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5" /> Print Selected
            </button>
            <button
              type="button" onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button onClick={() => setSelectedIds([])} className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const isSelected = selectedIds.includes(c.id);
          return (
            <div
              key={c.id} onClick={() => setPrintableCerts([c])}
              className={`p-5 rounded-[22px] border shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between ${
                isSelected ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-400/40' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox" checked={isSelected} onChange={() => toggleSelect(c.id)}
                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                    />
                    <span className="font-mono text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">{c.id}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">{c.type}</span>
                </div>
                <div className="flex items-start gap-3 mt-3">
                  {c.photoUrl && <img src={c.photoUrl} alt={c.studentName} className="w-11 h-11 rounded-xl object-cover border-2 border-indigo-200 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-[15px] text-slate-900 truncate">{c.studentName}</h3>
                    <p className="text-xs text-slate-500 font-mono">Roll: <strong className="text-indigo-700">{c.rollNo}</strong> &bull; {c.class}</p>
                  </div>
                </div>
                {c.achievement && <p className="text-[11px] mt-3 bg-amber-50 text-amber-900 px-3 py-2 rounded-xl font-medium border border-amber-200">🏆 {c.achievement}</p>}
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400 font-mono">Issued: {c.issueDate}</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={(e) => handleOpenEdit(c, e)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={(e) => handleDelete(c.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showNew && (
        <Modal isOpen={showNew} onClose={() => setShowNew(false)} title={isEditMode ? 'Edit Certificate' : 'Issue Official Certificate'} maxWidth="max-w-xl">
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block font-bold mb-1 uppercase">Student Name *</label><input required value={form.studentName} onChange={e => setForm({...form, studentName: e.target.value})} className="w-full px-3 py-2 border rounded-xl outline-none font-bold" /></div>
              <div><label className="block font-bold mb-1 uppercase">Father Name</label><input value={form.fatherName} onChange={e => setForm({...form, fatherName: e.target.value})} className="w-full px-3 py-2 border rounded-xl outline-none" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block font-bold mb-1 uppercase">Roll No *</label><input required value={form.rollNo} onChange={e => setForm({...form, rollNo: e.target.value})} className="w-full px-3 py-2 border rounded-xl outline-none font-mono" /></div>
              <div><label className="block font-bold mb-1 uppercase">Class / Program</label><input value={form.class} onChange={e => setForm({...form, class: e.target.value})} className="w-full px-3 py-2 border rounded-xl outline-none" /></div>
            </div>
            <div><label className="block font-bold mb-1 uppercase">Type *</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value as CertType})} className="w-full px-3 py-2 border rounded-xl outline-none font-bold"><option>Bonafide</option><option>Character</option><option>Achievement</option><option>Course Completion</option><option>Transfer Certificate</option><option>Merit</option></select></div>
            <div><label className="block font-bold mb-1 uppercase">Citation</label><textarea rows={2} value={form.achievement} onChange={e => setForm({...form, achievement: e.target.value})} className="w-full px-3 py-2 border rounded-xl outline-none" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <CloudinaryUploader label="Photo" value={form.photoUrl} accept="image/*" mode="image" previewShape="circle" folder="taleemos_students" onUpload={(url) => setForm(p => ({...p, photoUrl: url}))} />
              <CloudinaryUploader label="Scanned Doc" value={form.fileUrl} accept="application/pdf,image/*" mode="document" folder="taleemos_certificates" onUpload={(url, meta) => setForm(p => ({...p, fileUrl: url, fileName: meta?.name || 'doc.pdf'}))} />
            </div>
            <div className="pt-3 flex justify-end gap-2 border-t"><button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button><button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black">{isEditMode ? 'Update' : 'Issue'}</button></div>
          </form>
        </Modal>
      )}

      {/* BEAUTIFUL BULK PRINT MODAL (Responsive & Mobile Friendly) */}
      {printableCerts.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col overflow-y-auto print:static print:block print:bg-transparent print:backdrop-blur-none print:overflow-visible">
          
          {/* Top Control Bar */}
          <div className="sticky top-0 z-50 bg-slate-900 border-b border-slate-700 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md no-print">
            <div className="text-white">
              <h3 className="font-black text-sm sm:text-lg flex items-center gap-2">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400"/> 
                Print Preview ({printableCerts.length} Certificates)
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400">A4 Formatted • High Quality</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => triggerBrowserPrint()} 
                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-4 h-4"/> Print / Save PDF
              </button>
              <button 
                onClick={() => setPrintableCerts([])} 
                className="flex-1 sm:flex-none px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          {/* Scrollable Preview Area */}
          <div id="bulk-certificates-print-area" className="p-3 sm:p-8 flex flex-col items-center gap-6 sm:gap-8 bg-slate-200 print:bg-white print:p-0 print:gap-0 min-h-screen">
            {printableCerts.map((cert) => (
              <div 
                key={cert.id} 
                className="w-full max-w-[95vw] sm:max-w-[800px] lg:max-w-[210mm] bg-white shadow-2xl print:shadow-none print:w-[210mm] print:h-[297mm] print:break-after-page relative overflow-hidden flex flex-col p-3 sm:p-8 print:p-8 rounded-sm print:rounded-none"
              >
                
                {/* Ornate Double Border */}
                <div className="flex-1 border-4 sm:border-[6px] border-double border-indigo-900 p-1 sm:p-2 h-full flex flex-col">
                  <div className="flex-1 border sm:border-2 border-amber-500 p-4 sm:p-10 relative flex flex-col items-center text-center bg-gradient-to-br from-amber-50/20 via-white to-indigo-50/20">
                    
                    {/* Watermark Crest */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                       <Award className="w-48 sm:w-96 h-48 sm:h-96" />
                    </div>

                    {/* Top Logo */}
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-indigo-900 flex items-center justify-center mb-3 sm:mb-4 shadow-lg shrink-0">
                       <Award className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
                    </div>

                    <h1 className="text-lg sm:text-2xl font-black text-indigo-950 uppercase tracking-widest leading-tight px-2">{academyName}</h1>
                    <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 mb-3 print:mb-4">Affiliated with Board of Intermediate & Secondary Education</p>

                    <h2 className="text-3xl sm:text-5xl font-serif text-indigo-900 font-bold mb-1 print:mb-2">Certificate</h2>
                    <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-amber-600 mb-4 print:mb-4">Of {cert.type}</h3>

                    <p className="text-xs sm:text-sm text-slate-600 mb-2 print:mb-3 font-serif italic">This is to proudly certify that</p>

                    <h4 className="text-2xl sm:text-4xl font-black text-slate-900 border-b-2 border-slate-300 pb-1 sm:pb-2 px-4 sm:px-8 inline-block mb-3 print:mb-4 break-words leading-tight">{cert.studentName}</h4>

                    <p className="text-xs sm:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed font-serif px-2">
                      Son / Daughter of <strong className="text-slate-900">{cert.fatherName || 'Guardian'}</strong>, bearing Institutional Roll Number <strong className="text-indigo-700 font-mono">{cert.rollNo}</strong>, has successfully been enrolled in <strong className="text-slate-900">{cert.class}</strong>.
                    </p>

                    {cert.achievement && (
                      <div className="my-2 print:my-4 p-2 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-[90%] sm:max-w-xl italic font-serif text-amber-900 text-[11px] sm:text-sm">
                        "{cert.achievement}"
                      </div>
                    )}

                    <p className="text-xs sm:text-sm text-slate-700 max-w-[90%] sm:max-w-xl mx-auto leading-relaxed font-serif mt-2 print:mt-3">
                      During their tenure at our institution, their conduct, character, and academic dedication have been found to be exemplary.
                    </p>

                    {/* Signatures */}
                    <div className="mt-auto pt-6 sm:pt-10 print:pt-2 w-full flex justify-between items-end px-1 sm:px-12">
                      <div className="text-center flex flex-col items-center">
                        <div className="w-16 sm:w-32 border-b border-slate-400 mb-1 print:mb-2"></div>
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-700 uppercase">Class Incharge</p>
                      </div>

                      {/* Gold Seal */}
                      <div className="relative flex items-center justify-center w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full shadow-lg border-2 sm:border-4 border-white mb-1 print:mb-2 shrink-0">
                         <div className="absolute inset-0.5 sm:inset-1 border border-dashed border-amber-700 rounded-full"></div>
                         <Award className="w-5 h-5 sm:w-8 sm:h-8 text-amber-900 opacity-50" />
                      </div>

                      <div className="text-center flex flex-col items-center">
                        <div className="w-16 sm:w-32 border-b border-slate-400 mb-1 print:mb-2"></div>
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-700 uppercase">Principal Signature</p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { CertificatesModule };
