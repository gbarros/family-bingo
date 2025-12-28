'use client';

import { useState } from 'react';
import type { GameMode, GameStatus } from '@/types/game';

interface GameControlsProps {
  sessionStatus: GameStatus | null;
  currentMode: GameMode;
  sessionId: string | number | null;
  onCreateSession: (mode: GameMode) => void;
  onStartGame: () => void;
  onDrawNumber: () => void;
  onChangeMode: (mode: GameMode) => void;
  onNewGame: () => void;
  drawnCount: number;
  totalNumbers: number;
  drawing?: boolean;
  className?: string;
}

export default function GameControls({
  sessionStatus,
  currentMode,
  sessionId,
  onCreateSession,
  onStartGame,
  onDrawNumber,
  onChangeMode,
  onNewGame,
  drawnCount,
  totalNumbers,
  drawing = false,
  className = '',
}: GameControlsProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>(currentMode);

  const handleModeChange = (mode: string) => {
    let newModeStr = '';
    const currentModes = selectedMode ? selectedMode.split(',') : [];

    if (mode === 'blackout') {
      // Blackout is exclusive: selecting it clears others. Deselecting it clears itself.
      if (currentModes.includes('blackout')) {
        newModeStr = '';
      } else {
        newModeStr = 'blackout';
      }
    } else {
      // Line modes
      // If currently blackout, clear it first
      const activeModes = currentModes.includes('blackout') ? [] : [...currentModes];
      
      if (activeModes.includes(mode)) {
        // Remove
        const filtered = activeModes.filter((m) => m !== mode);
        newModeStr = filtered.join(',');
      } else {
        // Add
        activeModes.push(mode);
        newModeStr = activeModes.join(',');
      }
    }

    setSelectedMode(newModeStr);
    if (sessionId && newModeStr) {
      onChangeMode(newModeStr);
    }
  };

  const gameModes: { value: string; label: string }[] = [
    { value: 'horizontal', label: 'Linha Horizontal' },
    { value: 'vertical', label: 'Linha Vertical' },
    { value: 'diagonal', label: 'Diagonal' },
    { value: 'blackout', label: 'Cartela Cheia' },
  ];

  return (
    <div className={`card-elevated-lg bg-cocoa-light rounded-xl p-3 sm:p-6 space-y-3 sm:space-y-4 ${className}`}>
      <h2 className="text-lg sm:text-2xl font-display font-bold text-gold-light mb-2 sm:mb-4">
        Controles do Jogo
      </h2>

      {/* Session status */}
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-ivory font-sans text-sm sm:text-base">Status:</span>
        <span
          className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold ${
            sessionStatus === 'active'
              ? 'bg-forest-light text-ivory'
              : sessionStatus === 'waiting'
              ? 'bg-gold text-cocoa'
              : 'bg-crimson text-ivory'
          }`}
        >
          {sessionStatus === 'active'
            ? '▶ Ativo'
            : sessionStatus === 'waiting'
            ? '⏸ Aguardando'
            : '⏹ Finalizado'}
        </span>
      </div>

      {/* Game mode selector - compact on mobile */}
      <div>
        <label className="block text-ivory font-sans font-semibold mb-1 sm:mb-2 text-xs sm:text-base">
          Modo de Jogo
        </label>
        <div className="grid grid-cols-2 gap-1 sm:gap-2">
          {gameModes.map((mode) => {
            const isActive = selectedMode.split(',').includes(mode.value);
            return (
              <button
                key={mode.value}
                onClick={() => handleModeChange(mode.value)}
                className={`
                  px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-sans font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1 sm:gap-2
                  ${
                    isActive
                      ? 'bg-gold text-cocoa-dark ring-2 ring-gold-light shadow-md'
                      : 'bg-cocoa text-ivory border border-gold/50 hover:border-gold-light'
                  }
                `}
              >
                {isActive && <span>✓</span>}
                <span className="truncate">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress - compact */}
      {drawnCount > 0 && (
        <div>
          <div className="flex justify-between text-xs sm:text-sm text-ivory-warm mb-1">
            <span>Sorteados</span>
            <span className="font-mono font-bold">
              {drawnCount}/{totalNumbers}
            </span>
          </div>
          <div className="w-full bg-cocoa-dark rounded-full h-2 sm:h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
              style={{ width: `${(drawnCount / totalNumbers) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Action buttons - prominent on mobile */}
      <div className="grid grid-cols-1 gap-2 sm:gap-3 pt-2 sm:pt-4">
        {(!sessionId || !sessionStatus) && (
          <button
            onClick={() => onCreateSession(selectedMode)}
            className="btn btn-secondary py-3 sm:py-4 text-sm sm:text-base"
          >
            ✨ Criar Nova Sessão
          </button>
        )}

        {sessionId && sessionStatus === 'waiting' && (
          <button
            onClick={onStartGame}
            className="btn btn-primary py-3 sm:py-4 text-sm sm:text-base"
          >
            ▶ Iniciar Jogo
          </button>
        )}

        {sessionId && sessionStatus === 'active' && (
          <>
            <button
              onClick={onDrawNumber}
              disabled={drawing || drawnCount >= totalNumbers}
              className="btn btn-primary text-lg sm:text-xl py-4 sm:py-6 glow-pulse disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {drawing ? '🎲 Sorteando...' : '🎲 SORTEAR'}
            </button>
          </>
        )}

        {sessionId && (sessionStatus === 'finished' || sessionStatus === 'active') && (
          <button
            onClick={onNewGame}
            className="btn btn-secondary py-2 sm:py-4 text-sm"
          >
            🔄 Novo Jogo
          </button>
        )}
      </div>
    </div>
  );
}
