// Session update API route: PATCH /api/session/[id]

import { NextRequest, NextResponse } from 'next/server';
import { updateSessionStatus, updateSessionGameMode } from '@/lib/db/queries';
import { broadcast } from '@/lib/sse/manager';
import type { UpdateSessionRequest } from '@/types/api';

export const runtime = 'nodejs';

const VALID_GAME_MODES = new Set(['horizontal', 'vertical', 'diagonal', 'blackout']);

function normalizeGameMode(mode?: string | null): string | null {
  if (!mode) return null;
  const rawParts = mode.split(',').map(part => part.trim()).filter(Boolean);
  const parts: string[] = [];
  for (const part of rawParts) {
    if (!parts.includes(part)) parts.push(part);
  }

  if (parts.length === 0) return null;
  if (parts.some(part => !VALID_GAME_MODES.has(part))) return null;
  if (parts.includes('blackout') && parts.length > 1) return null;
  return parts.join(',');
}

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
      const normalizedGameMode = normalizeGameMode(body.gameMode);
      if (!normalizedGameMode) {
        return NextResponse.json(
          { success: false, error: 'Invalid game mode' },
          { status: 400 }
        );
      }

      updateSessionGameMode(sessionId, normalizedGameMode as any);

      broadcast({
        type: 'gameStateChanged',
        data: { status: '', mode: normalizedGameMode },
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
