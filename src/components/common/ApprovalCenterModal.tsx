import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  Users,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { Modal } from './Modal';
import { erpStorage } from '../../lib/storage';
import { type UserRole, type ApprovalRequest, type AppUser } from '../../types';
import { fetchPendingUsers, setUserApprovalStatus } from '../../lib/academyService';

interface ApprovalCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRole: UserRole;
}

export const ApprovalCenterModal: React.FC<ApprovalCenterModalProps> = ({
  isOpen,
  onClose,
  activeRole,
}) => {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [pendingUsers, setPendingUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'history'>('users');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const state = erpStorage.getState();

  const loadPendingUsers = async () => {
    try {
      setLoadingUsers(true);
      const curr = JSON.parse(localStorage.getItem('taleemos_current_user_v5') || 'null');
      setCurrentUser(curr);
      const isDev = curr?.role === 'developer';
      const acadId = curr?.academyId || curr?.institutionId;

      // Runs the user's Firestore query logic: query(collection(db, "users"), where("status", "==", "pending"))
      const fetched = await fetchPendingUsers(acadId, isDev);
      setPendingUsers(fetched || []);
    } catch (err) {
      console.warn('Notice: loading pending users in ApprovalCenterModal:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPendingUsers();
    }
  }, [isOpen]);

  const handleApproveUser = async (u: AppUser) => {
    await setUserApprovalStatus(u.uid || u.id || '', 'approved');
    await loadPendingUsers();
  };

  const handleRejectUser = async (u: AppUser) => {
    await setUserApprovalStatus(u.uid || u.id || '', 'rejected');
    await loadPendingUsers();
  };

  // Role permissions check for institutional requests
  const canApprove = (req: ApprovalRequest): boolean => {
    if (activeRole === 'Super Admin') return true;
    if (activeRole === 'Director / Owner') {
      return (
        req.module === 'Admission Confirmed' ||
        req.module === 'Fee Discount > 500' ||
        req.module === 'Expense > 5000'
      );
    }
    if (activeRole === 'Principal') {
      return (
        req.module === 'Staff Leave' ||
        req.module === 'Student Promotion' ||
        req.module === 'Marks Final Submit'
      );
    }
    return false;
  };

  const handleApprove = (req: ApprovalRequest) => {
    erpStorage.approveRequest(req.id, 'Approved via TaleemOS Approval Center');
  };

  const handleConfirmReject = (req: ApprovalRequest) => {
    if (!rejectReason.trim()) return;
    erpStorage.rejectRequest(req.id, rejectReason.trim());
    setRejectingId(null);
    setRejectReason('');
  };

  const pendingApprovals = state.approvals.filter((a) => a.status === 'Pending Approval');
  const pastApprovals = state.approvals.filter((a) => a.status !== 'Pending Approval');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enterprise Approval Center"
      subtitle={`Review and authorize pending user registrations and institution requests. Active Role: ${activeRole}`}
      badge="HIERARCHICAL RBAC"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5">
        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pending User Accounts</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                {pendingUsers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Institutional Requests</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                {pendingApprovals.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Decision History</span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadPendingUsers}
            disabled={loadingUsers}
            title="Refresh from Firestore"
            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer transition flex items-center gap-1 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Firestore</span>
          </button>
        </div>

        {/* TAB 1: Pending User Accounts (UI Cards from Firestore query) */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                Firestore Pending Users Queue ({pendingUsers.length})
              </h4>
              <span className="text-[11px] text-slate-500">
                {currentUser?.role === 'developer'
                  ? 'Super Developer: Approve Admins across all branches'
                  : `Admin: Authorize members of ${currentUser?.academyName || 'your academy'}`}
              </span>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <UserCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">All user registrations cleared!</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  New registrations from Firestore will automatically appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingUsers.map((u) => (
                  <div
                    key={u.uid || u.id}
                    className="p-4 bg-white rounded-2xl border border-amber-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-extrabold text-slate-900 text-xs truncate">
                              {u.name}
                            </h5>
                            <span className="text-[10px] text-slate-500 font-mono block truncate">
                              {u.email}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-md uppercase border border-amber-300 shrink-0">
                          {u.role}
                        </span>
                      </div>

                      <div className="mt-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[10px]">Institution:</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                            {u.academyName || 'Unassigned'}
                          </span>
                        </div>
                        {u.phone && (
                          <div className="flex justify-between">
                            <span className="text-slate-400 text-[10px]">Phone:</span>
                            <span className="font-mono text-slate-700">{u.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleApproveUser(u)}
                        className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-700/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Authorize</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectUser(u)}
                        className="py-1.5 px-3 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Institutional Requests */}
        {activeTab === 'requests' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                Pending Requests Queue ({pendingApprovals.length})
              </h4>
              <span className="text-xs text-slate-500">
                Only authorized roles can authorize actions
              </span>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">All clear! No pending requests.</p>
                <p className="text-xs text-slate-500 mt-0.5">Requests will automatically appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((req) => {
                  const userCanAuthorize = canApprove(req);
                  return (
                    <div
                      key={req.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full uppercase">
                              {req.module}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-400">
                              {req.id}
                            </span>
                            <span className="text-xs text-slate-500">
                              Requested by: <strong className="text-slate-800">{req.requestedBy}</strong> ({req.requestedRole})
                            </span>
                          </div>
                          <h5 className="font-bold text-slate-900 text-sm mt-1">{req.title}</h5>
                          {req.amountOrValue && (
                            <div className="text-xs font-mono text-indigo-700 font-bold mt-0.5">
                              Value: {req.amountOrValue}
                            </div>
                          )}
                          {req.reason && (
                            <p className="text-xs text-slate-600 mt-1 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                              &ldquo;{req.reason}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Approval Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {userCanAuthorize ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(req)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer transition-all"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Authorize
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingId(req.id);
                                  setRejectReason('');
                                }}
                                className="px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          ) : (
                            <div className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs rounded-xl flex items-center gap-1.5 font-medium">
                              <AlertCircle className="w-4 h-4 text-slate-400" />
                              <span>Requires: {req.currentApproverRole}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rejection reason inline form */}
                      {rejectingId === req.id && (
                        <div className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-200 animate-in fade-in">
                          <label className="block text-xs font-bold text-rose-800 mb-1">
                            Specify reason for rejection (mandatory):
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="e.g., Exceeds monthly budget allowance..."
                              className="flex-1 px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs outline-none focus:border-rose-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleConfirmReject(req)}
                              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingId(null)}
                              className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Decision History */}
        {activeTab === 'history' && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              Decision History
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pastApprovals.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No historical decisions logged yet.
                </div>
              ) : (
                pastApprovals.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{req.title}</span>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {req.date} &bull; Requested by {req.requestedBy}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 font-bold rounded-full text-[10px] ${
                        req.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
