import { getCurrentUser } from '../components/auth/AuthSystem';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileText, Printer, Plus, Search, Download, Trash2, Edit2, 
  CheckSquare, Square, X, Award, CheckCircle2
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';

interface ReportCard {
  id: string;
  rollNo: string;
  studentName: string;
  batch: string;
  grade: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  rank: number;
  remarks: string;
  examName: string;
  subjects: { name: string; total: number; obtained: number; grade: string }[];
}

const INITIAL_DATA: ReportCard[] = [
  {
    id: 'REP-101', rollNo: 'TAK-26-001', studentName: 'Muhammad Hamza Malik', batch: 'Batch 2026-A (Morning)', grade: 'A+',
    marksObtained: 442, totalMarks: 500, percentage: 88.4, rank: 2, remarks: 'Outstanding analytical skills in Mathematics and Physics.', examName: '1st Quarter Evaluation',
    subjects: [
      { name: 'Physics', total: 100, obtained: 92, grade: 'A+' }, { name: 'Mathematics', total: 100, obtained: 96, grade: 'A+' },
      { name: 'Chemistry', total: 100, obtained: 84, grade: 'A' }, { name: 'English', total: 100, obtained: 82, grade: 'A' },
      { name: 'Islamiat', total: 100, obtained: 88, grade: 'A+' },
    ]
  },
  {
    id: 'REP-102', rollNo: 'TAK-26-002', studentName: 'Dua Fatima Soomro', batch: 'Batch 2026-B (Morning)', grade: 'A+',
    marksObtained: 468, totalMarks: 500, percentage: 93.6, rank: 1, remarks: 'Class topper with consistent top percentile in all disciplines.', examName: '1st Quarter Evaluation',
    subjects: [
      { name: 'Physics', total: 100, obtained: 95, grade: 'A+' }, { name: 'Mathematics', total: 100, obtained: 98, grade: 'A+' },
      { name: 'Chemistry', total: 100, obtained: 92, grade: 'A+' }, { name: 'English', total: 100, obtained: 88, grade: 'A+' },
      { name: 'Islamiat', total: 100, obtained: 95, grade: 'A+' },
    ]
  }
];

