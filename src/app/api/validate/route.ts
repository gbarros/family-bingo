// Validate bingo API: POST /api/validate

import { NextRequest, NextResponse } from 'next/server';
import {
  getPlayerById,
  getPlayerMarkingsArray,
  getActiveSession,
  updateSessionStatus,
} from '@/lib/db/queries';
import { validateBingo, getWinningPattern } from '@/lib/game/validator';
import { broadcast } from '@/lib/sse/manager';
import type { ValidateBingoRequest, ValidateBingoResponse } from '@/types/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/validate - Validate if player has BINGO
 */
export async function POST(request: NextRequest) {
  try {
    const body: ValidateBingoRequest = await request.json();
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json(
        { success: false, error: 'Player ID is required' },
        { status: 400 }
      );
    }

    // Get player
    const player = getPlayerById(playerId);
    if (!player) {
      return NextResponse.json(
        { success: false, error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get active session
    const session = getActiveSession();
    if (!session || session.id !== player.session_id) {
      return NextResponse.json(
        { success: false, error: 'Session not active' },
        { status: 404 }
      );
    }

    // Get player's card and markings
    const card = JSON.parse(player.card_data);
    const markings = getPlayerMarkingsArray(playerId);

    // Validate bingo
    const isValid = validateBingo(card, markings, session.game_mode);

    if (isValid) {
      // Update session as finished with winner
      updateSessionStatus(session.id, 'finished', playerId);

      // Get winning pattern description
      const winningPattern = getWinningPattern(card, markings, session.game_mode);

      // Broadcast game ended
      broadcast({
        type: 'gameEnded',
        data: { winner: player.name, playerName: player.name },
      });

      return NextResponse.json<ValidateBingoResponse>({
        success: true,
        isValid: true,
        playerName: player.name,
        card,
        markings,
        winningPattern: winningPattern || undefined,
      });
    } else {
      return NextResponse.json<ValidateBingoResponse>({
        success: true,
        isValid: false,
      });
    }
  } catch (error) {
    console.error('[API] Error validating bingo:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate bingo' },
      { status: 500 }
    );
  }
}
