'use client';

import { ReactNode } from 'react';

interface ViewOverlayProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  minimal?: boolean;
}

export default function ViewOverlay({ title, isOpen, onClose, children, minimal = false }: ViewOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-cocoa-dark animate-in fade-in duration-200">
      {/* Absolute Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 rounded-full bg-ivory/10 flex items-center justify-center text-ivory hover:bg-ivory/20 transition-all z-[60] backdrop-blur-sm border border-ivory/10 hover:scale-110"
        aria-label="Fechar"
      >
        <span className="text-2xl font-bold">✕</span>
      </button>

      {!minimal && (
        <div className="px-8 pt-8 md:px-12 md:pt-12 shrink-0">
          <h2 className="text-3xl font-display font-bold text-gold-light uppercase tracking-widest">{title}</h2>
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 overflow-auto ${minimal ? 'p-4' : 'px-8 pb-8 md:px-12 md:pb-12'}`}>
        <div className="max-w-7xl mx-auto min-h-full">
          {children}
        </div>
      </div>
    </div>
  );
}
