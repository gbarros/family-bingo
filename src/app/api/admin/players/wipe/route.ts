// Admin: wipe all player records + markings
// POST /api/admin/players/wipe

import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession, getPlayersBySession, wipeAllPlayers } from '@/lib/db/queries';
import { broadcast } from '@/lib/sse/manager';

export const dynamic = 'force-dynamic';
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

    const session = getActiveSession();
    wipeAllPlayers();

    if (session) {
      const players = getPlayersBySession(session.id);
      await broadcast({ type: 'playerDisconnected', data: { playerCount: players.length, wiped: true } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error wiping players (admin):', error);
    return NextResponse.json({ success: false, error: 'Failed to wipe players' }, { status: 500 });
  }
}