export const ReportCardsModule: React.FC = () => {
  const [records, setRecords] = useState<ReportCard[]>(INITIAL_DATA);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [selectedRecord, setSelectedRecord] = useState<ReportCard | null>(null);
  const [isPrintLedgerOpen, setIsPrintLedgerOpen] = useState(false);
  const [ledgerRecords, setLedgerRecords] = useState<ReportCard[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'summary' | 'full'>('summary');

  const [formName, setFormName] = useState('');
  const [formRoll, setFormRoll] = useState('');
  const [formBatch, setFormBatch] = useState('');
  const [formMarks, setFormMarks] = useState('');
  const [formTotal, setFormTotal] = useState('500');
  const [formRemarks, setFormRemarks] = useState('');

  // PRINT PAYLOAD STATE
  const [printData, setPrintData] = useState<{ mode: 'single' | 'summary' | 'full', records: ReportCard[] } | null>(null);

  const handleTriggerPrint = (mode: 'single' | 'summary' | 'full', data: ReportCard[]) => {
    setPrintData({ mode, records: data });
    setTimeout(() => {
      window.print();
    }, 300); // Wait for portal to render
  };

  const filteredRecords = records.filter(r => {
    const isChildReport = r.studentName === currentUser?.name || r.rollNo === currentUser?.rollNo;
    const matchesSearch = r.studentName.toLowerCase().includes(search.toLowerCase()) || r.rollNo.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (!(isParent || isStudent) || (r.studentName && isChildReport));
  });
  const unusedFiltered = records.filter(r => 
    r.studentName.toLowerCase().includes(search.toLowerCase()) || r.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length && filteredRecords.length > 0) setSelectedIds([]);
    else setSelectedIds(filteredRecords.map(r => r.id));
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} report cards?`)) {
      setRecords(prev => prev.filter(r => !selectedIds.includes(r.id)));
      setSelectedIds([]);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this report card?')) {
      setRecords(prev => prev.filter(r => r.id !== id));
      if (selectedRecord?.id === id) setSelectedRecord(null);
    }
  };

  const openPrintLedger = (scope: 'all' | 'selected') => {
    if (scope === 'selected') setLedgerRecords(records.filter(r => selectedIds.includes(r.id)));
    else setLedgerRecords(records);
    setIsPrintLedgerOpen(true);
  };

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const marks = Number(formMarks);
    const total = Number(formTotal);
    const pct = total > 0 ? ((marks / total) * 100) : 0;
    let grade = 'F';
    if (pct >= 90) grade = 'A+'; else if (pct >= 80) grade = 'A'; else if (pct >= 70) grade = 'B'; else if (pct >= 60) grade = 'C'; else if (pct >= 50) grade = 'D';

    const newRecord: ReportCard = {
      id: `REP-${Math.floor(Math.random() * 900) + 100}`, rollNo: formRoll, studentName: formName, batch: formBatch || 'Unassigned',
      grade: grade, marksObtained: marks, totalMarks: total, percentage: Number(pct.toFixed(1)), rank: records.length + 1,
      remarks: formRemarks || 'No remarks provided.', examName: '1st Quarter Evaluation',
      subjects: [
        { name: 'Physics', total: 100, obtained: Math.floor(marks * 0.2), grade: grade }, { name: 'Mathematics', total: 100, obtained: Math.floor(marks * 0.2), grade: grade },
        { name: 'Chemistry', total: 100, obtained: Math.floor(marks * 0.2), grade: grade }, { name: 'English', total: 100, obtained: Math.floor(marks * 0.2), grade: grade },
        { name: 'Islamiat', total: 100, obtained: Math.floor(marks * 0.2), grade: grade },
      ]
    };
    setRecords([newRecord, ...records]);
    setIsCreateModalOpen(false);
    setFormName(''); setFormRoll(''); setFormBatch(''); setFormMarks(''); setFormTotal('500'); setFormRemarks('');
  };

  // Reusable Transcript Component for both Preview and Print
  const TranscriptContent = ({ data }: { data: ReportCard }) => (
    <>
      <div className="flex justify-between items-end border-b-2 border-slate-800 pb-3 mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase">{data.studentName}</h2>
          <p className="text-xs font-mono font-bold text-slate-600">Roll No: {data.rollNo} • {data.batch}</p>
          <p className="text-xs font-bold text-indigo-700 mt-1">Examination: {data.examName}</p>
        </div>
        <div className="text-right">
          <div className="inline-block px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
            <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-wider">Grade</span>
            <span className="text-2xl font-black text-indigo-700 leading-none">{data.grade}</span>
          </div>
        </div>
      </div>
      <table className="w-full border-collapse border border-slate-300 text-left text-xs mb-4">
        <thead>
          <tr className="bg-slate-100 text-slate-800 font-bold">
            <th className="border border-slate-300 p-2">Subject</th><th className="border border-slate-300 p-2 text-center">Total Marks</th><th className="border border-slate-300 p-2 text-center">Obtained</th><th className="border border-slate-300 p-2 text-center">Grade</th>
          </tr>
        </thead>
        <tbody>
          {data.subjects.map((sub, idx) => (
            <tr key={idx}>
              <td className="border border-slate-300 p-2 font-bold text-slate-800">{sub.name}</td><td className="border border-slate-300 p-2 text-center font-mono">{sub.total}</td><td className="border border-slate-300 p-2 text-center font-mono font-bold">{sub.obtained}</td><td className="border border-slate-300 p-2 text-center font-black text-indigo-700">{sub.grade}</td>
            </tr>
          ))}
          <tr className="bg-slate-50">
            <td className="border border-slate-300 p-2 font-black text-slate-900">AGGREGATE SUMMARY</td><td className="border border-slate-300 p-2 text-center font-black font-mono">{data.totalMarks}</td><td className="border border-slate-300 p-2 text-center font-black font-mono">{data.marksObtained}</td><td className="border border-slate-300 p-2 text-center font-black text-emerald-700">{data.grade} ({data.percentage}%)</td>
          </tr>
        </tbody>
      </table>
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Evaluation Remarks</span><p className="text-xs italic text-slate-800 font-medium">"{data.remarks}"</p></div>
        <div className="shrink-0 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-center"><span className="text-[10px] font-bold text-amber-600 uppercase">Institutional Standing</span><span className="block text-base font-black text-amber-700">Rank #{data.rank}</span></div>
      </div>
      <div className="mt-12 pt-4 grid grid-cols-3 gap-6 text-center text-xs">
        <div className="border-t border-slate-400 pt-2"><p className="font-bold text-slate-800">Class Incharge / Teacher</p><p className="text-[10px] text-slate-500 mt-1">Authorized Signatory</p></div>
        <div className="border-t border-slate-400 pt-2"><p className="font-bold text-slate-800">Controller of Examinations</p><p className="text-[10px] text-slate-500 mt-1">Authorized Signatory</p></div>
        <div className="border-t border-slate-400 pt-2"><p className="font-bold text-slate-800">Principal Dr. Qureshi</p><p className="text-[10px] text-slate-500 mt-1">Authorized Signatory</p></div>
      </div>
    </>
  );
  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-200 print:hidden">
        {/* Header */}
        <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-600 rounded-xl"><FileText className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Report Cards & Transcripts PRO</h1>
              <span className="px-2 py-0.5 bg-indigo-500 text-white font-black text-[10px] rounded uppercase">AUTOMATED</span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">Automated grading, percentage calculators, institutional ranks, and printable transcripts.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => openPrintLedger('all')} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Ledger</button>
            <button style={{display: (!isParent && !isTeacher && !isStudent) ? 'flex' : 'none'}} onClick={() => setIsCreateModalOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"><Plus className="w-4 h-4" /> Create Transcript</button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search report cards by student, roll number..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleSelectAll} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
                {selectedIds.length === filteredRecords.length && filteredRecords.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All
              </button>
              {selectedIds.length > 0 && (
                <>
                  <button onClick={() => openPrintLedger('selected')} className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"><Printer className="w-4 h-4" /> Print ({selectedIds.length})</button>
                  <button onClick={handleBulkDelete} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"><Trash2 className="w-4 h-4" /> Delete</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* List View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((record) => {
            const isSelected = selectedIds.includes(record.id);
            return (
              <div key={record.id} onClick={() => setSelectedRecord(record)} className={`p-5 bg-white rounded-[22px] border transition-all cursor-pointer flex flex-col justify-between ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/30' : 'border-slate-200 hover:shadow-lg'}`}>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-lg bg-indigo-50 text-indigo-700">{record.rollNo}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase bg-emerald-100 text-emerald-800">Grade: {record.grade}</span>
                      <label className="p-1 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-200 transition" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(record.id, e as any)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                      </label>
                    </div>
                  </div>
                  <h3 className="text-base font-black text-slate-900">{record.studentName}</h3>
                  <p className="text-xs text-slate-500 font-medium mb-4">{record.batch}</p>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-3">
                    <div className="text-center"><span className="block text-[10px] text-slate-400 font-bold uppercase">Marks</span><span className="text-sm font-black text-slate-800">{record.marksObtained}/{record.totalMarks}</span></div>
                    <div className="text-center border-x border-slate-200"><span className="block text-[10px] text-slate-400 font-bold uppercase">Percentage</span><span className="text-sm font-black text-indigo-600">{record.percentage}%</span></div>
                    <div className="text-center"><span className="block text-[10px] text-slate-400 font-bold uppercase">Position</span><span className="text-sm font-black text-amber-600">Rank #{record.rank}</span></div>
                  </div>
                  <p className="text-[11px] text-slate-500 italic bg-white border border-slate-100 p-2 rounded-lg">"{record.remarks}"</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{record.examName}</span>
                  <div style={{display: (!isParent && !isTeacher && !isStudent) ? 'flex' : 'none'}} className="flex items-center gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedRecord(record); }} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg" title="View Transcript"><FileText className="w-4 h-4" /></button>
                    <button onClick={(e) => handleDelete(record.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* CREATE MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Report Card" subtitle="Enter marks to auto-generate grade and percentage.">
        <form onSubmit={handleCreateRecord} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block font-bold text-slate-700 mb-1 uppercase">Student Name *</label><input required type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none font-bold" /></div>
            <div><label className="block font-bold text-slate-700 mb-1 uppercase">Roll Number *</label><input required type="text" value={formRoll} onChange={e => setFormRoll(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none font-mono" /></div>
          </div>
          <div><label className="block font-bold text-slate-700 mb-1 uppercase">Batch</label><input type="text" value={formBatch} onChange={e => setFormBatch(e.target.value)} placeholder="e.g. Batch 2026-A" className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block font-bold text-slate-700 mb-1 uppercase">Obtained Marks *</label><input required type="number" value={formMarks} onChange={e => setFormMarks(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none font-mono" /></div>
            <div><label className="block font-bold text-slate-700 mb-1 uppercase">Total Marks *</label><input required type="number" value={formTotal} onChange={e => setFormTotal(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none font-mono" /></div>
          </div>
          <div><label className="block font-bold text-slate-700 mb-1 uppercase">Remarks</label><textarea value={formRemarks} onChange={e => setFormRemarks(e.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-50 border rounded-xl outline-none"></textarea></div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black shadow-md hover:bg-indigo-700">Generate Transcript</button>
          </div>
        </form>
      </Modal>

      {/* SINGLE TRANSCRIPT PREVIEW MODAL */}
      {selectedRecord && (
        <Modal isOpen={Boolean(selectedRecord)} onClose={() => setSelectedRecord(null)} title="Official Transcript Preview" maxWidth="max-w-4xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 p-3 bg-slate-100 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-slate-600">Document Ref: {selectedRecord.id}</div>
              <div className="flex gap-2">
                <button onClick={() => handleTriggerPrint('single', [selectedRecord])} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print</button>
                <button onClick={() => setSelectedRecord(null)} className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50">Close</button>
              </div>
            </div>
            <div className="bg-slate-200 p-2 sm:p-6 overflow-auto max-h-[70vh] rounded-xl">
              <div className="bg-white shadow-xl mx-auto p-4 pointer-events-none">
                <LetterheadPrint title="OFFICIAL INSTITUTIONAL ACADEMIC TRANSCRIPT" documentNo={selectedRecord.id} summaryStats={[]}>
                  <TranscriptContent data={selectedRecord} />
                </LetterheadPrint>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* BULK PRINT PREVIEW MODAL */}
      {isPrintLedgerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div><h3 className="font-bold text-base text-slate-900">Bulk Print Preview</h3><p className="text-[11px] text-slate-500">Select format and print.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={printMode} onChange={(e) => setPrintMode(e.target.value as 'summary' | 'full')} className="px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-xs font-bold outline-none cursor-pointer">
                  <option value="summary">📊 Summary Ledger</option>
                  <option value="full">📄 Full Transcripts</option>
                </select>
                <button type="button" onClick={() => handleTriggerPrint(printMode, ledgerRecords)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print</button>
                <button type="button" onClick={() => setIsPrintLedgerOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div className="bg-white shadow-md mx-auto pointer-events-none">
                {printMode === 'summary' && (
                  <div className="p-8">
                    <LetterheadPrint title="Institutional Report Card Ledger" documentNo="LEDGER" summaryStats={[{ label: 'Total Records', value: ledgerRecords.length }]}>
                      <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800 font-bold">
                            <th className="border border-slate-300 p-2">Roll No</th><th className="border border-slate-300 p-2">Student Name</th><th className="border border-slate-300 p-2">Batch</th><th className="border border-slate-300 p-2 text-center">Marks</th><th className="border border-slate-300 p-2 text-center">Percentage</th><th className="border border-slate-300 p-2 text-center">Grade</th><th className="border border-slate-300 p-2 text-center">Rank</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledgerRecords.map((r) => (
                            <tr key={r.id}>
                              <td className="border border-slate-300 p-2 font-mono font-bold">{r.rollNo}</td><td className="border border-slate-300 p-2 font-bold">{r.studentName}</td><td className="border border-slate-300 p-2">{r.batch}</td><td className="border border-slate-300 p-2 text-center font-mono">{r.marksObtained}/{r.totalMarks}</td><td className="border border-slate-300 p-2 text-center font-mono">{r.percentage}%</td><td className="border border-slate-300 p-2 text-center font-black">{r.grade}</td><td className="border border-slate-300 p-2 text-center font-mono">#{r.rank}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </LetterheadPrint>
                  </div>
                )}
                {printMode === 'full' && (
                  <div className="space-y-8 p-8">
                    {ledgerRecords.map((r) => (
                      <div key={r.id} className="bg-white shadow-sm">
                         <LetterheadPrint title="OFFICIAL INSTITUTIONAL ACADEMIC TRANSCRIPT" documentNo={r.id} summaryStats={[]}>
                            <TranscriptContent data={r} />
                         </LetterheadPrint>
                      </div>
                    ))}
                  </div>
                )}
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
          
          {printData.mode === 'single' && printData.records[0] && (
            <div className="print-page">
              <LetterheadPrint title="OFFICIAL INSTITUTIONAL ACADEMIC TRANSCRIPT" documentNo={printData.records[0].id} summaryStats={[]}>
                <TranscriptContent data={printData.records[0]} />
              </LetterheadPrint>
            </div>
          )}

          {printData.mode === 'summary' && (
            <div className="print-page">
              <LetterheadPrint title="Institutional Report Card Ledger" documentNo={`REP-LEDGER-${new Date().getFullYear()}`} summaryStats={[{ label: 'Total Records', value: printData.records.length }]}>
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold">
                      <th className="border border-slate-300 p-2">Roll No</th><th className="border border-slate-300 p-2">Student Name</th><th className="border border-slate-300 p-2">Batch</th><th className="border border-slate-300 p-2 text-center">Marks</th><th className="border border-slate-300 p-2 text-center">Percentage</th><th className="border border-slate-300 p-2 text-center">Grade</th><th className="border border-slate-300 p-2 text-center">Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printData.records.map((r) => (
                      <tr key={r.id}>
                        <td className="border border-slate-300 p-2 font-mono font-bold">{r.rollNo}</td><td className="border border-slate-300 p-2 font-bold">{r.studentName}</td><td className="border border-slate-300 p-2">{r.batch}</td><td className="border border-slate-300 p-2 text-center font-mono">{r.marksObtained}/{r.totalMarks}</td><td className="border border-slate-300 p-2 text-center font-mono">{r.percentage}%</td><td className="border border-slate-300 p-2 text-center font-black">{r.grade}</td><td className="border border-slate-300 p-2 text-center font-mono">#{r.rank}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </LetterheadPrint>
            </div>
          )}

          {printData.mode === 'full' && printData.records.map((r) => (
            <div key={r.id} className="print-page">
              <LetterheadPrint title="OFFICIAL INSTITUTIONAL ACADEMIC TRANSCRIPT" documentNo={r.id} summaryStats={[]}>
                <TranscriptContent data={r} />
              </LetterheadPrint>
            </div>
          ))}

        </div>,
        document.body
      )}
    </>
  );
};

export default ReportCardsModule;
