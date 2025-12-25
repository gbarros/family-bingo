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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    if (!gameMode || !['horizontal', 'vertical', 'diagonal', 'blackout'].includes(gameMode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid game mode' },
        { status: 400 }
      );
    }

    const session = createSession(gameMode as GameMode);

    // Broadcast session created
    broadcast({
      type: 'gameStateChanged',
      data: { status: 'waiting', mode: gameMode },
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
