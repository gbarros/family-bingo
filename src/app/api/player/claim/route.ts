// Claim existing player session (recover from name collision)
// POST /api/player/claim

import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession, getPlayersBySession } from '@/lib/db/queries';
import type { ReconnectResponse } from '@/types/api';
import { getPlayerMarkingsArray } from '@/lib/db/queries';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Name required' },
                { status: 400 }
            );
        }

        const session = getActiveSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'No active session' },
                { status: 404 }
            );
        }

        // Find player
        const players = getPlayersBySession(session.id);
        const existingPlayer = players.find(
            (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()
        );

        if (!existingPlayer) {
            return NextResponse.json(
                { success: false, error: 'Player not found' },
                { status: 404 }
            );
        }

        // Log the "takeover" or additional device connection (server-side log only for now)
        const userAgent = request.headers.get('user-agent') || 'unknown';
        console.log(`[Claim] ${name} reclaiming session from ${userAgent}`);

        // Update player connection status and UA to the new device
        // Update player connection status and UA to the new device
        // This ensures subsequent conflicts show the LATEST device used.
        // We import updatePlayerConnection strictly for this.
        const { updatePlayerConnection } = await import('@/lib/db/queries');
        const playerId = Number(existingPlayer.id);
        updatePlayerConnection(playerId, true, userAgent);

        // Return the existing credentials effectively logging them in
        const card = JSON.parse(existingPlayer.card_data);
        const markings = getPlayerMarkingsArray(playerId);

        return NextResponse.json<ReconnectResponse>({
            success: true,
            playerId: playerId,
            clientId: existingPlayer.client_id, // Return the MASTER clientId
            name: existingPlayer.name,
            card,
            markings,
            sessionId: session.id,
            sessionStatus: session.status,
        });
    } catch (error) {
        console.error('[API] Error claiming info:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to claim session' },
            { status: 500 }
        );
    }
}
