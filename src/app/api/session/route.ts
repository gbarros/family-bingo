// Session API routes: GET active session, POST create new session

import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveSession,
  createSession,
  getPlayersBySession,
  getDrawnNumbers,
} from '@/lib/db/queries';
import { broadcast } from '@/lib/sse/manager';
import type { CreateSessionRequest, GetSessionResponse } from '@/types/api';
import type { GameMode } from '@/types/game';

export const runtime = 'nodejs';

const VALID_GAME_MODES = new Set(['horizontal', 'vertical', 'diagonal', 'blackout']);

function normalizeGameMode(mode?: string | null): string | null {
  if (!mode) return null;
  const rawParts = mode.split(',').map(part => part.trim()).filter(Boolean);
  const parts: string[] = [];
  for (const part of rawParts) {
    if (!parts.includes(part)) parts.push(part);
  }

  if (parts.length === 0) return null;
  if (parts.some(part => !VALID_GAME_MODES.has(part))) return null;
  if (parts.includes('blackout') && parts.length > 1) return null;
  return parts.join(',');
}

/**
 * GET /api/session - Get active session with players and drawn numbers
 */
export async function GET() {
  try {
    const session = getActiveSession();

    if (!session) {
      return NextResponse.json<GetSessionResponse>(
        {
          success: true,
          session: null,
          players: [],
          drawnNumbers: [],
          currentNumber: null,
        },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const players = getPlayersBySession(session.id);
    const playersWithCards = players.map(p => ({
      ...p,
      card: JSON.parse(p.card_data),
    }));

    const drawnNumbersRecords = getDrawnNumbers(session.id);
    // Dedupe defensively (older DBs may contain duplicates)
    const drawnNumbers: number[] = [];
    const seen = new Set<number>();
    for (const r of drawnNumbersRecords) {
      if (!seen.has(r.number)) {
        seen.add(r.number);
        drawnNumbers.push(r.number);
      }
    }
    const currentNumber = drawnNumbers.length > 0 ? drawnNumbers[drawnNumbers.length - 1] : null;

    return NextResponse.json<GetSessionResponse>(
      {
        success: true,
        session: {
          id: session.id,
          status: session.status,
          gameMode: session.game_mode,
          createdAt: session.created_at,
          startedAt: session.started_at,
          finishedAt: session.finished_at,
          winnerPlayerId: session.winner_player_id,
        },
        players: playersWithCards,
        drawnNumbers,
        currentNumber,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[API] Error getting session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get session' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/session - Create new session
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateSessionRequest = await request.json();
    const { gameMode } = body;
    const normalizedGameMode = normalizeGameMode(gameMode);

    if (!normalizedGameMode) {
      return NextResponse.json(
        { success: false, error: 'Invalid game mode' },
        { status: 400 }
      );
    }

    const session = createSession(normalizedGameMode as GameMode);

    // Broadcast session created
    broadcast({
      type: 'gameStateChanged',
      data: { status: 'waiting', mode: normalizedGameMode },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      gameMode: session.game_mode,
    });
  } catch (error) {
    console.error('[API] Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
