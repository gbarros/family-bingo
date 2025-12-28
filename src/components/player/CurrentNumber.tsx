'use client';

import { useEffect, useState } from 'react';
import { getColumnLetter } from '@/lib/utils/helpers';

interface CurrentNumberProps {
  number: number | null;
  onExpand?: () => void;
  onAction?: () => void;
  disabled?: boolean;
}

export default function CurrentNumber({ number, onExpand, onAction, disabled }: CurrentNumberProps) {
  const [animationKey, setAnimationKey] = useState(0);

  // Trigger animation when number changes
  useEffect(() => {
    if (number !== null) {
      setAnimationKey((prev) => prev + 1);
    }
  }, [number]);

  if (number === null) {
    return (
      <div className="card-elevated-lg bg-ivory-warm rounded-2xl p-6 text-center">
        <p className="text-lg font-display text-cocoa-light">
          Aguardando próximo número...
        </p>
      </div>
    );
  }

  const columnLetter = getColumnLetter(number);

  return (
    <div 
      className={`card-elevated-lg bg-crimson rounded-2xl p-5 sm:p-8 text-center border-4 border-gold glow-pulse overflow-hidden relative group transition-all ${
        onAction && !disabled ? 'cursor-pointer active:scale-95 hover:brightness-110' : ''
      } ${disabled ? 'opacity-80' : ''}`}
      onClick={() => !disabled && onAction?.()}
    >
      {onExpand && (
        <button
          onClick={onExpand}
          className="absolute top-4 right-4 text-gold-light/40 hover:text-gold-light transition-all transform hover:scale-110 opacity-0 group-hover:opacity-100"
          title="Focar no Número"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
        </button>
      )}
      <div className="mb-2">
        <span className="text-2xl font-display font-semibold text-gold-light uppercase tracking-widest">
          Número Atual
        </span>
      </div>

      {/* Dramatic number display */}
      <div key={animationKey} className="number-draw">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 my-3 sm:my-4">
          {/* Column letter */}
          <span className="text-5xl sm:text-6xl md:text-7xl font-display font-bold text-gold shine leading-none">
            {columnLetter}
          </span>

          {/* Number */}
          <span className="text-6xl sm:text-8xl md:text-9xl font-mono font-extrabold text-ivory leading-none">
            {number}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <span className="text-lg font-sans text-ivory font-semibold">
          {onAction ? '⚡ Clique para Sorteio ⚡' : '❄ Marque em sua cartela ❄'}
        </span>
      </div>
    </div>
  );
}
