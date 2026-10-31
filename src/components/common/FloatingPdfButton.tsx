import React, { useState } from 'react';
import { Download, Printer, CheckCircle2 } from 'lucide-react';
import { triggerBrowserPrint } from '../../lib/pdf';

interface FloatingPdfButtonProps {
  label?: string;
  targetId?: string;
  className?: string;
  onPrint?: () => void;
}

export const FloatingPdfButton: React.FC<FloatingPdfButtonProps> = ({
  label = 'Download as PDF',
  className = '',
  onPrint,
}) => {
  const [justPrinted, setJustPrinted] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setJustPrinted(true);
    setTimeout(() => setJustPrinted(false), 3000);
    if (onPrint) {
      onPrint();
    } else {
      triggerBrowserPrint();
    }
  };

  return (
    <div className={`fixed top-18 right-4 md:right-8 z-40 no-print ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        title="Trigger browser print/export to PDF for visible data"
        className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-full shadow-2xl border border-indigo-400/40 hover:border-indigo-300 transition-all duration-300 active:scale-95 cursor-pointer hover:shadow-indigo-500/25 backdrop-blur-md"
      >
        <div className="w-6 h-6 rounded-full bg-indigo-500/30 group-hover:bg-white/20 flex items-center justify-center transition">
          {justPrinted ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Printer className="w-3.5 h-3.5 text-indigo-300 group-hover:text-white" />
          )}
        </div>
        <span className="text-xs font-black tracking-wide hidden sm:inline">
          {justPrinted ? 'Opening Print...' : label}
        </span>
        <span className="text-[10px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded-full border border-white/10 text-indigo-200 group-hover:text-white hidden md:inline">
          PDF
        </span>
      </button>
    </div>
  );
};
