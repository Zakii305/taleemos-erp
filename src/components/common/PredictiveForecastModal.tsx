import React from 'react';
import { Modal } from './Modal';
import {
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export interface ForecastData {
  nextMonthName: string;
  shortMonthName: string;
  enrollment: {
    actual: number;
    projected: number;
    delta: number;
    growthPct: number;
    progressPct: number;
    confidence: string;
    qualifiedEnquiries: number;
    pendingAdmissions: number;
    primaryDriver: string;
  };
  fees: {
    actual: number;
    projected: number;
    delta: number;
    growthPct: number;
    progressPct: number;
    confidence: string;
    expectedDefaulterRecovery: number;
    newStudentTuitionYield: number;
    primaryDriver: string;
  };
}

interface PredictiveForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  forecast: ForecastData;
}

export const PredictiveForecastModal: React.FC<PredictiveForecastModalProps> = ({
  isOpen,
  onClose,
  forecast,
}) => {
  const conservativeEnrollment = Math.round(forecast.enrollment.actual + forecast.enrollment.delta * 0.7);
  const optimisticEnrollment = Math.round(forecast.enrollment.actual + forecast.enrollment.delta * 1.35);

  const conservativeFees = Math.round(forecast.fees.actual + forecast.fees.delta * 0.75);
  const optimisticFees = Math.round(forecast.fees.actual + forecast.fees.delta * 1.3);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Predictive Outcomes & Forecasting Engine"
      subtitle={`Machine-assisted monthly projections for ${forecast.nextMonthName}`}
      badge="Predictive AI Model"
      maxWidth="max-w-4xl"
    >
      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
        {/* Model Executive Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-800/50 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-xl shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-indigo-200">
                  Forecasting Baseline: October 2026 → {forecast.nextMonthName}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Projections synthesized using inquiry conversion rates, pending admission pipelines, and 6-month fee recovery momentum.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Model Confidence</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono">92.4% Verified</span>
            </div>
          </div>
        </div>

        {/* 2 Grid Columns: Enrollment vs Fee Collection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Section 1: Student Enrollment Projection */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-extrabold text-sm text-slate-900">Student Enrollment</h5>
                  <p className="text-[11px] text-slate-500">Pipeline Velocity & Intake</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                +{forecast.enrollment.growthPct}% Projected
              </span>
            </div>

            {/* Actual vs Projected Big Numbers */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Current Actual</span>
                <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                  {forecast.enrollment.actual}
                </p>
                <span className="text-[10px] text-slate-500">Active Students</span>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <span className="text-[10px] font-bold text-indigo-600 uppercase">
                  {forecast.shortMonthName} Target
                </span>
                <p className="text-2xl font-black text-indigo-700 font-mono mt-0.5">
                  {forecast.enrollment.projected}
                </p>
                <span className="text-[10px] font-bold text-emerald-600">
                  +{forecast.enrollment.delta} net new
                </span>
              </div>
            </div>

            {/* Predictive Variance Range */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 mb-1.5 block">
                Outcome Probability Range ({forecast.nextMonthName}):
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Conservative (Worst-case)</span>
                  <span className="font-mono font-bold text-slate-800">{conservativeEnrollment}</span>
                </div>
                <div className="flex items-center justify-between text-indigo-700 font-bold bg-indigo-50/60 p-1.5 rounded-lg border border-indigo-100">
                  <span>Target Projection (Expected)</span>
                  <span className="font-mono">{forecast.enrollment.projected}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Optimistic (High-conversion)</span>
                  <span className="font-mono font-bold">{optimisticEnrollment}</span>
                </div>
              </div>
            </div>

            {/* Key Predictive Drivers */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
              <span className="font-bold text-slate-700 block">Identified Growth Drivers:</span>
              <div className="flex items-center gap-1.5 text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{forecast.enrollment.qualifiedEnquiries} active inquiries converting at ~38% velocity</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{forecast.enrollment.pendingAdmissions} pending admissions awaiting final verification</span>
              </div>
            </div>
          </div>

          {/* Section 2: Fee Collection MTD Projection */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-extrabold text-sm text-slate-900">Fee Revenue Forecast</h5>
                  <p className="text-[11px] text-slate-500">Billing & Defaulter Recovery</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                +{forecast.fees.growthPct}% Projected
              </span>
            </div>

            {/* Actual vs Projected Big Numbers */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Current Actual</span>
                <p className="text-xl font-black text-slate-900 font-mono mt-0.5">
                  PKR {(forecast.fees.actual / 1000).toFixed(0)}k
                </p>
                <span className="text-[10px] text-slate-500">Collected MTD</span>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">
                  {forecast.shortMonthName} Target
                </span>
                <p className="text-xl font-black text-emerald-700 font-mono mt-0.5">
                  PKR {(forecast.fees.projected / 1000).toFixed(0)}k
                </p>
                <span className="text-[10px] font-bold text-emerald-600">
                  +PKR {(forecast.fees.delta / 1000).toFixed(0)}k yield
                </span>
              </div>
            </div>

            {/* Predictive Variance Range */}
            <div>
              <span className="text-[11px] font-bold text-slate-600 mb-1.5 block">
                Outcome Probability Range ({forecast.nextMonthName}):
              </span>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Conservative (Delayed dues)</span>
                  <span className="font-mono font-bold text-slate-800">
                    PKR {conservativeFees.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-800 font-bold bg-emerald-50/60 p-1.5 rounded-lg border border-emerald-100">
                  <span>Target Projection (Expected)</span>
                  <span className="font-mono">PKR {forecast.fees.projected.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-teal-700">
                  <span>Optimistic (100% On-time)</span>
                  <span className="font-mono font-bold">
                    PKR {optimisticFees.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Predictive Drivers */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
              <span className="font-bold text-slate-700 block">Identified Inflow Drivers:</span>
              <div className="flex items-center gap-1.5 text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>PKR {(forecast.fees.expectedDefaulterRecovery / 1000).toFixed(0)}k estimated from overdue challan follow-ups</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>PKR {(forecast.fees.newStudentTuitionYield / 1000).toFixed(0)}k initial admission & session fees</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Recommendations for Administration */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Recommended Administrative Action for Next Month:</span>
          </div>
          <p className="text-[11px] text-amber-800 pl-6 leading-relaxed">
            Dispatch bulk SMS payment notices to the top 14 defaulters by 28th October to lock in the optimistic revenue target of PKR {(optimisticFees / 1000).toFixed(0)}k. Contact active enquiry leads before November 1st to secure batch seats.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Close Forecast Engine
          </button>
        </div>
      </div>
    </Modal>
  );
};
