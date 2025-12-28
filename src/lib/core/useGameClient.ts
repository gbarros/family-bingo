import { useHttpGameClient } from "./hooks/useHttpGameClient";
import { useP2PGameClient } from "./hooks/useP2PGameClient";
import { useSearchParams } from "next/navigation";
import { GameClient } from "./clientTypes";

export function useGameClient(): GameClient {
    const searchParams = useSearchParams();
    const isP2P = process.env.NEXT_PUBLIC_GAME_MODE === 'p2p';

    if (isP2P) {
        const hostId = searchParams.get('host') || undefined;

        let secret = searchParams.get('s');
        if (!secret && typeof window !== 'undefined') {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            secret = hashParams.get('s');
        }

        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useP2PGameClient(hostId, secret || undefined);
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useHttpGameClient(true);
}
