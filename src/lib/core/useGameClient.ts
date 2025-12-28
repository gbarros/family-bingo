import { useHttpGameClient } from "./hooks/useHttpGameClient";
import { useP2PGameClient } from "./hooks/useP2PGameClient";
import { useSearchParams } from "next/navigation";
import { GameClient } from "./clientTypes";

export function useGameClient(): GameClient {
    const searchParams = useSearchParams();
    const hostId = searchParams.get('host');

    const isP2P = !!(hostId && hostId.startsWith('bingo-host-'));

    // Look for secret in query string OR fragment (hash) for better security
    let secret = searchParams.get('s');
    if (!secret && typeof window !== 'undefined') {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        secret = hashParams.get('s');
    }

    const httpClient = useHttpGameClient(!isP2P);
    const p2pClient = useP2PGameClient(isP2P ? hostId : undefined, secret || undefined);

    return isP2P ? p2pClient : httpClient;
}
