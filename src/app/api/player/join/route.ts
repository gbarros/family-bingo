// Player join API: POST /api/player/join

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getActiveSession, createPlayer, getPlayersBySession } from '@/lib/db/queries';
import { generateCard } from '@/lib/game/cardGenerator';
import { broadcast } from '@/lib/sse/manager';
import type { JoinSessionRequest, JoinSessionResponse } from '@/types/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/player/join - Join active session with a name
 */
export async function POST(request: NextRequest) {
  try {
    const body: JoinSessionRequest = await request.json();
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Get active session
    const session = getActiveSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No active session. Wait for coordinator to start a game.' },
        { status: 404 }
      );
    }

    // Generate unique client ID
    const clientId = uuidv4();

    // Generate bingo card
    const card = generateCard();

    // Create player
    const player = createPlayer(session.id, name.trim(), clientId, card);

    // Get player count
    const players = getPlayersBySession(session.id);

    // Broadcast player joined
    await broadcast({
      type: 'playerJoined',
      data: { name: player.name, playerCount: players.length },
    });

    return NextResponse.json<JoinSessionResponse>({
      success: true,
      playerId: player.id,
      clientId: player.client_id,
      card,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('[API] Error joining session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join session' },
      { status: 500 }
    );
  }
}
