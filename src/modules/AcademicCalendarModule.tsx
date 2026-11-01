import { getCurrentUser } from '../components/auth/AuthSystem';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Search, Filter, Download, Printer, Clock, MapPin, Users, GraduationCap, CalendarDays, List, Grid, CheckCircle2, AlertTriangle, Move, X, Edit2, Trash2, Share2, FileText, Tag, Building2, Sparkles, CheckSquare, Square
} from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type CalendarEvent, type CalendarEventType } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
import { triggerBrowserPrint, downloadElementAsPdf } from '../lib/pdf';

interface AcademicCalendarModuleProps {
  onNavigate?: (path: string) => void;
}

const EVENT_TYPE_CONFIG: Record<CalendarEventType, { label: string; icon: string; badgeBg: string; badgeText: string; border: string; cardBg: string; pillBg: string; }> = {
  Exam: { label: 'Exam', icon: '📝', badgeBg: 'bg-rose-50 text-rose-700 border-rose-200', badgeText: 'text-rose-700', border: 'border-rose-400', cardBg: 'bg-rose-50/70 border-rose-200', pillBg: 'bg-rose-600 text-white' },
  Holiday: { label: 'Holiday', icon: '🌴', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200', badgeText: 'text-emerald-700', border: 'border-emerald-400', cardBg: 'bg-emerald-50/70 border-emerald-200', pillBg: 'bg-emerald-600 text-white' },
  Event: { label: 'Event', icon: '🎪', badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200', badgeText: 'text-indigo-700', border: 'border-indigo-400', cardBg: 'bg-indigo-50/70 border-indigo-200', pillBg: 'bg-indigo-600 text-white' },
  Meeting: { label: 'Meeting / PTM', icon: '👥', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200', badgeText: 'text-amber-700', border: 'border-amber-400', cardBg: 'bg-amber-50/70 border-amber-200', pillBg: 'bg-amber-600 text-white' },
  Sports: { label: 'Sports', icon: '🏅', badgeBg: 'bg-teal-50 text-teal-700 border-teal-200', badgeText: 'text-teal-700', border: 'border-teal-400', cardBg: 'bg-teal-50/70 border-teal-200', pillBg: 'bg-teal-600 text-white' },
  Ceremony: { label: 'Ceremony', icon: '🎓', badgeBg: 'bg-purple-50 text-purple-700 border-purple-200', badgeText: 'text-purple-700', border: 'border-purple-400', cardBg: 'bg-purple-50/70 border-purple-200', pillBg: 'bg-purple-600 text-white' },
};

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const AcademicCalendarModule: React.FC<AcademicCalendarModuleProps> = ({ onNavigate }) => {
  const currentUser = getCurrentUser();
  const isParent = currentUser?.role === 'parent';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  
  
  
  

  const state = erpStorage.getState();
  
  
  
  
  const rawEvents = state.calendarEvents || [];

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 26));
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false); // Used for Add & Edit
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Print State
  const [printEvents, setPrintEvents] = useState<CalendarEvent[]>([]);
  const [printScope, setPrintScope] = useState<'all'|'filtered'|'selected'>('filtered');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<CalendarEventType>('Exam');
  const [formDate, setFormDate] = useState('2026-10-28');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('12:00');
  const [formLocation, setFormLocation] = useState('Exam Hall A');
  const [formAudience, setFormAudience] = useState<'All' | 'Students' | 'Faculty' | 'Parents' | 'Staff'>('Students');
  const [formClassBatch, setFormClassBatch] = useState('Batch 2026-A (Morning)');
  const [formDescription, setFormDescription] = useState('');
  const [formIsHoliday, setFormIsHoliday] = useState(false);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrev = () => setCurrentDate(viewMode === 'week' ? new Date(currentDate.setDate(currentDate.getDate() - 7)) : new Date(currentYear, currentMonth - 1, 1));
  const handleNext = () => setCurrentDate(viewMode === 'week' ? new Date(currentDate.setDate(currentDate.getDate() + 7)) : new Date(currentYear, currentMonth + 1, 1));
  const handleToday = () => setCurrentDate(new Date(2026, 9, 26));

  const filteredEvents = useMemo(() => {
    return rawEvents.filter((ev) => {
      const matchesType = typeFilter === 'All' || ev.type === typeFilter;
      const matchesSearch = search === '' || ev.title.toLowerCase().includes(search.toLowerCase()) || (ev.location && ev.location.toLowerCase().includes(search.toLowerCase())) || (ev.classBatch && ev.classBatch.toLowerCase().includes(search.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [rawEvents, typeFilter, search]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    let firstDayIndex = firstDayOfMonth.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;
    const days = [];
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      days.push({ date: d, dateStr: d.toISOString().split('T')[0], dayNum: prevMonthLastDay - i, isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(currentYear, currentMonth, i);
      days.push({ date: d, dateStr: d.toISOString().split('T')[0], dayNum: i, isCurrentMonth: true });
    }
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      days.push({ date: d, dateStr: d.toISOString().split('T')[0], dayNum: i, isCurrentMonth: false });
    }
    return days;
  }, [currentYear, currentMonth]);

  // Selection Logic
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEvents.length && filteredEvents.length > 0) setSelectedIds([]);
    else setSelectedIds(filteredEvents.map(e => e.id));
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedIds.length} selected events?`)) {
      selectedIds.forEach(id => erpStorage.deleteCalendarEvent(id));
      setSelectedIds([]);
      setToastMessage(`🗑️ Bulk deleted ${selectedIds.length} events`);
    }
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedEventId(eventId);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateStr) setDragOverDate(dateStr);
  };

  const handleDrop = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain') || draggedEventId;
    setDragOverDate(null);
    setDraggedEventId(null);
    if (eventId) {
      const targetEv = rawEvents.find((x) => x.id === eventId);
      if (targetEv && targetEv.date !== targetDate) {
        erpStorage.moveCalendarEvent(eventId, targetDate);
        setToastMessage(`✨ Rescheduled "${targetEv.title}" to ${targetDate}`);
      }
    }
  };

  // Form Logic (Add & Edit)
  const openFormModal = (dateStr: string, eventToEdit?: CalendarEvent) => {
    if (eventToEdit) {
      setEditingEventId(eventToEdit.id);
      setFormTitle(eventToEdit.title);
      setFormType(eventToEdit.type);
      setFormDate(eventToEdit.date);
      setFormEndDate(eventToEdit.endDate || '');
      setFormStartTime(eventToEdit.startTime || '09:00');
      setFormEndTime(eventToEdit.endTime || '12:00');
      setFormLocation(eventToEdit.location || '');
      setFormAudience(eventToEdit.targetAudience || 'All');
      setFormClassBatch(eventToEdit.classBatch || '');
      setFormDescription(eventToEdit.description || '');
      setFormIsHoliday(eventToEdit.isNationalHoliday || false);
    } else {
      setEditingEventId(null);
      setFormTitle('');
      setFormType('Exam');
      setFormDate(dateStr);
      setFormEndDate('');
      setFormStartTime('09:00');
      setFormEndTime('12:00');
      setFormLocation('Main Campus');
      setFormAudience('Students');
      setFormClassBatch('');
      setFormDescription('');
      setFormIsHoliday(false);
    }
    setIsFormModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const eventData: CalendarEvent = {
      id: editingEventId || `EVT-CAL-${Date.now().toString().slice(-5)}`,
      title: formTitle.trim(),
      date: formDate,
      endDate: formEndDate || undefined,
      startTime: formStartTime || undefined,
      endTime: formEndTime || undefined,
      type: formType,
      location: formLocation || undefined,
      targetAudience: formAudience,
      classBatch: formClassBatch || undefined,
      description: formDescription || undefined,
      isNationalHoliday: formType === 'Holiday' ? formIsHoliday : false,
      status: 'Confirmed',
    };

    if (editingEventId) {
      erpStorage.updateItem('calendarEvents', editingEventId, eventData);
      setToastMessage(`✏️ Updated event "${eventData.title}"`);
    } else {
      erpStorage.addCalendarEvent(eventData);
      setToastMessage(`✅ Added event "${eventData.title}"`);
    }
    setIsFormModalOpen(false);
  };

  const handleDeleteSelected = () => {
    if (!selectedEvent) return;
    if(confirm('Delete this event?')) {
      erpStorage.deleteCalendarEvent(selectedEvent.id);
      setIsDetailModalOpen(false);
      setSelectedEvent(null);
      setToastMessage(`🗑️ Deleted event`);
    }
  };

  const handleQuickShift = (daysToAdd: number) => {
    if (!selectedEvent) return;
    const cur = new Date(selectedEvent.date);
    cur.setDate(cur.getDate() + daysToAdd);
    const newDateStr = cur.toISOString().split('T')[0];
    erpStorage.moveCalendarEvent(selectedEvent.id, newDateStr);
    setSelectedEvent({ ...selectedEvent, date: newDateStr });
    setToastMessage(`Rescheduled to ${newDateStr}`);
  };

  const handleOpenPrint = (scope: 'all'|'filtered'|'selected') => {
    setPrintScope(scope);
    if (scope === 'all') setPrintEvents(rawEvents);
    else if (scope === 'selected') setPrintEvents(rawEvents.filter(e => selectedIds.includes(e.id)));
    else setPrintEvents(filteredEvents);
    setIsPrintModalOpen(true);
  };

  const handleExportICS = () => {
    let icsContent = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//TaleemOS Hub//Academic Calendar 2026//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:TaleemOS Academic Calendar'];
    filteredEvents.forEach((ev) => {
      const dtStart = ev.date.replace(/-/g, '') + (ev.startTime ? 'T' + ev.startTime.replace(/:/g, '') + '00' : '');
      const dtEnd = (ev.endDate || ev.date).replace(/-/g, '') + (ev.endTime ? 'T' + ev.endTime.replace(/:/g, '') + '00' : '');
      icsContent.push('BEGIN:VEVENT',`UID:${ev.id}@taleemos.edu.pk`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,`DTSTART:${dtStart}`,`DTEND:${dtEnd}`,`SUMMARY:[${ev.type}] ${ev.title}`,`DESCRIPTION:${ev.description || ''}`,`LOCATION:${ev.location || 'Taleem Academy'}`,'STATUS:CONFIRMED','END:VEVENT');
    });
    icsContent.push('END:VCALENDAR');
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `TaleemOS_Calendar_${currentYear}.ics`; a.click(); URL.revokeObjectURL(url);
    setToastMessage('📅 Exported .ics file!');
  };

  const monthName = currentDate.toLocaleString('en-US', { month: 'long' });
  const examCount = rawEvents.filter((e) => e.type === 'Exam').length;
  const holidayCount = rawEvents.filter((e) => e.type === 'Holiday').length;
  const eventCount = rawEvents.filter((e) => e.type === 'Event' || e.type === 'Sports' || e.type === 'Ceremony').length;
  const meetingCount = rawEvents.filter((e) => e.type === 'Meeting').length;
  return (
    <div className="space-y-5">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-indigo-500/30 flex items-center gap-3 animate-fade-in font-medium text-xs no-print">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"><Sparkles className="w-3 h-3 text-amber-300" /> Drag & Drop Interactive Calendar</span>
              <span className="text-xs text-slate-400">Term Session 2026-2027</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5"><CalendarIcon className="w-6 h-6 text-indigo-400" /> Academic Calendar & Term Milestones</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">Drag-and-drop exams, scheduled holidays, and institution events. Syncs with exam halls, parent notifications, and timetables.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => handleOpenPrint('filtered')} className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/10 transition shadow-sm cursor-pointer"><Printer className="w-3.5 h-3.5 text-indigo-300" /> Print A4</button>
            <button onClick={handleExportICS} className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/10 transition shadow-sm cursor-pointer"><Download className="w-3.5 h-3.5 text-emerald-300" /> Export .ICS</button>
            <button style={{display: (!isParent && !isTeacher) ? 'flex' : 'none'}} onClick={() => openFormModal(new Date().toISOString().split('T')[0])} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg transition active:scale-95 cursor-pointer"><Plus className="w-4 h-4" /> Add Event / Exam</button>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[{ t: 'Exam', c: examCount, l: 'Exams Scheduled', i: '📝', col: 'rose' }, { t: 'Holiday', c: holidayCount, l: 'Official Holidays', i: '🌴', col: 'emerald' }, { t: 'Event', c: eventCount, l: 'Galas & Activities', i: '🎪', col: 'indigo' }, { t: 'Meeting', c: meetingCount, l: 'PTM & Academic', i: '👥', col: 'amber' }].map(pill => (
            <div key={pill.t} onClick={() => setTypeFilter(pill.t)} className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${typeFilter === pill.t ? `bg-${pill.col}-500/20 border-${pill.col}-400 text-white` : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>
              <div className="flex items-center gap-2"><span className="text-lg">{pill.i}</span><div><p className="text-[10px] uppercase font-bold text-slate-400">{pill.l}</p><p className={`text-sm font-black text-${pill.col}-300 font-mono`}>{pill.c} {pill.t === 'Holiday' ? 'Days' : pill.t === 'Meeting' ? 'Sessions' : pill.t === 'Event' ? 'Events' : 'Tests'}</p></div></div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border">
            <button onClick={handlePrev} className="p-1.5 hover:bg-white rounded-lg text-slate-700"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={handleToday} className="px-2.5 py-1 text-xs font-bold hover:bg-white rounded-lg text-slate-700">Today</button>
            <button onClick={handleNext} className="p-1.5 hover:bg-white rounded-lg text-slate-700"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight font-mono">{monthName} {currentYear}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search event, exam..." className="pl-8 pr-3 py-1.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-500 w-36 sm:w-44 transition" />
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-transparent font-bold text-slate-700 outline-none pr-1 cursor-pointer">
              <option value="All">All Types ({rawEvents.length})</option>
              <option value="Exam">📝 Exams</option><option value="Holiday">🌴 Holidays</option><option value="Event">🎪 Events</option><option value="Meeting">👥 PTM</option><option value="Sports">🏅 Sports</option><option value="Ceremony">🎓 Ceremonies</option>
            </select>
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border text-xs">
            <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${viewMode === 'month' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600'}`}><Grid className="w-3.5 h-3.5" /> Month</button>
            <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${viewMode === 'week' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600'}`}><CalendarDays className="w-3.5 h-3.5" /> Week</button>
            <button onClick={() => setViewMode('agenda')} className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${viewMode === 'agenda' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600'}`}><List className="w-3.5 h-3.5" /> Agenda</button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (Appears when items are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 no-print">
          <div className="text-xs font-bold text-indigo-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4" /> {selectedIds.length} events selected
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleOpenPrint('selected')} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow hover:bg-indigo-700 flex items-center gap-1"><Printer className="w-3.5 h-3.5" /> Print Selected</button>
            <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow hover:bg-rose-700 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
            <button onClick={() => setSelectedIds([])} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden no-print">
          <div className="grid grid-cols-7 border-b bg-slate-50/80 text-center text-xs font-bold text-slate-500 py-3">
            {DAYS_OF_WEEK.map((d, idx) => <div key={d} className={`${idx === 5 || idx === 6 ? 'text-rose-500' : ''}`}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {calendarDays.map((cell) => {
              const dayEvents = filteredEvents.filter((ev) => ev.date === cell.dateStr);
              const isToday = cell.dateStr === '2026-10-26';
              const isDropTarget = dragOverDate === cell.dateStr;
              return (
                <div key={cell.dateStr} onDragOver={(e) => handleDragOver(e, cell.dateStr)} onDragLeave={() => setDragOverDate(null)} onDrop={(e) => handleDrop(e, cell.dateStr)} className={`min-h-[110px] md:min-h-[135px] p-2 flex flex-col justify-between transition-all group relative ${cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/60 text-slate-400'} ${isDropTarget ? 'bg-indigo-50/90 ring-2 ring-indigo-500 ring-inset scale-[1.01] z-10' : ''}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${isToday ? 'bg-indigo-600 text-white shadow-md' : cell.isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}`}>{cell.dayNum}</span>
                    <button onClick={() => openFormModal(cell.dateStr)} className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition text-xs"><Plus className="w-3 h-3" /></button>
                  </div>
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] scrollbar-none">
                    {dayEvents.map((ev) => {
                      const cfg = EVENT_TYPE_CONFIG[ev.type] || EVENT_TYPE_CONFIG.Event;
                      return (
                        <div key={ev.id} draggable onDragStart={(e) => handleDragStart(e, ev.id)} onClick={() => { setSelectedEvent(ev); setIsDetailModalOpen(true); }} className={`px-2 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-grab active:cursor-grabbing flex items-center gap-1.5 shadow-xs hover:shadow-sm select-none truncate ${cfg.cardBg} ${cfg.border} hover:scale-[1.02]`}>
                          <span className="shrink-0 text-xs">{cfg.icon}</span>
                          <span className="truncate flex-1 text-slate-800">{ev.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length === 0 && isDropTarget && <div className="border-2 border-dashed border-indigo-400 rounded-lg p-2 text-center text-[10px] text-indigo-600 font-bold bg-white/80">Drop here</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="bg-white rounded-3xl border shadow-sm p-4 overflow-x-auto no-print">
          <div className="min-w-[700px] grid grid-cols-7 gap-3">
            {DAYS_OF_WEEK.map((dName, idx) => {
              const firstDayOfWeek = new Date(currentDate);
              const day = firstDayOfWeek.getDay();
              const diff = firstDayOfWeek.getDate() - day + (day === 0 ? -6 : 1) + idx;
              const colDate = new Date(firstDayOfWeek.setDate(diff));
              const dateStr = colDate.toISOString().split('T')[0];
              const dayEvents = filteredEvents.filter((e) => e.date === dateStr);
              const isToday = dateStr === '2026-10-26';
              const isDropTarget = dragOverDate === dateStr;
              return (
                <div key={dName} onDragOver={(e) => handleDragOver(e, dateStr)} onDragLeave={() => setDragOverDate(null)} onDrop={(e) => handleDrop(e, dateStr)} className={`rounded-2xl border p-3 min-h-[360px] flex flex-col justify-between transition ${isToday ? 'bg-indigo-50/40 border-indigo-300' : 'bg-slate-50/60 border-slate-200'} ${isDropTarget ? 'ring-2 ring-indigo-500 bg-indigo-100/60' : ''}`}>
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-3 border-b">
                      <div><p className="text-xs font-bold uppercase text-slate-500">{dName}</p><p className={`text-base font-black font-mono ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>{colDate.getDate()} {colDate.toLocaleString('en-US', { month: 'short' })}</p></div>
                      <button onClick={() => openFormModal(dateStr)} className="w-6 h-6 rounded-lg bg-white border text-slate-600 hover:bg-slate-100 flex items-center justify-center text-xs"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="space-y-2">
                      {dayEvents.map((ev) => {
                        const cfg = EVENT_TYPE_CONFIG[ev.type] || EVENT_TYPE_CONFIG.Event;
                        return (
                          <div key={ev.id} draggable onDragStart={(e) => handleDragStart(e, ev.id)} onClick={() => { setSelectedEvent(ev); setIsDetailModalOpen(true); }} className={`p-2.5 rounded-xl border text-xs font-medium cursor-grab shadow-xs ${cfg.cardBg} ${cfg.border}`}>
                            <div className="flex items-center gap-1.5 mb-1"><span>{cfg.icon}</span><span className="font-bold text-slate-900 truncate">{ev.title}</span></div>
                            {ev.startTime && <p className="text-[10px] text-slate-600 flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" />{ev.startTime} - {ev.endTime || 'End'}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-3xl border shadow-sm p-5 space-y-4 no-print">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h3 className="font-black text-base text-slate-900">Term Chronological Agenda ({filteredEvents.length} Events)</h3>
              <p className="text-xs text-slate-500">Select events using checkboxes to perform bulk actions.</p>
            </div>
            <button onClick={toggleSelectAll} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition">
              {selectedIds.length === filteredEvents.length && filteredEvents.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />} Select All
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredEvents.slice().sort((a, b) => a.date.localeCompare(b.date)).map((ev) => {
              const cfg = EVENT_TYPE_CONFIG[ev.type] || EVENT_TYPE_CONFIG.Event;
              const isSelected = selectedIds.includes(ev.id);
              return (
                <div key={ev.id} onClick={() => { setSelectedEvent(ev); setIsDetailModalOpen(true); }} className={`py-3.5 px-3 rounded-2xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'}`}>
                  <div className="flex items-start sm:items-center gap-3">
                    <label className="p-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 shadow-sm mt-1 sm:mt-0" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={(e) => toggleSelect(ev.id, e as any)} className="w-4 h-4 rounded text-indigo-600 cursor-pointer" />
                    </label>
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0 font-mono shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-slate-400">{new Date(ev.date).toLocaleString('en-US', { month: 'short' })}</span>
                      <span className="text-lg font-black leading-none">{new Date(ev.date).getDate()}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badgeBg}`}>{cfg.icon} {ev.type}</span>
                        {ev.classBatch && <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-semibold text-slate-700">{ev.classBatch}</span>}
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900 mt-1 group-hover:text-indigo-600 transition">{ev.title}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        {ev.startTime && <span className="flex items-center gap-1 font-mono"><Clock className="w-3.5 h-3.5 text-slate-400" />{ev.startTime} - {ev.endTime || 'End'}</span>}
                        {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{ev.location}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                     <button onClick={(e) => { e.stopPropagation(); openFormModal(ev.date, ev); }} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                     <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 flex items-center gap-1"><span>Details</span><ChevronRight className="w-4 h-4" /></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingEventId ? 'Edit Academic Event' : 'Schedule Academic Event'}>
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Event / Examination Title *</label>
            <input type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Physics Mid-Term Examination" className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-500 font-medium" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-slate-700 mb-1">Event Type *</label><select value={formType} onChange={(e) => setFormType(e.target.value as CalendarEventType)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold"><option value="Exam">📝 Exam</option><option value="Holiday">🌴 Holiday</option><option value="Event">🎪 Event</option><option value="Meeting">👥 Meeting</option><option value="Sports">🏅 Sports</option><option value="Ceremony">🎓 Ceremony</option></select></div>
            <div><label className="block text-xs font-bold text-slate-700 mb-1">Audience</label><select value={formAudience} onChange={(e) => setFormAudience(e.target.value as any)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold"><option value="All">All</option><option value="Students">Students</option><option value="Faculty">Faculty</option><option value="Parents">Parents</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-slate-700 mb-1">Date *</label><input type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-bold" /></div>
            <div><label className="block text-xs font-bold text-slate-700 mb-1">End Date</label><input type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-bold" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label><input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono" /></div>
            <div><label className="block text-xs font-bold text-slate-700 mb-1">End Time</label><input type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-slate-700 mb-1">Venue</label><input type="text" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs" /></div>
            <div><label className="block text-xs font-bold text-slate-700 mb-1">Batch / Class</label><input type="text" value={formClassBatch} onChange={(e) => setFormClassBatch(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs" /></div>
          </div>
          <div><label className="block text-xs font-bold text-slate-700 mb-1">Description</label><textarea rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs outline-none focus:border-indigo-500" /></div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-md">{editingEventId ? 'Save Changes' : 'Confirm Schedule'}</button>
          </div>
        </form>
      </Modal>

      {/* DETAIL MODAL */}
      {selectedEvent && (
        <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`Event Details`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{EVENT_TYPE_CONFIG[selectedEvent.type]?.icon || '📅'}</span>
                <div>
                  <div className="flex items-center gap-2"><span className="font-mono text-[10px] bg-slate-200 px-2 py-0.5 rounded">{selectedEvent.id}</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${EVENT_TYPE_CONFIG[selectedEvent.type]?.badgeBg}`}>{selectedEvent.type}</span></div>
                  <h4 className="font-extrabold text-sm text-slate-900 mt-1">{selectedEvent.title}</h4>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border"><span className="text-[10px] font-bold text-slate-400 uppercase block">Scheduled Date</span><span className="font-mono font-bold text-indigo-700 text-sm">{selectedEvent.date}</span></div>
              <div className="p-3 bg-slate-50 rounded-xl border"><span className="text-[10px] font-bold text-slate-400 uppercase block">Timings</span><span className="font-mono font-bold text-slate-800 text-sm">{selectedEvent.startTime || 'Full Day'} {selectedEvent.endTime ? `- ${selectedEvent.endTime}` : ''}</span></div>
            </div>
            {selectedEvent.description && <div className="p-3.5 bg-slate-50 rounded-xl border text-xs"><span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description</span><p className="text-slate-700">{selectedEvent.description}</p></div>}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
              <p className="text-[11px] font-bold text-indigo-950 mb-2 flex items-center gap-1.5"><Move className="w-3.5 h-3.5" /> Quick Reschedule:</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => handleQuickShift(-1)} className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg text-xs font-bold border">-1 Day</button>
                <button type="button" onClick={() => handleQuickShift(1)} className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg text-xs font-bold border">+1 Day</button>
                <button type="button" onClick={() => handleQuickShift(7)} className="px-2.5 py-1 bg-white hover:bg-slate-100 rounded-lg text-xs font-bold border">+1 Week</button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <div style={{display: (!isParent && !isTeacher) ? 'flex' : 'none'}} className="flex gap-2">
                 <button type="button" onClick={handleDeleteSelected} className="px-3 py-2 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                 <button type="button" onClick={() => { setIsDetailModalOpen(false); openFormModal(selectedEvent.date, selectedEvent); }} className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
              </div>
              <button type="button" onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* PRINT MODAL */}
      <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title="Official Academic Calendar Schedule" maxWidth="max-w-5xl">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b no-print">
            <div className="flex items-center gap-2">
              <select value={printScope} onChange={(e) => {
                const scope = e.target.value as any;
                setPrintScope(scope);
                if (scope === 'all') setPrintEvents(rawEvents);
                else if (scope === 'selected') setPrintEvents(rawEvents.filter(ev => selectedIds.includes(ev.id)));
                else setPrintEvents(filteredEvents);
              }} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold">
                <option value="filtered">Currently Filtered</option>
                <option value="all">All Events</option>
                <option value="selected" disabled={selectedIds.length===0}>Selected Events ({selectedIds.length})</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => triggerBrowserPrint()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Printer className="w-4 h-4" /> Print</button>
              <button onClick={() => downloadElementAsPdf('printable-calendar', 'Calendar_Schedule')} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"><Download className="w-4 h-4" /> PDF</button>
              <button onClick={() => setIsPrintModalOpen(false)} className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold">Close</button>
            </div>
          </div>
          <div className="overflow-auto max-h-[70vh] bg-slate-200 p-4 rounded-xl">
             <div id="printable-calendar" className="min-w-[800px] bg-white p-8 shadow-md mx-auto">
              <LetterheadPrint title="OFFICIAL ACADEMIC CALENDAR & SCHEDULE" subtitle="Academic Session 2026-2027" documentNo={`CAL-${currentYear}`}>
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead className="bg-slate-100"><tr><th className="border p-2">Date</th><th className="border p-2">Day</th><th className="border p-2">Type</th><th className="border p-2">Description</th><th className="border p-2">Venue</th></tr></thead>
                  <tbody>
                    {printEvents.slice().sort((a, b) => a.date.localeCompare(b.date)).map((e) => (
                      <tr key={e.id}><td className="border p-2 font-mono font-bold whitespace-nowrap">{e.date}</td><td className="border p-2 font-medium">{new Date(e.date).toLocaleDateString('en-US', { weekday: 'short' })}</td><td className="border p-2 font-bold whitespace-nowrap">[{e.type}]</td><td className="border p-2"><span className="font-bold block">{e.title}</span></td><td className="border p-2 font-mono text-[11px]">{e.startTime ? `${e.startTime} - ${e.endTime || ''}` : 'Full Day'} {e.location && <span className="block text-[10px]">{e.location}</span>}</td></tr>
                    ))}
                  </tbody>
                </table>
              </LetterheadPrint>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AcademicCalendarModule;
