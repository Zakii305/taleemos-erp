import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Download,
  Search,
  Phone,
  User,
  ArrowRight,
  Trash2,
  Edit2,
  Calendar,
  Share2,
} from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type Enquiry } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
import { triggerBrowserPrint, downloadElementAsPdf } from '../lib/pdf';

export const EnquiriesModule: React.FC = () => {
  const state = erpStorage.getState();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form (11 fields as specified)
  const [studentName, setStudentName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState('F.Sc Pre-Engineering');
  const [source, setSource] = useState<Enquiry['source']>('Walk-in');
  const [status, setStatus] = useState<Enquiry['status']>('New');
  const [enquiryDate, setEnquiryDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpDate, setFollowUpDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('Receptionist Asma');
  const [actionTaken, setActionTaken] = useState('');
  const [remarks, setRemarks] = useState('');

  // 5 KPIs (Total, New, Contacted, Admitted, Conversion %)
  const totalEnquiries = state.enquiries.length;
  const newCount = state.enquiries.filter((e) => e.status === 'New').length;
  const contactedCount = state.enquiries.filter((e) => e.status === 'Contacted' || e.status === 'Follow-up').length;
  const admittedCount = state.enquiries.filter((e) => e.status === 'Admitted').length;
  const conversionRate = totalEnquiries > 0 ? Math.round((admittedCount / totalEnquiries) * 100) : 0;

  const filtered = state.enquiries.filter((item) => {
    const matchSearch =
      item.studentName.toLowerCase().includes(search.toLowerCase()) ||
      item.fatherName.toLowerCase().includes(search.toLowerCase()) ||
      item.phone.includes(search) ||
      item.remarks.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchSource = sourceFilter === 'All' || item.source === sourceFilter;
    const matchCourse = courseFilter === 'All' || item.course === courseFilter;
    return matchSearch && matchStatus && matchSource && matchCourse;
  });

  const handleSaveEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !phone.trim()) return;

    if (isEditMode && selectedEnquiry) {
      erpStorage.updateItem('enquiries', selectedEnquiry.id, {
        studentName,
        fatherName,
        phone,
        course,
        source,
        status,
        enquiryDate,
        followUpDate,
        assignedTo,
        actionTaken,
        remarks,
      });
    } else {
      const newEnq: Enquiry = {
        id: `ENQ-${Date.now().toString().slice(-4)}`,
        studentName,
        fatherName,
        phone,
        course,
        source,
        status,
        enquiryDate,
        followUpDate: followUpDate || enquiryDate,
        assignedTo,
        actionTaken: actionTaken || 'Prospectus issued',
        remarks,
      };
      erpStorage.addItem('enquiries', newEnq);
    }

    setIsAddModalOpen(false);
    setIsEditMode(false);
    setSelectedEnquiry(null);
    resetForm();
  };

  const resetForm = () => {
    setStudentName('');
    setFatherName('');
    setPhone('');
    setActionTaken('');
    setRemarks('');
  };

  const handleNextStatus = (enq: Enquiry, e: React.MouseEvent) => {
    e.stopPropagation();
    const transitions: Record<Enquiry['status'], Enquiry['status']> = {
      New: 'Contacted',
      Contacted: 'Follow-up',
      'Follow-up': 'Admitted',
      Admitted: 'Admitted',
      Lost: 'New',
    };
    const next = transitions[enq.status];
    erpStorage.updateItem('enquiries', enq.id, { status: next });
  };

  const handleOpenEdit = (enq: Enquiry, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEnquiry(enq);
    setIsEditMode(true);
    setStudentName(enq.studentName);
    setFatherName(enq.fatherName);
    setPhone(enq.phone);
    setCourse(enq.course);
    setSource(enq.source);
    setStatus(enq.status);
    setEnquiryDate(enq.enquiryDate);
    setFollowUpDate(enq.followUpDate);
    setAssignedTo(enq.assignedTo);
    setActionTaken(enq.actionTaken);
    setRemarks(enq.remarks);
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this enquiry record?')) {
      erpStorage.deleteItem('enquiries', id);
      if (selectedEnquiry?.id === id) setSelectedEnquiry(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 rounded-xl">
              <FileText className="w-5 h-5 text-white" />
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">New Enquiries PRO</h1>
            <span className="px-2 py-0.5 bg-indigo-500 text-white font-black text-[10px] rounded uppercase">
              LEAD CRM
            </span>
          </div>
          <p className="text-xs text-indigo-200 mt-1">
            Student lead pipeline, follow-ups, prospect tracking, and conversion analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPrintAllOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print All
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditMode(false);
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      {/* 5 KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Leads</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">{totalEnquiries}</div>
        </div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-blue-500 uppercase">New Leads</div>
          <div className="text-2xl font-black text-blue-600 font-mono mt-1">{newCount}</div>
        </div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-amber-500 uppercase">Contacted / Follow</div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">{contactedCount}</div>
        </div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-500 uppercase">Admitted</div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">{admittedCount}</div>
        </div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-indigo-500 uppercase">Conversion %</div>
          <div className="text-2xl font-black text-indigo-600 font-mono mt-1">{conversionRate}%</div>
        </div>
      </div>

      {/* Search & Smart Filters */}
      <div className="p-4 bg-white rounded-[22px] border border-slate-200 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by student name, father name, phone, or remarks..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>
          {['All', 'New', 'Contacted', 'Follow-up', 'Admitted', 'Lost'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}

          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-2 mr-1">
            Source:
          </span>
          {['All', 'Walk-in', 'Facebook', 'Referral', 'Poster', 'WhatsApp', 'Google'].map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => setSourceFilter(src)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                sourceFilter === src
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {/* Results Cards (Tappable to detail modal) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-[22px] border border-slate-200 text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-1" />
            <p className="text-sm font-semibold">No enquiry leads found matching criteria</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedEnquiry(item)}
              className="p-5 bg-white rounded-[22px] border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase ${
                      item.status === 'Admitted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'New'
                        ? 'bg-blue-100 text-blue-800'
                        : item.status === 'Follow-up'
                        ? 'bg-amber-100 text-amber-800'
                        : item.status === 'Lost'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.enquiryDate}</span>
                </div>

                <h3 className="mt-2 text-base font-bold text-slate-900">{item.studentName}</h3>
                <p className="text-xs text-slate-500 font-medium">S/O {item.fatherName || 'N/A'}</p>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{item.phone}</span>
                  </div>
                  <div className="font-semibold text-indigo-700">Course: {item.course}</div>
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 italic line-clamp-2">
                    &ldquo;{item.remarks}&rdquo;
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600">
                  {item.source}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => handleNextStatus(item, e)}
                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[10px] cursor-pointer"
                    title="Advance Lead Status"
                  >
                    Next &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(item, e)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD / EDIT MODAL with 11 fields */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={isEditMode ? 'Edit Enquiry Lead' : 'Add New Enquiry'}
        subtitle="Register new admission lead into CRM"
        badge="11 FIELDS CRM"
      >
        <form onSubmit={handleSaveEnquiry} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Student Name *
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Full student name"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Father Name
              </label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="Father / Guardian name"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 0000000"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Interested Course
              </label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              >
                {state.courses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Lead Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as Enquiry['source'])}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              >
                <option value="Walk-in">Walk-in</option>
                <option value="Facebook">Facebook</option>
                <option value="Referral">Referral</option>
                <option value="Poster">Poster</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Google">Google</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Enquiry['status'])}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Admitted">Admitted</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Enquiry Date
              </label>
              <input
                type="date"
                value={enquiryDate}
                onChange={(e) => setEnquiryDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Follow-Up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Assigned Counselor
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Counselor name"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Action Taken
              </label>
              <input
                type="text"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="e.g. Prospectus provided, call scheduled"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Remarks & Special Requests
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Candidate background, timing preference, scholarships..."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {isEditMode ? 'Update Enquiry' : 'Save Enquiry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DETAIL MODAL + Single Print */}
      {selectedEnquiry && (
        <Modal
          isOpen={Boolean(selectedEnquiry)}
          onClose={() => setSelectedEnquiry(null)}
          title={`Enquiry: ${selectedEnquiry.studentName}`}
          subtitle={`Lead Ref: ${selectedEnquiry.id} • Registered on ${selectedEnquiry.enquiryDate}`}
          badge={selectedEnquiry.status}
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block font-semibold">Student Name:</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedEnquiry.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Father Name:</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedEnquiry.fatherName || 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block font-semibold">Phone:</span>
                  <span className="font-mono text-indigo-700 font-bold">{selectedEnquiry.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Course:</span>
                  <span className="font-bold text-slate-800">{selectedEnquiry.course}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 block font-semibold">Source:</span>
                  <span className="font-semibold text-slate-700">{selectedEnquiry.source}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Follow-up:</span>
                  <span className="font-mono text-slate-700">{selectedEnquiry.followUpDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Assigned:</span>
                  <span className="font-semibold text-slate-700">{selectedEnquiry.assignedTo}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-400 block font-semibold">Action Taken:</span>
                <p className="text-slate-800">{selectedEnquiry.actionTaken}</p>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-400 block font-semibold">Remarks:</span>
                <p className="text-slate-800 italic bg-white p-2.5 rounded-lg border border-slate-100">
                  &ldquo;{selectedEnquiry.remarks}&rdquo;
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => triggerBrowserPrint()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                Print Enquiry Slip
              </button>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PRINT ALL MODAL */}
      {isPrintAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 no-print overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">Enquiries Lead Registry (A4)</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerBrowserPrint()}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print A4
                </button>
                <button
                  type="button"
                  onClick={() => downloadElementAsPdf('enquiries-print-table', 'TaleemOS_Enquiries_Report')}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF Download
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintAllOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  Close
                </button>
              </div>
            </div>

            <div id="enquiries-print-table">
              <LetterheadPrint
                title="Prospective Admission Enquiries & Lead Pipeline"
                documentNo="ENQ-LEDGER-2026"
                summaryStats={[
                  { label: 'Total Leads', value: totalEnquiries },
                  { label: 'New Inquiries', value: newCount },
                  { label: 'Admitted', value: admittedCount },
                  { label: 'Conversion', value: `${conversionRate}%` },
                ]}
              >
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold">
                      <th className="border border-slate-300 p-2">Ref</th>
                      <th className="border border-slate-300 p-2">Candidate</th>
                      <th className="border border-slate-300 p-2">S/O</th>
                      <th className="border border-slate-300 p-2">Phone</th>
                      <th className="border border-slate-300 p-2">Course</th>
                      <th className="border border-slate-300 p-2">Source</th>
                      <th className="border border-slate-300 p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => (
                      <tr key={e.id}>
                        <td className="border border-slate-300 p-2 font-mono font-bold">{e.id}</td>
                        <td className="border border-slate-300 p-2 font-bold">{e.studentName}</td>
                        <td className="border border-slate-300 p-2">{e.fatherName}</td>
                        <td className="border border-slate-300 p-2 font-mono">{e.phone}</td>
                        <td className="border border-slate-300 p-2">{e.course}</td>
                        <td className="border border-slate-300 p-2">{e.source}</td>
                        <td className="border border-slate-300 p-2 font-bold">{e.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </LetterheadPrint>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiriesModule;
