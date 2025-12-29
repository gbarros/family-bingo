'use client';

import { useEffect, useState } from 'react';
import { getColumnLetter } from '@/lib/utils/helpers';

interface CurrentNumberProps {
  number: number | null;
  onExpand?: () => void;
  onAction?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'focus';
}

export default function CurrentNumber({
  number,
  onExpand,
  onAction,
  disabled,
  className = '',
  variant = 'default'
}: CurrentNumberProps) {
  const [animationKey, setAnimationKey] = useState(0);

  // Trigger animation when number changes
  useEffect(() => {
    if (number !== null) {
      setAnimationKey((prev) => prev + 1);
    }
  }, [number]);

  if (number === null) {
    return (
      <div className={`card-elevated-lg bg-ivory-warm rounded-2xl p-6 text-center ${className}`}>
        <p className="text-lg font-display text-cocoa-light">
          Aguardando próximo número...
        </p>
      </div>
    );
  }

  const columnLetter = getColumnLetter(number);
  const isFocus = variant === 'focus';

  const paddingClass = isFocus
    ? 'px-[clamp(0.75rem,3cqi,2rem)] py-[clamp(0.75rem,3cqi,2rem)]'
    : 'px-[clamp(0.8rem,3.6cqi,2.6rem)] py-[clamp(0.6rem,2.8cqi,2.2rem)]';
  const titleSizeClass = isFocus
    ? 'text-[clamp(1.1rem,5.8cqi,3.2rem)]'
    : 'text-[clamp(0.85rem,3.2cqi,1.9rem)]';
  const letterSizeClass = isFocus
    ? 'text-[clamp(3rem,20cqi,10.5rem)]'
    : 'text-[clamp(2.2rem,9cqi,6.2rem)]';
  const numberSizeClass = isFocus
    ? 'text-[clamp(5rem,36cqi,17rem)]'
    : 'text-[clamp(3.6rem,14.5cqi,10rem)]';
  const footerSizeClass = isFocus
    ? 'text-[clamp(1rem,4.2cqi,2.3rem)]'
    : 'text-[clamp(0.75rem,2.8cqi,1.4rem)]';
  const titleMarginClass = isFocus ? 'mb-[clamp(0.15rem,1.2cqi,0.7rem)]' : 'mb-[clamp(0.2rem,1.6cqi,0.9rem)]';
  const numberGapClass = isFocus ? 'gap-[clamp(0.5rem,3cqi,2.2rem)]' : 'gap-[clamp(0.4rem,2.2cqi,1.6rem)]';
  const numberMarginClass = isFocus ? 'my-[clamp(0.15rem,2.2cqi,1.1rem)]' : 'my-[clamp(0.25rem,2.4cqi,1.4rem)]';
  const footerMarginClass = isFocus ? 'mt-[clamp(0.1rem,1.2cqi,0.7rem)]' : 'mt-[clamp(0.2rem,1.6cqi,0.9rem)]';

  return (
    <div 
      className={`card-elevated-lg sheen bg-gradient-to-br from-crimson-dark via-crimson to-crimson-light rounded-xl ${paddingClass} text-center border-2 border-gold/80 glow-pulse overflow-hidden relative group transition-all ${className} ${
        onAction && !disabled ? 'cursor-pointer active:scale-95 hover:brightness-110' : ''
      } ${disabled ? 'opacity-80' : ''}`}
      onClick={() => !disabled && onAction?.()}
      style={{ containerType: 'inline-size' }}
    >
      {onExpand && (
        <button
          onClick={onExpand}
          className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 text-gold-light/40 hover:text-gold-light transition-all transform hover:scale-110 opacity-0 group-hover:opacity-100"
          title="Focar no Número"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
        </button>
      )}
      <div className={titleMarginClass}>
        <span className={`${titleSizeClass} font-display font-semibold text-gold-light uppercase tracking-[0.22em] leading-tight`}>
          Número Atual
        </span>
      </div>

      {/* Dramatic number display - always horizontal */}
      <div key={animationKey} className="number-draw">
        <div className={`flex flex-row items-baseline justify-center ${numberGapClass} ${numberMarginClass}`}>
          {/* Column letter */}
          <span className={`${letterSizeClass} font-display font-bold text-shimmer leading-none`}>
            {columnLetter}
          </span>

          {/* Number */}
          <span className={`${numberSizeClass} font-mono font-extrabold text-ivory leading-none`}>
            {number}
          </span>
        </div>
      </div>

      <div className={footerMarginClass}>
        <span className={`${footerSizeClass} font-sans text-ivory font-semibold leading-tight`}>
          {onAction ? '⚡ Clique para Sorteio ⚡' : '❄ Marque em sua cartela ❄'}
        </span>
      </div>
    </div>
  );
}
