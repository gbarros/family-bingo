// Server-Sent Events types for real-time communication

export type SSEEvent =
  | { type: 'numberDrawn'; data: { number: number; timestamp: number } }
  | { type: 'gameStateChanged'; data: { status: string; mode: string } }
  | { type: 'playerJoined'; data: { name: string; playerCount: number } }
  | {
      type: 'playerDisconnected';
      data: {
        // Some callers may not know the name (e.g. admin reset by id)
        name?: string;
        playerId?: number;
        playerCount: number;
        wiped?: boolean;
      };
    }
  | { type: 'gameEnded'; data: { winner: string; playerName: string } }
  | { type: 'heartbeat'; data: { timestamp: number } };

export interface SSEConnection {
  writer: WritableStreamDefaultWriter;
  id: string;
}
