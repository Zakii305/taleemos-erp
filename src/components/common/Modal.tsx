import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  maxWidth = 'max-w-3xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  return (
    // 1. Outer Wrapper: Removed 'no-print', added 'print:static' to fix positioning on paper
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center items-center overflow-y-auto overscroll-contain touch-pan-y print:static print:block print:overflow-visible print:h-auto print:w-auto print:inset-auto">
      
      {/* 2. Backdrop: Hidden on print */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 print:hidden"
        onClick={onClose}
      />

      {/* 3. Modal Dialog Box: Removed shadows/borders on print */}
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-t-[28px] md:rounded-[24px] shadow-2xl border border-slate-200/80 max-h-[90vh] flex flex-col z-10 transform transition-all duration-300 my-0 md:my-8 overflow-hidden overscroll-contain print:shadow-none print:border-none print:m-0 print:max-h-none print:overflow-visible`}
      >
        {/* 4. Header: Hidden on print */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-7 rounded-full bg-indigo-600 print:hidden" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
                {badge && (
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 rounded-md print:hidden">
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5 print:hidden">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5. Content Body: Removed padding and overflow restrictions on print */}
        <div className="p-6 overflow-y-auto flex-1 overscroll-contain touch-pan-y print:p-0 print:overflow-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
