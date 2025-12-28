// Player reconnect API: POST /api/player/reconnect

import { NextRequest, NextResponse } from 'next/server';
import { getPlayerByClientId, updatePlayerConnection, getPlayerMarkingsArray, getActiveSession } from '@/lib/db/queries';
import type { ReconnectRequest, ReconnectResponse } from '@/types/api';


/**
 * POST /api/player/reconnect - Reconnect with client ID from localStorage
 */
export async function POST(request: NextRequest) {
  try {
    const body: ReconnectRequest = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Find player by client ID
    const player = getPlayerByClientId(clientId);
    if (!player) {
      return NextResponse.json(
        { success: false, error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get active session to check status
    const session = getActiveSession();
    if (!session || session.id !== player.session_id) {
      return NextResponse.json(
        { success: false, error: 'Session is no longer active' },
        { status: 404 }
      );
    }

    // Capture User-Agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Update player connection status and UA
    const playerId = Number(player.id);
    updatePlayerConnection(playerId, true, userAgent);

    // Get player's markings
    const markings = getPlayerMarkingsArray(playerId);

    // Parse card data
    const card = JSON.parse(player.card_data);

    return NextResponse.json<ReconnectResponse>({
      success: true,
      playerId: playerId,
      clientId: player.client_id, // Added field
      name: player.name,
      card,
      markings,
      sessionId: session.id,
      sessionStatus: session.status,
    });
  } catch (error) {
    console.error('[API] Error reconnecting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reconnect' },
      { status: 500 }
    );
  }
}
