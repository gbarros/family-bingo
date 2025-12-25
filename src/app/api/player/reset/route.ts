// Player reset API: POST /api/player/reset
// Deletes the player record + markings for this device (clientId).

import { NextRequest, NextResponse } from 'next/server';
import { deletePlayerByClientId, getActiveSession, getPlayersBySession } from '@/lib/db/queries';
import { broadcast } from '@/lib/sse/manager';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { clientId?: string };
    const clientId = body?.clientId?.trim();
    if (!clientId) {
      return NextResponse.json({ success: false, error: 'clientId is required' }, { status: 400 });
    }

    deletePlayerByClientId(clientId);

    // Broadcast so manager refreshes player list.
    const session = getActiveSession();
    if (session) {
      const players = getPlayersBySession(session.id);
      await broadcast({
        type: 'playerDisconnected',
        data: { playerCount: players.length },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error resetting player:', error);
    return NextResponse.json({ success: false, error: 'Failed to reset player' }, { status: 500 });
  }
}


