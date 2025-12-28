import { useHttpGameHost } from "./hooks/useHttpGameHost";
import { useP2PGameHost } from "./hooks/useP2PGameHost";
import { GameHost } from "./hostTypes";

export function useGameHost(): GameHost {
    const isP2P = process.env.NEXT_PUBLIC_GAME_MODE === 'p2p';

    if (isP2P) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useP2PGameHost(true);
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useHttpGameHost(true);
}
