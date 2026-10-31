import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPIStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  gradient: string; // e.g. "from-indigo-600 to-blue-500"
  glowColor?: string; // e.g. "bg-indigo-500/20"
  onClick?: () => void;
}

export const KPIStatCard: React.FC<KPIStatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon: Icon,
  gradient,
  glowColor = 'bg-indigo-500/20',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative group overflow-hidden rounded-[22px] p-5 bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Background soft ambient blur glow */}
      <div
        className={`absolute -right-8 -bottom-8 w-28 h-28 rounded-full ${glowColor} blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none`}
      />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
              {value}
            </span>
            {change && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isPositive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                }`}
              >
                {change}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>

        <div
          className={`w-12 h-12 rounded-[16px] bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 shrink-0`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>TaleemOS Live Sync</span>
        <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">
          Tap to view &rarr;
        </span>
      </div>
    </div>
  );
};
