// Session update API route: PATCH /api/session/[id]

import { NextRequest, NextResponse } from 'next/server';
import { updateSessionStatus, updateSessionGameMode } from '@/lib/db/queries';
import { broadcast } from '@/lib/sse/manager';
import type { UpdateSessionRequest } from '@/types/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PATCH /api/session/[id] - Update session status or game mode
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);
    if (isNaN(sessionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    const body: UpdateSessionRequest = await request.json();

    // Update status if provided
    if (body.status) {
      updateSessionStatus(sessionId, body.status, body.winnerId);

      broadcast({
        type: 'gameStateChanged',
        data: { status: body.status, mode: '' },
      });
    }

    // Update game mode if provided
    if (body.gameMode) {
      updateSessionGameMode(sessionId, body.gameMode);

      broadcast({
        type: 'gameStateChanged',
        data: { status: '', mode: body.gameMode },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error updating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
