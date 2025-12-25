// SSE connection manager for broadcasting events to all connected clients

import type { SSEEvent } from './types';

declare global {
  // eslint-disable-next-line no-var
  var __bingoSseConnections: Set<WritableStreamDefaultWriter> | undefined;
}

// Store connections on globalThis to avoid dev/prod module-instance duplication.
const connections: Set<WritableStreamDefaultWriter> =
  globalThis.__bingoSseConnections ?? (globalThis.__bingoSseConnections = new Set());

const INSTANCE_ID = (() => {
  // Stable-ish id per loaded module instance (useful for debugging)
  const rand = Math.random().toString(36).slice(2, 8);
  return `sse:${rand}`;
})();

/**
 * Add a new SSE connection
 */
export function addConnection(writer: WritableStreamDefaultWriter): void {
  connections.add(writer);
  console.log(`[SSE ${INSTANCE_ID}] Connection added. Total connections: ${connections.size}`);
}

/**
 * Remove an SSE connection
 */
export function removeConnection(writer: WritableStreamDefaultWriter): void {
  connections.delete(writer);
  console.log(`[SSE ${INSTANCE_ID}] Connection removed. Total connections: ${connections.size}`);
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
    connections.delete(writer);
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
