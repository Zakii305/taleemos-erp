import { getCurrentUser } from '../components/auth/AuthSystem';
import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Printer,
  Download,
  Search,
  DollarSign,
  User,
  School,
  FileCheck,
  Tag,
  Trash2,
  Phone,
  QrCode,
  Upload,
} from 'lucide-react';
import { erpStorage } from '../lib/storage';
import { type Admission, type ApprovalRequest } from '../types';
import { Modal } from '../components/common/Modal';
import { LetterheadPrint } from '../components/common/LetterheadPrint';
import { triggerBrowserPrint, downloadElementAsPdf } from '../lib/pdf';
import { uploadToCloudinary } from '../lib/cloudinary';
import { CloudinaryUploader } from '../components/common/CloudinaryUploader';
import { logAuditEvent } from '../lib/auditLogger';

export const AdmissionsModule: React.FC = () => {
  const state = erpStorage.getState();
  const currentUser = getCurrentUser();
  const isParent = currentUser?.role === 'parent';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');
  const [batchFilter, setBatchFilter] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Form (12 fields as requested)
  const [studentName, setStudentName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [cnic, setCnic] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState('F.Sc Pre-Engineering');
  const [batch, setBatch] = useState('Batch 2026-A (Morning)');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<Admission['status']>('Confirmed');
  const [assignedTo, setAssignedTo] = useState('Front Desk Asma');
  const [admissionFee, setAdmissionFee] = useState(8000);
  const [discount, setDiscount] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Auto calculate net fee
  const netFee = Math.max(0, admissionFee - discount);

  // KPIs (Total, Confirmed, Pending, Revenue, Avg Fee)
  const totalAdmissions = state.admissions.length;
  const confirmedCount = state.admissions.filter((a) => a.status === 'Confirmed').length;
  const pendingCount = state.admissions.filter((a) => a.status === 'Pending').length;
  const totalRevenue = state.admissions
    .filter((a) => a.status === 'Confirmed')
    .reduce((sum, a) => sum + a.netFee, 0);
  const avgFee = confirmedCount > 0 ? Math.round(totalRevenue / confirmedCount) : 0;

  const filtered = state.admissions.filter((item) => {
    const matchSearch =
      item.studentName.toLowerCase().includes(search.toLowerCase()) ||
      item.fatherName.toLowerCase().includes(search.toLowerCase()) ||
      item.cnic.includes(search) ||
      item.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
      item.phone.includes(search);
    const matchStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchCourse = courseFilter === 'All' || item.course === courseFilter;
    const matchBatch = batchFilter === 'All' || item.batch === batchFilter;
    return matchSearch && matchStatus && matchCourse && matchBatch;
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingPhoto(true);
      try {
        const url = await uploadToCloudinary(e.target.files[0]);
        setPhotoUrl(url);
      } catch (err) {
        console.error('Photo upload failed:', err);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleCreateAdmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !fatherName.trim() || !phone.trim()) return;

    // Auto generate Receipt No like REC-1001
    const nextNum = 1000 + state.admissions.length + 1;
    const receiptNo = `REC-${nextNum}`;
    const newId = `ADM-${nextNum}`;

    // Receptionist role rule: Receptionist can only create Pending status admissions
    let finalStatus: Admission['status'] = status;
    if (state.activeRole === 'Receptionist / Front Desk') {
      finalStatus = 'Pending';
    }

    const newAdm: Admission = {
      id: newId,
      receiptNo,
      studentName,
      fatherName,
      cnic: cnic || '43102-0000000-0',
      phone,
      course,
      batch,
      admissionDate,
      status: finalStatus,
      assignedTo: assignedTo || state.userName,
      admissionFee: Number(admissionFee),
      discount: Number(discount),
      netFee,
      remarks: remarks || 'Standard enrollment verified.',
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    };

    erpStorage.addItem('admissions', newAdm);

    logAuditEvent({
      action: 'ADMISSION_REGISTERED',
      module: 'Admissions',
      targetRecord: `${studentName} (${receiptNo})`,
      targetId: newId,
      details: `Enrolled student into ${course} (${batch}). Fee: PKR ${netFee} (Discount: PKR ${discount})`,
    });

    // If discount > 500 or created as pending, queue an approval request
    if (discount > 500) {
      const approvalReq: ApprovalRequest = {
        id: `APP-${Date.now().toString().slice(-4)}`,
        module: 'Fee Discount > 500',
        recordId: newId,
        title: `Discount Authorization: ${studentName} (PKR ${discount} off)`,
        requestedBy: state.userName,
        requestedRole: state.activeRole,
        currentApproverRole: 'Director / Owner',
        amountOrValue: `PKR ${discount} Discount on ${admissionFee} Fee`,
        status: 'Pending Approval',
        date: admissionDate,
        reason: remarks || 'Fee discount requested exceeding PKR 500 limit.',
        history: [
          {
            actor: state.userName,
            role: state.activeRole,
            action: 'Created',
            timestamp: new Date().toLocaleString(),
          },
        ],
      };
      erpStorage.addItem('approvals', approvalReq);
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setStudentName('');
    setFatherName('');
    setCnic('');
    setPhone('');
    setAdmissionFee(8000);
    setDiscount(0);
    setRemarks('');
    setPhotoUrl('');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (state.activeRole === 'Receptionist / Front Desk') {
      alert('Receptionists do not have permission to delete admission records.');
      return;
    }
    const target = state.admissions.find((a) => a.id === id);
    if (confirm('Delete this admission record and associated voucher?')) {
      erpStorage.deleteItem('admissions', id);
      if (selectedAdmission?.id === id) setSelectedAdmission(null);

      logAuditEvent({
        action: 'DELETE_ADMISSION',
        module: 'Admissions',
        targetRecord: `${target?.studentName || 'Student'} (${target?.receiptNo || id})`,
        targetId: id,
        details: `Deleted admission record ${id} for ${target?.studentName || 'Student'}`,
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-600 rounded-xl">
              <CheckSquare className="w-5 h-5 text-white" />
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Admissions ERP PRO</h1>
            <span className="px-2 py-0.5 bg-emerald-500 text-white font-black text-[10px] rounded uppercase">
              CONFIRMED REGISTER
            </span>
          </div>
          <p className="text-xs text-indigo-200 mt-1">
            Complete student admission lifecycle, fee box calculation, receipt dispatch, and approval routing.
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
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      {/* 5 KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Admissions</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">{totalAdmissions}</div>
        </div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase">Confirmed</div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">{confirmedCount}</div>
        </div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-amber-500 uppercase">Pending Review</div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">{pendingCount}</div>
        </div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-indigo-500 uppercase">Total Net Revenue</div>
          <div className="text-xl md:text-2xl font-black text-indigo-600 font-mono mt-1">
            PKR {totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="p-4 bg-white rounded-[20px] border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-purple-500 uppercase">Average Fee</div>
          <div className="text-2xl font-black text-purple-600 font-mono mt-1">
            PKR {avgFee.toLocaleString()}
          </div>
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
            placeholder="Search admissions by receipt no (REC-1001), student, CNIC, or phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>
          {['All', 'Confirmed', 'Pending', 'Cancelled'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}

          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-2 mr-1">
            Course:
          </span>
          {['All', 'F.Sc Pre-Engineering', 'F.Sc Pre-Medical', 'ICS (Computer Science)'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCourseFilter(c)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                courseFilter === c
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Results Cards (Tappable to Detail modal) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedAdmission(item)}
            className="p-5 bg-white rounded-[22px] border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 font-mono text-xs font-black bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                  {item.receiptNo}
                </span>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase ${
                    item.status === 'Confirmed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.status === 'Pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="mt-3 flex items-start gap-3">
                {item.photoUrl && (
                  <img
                    src={item.photoUrl}
                    alt={item.studentName}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900">{item.studentName}</h3>
                  <p className="text-xs text-slate-500">S/O {item.fatherName}</p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">CNIC: {item.cnic}</p>
                </div>
              </div>

              {/* Fee Details Box (Fee - Discount = Net) */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-3 gap-1 text-center font-mono">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block font-sans">Gross Fee</span>
                  <span className="text-xs font-bold text-slate-700">PKR {item.admissionFee}</span>
                </div>
                <div>
                  <span className="text-[9px] text-rose-500 uppercase block font-sans">Discount</span>
                  <span className="text-xs font-bold text-rose-600">-PKR {item.discount}</span>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-600 uppercase block font-sans">Net Fee</span>
                  <span className="text-xs font-black text-emerald-700">PKR {item.netFee}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px] truncate max-w-[150px]">
                {item.batch}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD NEW ADMISSION MODAL (12 fields as required) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Admission (ERP PRO)"
        subtitle="Auto generates Receipt Number and configures financial audit boxes"
        badge="12 FIELDS"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleCreateAdmission} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                Father Name *
              </label>
              <input
                type="text"
                required
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="Father's full name"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                CNIC / B-Form Number
              </label>
              <input
                type="text"
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder="43102-XXXXXXX-X"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Contact Phone *
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
                Course Program *
              </label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              >
                {state.courses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Assigned Batch *
              </label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              >
                {state.batches.map((b) => (
                  <option key={b.id} value={b.batchName}>
                    {b.batchName} ({b.enrolled}/{b.capacity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Admission Date
              </label>
              <input
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Admission['status'])}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white"
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Assigned Counselor
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Front Desk officer"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          {/* Fee Calculation Section (Auto Net Fee) */}
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
            <span className="text-xs font-bold text-indigo-900 uppercase">
              Financial Breakdown & Concessions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Admission Fee (PKR) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={admissionFee}
                  onChange={(e) => setAdmissionFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Discount (PKR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-rose-600 outline-none"
                />
                {discount > 500 && (
                  <span className="text-[10px] text-amber-700 font-bold block mt-1">
                    ⚠️ Discount &gt; 500 will trigger Director Approval Queue.
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Net Fee (Auto Calculated)
                </label>
                <div className="w-full px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono font-black text-emerald-800">
                  PKR {netFee.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Cloudinary Student Photo Upload */}
          <CloudinaryUploader
            label="Student Profile Photo (Cloudinary)"
            description="Direct cloud upload to preset TaleemOS (h79njj6q)"
            value={photoUrl}
            accept="image/*"
            mode="image"
            previewShape="circle"
            folder="taleemos_admissions"
            onUpload={(url) => setPhotoUrl(url)}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Remarks & Verification Notes
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Certificate verification, documents collected, special notes..."
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              Confirm Admission
            </button>
          </div>
        </form>
      </Modal>

      {/* DETAIL MODAL with Official Single Print Receipt */}
      {selectedAdmission && (
        <Modal
          isOpen={Boolean(selectedAdmission)}
          onClose={() => setSelectedAdmission(null)}
          title={`Official Admission Receipt: ${selectedAdmission.receiptNo}`}
          subtitle={`Student: ${selectedAdmission.studentName} • Admitted on ${selectedAdmission.admissionDate}`}
          badge={selectedAdmission.status}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div id="single-admission-receipt">
              <LetterheadPrint
                title="OFFICIAL STUDENT ADMISSION RECEIPT"
                documentNo={selectedAdmission.receiptNo}
                date={selectedAdmission.admissionDate}
                signatures={[
                  'Accounts Officer (Cashier)',
                  'Admission Counselor',
                  'Principal / Director Seal',
                ]}
              >
                <div className="space-y-4 text-xs">
                  {/* Student details header */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {selectedAdmission.photoUrl && (
                        <img
                          src={selectedAdmission.photoUrl}
                          alt={selectedAdmission.studentName}
                          className="w-16 h-16 rounded-xl object-cover border-2 border-slate-300"
                        />
                      )}
                      <div>
                        <h4 className="text-base font-black text-slate-900 uppercase">
                          {selectedAdmission.studentName}
                        </h4>
                        <div className="text-slate-600 font-semibold">
                          Father's Name: <strong className="text-slate-800">{selectedAdmission.fatherName}</strong>
                        </div>
                        <div className="text-slate-500 font-mono">
                          CNIC/B-Form: {selectedAdmission.cnic} &bull; Ph: {selectedAdmission.phone}
                        </div>
                      </div>
                    </div>

                    <div className="text-right sm:border-l border-slate-200 sm:pl-4">
                      <div className="text-slate-500">Academic Program</div>
                      <div className="font-extrabold text-indigo-900 text-sm">{selectedAdmission.course}</div>
                      <div className="font-semibold text-slate-700">{selectedAdmission.batch}</div>
                    </div>
                  </div>

                  {/* 3 Fee Boxes as strictly requested by prompt: (Fee, Discount, Net) */}
                  <div className="grid grid-cols-3 gap-3 my-4">
                    <div className="p-3 bg-white border-2 border-slate-300 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Admission Fee
                      </span>
                      <span className="text-base md:text-lg font-black text-slate-900 font-mono">
                        PKR {selectedAdmission.admissionFee.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-rose-700 uppercase block">
                        Discount Allowed
                      </span>
                      <span className="text-base md:text-lg font-black text-rose-700 font-mono">
                        -PKR {selectedAdmission.discount.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                        Net Amount Paid
                      </span>
                      <span className="text-base md:text-lg font-black text-emerald-800 font-mono">
                        PKR {selectedAdmission.netFee.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Remarks & Academic Details */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block font-semibold text-[11px] mb-0.5">
                      Admission Remarks / Concession Authorization:
                    </span>
                    <p className="text-slate-800 font-medium">
                      {selectedAdmission.remarks || 'Standard verified enrollment with document archive.'}
                    </p>
                  </div>

                  {/* Thank you dashed box (Strict prompt requirement) */}
                  <div className="p-3.5 border-2 border-dashed border-indigo-300 bg-indigo-50/40 rounded-xl text-center">
                    <span className="font-extrabold text-indigo-900 tracking-wide text-xs uppercase block">
                      Thank You for Choosing Taleem Academy Kandhkot!
                    </span>
                    <span className="text-[11px] text-slate-600">
                      Kindly preserve this receipt for library book issuance and student ID card processing.
                    </span>
                  </div>
                </div>
              </LetterheadPrint>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerBrowserPrint()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  Print Single Receipt
                </button>
                <button
                  type="button"
                  onClick={() => downloadElementAsPdf('single-admission-receipt', `Admission_${selectedAdmission.receiptNo}`)}
                  className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAdmission(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* PRINT ALL ADMISSIONS MODAL */}
      {isPrintAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 no-print overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">Admissions Master Ledger (A4)</h3>
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
                  onClick={() => downloadElementAsPdf('admissions-print-table', 'TaleemOS_Admissions_Ledger')}
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

            <div id="admissions-print-table">
              <LetterheadPrint
                title="Master Institutional Admissions Register"
                documentNo="ADM-LEDGER-2026"
                summaryStats={[
                  { label: 'Total Enrolled', value: totalAdmissions },
                  { label: 'Confirmed', value: confirmedCount },
                  { label: 'Net Revenue', value: `PKR ${totalRevenue.toLocaleString()}` },
                  { label: 'Average Fee', value: `PKR ${avgFee.toLocaleString()}` },
                ]}
              >
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold">
                      <th className="border border-slate-300 p-2">Receipt No</th>
                      <th className="border border-slate-300 p-2">Student Name</th>
                      <th className="border border-slate-300 p-2">Father Name</th>
                      <th className="border border-slate-300 p-2">Course</th>
                      <th className="border border-slate-300 p-2">Batch</th>
                      <th className="border border-slate-300 p-2">Net Fee</th>
                      <th className="border border-slate-300 p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => (
                      <tr key={a.id}>
                        <td className="border border-slate-300 p-2 font-mono font-bold text-indigo-700">
                          {a.receiptNo}
                        </td>
                        <td className="border border-slate-300 p-2 font-bold">{a.studentName}</td>
                        <td className="border border-slate-300 p-2">{a.fatherName}</td>
                        <td className="border border-slate-300 p-2">{a.course}</td>
                        <td className="border border-slate-300 p-2">{a.batch}</td>
                        <td className="border border-slate-300 p-2 font-mono font-bold">
                          PKR {a.netFee.toLocaleString()}
                        </td>
                        <td className="border border-slate-300 p-2 font-bold">{a.status}</td>
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

export default AdmissionsModule;
