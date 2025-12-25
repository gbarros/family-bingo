// Draw number API: POST /api/draw

import { NextResponse } from 'next/server';
import { getActiveSession, getDrawnNumbersSet, addDrawnNumber, getDrawnNumbers } from '@/lib/db/queries';
import { drawRandomNumber } from '@/lib/game/numberDrawer';
import { broadcast } from '@/lib/sse/manager';
import type { DrawNumberResponse } from '@/types/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/draw - Draw next random number
 */
export async function POST() {
  try {
    // Get active session
    const session = getActiveSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No active session' },
        { status: 404 }
      );
    }

    if (session.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Game is not active' },
        { status: 400 }
      );
    }

    // Draw + insert in a small loop to avoid duplicates under rapid clicks/races.
    let newNumber: number | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const drawnSet = getDrawnNumbersSet(session.id);
      newNumber = drawRandomNumber(drawnSet);
      if (newNumber === null) break;

      const result = addDrawnNumber(session.id, newNumber);
      // If INSERT OR IGNORE didn't insert (duplicate), retry.
      if (result.id !== 0) break;
      newNumber = null;
    }

    if (newNumber === null) {
      return NextResponse.json(
        { success: false, error: 'All numbers have been drawn' },
        { status: 400 }
      );
    }

    // Get updated drawn numbers list
    const drawnRecords = getDrawnNumbers(session.id);
    const drawnNumbers = drawnRecords.map(d => d.number);

    // Broadcast to all clients
    broadcast({
      type: 'numberDrawn',
      data: { number: newNumber, timestamp: Date.now() },
    });

    return NextResponse.json<DrawNumberResponse>({
      success: true,
      number: newNumber,
      drawnNumbers,
    });
  } catch (error) {
    console.error('[API] Error drawing number:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to draw number' },
      { status: 500 }
    );
  }
}
