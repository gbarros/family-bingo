// Admin: reset a specific player (delete record + markings)
// POST /api/admin/players/reset

import { NextRequest, NextResponse } from 'next/server';
import { deletePlayerById, getActiveSession, getPlayersBySession } from '@/lib/db/queries';
import { broadcast } from '@/lib/sse/manager';

export const runtime = 'nodejs';

function isManagerAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return false;
  const token = auth.slice('Bearer '.length).trim();
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    return decoded.startsWith('manager:');
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isManagerAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { playerId?: number };
    const playerId = body?.playerId;
    if (!playerId || typeof playerId !== 'number') {
      return NextResponse.json({ success: false, error: 'playerId is required' }, { status: 400 });
    }

    deletePlayerById(playerId);

    const session = getActiveSession();
    if (session) {
      const players = getPlayersBySession(session.id);
      await broadcast({ type: 'playerDisconnected', data: { playerId, playerCount: players.length } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error resetting player (admin):', error);
    return NextResponse.json({ success: false, error: 'Failed to reset player' }, { status: 500 });
  }
}


