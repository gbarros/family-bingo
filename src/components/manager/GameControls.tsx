'use client';

import { useState } from 'react';
import type { GameMode, GameStatus } from '@/types/game';

interface GameControlsProps {
  sessionStatus: GameStatus | null;
  currentMode: GameMode;
  sessionId: number | null;
  onCreateSession: (mode: GameMode) => void;
  onStartGame: () => void;
  onDrawNumber: () => void;
  onChangeMode: (mode: GameMode) => void;
  onNewGame: () => void;
  drawnCount: number;
  totalNumbers: number;
  drawing?: boolean;
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
}: GameControlsProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>(currentMode);

  const handleModeChange = (mode: GameMode) => {
    setSelectedMode(mode);
    if (sessionId) {
      onChangeMode(mode);
    }
  };

  const gameModes: { value: GameMode; label: string }[] = [
    { value: 'horizontal', label: 'Linha Horizontal' },
    { value: 'vertical', label: 'Linha Vertical' },
    { value: 'diagonal', label: 'Diagonal' },
    { value: 'blackout', label: 'Cartela Cheia' },
  ];

  return (
    <div className="card-elevated-lg bg-cocoa-light rounded-xl p-6 space-y-4">
      <h2 className="text-2xl font-display font-bold text-gold-light mb-4">
        Controles do Jogo
      </h2>

      {/* Session status */}
      <div className="flex items-center gap-3">
        <span className="text-ivory font-sans">Status:</span>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
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

      {/* Game mode selector */}
      <div>
        <label className="block text-ivory font-sans font-semibold mb-2">
          Modo de Jogo
        </label>
        <div className="grid grid-cols-2 gap-2">
          {gameModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => handleModeChange(mode.value)}
              className={`
                px-4 py-2 rounded-lg font-sans font-bold text-sm transition-all
                ${
                  selectedMode === mode.value
                    ? 'bg-gold text-cocoa-dark ring-2 ring-gold-light shadow-md'
                    : 'bg-cocoa text-ivory border-2 border-gold hover:border-gold-light hover:bg-cocoa-dark hover:ring-2 hover:ring-gold/20'
                }
              `}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      {drawnCount > 0 && (
        <div>
          <div className="flex justify-between text-sm text-ivory-warm mb-1">
            <span>Números Sorteados</span>
            <span className="font-mono font-bold">
              {drawnCount}/{totalNumbers}
            </span>
          </div>
          <div className="w-full bg-cocoa-dark rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
              style={{ width: `${(drawnCount / totalNumbers) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 pt-4">
        {!sessionId && (
          <button
            onClick={() => onCreateSession(selectedMode)}
            className="col-span-2 btn btn-secondary"
          >
            ✨ Criar Nova Sessão
          </button>
        )}

        {sessionId && sessionStatus === 'waiting' && (
          <button
            onClick={onStartGame}
            className="col-span-2 btn btn-primary"
          >
            ▶ Iniciar Jogo
          </button>
        )}

        {sessionId && sessionStatus === 'active' && (
          <>
            <button
              onClick={onDrawNumber}
              disabled={drawing || drawnCount >= totalNumbers}
              className="col-span-2 btn btn-primary text-xl py-4 glow-pulse disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {drawing ? '🎲 Sorteando...' : '🎲 Sortear Número'}
            </button>
          </>
        )}

        {sessionId && (sessionStatus === 'finished' || sessionStatus === 'active') && (
          <button
            onClick={onNewGame}
            className="col-span-2 btn btn-secondary"
          >
            🔄 Novo Jogo
          </button>
        )}
      </div>
    </div>
  );
}
