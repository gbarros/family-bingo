// SSE endpoint for real-time game updates

import { addConnection, removeConnection, sendEvent } from '@/lib/sse/manager';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Get clientId from URL if present
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId') || undefined;

  // Add connection to manager
  addConnection(writer, clientId);

  // Send initial heartbeat
  sendEvent(writer, { type: 'heartbeat', data: { timestamp: Date.now() } });

  // Set up heartbeat interval
  const heartbeatInterval = setInterval(() => {
    sendEvent(writer, { type: 'heartbeat', data: { timestamp: Date.now() } });
  }, 30000); // Every 30 seconds

  // Clean up on connection close
  request.signal.addEventListener('abort', () => {
    clearInterval(heartbeatInterval);
    removeConnection(writer);
    writer.close().catch(() => { });
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
