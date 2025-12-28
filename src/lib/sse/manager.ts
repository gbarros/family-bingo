// SSE connection manager for broadcasting events to all connected clients

import type { SSEEvent } from './types';

declare global {
  // eslint-disable-next-line no-var
  var __bingoSseConnections: Set<WritableStreamDefaultWriter> | undefined;
}

// Store connections on globalThis to avoid dev/prod module-instance duplication.
const connections: Set<WritableStreamDefaultWriter> =
  globalThis.__bingoSseConnections ?? (globalThis.__bingoSseConnections = new Set());

// Map clientId to set of connections
const clientConnections: Map<string, Set<WritableStreamDefaultWriter>> = new Map();
// Simple writer to clientId reverse map for cleanup
const writerToClient: Map<WritableStreamDefaultWriter, string> = new Map();

const INSTANCE_ID = (() => {
  // Stable-ish id per loaded module instance (useful for debugging)
  const rand = Math.random().toString(36).slice(2, 8);
  return `sse:${rand}`;
})();

/**
 * Add a new SSE connection
 */
export function addConnection(writer: WritableStreamDefaultWriter, clientId?: string): void {
  // Always add to global pool for broadcasting
  connections.add(writer);

  if (clientId) {
    if (!clientConnections.has(clientId)) {
      clientConnections.set(clientId, new Set());
    }
    clientConnections.get(clientId)?.add(writer);
    writerToClient.set(writer, clientId);

    // Notify manager of presence update
    broadcastPresence(clientId, true);
  }

  console.log(`[SSE ${INSTANCE_ID}] Connection added. Total: ${connections.size}. Client ${clientId || 'anon'} connected.`);
}

/**
 * Remove an SSE connection
 */
export function removeConnection(writer: WritableStreamDefaultWriter): void {
  connections.delete(writer);

  const clientId = writerToClient.get(writer);
  if (clientId) {
    const clientSet = clientConnections.get(clientId);
    if (clientSet) {
      clientSet.delete(writer);
      if (clientSet.size === 0) {
        clientConnections.delete(clientId);
        // User went fully offline
        broadcastPresence(clientId, false);
      } else {
        // User just dropped one connection (still online)
        broadcastPresence(clientId, true);
      }
    }
    writerToClient.delete(writer);
  }

  console.log(`[SSE ${INSTANCE_ID}] Connection removed. Total: ${connections.size}`);
}

/**
 * Broadcast presence update to managers (internal event)
 */
async function broadcastPresence(clientId: string, online: boolean) {
  // Determine connection count
  const count = clientConnections.get(clientId)?.size || 0;

  /* 
     Ideally we would only send this to managers, but since we don't 
     distinguish writer types easily here without more state, 
     we'll broadcast a 'playerPresence' event.
     Clients can ignore it, Manager UI will consume it.
  */
  await broadcast({
    type: 'playerPresence',
    data: { clientId, online, deviceCount: count }
  });
}

/**
 * Broadcast event to all connected clients
 */
export async function broadcast(event: SSEEvent): Promise<void> {
  const message = formatSSEMessage(event);

  const deadConnections: WritableStreamDefaultWriter[] = [];
  console.log(`[SSE ${INSTANCE_ID}] Broadcast "${event.type}" to ${connections.size} connections`);

  for (const writer of connections) {
    try {
      await writer.write(message);
    } catch (error) {
      console.error('[SSE] Error writing to connection:', error);
      deadConnections.push(writer);
    }
  }

  // Clean up dead connections
  for (const writer of deadConnections) {
    removeConnection(writer); // Use removeConnection to ensure maps are cleaned up
  }

  if (deadConnections.length > 0) {
    console.log(`[SSE] Removed ${deadConnections.length} dead connections`);
  }
}

/**
 * Format event as SSE message
 */
function formatSSEMessage(event: SSEEvent): Uint8Array {
  const encoder = new TextEncoder();
  const data = JSON.stringify(event);
  return encoder.encode(`data: ${data}\n\n`);
}

/**
 * Send event to specific writer
 */
export async function sendEvent(writer: WritableStreamDefaultWriter, event: SSEEvent): Promise<void> {
  try {
    const message = formatSSEMessage(event);
    await writer.write(message);
  } catch (error) {
    console.error('[SSE] Error sending event:', error);
  }
}

/**
 * Get current connection count
 */
export function getConnectionCount(): number {
  return connections.size;
}

/**
 * Get connection count for a specific client
 */
export function getClientConnectionCount(clientId: string): number {
  return clientConnections.get(clientId)?.size || 0;
}
