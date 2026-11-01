import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, Shield, Building2, Download, Calendar, Clock, CheckCircle, Users, Sun, Moon, Megaphone, CheckSquare } from 'lucide-react';
import { erpStorage, INSTITUTIONS } from '../../lib/storage';
import { type Academy } from '../../types';
import { getCurrentUser, type User } from '../auth/AuthSystem';
import { fetchActiveAcademies } from '../../lib/academyService';
import { getInitialTheme, toggleTheme, applyTheme, type ThemeMode } from '../../lib/theme';

interface HeaderProps {
  onToggleMobileDrawer: () => void;
  onOpenSearch: () => void;
  onOpenApprovals: () => void;
  onOpenNotices?: () => void;
  onOpenExportZip?: () => void;
  onNavigate: (path: string) => void;
  currentUser?: User | null;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileDrawer, onOpenSearch, onOpenApprovals, onOpenNotices, onOpenExportZip, onNavigate, currentUser: propUser,
}) => {
  const state = erpStorage.getState();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<User | null>(propUser || getCurrentUser());
  const [activeAcademies, setActiveAcademies] = useState<Academy[]>([]);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());

  useEffect(() => { applyTheme(theme); }, [theme]);
  const handleToggleTheme = () => { const next = toggleTheme(theme); setTheme(next); };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (propUser) setCurrentUser(propUser);
    else setCurrentUser(getCurrentUser());
    fetchActiveAcademies().then(setActiveAcademies);
  }, [propUser]);

  const isDev = currentUser?.role === 'developer';
  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher';
  const isParent = currentUser?.role === 'parent';

  const pendingApprovalsCount = state.approvals.filter((a) => a.status === 'Pending Approval').length;
  const userAcadId = currentUser?.academyId || state.activeInstitutionId;
  const activeNoticesCount = state.alerts.filter((item) => {
    if (isDev) return true;
    return item.academyId === userAcadId || item.academyId === 'all' || !item.academyId;
  }).length;

  const totalNotifications = pendingApprovalsCount + activeNoticesCount;
  const currentInstitution = INSTITUTIONS.find((i) => i.id === state.activeInstitutionId) || INSTITUTIONS[0];
  const handleInstitutionChange = (instId: string) => { erpStorage.setActiveInstitution(instId); };

  const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/40 shadow-lg no-print w-full max-w-full overflow-hidden">
      <div className="px-2.5 sm:px-4 md:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-2 md:gap-4 w-full max-w-full">
        {/* Left side: Hamburger + Brand + Campus Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 shrink-0 min-w-0">
          <button type="button" onClick={onToggleMobileDrawer} className="p-1.5 sm:p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer flex items-center justify-center shrink-0" title="Open Menu Drawer">
            <Menu className="w-5 h-5 text-indigo-300" />
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-md border border-indigo-400/30">
              <img src="/icon.png" alt="TaleemOS Logo" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <div className="flex items-center gap-1"><span className="font-black text-xs tracking-tight text-white">TaleemOS</span><span className="text-[7.5px] uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-1 py-0.2 rounded font-bold">ERP</span></div>
              <span className="text-[9px] text-indigo-300/80 font-medium">Academy Hub</span>
            </div>
          </div>
          <div className="hidden md:flex items-center">
            {isDev ? (
              <div className="flex items-center gap-2 bg-purple-900/40 hover:bg-purple-900/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-purple-500/40 transition-colors">
                <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-purple-300 leading-none">Dev Scope</span>
                  <select value={state.activeInstitutionId} onChange={(e) => handleInstitutionChange(e.target.value)} className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1 truncate">
                    <option value="all" className="bg-slate-900 text-purple-300">🌐 All Academies (Global)</option>
                    {(activeAcademies.length > 0 ? activeAcademies : INSTITUTIONS).map((inst: any) => (
                      <option key={inst.academyId || inst.id} value={inst.academyId || inst.id} className="bg-slate-900 text-white">{inst.academyName || inst.name || inst.campusName} ({inst.code})</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-slate-400 leading-none">My Academy</span><span className="text-xs font-bold text-white truncate max-w-[200px]">{currentUser?.academyName || currentInstitution.campusName || 'Taleem Academy'}</span></div>
              </div>
            )}
          </div>
          <div className="md:hidden flex items-center gap-1.5 min-w-0"><span className="text-xs font-black tracking-tight text-white truncate max-w-[95px] sm:max-w-[130px]">{isDev ? 'Dev Scope' : (currentUser?.academyName || currentInstitution.campusName || 'TaleemOS')}</span></div>
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-300 border-l border-white/10 pl-3">
            <div className="flex items-center gap-1.5 font-medium"><Calendar className="w-3.5 h-3.5 text-indigo-400" /><span>{formattedDate}</span></div>
            <div className="flex items-center gap-1.5 font-mono text-indigo-200 bg-white/5 px-2 py-0.5 rounded"><Clock className="w-3 h-3 text-indigo-400" /><span>{formattedTime}</span></div>
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button type="button" onClick={onOpenSearch} title="Search Hub (Ctrl+K)" className="flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 rounded-xl text-xs text-slate-300 hover:text-white transition-all cursor-pointer">
            <Search className="w-3.5 h-3.5 text-indigo-300" /><span className="hidden md:inline">Search</span>
          </button>
          <button type="button" style={{display: (isParent || isTeacher) ? 'none' : 'flex'}} onClick={() => onNavigate('users')} title="Open Users Directory" className="flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 rounded-xl text-xs text-slate-200 hover:text-white transition-all cursor-pointer">
            <Users className="w-3.5 h-3.5 text-indigo-300" /><span className="hidden md:inline">Users</span>
          </button>
          {isDev && (<button onClick={() => onNavigate('developer')} title="Open Developer Hub" className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold border border-purple-400/40 shadow-sm transition cursor-pointer"><span>👑 Dev Hub</span></button>)}
          
          <button type="button" onClick={handleToggleTheme} title={theme === 'dark' ? 'Switch to Day (Light) Mode' : 'Switch to Night (Dark) Mode'} className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 text-amber-300 hover:text-white rounded-xl border border-white/10 transition-colors cursor-pointer">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-300" />}
          </button>
          
          {/* UNIFIED NOTIFICATION CENTER BELL */}
          <button type="button" onClick={onOpenNotices} title="Notification Center (Notices & Approvals)" className="relative p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white rounded-xl border border-white/10 transition-colors cursor-pointer flex items-center justify-center">
            <Bell className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-bold ml-1.5">Inbox</span>
            {totalNotifications > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-rose-500 text-white font-black text-[10px] rounded-full animate-pulse shadow-md border border-rose-400">
                {totalNotifications > 99 ? '99+' : totalNotifications}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sub-bar & KPIs (Kept exactly as original) */}
      {isDev && (
        <div className="md:hidden px-3 py-1.5 bg-purple-950/80 border-t border-purple-500/30 flex items-center justify-between gap-2 text-xs w-full">
          <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px] shrink-0"><Building2 className="w-3.5 h-3.5 text-purple-400" /><span>Dev Scope:</span></div>
          <select value={state.activeInstitutionId} onChange={(e) => handleInstitutionChange(e.target.value)} className="bg-black/60 text-white font-bold text-xs py-1 px-2.5 rounded-lg border border-purple-400/40 focus:outline-none flex-1 max-w-[220px] truncate">
            <option value="all" className="bg-slate-900 text-purple-300">🌐 All Academies (Global Network)</option>
            {(activeAcademies.length > 0 ? activeAcademies : INSTITUTIONS).map((inst: any) => (
              <option key={inst.academyId || inst.id} value={inst.academyId || inst.id} className="bg-slate-900 text-white">{inst.academyName || inst.name || inst.campusName} ({inst.code})</option>
            ))}
          </select>
        </div>
      )}

      <div className="px-3 sm:px-4 md:px-6 py-2 bg-black/25 border-t border-white/5 flex items-center justify-between overflow-x-auto text-xs whitespace-nowrap gap-4 scrollbar-none touch-scroll w-full">
        <div className="flex items-center gap-4 sm:gap-6">
          <div onClick={() => onNavigate('students')} className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"><span className="text-[11px] text-slate-400 uppercase font-semibold">Students:</span><span className="font-extrabold text-white font-mono">{state.students.length}</span><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /></div>
          <div onClick={() => onNavigate('admissions')} className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"><span className="text-[11px] text-slate-400 uppercase font-semibold">Confirmed Adm:</span><span className="font-extrabold text-emerald-300 font-mono">{state.admissions.filter((a) => a.status === 'Confirmed').length}</span></div>
          <div onClick={() => onNavigate('batches')} className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"><span className="text-[11px] text-slate-400 uppercase font-semibold">Active Batches:</span><span className="font-extrabold text-indigo-300 font-mono">{state.batches.filter((b) => b.status === 'Active').length}</span></div>
          <div onClick={() => onNavigate('fees')} className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"><span className="text-[11px] text-slate-400 uppercase font-semibold">October Fee Col:</span><span className="font-extrabold text-amber-300 font-mono">PKR {state.fees.filter((f) => f.status === 'Paid').reduce((acc, curr) => acc + curr.netPayable, 0).toLocaleString()}</span></div>
        </div>
      </div>
    </header>
  );
};
