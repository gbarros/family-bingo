# Serverless WebRTC Prototype: Findings & Architecture

This document consolidates the lessons learned and features implemented in the `/serverless` prototype. It serves as a blueprint for refactoring the main application to a serverless, P2P architecture.

## 1. Core Architecture (PeerJS)

-   **Role-Based Logic**: The application dynamic splits into `Host` and `Client` modes based on user selection or URL parameters.
-   **Signaling Server**: We utilize the public PeerJS cloud (`0.peerjs.com`) solely for the initial handshake (SDP Exchange).
    -   *Insight*: This dependency is minimal. Once connected, data flows P2P.
    -   *Resilience*: We must handle signaling disconnects separate from P2P disconnects.
-   **Data Transport**: JSON serialization over WebRTC DataChannels works reliably for game events (`chat`, `ping`, `bingo`).

## 2. Connection Security & Filtering

We implemented a "Trust but Verify" model since the signaling server is public.

-   **Room Secrets (URL Fragment)**:
    -   The Host generates a random secret.
    -   It is passed to clients via the URL Fragment (`#secret`).
    -   *Security*: Fragments are **never sent to the server** (HTTP spec), keeping the secret local to the browser.
    -   **Validation**: Clients send this secret in `metadata` during the handshake. The Host rejects connections with mismatched secrets immediately.

-   **LAN Isolation (The "Hard Check")**:
    -   To prevent unauthorized internet connections (if Peer ID leaks), the Host inspects the WebRTC `candidateType` and `ip`.
    -   **Rule**: We accept connections ONLY if:
        1.  `candidateType` is `host` (Direct LAN Interface).
        2.  **OR** `candidateType` is `srflx` (Hairpin NAT/Mobile) **BUT** the IP resolves to a private range (`192.168.x`, `10.x`, `.local`).
    -   **Strict Ban**: Any `relay` (TURN) candidate is dropped.

## 3. Persistence & Session Recovery

To survive refreshes and browser backgrounding (mobile), we implemented a multi-layer persistence strategy.

-   **Host Persistence**:
    -   `bingo_host_id` & `bingo_room_secret` are saved to `localStorage`.
    -   On mount, the Host attempts to `new Peer(storedId)`.
    -   *Fallback*: If the ID is "taken" (ghost session), we modify the logic to auto-generate a new one and update storage.

-   **Client Persistence**:
    -   `bingo_last_host` is saved.
    -   On mount, if no URL params exist, the client auto-connects to the last known host.

-   **Role Memory**:
    -   `bingo_role` (`host` | `client`) is saved.
    -   Refreshes automatically restore the UI state without user interaction.

## 4. Mobile & Network Resilience

Mobile browsers are aggressive about closing background sockets.

-   **Signaling Reconnect**:
    -   We listen for `peer.on('disconnected')` and immediately call `peer.reconnect()`.
    -   *Note*: This keeps the "Phone Book" entry alive in the Signaling Server so new clients can find us.
    -   **Observed Instability**: In Mobile-to-Mobile setups (e.g., Android Host + iPhone Client), we observed constant reconnections even when the app remains in the foreground. This suggests that mobile browsers might throttle WebSocket connections aggressively or that the PeerJS keep-alive mechanism needs tuning for mobile energy policies.

-   **Visibility API**:
    -   We listen to `document.onvisibilitychange`.
    -   When the app returns to `visible`:
        -   If disconnected: Trigger reconnect.
        -   If destroyed (memory reclaimed): Trigger full re-initialization.

## 5. User Experience (UX)

-   **URL Auto-Join**:
    -   QR Codes encode a "Magic Link": `http://LAN_IP:3000/serverless?host=UUID#SECRET`.
    -   Opening this link does 3 things:
        1.  Sets mode to `Client`.
        2.  Populates Host ID.
        3.  Initiates connection with the Secret.
-   **Latency Feedback**:
    -   Implemented an application-level `ping`/`pong` (RTT) to verify data channel health, distinct from the raw ICE RTT.

## 6. Known Limitations

-   **HTTPS & Camera**: The QR Scanner library (`html5-qrcode`) requires a Secure Context (HTTPS) on mobile devices (except `localhost`).
    -   *Workaround*: For LAN testing without HTTPS, users must type/paste the Host ID manually or use a browser flag to treat the local IP as secure.
-   **Browser Privacy**: We cannot reliably detect the Host's LAN IP via JavaScript (WebRTC IP leakage protection).
    -   *Solution*: We hardcoded the LAN IP for the prototype, but in production, we might need a simple echo service or manual input for the QR generation.
