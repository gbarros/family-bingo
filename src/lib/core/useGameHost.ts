import { useHttpGameHost } from "./hooks/useHttpGameHost";
import { useP2PGameHost } from "./hooks/useP2PGameHost";
import { useSearchParams } from "next/navigation";
import { GameHost } from "./hostTypes";

export function useGameHost(): GameHost {
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode');

    const isP2P = mode === 'p2p';
    const httpHost = useHttpGameHost(!isP2P);
    const p2pHost = useP2PGameHost(isP2P);

    return isP2P ? p2pHost : httpHost;
}
