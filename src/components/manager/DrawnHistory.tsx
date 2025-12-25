'use client';

import { getColumnLetter } from '@/lib/utils/helpers';
import { COLUMN_LETTERS } from '@/lib/utils/constants';

interface DrawnHistoryProps {
  numbers: number[];
}

export default function DrawnHistory({ numbers }: DrawnHistoryProps) {
  if (numbers.length === 0) {
    return (
      <div className="card-elevated bg-cocoa-light rounded-xl p-6 text-center">
        <p className="text-ivory font-sans text-lg">
          Nenhum número sorteado ainda
        </p>
      </div>
    );
  }

  // Group numbers by column
  const byColumn: Record<string, number[]> = {
    B: [],
    I: [],
    N: [],
    G: [],
    O: [],
  };

  numbers.forEach((num) => {
    const column = getColumnLetter(num);
    if (byColumn[column]) {
      byColumn[column].push(num);
    }
  });

  const columnColors: Record<string, string> = {
    B: 'bg-forest text-ivory',
    I: 'bg-crimson text-ivory',
    N: 'bg-gold text-cocoa',
    G: 'bg-forest-light text-ivory',
    O: 'bg-crimson-light text-ivory',
  };

  const recentSet = new Set(numbers.slice(-5));

  return (
    <div className="card-elevated-lg bg-cocoa-light rounded-xl p-6">
      <h2 className="text-2xl font-display font-bold text-gold-light mb-4">
        Números Sorteados ({numbers.length}/75)
      </h2>

      {/* By column view */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
        {COLUMN_LETTERS.map((letter) => (
          <div key={letter}>
            <div
              className={`text-center font-display font-bold text-2xl mb-2 ${
                columnColors[letter]
              } rounded-lg py-2`}
            >
              {letter}
            </div>
            <div className="space-y-1">
              {byColumn[letter].map((num, i) => {
                const isRecent = recentSet.has(num);
                return (
                  <div
                    key={`${letter}-${num}-${i}`}
                    className={`
                      text-center py-2 rounded font-mono font-bold text-lg
                      transition-all
                      ${
                        isRecent
                          ? `${columnColors[letter]} ring-2 ring-gold/50`
                          : 'bg-cocoa text-ivory'
                      }
                    `}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Latest numbers */}
      <div className="mt-6 pt-6 border-t border-gold/30">
        <p className="text-ivory text-sm font-sans font-semibold mb-2">
          Últimos 10 sorteados:
        </p>
        <div className="flex flex-wrap gap-2">
          {numbers.slice(-10).reverse().map((num, i) => {
            const letter = getColumnLetter(num);
            return (
              <div
                key={`recent-${num}-${i}`}
                className={`${columnColors[letter]} px-3 py-1 rounded-lg font-mono font-bold`}
              >
                {letter}-{num}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
