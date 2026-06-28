import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface HelpBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export default function HelpBottomSheet({ isOpen, onClose, title, content }: HelpBottomSheetProps) {
  // Prevent body scrolling when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide up sheet */}
      <div className="relative w-full max-w-lg bg-stone-50 border-t border-stone-250 rounded-t-2xl px-5 pb-8 pt-5 shadow-2xl z-10 transition-transform duration-300 transform translate-y-0 flex flex-col space-y-4 max-h-[85vh] overflow-y-auto">
        {/* Notch indicator */}
        <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto shrink-0 cursor-pointer" onClick={onClose} />

        {/* Header */}
        <div className="flex justify-between items-center border-b border-stone-200 pb-2 shrink-0">
          <h3 className="font-bold text-sm text-stone-850 uppercase tracking-wide flex items-center">
            <span>💡 Ausfüll-Hilfe:</span>
            <span className="ml-1.5 text-brandpink-600 normal-case">{title}</span>
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-stone-200 text-stone-500 hover:text-stone-900 border border-stone-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto text-xs text-stone-700 leading-relaxed font-medium whitespace-pre-line py-1">
          {content}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 bg-brandpink-600 hover:bg-brandpink-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors shrink-0"
        >
          Verstanden
        </button>
      </div>
    </div>
  );
}
