'use client';

import { getColumnLetter } from '@/lib/utils/helpers';

interface DrawnNumbersProps {
  numbers: number[];
}

export default function DrawnNumbers({ numbers }: DrawnNumbersProps) {
  if (numbers.length === 0) {
    return null;
  }

  return (
    <div className="card-elevated bg-ivory-warm rounded-xl p-4">
      <h3 className="text-lg font-display font-semibold text-cocoa mb-3">
        Números Sorteados ({numbers.length}/75)
      </h3>

      <div className="max-h-32 overflow-y-auto">
        <div className="flex flex-wrap gap-2">
          {numbers.map((num, index) => {
            const columnLetter = getColumnLetter(num);
            const isRecent = index >= numbers.length - 3;

            return (
              <div
                key={`${num}-${index}`}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded-md text-sm font-mono font-bold
                  ${isRecent ? 'bg-gold text-cocoa ring-2 ring-gold/60' : 'bg-forest-light text-ivory'}
                  transition-all duration-200
                `}
              >
                <span className="text-xs opacity-75">{columnLetter}</span>
                <span>{num}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
