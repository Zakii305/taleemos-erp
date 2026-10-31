import React from 'react';
import { erpStorage, INSTITUTIONS } from '../../lib/storage';
import { getCurrentUser } from '../auth/AuthSystem';

interface LetterheadPrintProps {
  title: string;
  documentNo?: string;
  subtitle?: string;
  date?: string;
  children: React.ReactNode;
  summaryStats?: { label: string; value: string | number }[];
  signatures?: string[];
  watermarkText?: string;
  id?: string;
  academyName?: string;
  academyCode?: string;
  academyAddress?: string;
  academyPhone?: string;
}

export const LetterheadPrint: React.FC<LetterheadPrintProps> = ({
  title,
  documentNo,
  subtitle,
  date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
  children,
  summaryStats,
  signatures = ['Prepared By (Accounts/Admin)', 'Checked & Verified By', 'Authorized Signatory / Principal'],
  watermarkText,
  id = 'printable-document',
  academyName: propAcadName,
  academyCode: propAcadCode,
  academyAddress: propAcadAddress,
  academyPhone: propAcadPhone,
}) => {
  const state = erpStorage.getState();
  const currentUser = getCurrentUser();
  const isDev = currentUser?.role === 'developer';

  const activeInst =
    INSTITUTIONS.find((i) => i.id === state.activeInstitutionId) || INSTITUTIONS[0];

  // Resolve Academy Name based on role and active scope
  const resolvedAcademyName: string =
    propAcadName ||
    (isDev
      ? (state.activeInstitutionId === 'all' ? 'All Academies Network' : activeInst?.academyName || activeInst?.name || 'Taleem Academy')
      : (currentUser?.academyName || activeInst?.academyName || activeInst?.name || 'Taleem Academy')) || 'Taleem Academy';

  const resolvedCode = propAcadCode || activeInst?.code || 'TAK-01';
  const resolvedAddress = propAcadAddress || activeInst?.address || 'Kandhkot, Sindh, Pakistan';
  const resolvedPhone = propAcadPhone || activeInst?.phone || '0300-1234567';
  const resolvedWatermark = watermarkText || `${resolvedAcademyName.toUpperCase()} OFFICIAL`;

  const emblemInitials = resolvedAcademyName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase() || 'TA';

  return (
    <div
      id={id}
      className="bg-white p-6 md:p-8 rounded-[16px] border border-slate-200 shadow-md relative overflow-hidden text-slate-800 print:border-none print:shadow-none print:p-0 print:m-0 print:overflow-visible"
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] print:opacity-[0.04] rotate-[-25deg]">
        <span className="text-7xl md:text-9xl font-black tracking-widest uppercase text-center">
          {resolvedWatermark}
        </span>
      </div>

      {/* Official Letterhead Header */}
      <div className="border-b-2 border-indigo-900/80 pb-4 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            {/* Academy Emblem / Logo */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-800 via-indigo-950 to-slate-950 text-white flex flex-col items-center justify-center shadow-lg border border-indigo-700/50 shrink-0">
              <span className="text-xl font-black tracking-tighter">{emblemInitials}</span>
              <span className="text-[8px] font-bold tracking-widest text-indigo-300 uppercase">
                {resolvedCode}
              </span>
            </div>

            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                {resolvedAcademyName}
              </h1>
              <p className="text-xs font-semibold text-indigo-700">
                Registered Higher Secondary, College & Technical Training Institute
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {resolvedAddress} &bull; Ph: {resolvedPhone}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Official Campus Code: {resolvedCode} &bull; Web: www.taleemos-hub.edu
              </p>
            </div>
          </div>

          {/* QR Code and Date box */}
          <div className="text-right sm:border-l border-slate-200 sm:pl-4 flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
            <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg inline-block">
              {/* Simulated QR matrix pattern */}
              <div className="w-14 h-14 bg-white p-1 grid grid-cols-5 gap-0.5 border border-slate-300">
                <div className="bg-slate-900 col-span-2 row-span-2" />
                <div className="bg-transparent" />
                <div className="bg-slate-900 col-span-2 row-span-2" />
                <div className="bg-transparent" />
                <div className="bg-slate-900" />
                <div className="bg-transparent" />
                <div className="bg-slate-900 col-span-2 row-span-2" />
                <div className="bg-transparent" />
                <div className="bg-slate-900" />
                <div className="bg-slate-900" />
              </div>
            </div>
            <div className="mt-1 text-right">
              {documentNo && (
                <div className="text-xs font-bold text-slate-900 font-mono">
                  Doc Ref: <span className="text-indigo-600">{documentNo}</span>
                </div>
              )}
              <div className="text-[10px] text-slate-500">Date: {date}</div>
            </div>
          </div>
        </div>

        {/* Document Title Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-4 bg-indigo-600 rounded-sm" />
              {title}
            </h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full">
            OFFICIAL RECORD
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="my-6 relative z-10">{children}</div>

      {/* Summary KPI boxes if provided */}
      {summaryStats && summaryStats.length > 0 && (
        <div className="my-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 relative z-10">
          {summaryStats.map((st, i) => (
            <div key={i} className="text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase">{st.label}</div>
              <div className="text-sm md:text-base font-black text-slate-900 font-mono mt-0.5">
                {st.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Official Signatures Row */}
      <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-3 gap-4 text-center relative z-10">
        {signatures.map((sig, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className="w-full max-w-[160px] border-b-2 border-slate-400 border-dashed mb-1.5" />
            <span className="text-[11px] font-bold text-slate-700">{sig}</span>
            <span className="text-[9px] text-slate-400">Authorized Signatory</span>
          </div>
        ))}
      </div>

      {/* Footer Notice */}
      <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
        <span>System Generated by {resolvedAcademyName} &bull; Powered by TaleemOS</span>
        <span>Valid without physical seal if verified via QR Code</span>
      </div>
    </div>
  );
};

export default LetterheadPrint;
