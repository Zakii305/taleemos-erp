import React, { useState, useEffect } from 'react';
import { Search, User, BookOpen, Receipt, School, ArrowRight, X, Calendar as CalendarIcon } from 'lucide-react';
import { erpStorage } from '../../lib/storage';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (modulePath: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const state = erpStorage.getState();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingStudents = q
    ? state.students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q) ||
          s.fatherName.toLowerCase().includes(q)
      )
    : [];

  const matchingAdmissions = q
    ? state.admissions.filter(
        (a) =>
          a.studentName.toLowerCase().includes(q) ||
          a.receiptNo.toLowerCase().includes(q) ||
          a.phone.toLowerCase().includes(q)
      )
    : [];

  const matchingCourses = q
    ? state.courses.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q)
      )
    : [];

  const matchingFees = q
    ? state.fees.filter(
        (f) =>
          f.voucherNo.toLowerCase().includes(q) ||
          f.studentName.toLowerCase().includes(q) ||
          f.rollNo.toLowerCase().includes(q)
      )
    : [];

  const matchingBooks = q
    ? state.library.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.isbn.toLowerCase().includes(q)
      )
    : [];

  const matchingCalendarEvents = q
    ? (state.calendarEvents || []).filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q) ||
          (e.location && e.location.toLowerCase().includes(q)) ||
          (e.classBatch && e.classBatch.toLowerCase().includes(q))
      )
    : [];

  const totalResults =
    matchingStudents.length +
    matchingAdmissions.length +
    matchingCourses.length +
    matchingFees.length +
    matchingBooks.length +
    matchingCalendarEvents.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 no-print overscroll-contain touch-pan-y">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[80vh] overscroll-contain">
        {/* Search Input Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-indigo-600" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, admissions, fee vouchers, courses, books... (Ctrl+K)"
            className="flex-1 bg-transparent text-sm md:text-base text-slate-800 placeholder-slate-400 outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-mono font-bold rounded">
            ESC
          </span>
        </div>

        {/* Results list */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 overscroll-contain touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
          {!query ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="text-sm font-semibold">Type anything to search across TaleemOS Hub</p>
              <p className="text-xs text-slate-400 mt-1">Try student names, receipt numbers, courses, or vouchers</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-semibold">No records found matching "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Check spelling or search by roll number</p>
            </div>
          ) : (
            <>
              {/* Students */}
              {matchingStudents.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    Students ({matchingStudents.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchingStudents.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          onNavigate('students');
                          onClose();
                        }}
                        className="p-3 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{s.name}</div>
                            <div className="text-xs text-slate-500 font-mono">
                              Roll: {s.rollNo} &bull; S/O {s.fatherName} &bull; {s.classBatch}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admissions */}
              {matchingAdmissions.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-emerald-600" />
                    Admissions ({matchingAdmissions.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchingAdmissions.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => {
                          onNavigate('admissions');
                          onClose();
                        }}
                        className="p-3 bg-slate-50 hover:bg-emerald-50/60 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900">{a.studentName}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            {a.receiptNo} &bull; {a.course} &bull; Net Fee: PKR {a.netFee}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fees */}
              {matchingFees.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-amber-600" />
                    Fee Vouchers ({matchingFees.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchingFees.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => {
                          onNavigate('fees');
                          onClose();
                        }}
                        className="p-3 bg-slate-50 hover:bg-amber-50/60 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            {f.studentName} &bull; {f.month}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            Voucher: {f.voucherNo} &bull; PKR {f.netPayable} ({f.paymentMethod})
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                          {f.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses */}
              {matchingCourses.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    Courses ({matchingCourses.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchingCourses.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onNavigate('courses');
                          onClose();
                        }}
                        className="p-3 bg-slate-50 hover:bg-purple-50/60 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900">{c.name}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            Code: {c.code} &bull; {c.duration} &bull; PKR {c.fee}/mo
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Academic Calendar Events & Exams */}
              {matchingCalendarEvents.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                    Academic Calendar & Exams ({matchingCalendarEvents.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchingCalendarEvents.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => {
                          onNavigate('calendar');
                          onClose();
                        }}
                        className="p-3 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900">{ev.title}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            {ev.date} &bull; [{ev.type}] {ev.location ? `&bull; ${ev.location}` : ''}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-800">
                          {ev.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
