'use client';

import { useEffect, useState, useCallback } from 'react';
import type { SSEEvent } from '@/lib/sse/types';

export function useSSE(url: string | null) {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(() => {
    if (!url) return null;
    console.log('[SSE] Connecting to', url);
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log('[SSE] Connected');
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (e) => {
      try {
        const event: SSEEvent = JSON.parse(e.data);
        console.log('[SSE] Event received:', event.type);

        // Skip heartbeats from state
        if (event.type !== 'heartbeat') {
          setEvents((prev) => [...prev, event]);
        }
      } catch (err) {
        console.error('[SSE] Error parsing event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SSE] Connection error:', err);
      setIsConnected(false);
      setError(new Error('SSE connection failed'));
      eventSource.close();

      // Auto-reconnect after 2 seconds
      setTimeout(() => {
        console.log('[SSE] Attempting to reconnect...');
        connect();
      }, 2000);
    };

    return eventSource;
  }, [url]);

  useEffect(() => {
    const eventSource = connect();

    return () => {
      if (eventSource) {
        console.log('[SSE] Disconnecting');
        eventSource.close();
      }
    };
  }, [connect]);

  return { events, isConnected, error };
}
