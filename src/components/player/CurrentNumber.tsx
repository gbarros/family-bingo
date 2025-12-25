'use client';

import { useEffect, useState } from 'react';
import { getColumnLetter } from '@/lib/utils/helpers';

interface CurrentNumberProps {
  number: number | null;
}

export default function CurrentNumber({ number }: CurrentNumberProps) {
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
    <div className="card-elevated-lg bg-crimson rounded-2xl p-5 sm:p-8 text-center border-4 border-gold glow-pulse overflow-hidden">
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
          ❄ Marque em sua cartela ❄
        </span>
      </div>
    </div>
  );
}
