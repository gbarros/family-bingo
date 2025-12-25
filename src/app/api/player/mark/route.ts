// Player mark number API: POST /api/player/mark

import { NextRequest, NextResponse } from 'next/server';
import { togglePlayerMarking } from '@/lib/db/queries';
import type { MarkNumberRequest, MarkNumberResponse } from '@/types/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/player/mark - Mark or unmark a number on player's card
 */
export async function POST(request: NextRequest) {
  try {
    const body: MarkNumberRequest = await request.json();
    const { playerId, position, marked } = body;

    if (playerId === undefined || position === undefined || marked === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (position < 0 || position > 24) {
      return NextResponse.json(
        { success: false, error: 'Invalid position' },
        { status: 400 }
      );
    }

    // Update marking in database
    togglePlayerMarking(playerId, position, marked);

    return NextResponse.json<MarkNumberResponse>({
      success: true,
    });
  } catch (error) {
    console.error('[API] Error marking number:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark number' },
      { status: 500 }
    );
  }
}
