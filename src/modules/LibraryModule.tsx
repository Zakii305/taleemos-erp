import { getCurrentUser } from '../components/auth/AuthSystem';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  BookOpen, Plus, Printer, Download, Search, AlertTriangle, CheckCircle, 
  UserCheck, BookMarked, Trash2, Edit2, CheckSquare, Square, X
} from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type LibraryBook } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';

export const LibraryModule: React.FC = () => {
  const state = erpStorage.getState();
  const currentUser = getCurrentUser();
  const isParent = currentUser?.role === 'parent';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  
  
  
  

  
  
  
  
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);

  // Form State
  const [editBookId, setEditBookId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [rackNo, setRackNo] = useState('PHY-01-A');
  const [category, setCategory] = useState('Science');
  const [totalQuantity, setTotalQuantity] = useState(10);
  const [finePerDay, setFinePerDay] = useState(20);

  // Issue State
  const [issueStudentName, setIssueStudentName] = useState(state.students[0]?.name || 'Muhammad Hamza Malik');
  const [issueRollNo, setIssueRollNo] = useState(state.students[0]?.rollNo || 'TAK-26-001');
  const [issueDueDate, setIssueDueDate] = useState('2026-11-10');

  // Print State
  const [printData, setPrintData] = useState<{ mode: 'summary' | 'detailed', records: LibraryBook[] } | null>(null);

  const totalBooks = state.library.reduce((sum, b) => sum + b.totalQuantity, 0);
  const availableBooks = state.library.reduce((sum, b) => sum + b.availableQuantity, 0);
  const issuedBooks = totalBooks - availableBooks;

  const filtered = state.library.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.isbn.includes(search) ||
      b.rackNo.toLowerCase().includes(search.toLowerCase())
  );

  // Selection Logic
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length && filtered.length > 0) setSelectedIds([]);
    else setSelectedIds(filtered.map(b => b.id));
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} books from catalog?`)) {
      selectedIds.forEach(id => erpStorage.deleteItem('library', id));
      setSelectedIds([]);
    }
  };

  // Form Logic
  const openAddModal = () => {
    setEditBookId(null);
    setTitle(''); setAuthor(''); setIsbn(''); setRackNo('PHY-01-A'); setTotalQuantity(10); setFinePerDay(20);
    setIsBookModalOpen(true);
  };

  const openEditModal = (book: LibraryBook, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditBookId(book.id);
    setTitle(book.title); setAuthor(book.author); setIsbn(book.isbn); setRackNo(book.rackNo);
    setTotalQuantity(book.totalQuantity); setFinePerDay(book.finePerDay);
    setIsBookModalOpen(true);
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    if (editBookId) {
      erpStorage.updateItem('library', editBookId, {
        title, author, isbn, rackNo, category, totalQuantity: Number(totalQuantity), finePerDay: Number(finePerDay)
      });
    } else {
      const newBook: LibraryBook = {
        id: `LIB-0${state.library.length + 1}`, title, author, isbn: isbn || '978-0000000000', rackNo, category,
        totalQuantity: Number(totalQuantity), availableQuantity: Number(totalQuantity), finePerDay: Number(finePerDay),
      };
      erpStorage.addItem('library', newBook);
    }
    setIsBookModalOpen(false);
  };

  const handleConfirmIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    if (selectedBook.availableQuantity <= 0) { alert('All copies issued out.'); return; }

    const issuedRecord = { studentName: issueStudentName, rollNo: issueRollNo, issueDate: new Date().toISOString().split('T')[0], dueDate: issueDueDate };
    const currentIssued = selectedBook.issuedTo || [];
    erpStorage.updateItem('library', selectedBook.id, {
      availableQuantity: selectedBook.availableQuantity - 1, issuedTo: [...currentIssued, issuedRecord],
    });
    setIsIssueModalOpen(false); setSelectedBook(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this book entry?')) {
      erpStorage.deleteItem('library', id);
      if (selectedBook?.id === id) setSelectedBook(null);
    }
  };

  const handleTriggerPrint = (mode: 'summary' | 'detailed', records: LibraryBook[]) => {
    setPrintData({ mode, records });
    setTimeout(() => { window.print(); }, 300);
  };

  // Reusable Print Component
  const PrintContent = ({ records }: { records: LibraryBook[] }) => (
    <table className="w-full border-collapse border border-slate-300 text-left text-xs">
      <thead>
        <tr className="bg-slate-100 text-slate-800 font-bold">
          <th className="border border-slate-300 p-2">Shelf Rack</th><th className="border border-slate-300 p-2">Title</th>
          <th className="border border-slate-300 p-2">Author</th><th className="border border-slate-300 p-2">ISBN</th>
          <th className="border border-slate-300 p-2 text-center">Total</th><th className="border border-slate-300 p-2 text-center">Avail</th>
        </tr>
      </thead>
      <tbody>
        {records.map((b) => (
          <tr key={b.id}>
            <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-700">{b.rackNo}</td>
            <td className="border border-slate-300 p-2 font-bold">{b.title}</td>
            <td className="border border-slate-300 p-2">{b.author}</td>
            <td className="border border-slate-300 p-2 font-mono">{b.isbn}</td>
            <td className="border border-slate-300 p-2 text-center font-mono">{b.totalQuantity}</td>
            <td className="border border-slate-300 p-2 text-center font-mono font-bold text-emerald-700">{b.availableQuantity}</td>
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
              <span className="p-2 bg-indigo-600 rounded-xl"><BookOpen className="w-5 h-5 text-white" /></span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">Institutional Library ERP</h1>
              <span className="px-2 py-0.5 bg-indigo-500 text-white font-black text-[10px] rounded uppercase">CIRCULATION</span>
            </div>
            <p className="text-xs text-indigo-200 mt-1">Book cataloging, rack locator, circulation issues, overdue alerts, and daily fine calculations.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setIsPrintModalOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"><Printer className="w-4 h-4" /> Print Catalog</button>
            <button style={{display: (!isParent && !isTeacher && !isStudent) ? 'flex' : 'none'}} onClick={openAddModal} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer"><Plus className="w-4 h-4" /> Catalog Book</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-slate-500 uppercase">Total Volumes</div><div className="text-2xl font-black text-slate-900 font-mono mt-1">{totalBooks} Copies</div></div>
          <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-emerald-600 uppercase">Available On Shelves</div><div className="text-2xl font-black text-emerald-600 font-mono mt-1">{availableBooks} Copies</div></div>
          <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm"><div className="text-[11px] font-semibold text-indigo-600 uppercase">Currently Borrowed</div><div className="text-2xl font-black text-indigo-600 font-mono mt-1">{issuedBooks} Issued</div></div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search books by title, author, ISBN barcode, or shelf rack..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleSelectAll} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
                {selectedIds.length === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All
              </button>
              {selectedIds.length > 0 && (
                <>
                  <button onClick={() => handleTriggerPrint('summary', state.library.filter(b => selectedIds.includes(b.id)))} className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"><Printer className="w-4 h-4" /> Print ({selectedIds.length})</button>
                  <button onClick={handleBulkDelete} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"><Trash2 className="w-4 h-4" /> Delete</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Book Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div key={item.id} onClick={() => setSelectedBook(item)} className={`p-5 bg-white rounded-[22px] border transition-all cursor-pointer flex flex-col justify-between ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/30' : 'border-slate-200 hover:shadow-lg'}`}>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 font-mono text-xs font-black bg-indigo-50 text-indigo-700 rounded-lg">{item.rackNo}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">ISBN: {item.isbn}</span>
                      <label className="p-1 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-200 transition" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(item.id, e as any)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                      </label>
                    </div>
                  </div>
                  <h3 className="mt-2 text-base font-extrabold text-slate-900 leading-snug">{item.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">By {item.author}</p>
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div><span className="text-[10px] text-slate-400 uppercase block font-sans">Available</span><span className={`font-black ${item.availableQuantity > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{item.availableQuantity} of {item.totalQuantity}</span></div>
                    <div><span className="text-[10px] text-slate-400 uppercase block font-sans">Overdue Fine</span><span className="font-bold text-amber-700">PKR {item.finePerDay}/Day</span></div>
                  </div>
                  {item.issuedTo && item.issuedTo.length > 0 && (
                    <div className="mt-3 text-[11px] bg-amber-50/70 border border-amber-200/70 p-2 rounded-lg text-amber-900">
                      <span className="font-bold">Borrowed By:</span> {item.issuedTo[0].studentName} (Due: {item.issuedTo[0].dueDate})
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button style={{display: (!isParent && !isTeacher && !isStudent) ? 'flex' : 'none'}} onClick={(e) => { e.stopPropagation(); setSelectedBook(item); setIsIssueModalOpen(true); }} className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 flex items-center gap-1"><BookMarked className="w-3 h-3" /> Issue to Student</button>
                  <div style={{display: (!isParent && !isTeacher && !isStudent) ? 'flex' : 'none'}} className="flex items-center gap-1.5">
                    <button onClick={(e) => openEditModal(item, e)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => handleDelete(item.id, e)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-lg" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* ADD / EDIT MODAL */}
      <Modal isOpen={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} title={editBookId ? "Edit Library Volume" : "Catalog New Library Volume"} subtitle="Register book into accession register with shelf locator" badge={editBookId ? "EDIT" : "ACCESSION"}>
        <form onSubmit={handleSaveBook} className="space-y-4">
          <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Book Title *</label><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Full book title & edition" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Author *</label><input type="text" required value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author / Editor" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">ISBN Number</label><input type="text" value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="978-XXXXXXXXXX" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rack / Shelf Locator</label><input type="text" value={rackNo} onChange={(e) => setRackNo(e.target.value)} placeholder="e.g. PHY-02-B" className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Copies Quantity</label><input type="number" min={1} value={totalQuantity} onChange={(e) => setTotalQuantity(Number(e.target.value))} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono font-bold" /></div>
            <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fine Per Day (PKR)</label><input type="number" min={0} value={finePerDay} onChange={(e) => setFinePerDay(Number(e.target.value))} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono font-bold" /></div>
          </div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsBookModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg">{editBookId ? 'Update Volume' : 'Add to Catalog'}</button>
          </div>
        </form>
      </Modal>

      {/* ISSUE BOOK MODAL */}
      <Modal isOpen={isIssueModalOpen && Boolean(selectedBook)} onClose={() => setIsIssueModalOpen(false)} title={`Issue Book: ${selectedBook?.title}`} subtitle="Assign lending record to student roll number" badge="CIRCULATION DESK">
        <form onSubmit={handleConfirmIssue} className="space-y-4">
          <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Borrower Student *</label><select value={issueRollNo} onChange={(e) => { setIssueRollNo(e.target.value); const s = state.students.find((stu) => stu.rollNo === e.target.value); if (s) setIssueStudentName(s.name); }} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-mono">{state.students.map((s) => (<option key={s.id} value={s.rollNo}>{s.rollNo} - {s.name} ({s.classBatch})</option>))}</select></div>
          <div><label className="block text-xs font-bold text-slate-700 uppercase mb-1">Due Return Date *</label><input type="date" required value={issueDueDate} onChange={(e) => setIssueDueDate(e.target.value)} className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white" /></div>
          <div className="p-3 bg-indigo-50 rounded-xl text-xs text-indigo-900">Overdue penalty rate: <strong>PKR {selectedBook?.finePerDay}/day</strong> after due date.</div>
          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsIssueModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg">Confirm Issue</button>
          </div>
        </form>
      </Modal>

      {/* PRINT PREVIEW MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-3 rounded-t-2xl">
              <div><h3 className="font-bold text-base text-slate-900">Print Catalog Preview</h3><p className="text-[11px] text-slate-500">Export accession register to A4.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => handleTriggerPrint('summary', state.library)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md"><Printer className="w-4 h-4" /> Print All</button>
                <button type="button" onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-black shadow-sm">Close</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-200">
              <div className="bg-white shadow-md mx-auto pointer-events-none">
                <div className="p-8">
                  <LetterheadPrint title="INSTITUTIONAL CENTRAL LIBRARY ACCESSION REGISTER" documentNo="LIB-REGISTER-2026" summaryStats={[{ label: 'Total Stock', value: totalBooks }, { label: 'Available', value: availableBooks }, { label: 'Issued Out', value: issuedBooks }]}>
                    <PrintContent records={state.library} />
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
            <LetterheadPrint title="INSTITUTIONAL CENTRAL LIBRARY ACCESSION REGISTER" documentNo="LIB-REGISTER-2026" summaryStats={[{ label: 'Total Records', value: printData.records.length }]}>
              <PrintContent records={printData.records} />
            </LetterheadPrint>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default LibraryModule;
