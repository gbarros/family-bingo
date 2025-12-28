'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import ChristmasBackground from '@/components/shared/ChristmasBackground';
import type { Peer, DataConnection } from 'peerjs';

// Separate inner component for search params to use Suspense
function ServerlessContent() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState<'none' | 'host' | 'client'>('none');
  const [peerId, setPeerId] = useState<string>('');
  const [roomSecret, setRoomSecret] = useState<string>('');
  const [lanOnly, setLanOnly] = useState<boolean>(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connections, setConnections] = useState<DataConnection[]>([]);
  
  // Client specific
  const [hostIdInput, setHostIdInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [myConn, setMyConn] = useState<DataConnection | null>(null);
  
  // Metrics
  const [connectionTime, setConnectionTime] = useState<number | null>(null);
  const [lastRtt, setLastRtt] = useState<number | null>(null);

  // Inspector
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);
  const [connStats, setConnStats] = useState<any>(null);

  const LAN_IP = '192.168.68.106';
  const PORT = '3000';

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const checkIsLocal = (addr: string) => {
    if (!addr) return false;
    // Check for mDNS .local
    if (addr.toLowerCase().endsWith('.local')) return true;
    // Check for private IPv4 ranges
    if (addr.startsWith('192.168.')) return true;
    if (addr.startsWith('10.')) return true;
    if (addr.startsWith('172.')) {
      const parts = addr.split('.');
      const secondPart = parseInt(parts[1], 10);
      return secondPart >= 16 && secondPart <= 31;
    }
    // IPv6 link-local
    if (addr.toLowerCase().startsWith('fe80:')) return true;
    // Loopback
    if (addr === '127.0.0.1' || addr === '::1' || addr === 'localhost') return true;
    
    return false;
  };

  // Auto-join logic
  useEffect(() => {
    const hostId = searchParams.get('host');
    if (hostId && role === 'none') {
      const secret = window.location.hash.replace('#', '');
      addLog(`Auto-join detected for host: ${hostId}`);
      if (secret) addLog('Secret found in fragment');
      startClient(hostId, secret);
    }
  }, [searchParams, role]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      peer?.destroy();
    };
  }, [peer]);

  // Restore Role on Mount
  useEffect(() => {
    // detailed auto-join logic handled by other effect for URL params
    // this is specifically for "refresh" restoration
    const storedRole = localStorage.getItem('bingo_role');
    if (storedRole === 'host' && role === 'none') {
        startHost();
    } else if (storedRole === 'client' && role === 'none') {
        // If we have URL params, let the other effect handle it to pick up new Host ID
        if (!searchParams.get('host')) {
            startClient();
        }
    }
  }, []);

  const lanOnlyRef = useRef(lanOnly);
  useEffect(() => { lanOnlyRef.current = lanOnly; }, [lanOnly]);

  // Host Logic
  const startHost = async () => {
    setRole('host');
    localStorage.setItem('bingo_role', 'host');
    addLog('Starting PeerJS Host...');
    
    // Check for stored host session
    let storedId = localStorage.getItem('bingo_host_id');
    let storedSecret = localStorage.getItem('bingo_room_secret');
    
    // If we have a stored ID/Secret, try to maintain it
    let secret = storedSecret || Math.random().toString(36).slice(2, 10);
    setRoomSecret(secret);
    if (!storedSecret) localStorage.setItem('bingo_room_secret', secret);
    
    const { Peer } = await import('peerjs');
    
    // Try to init with stored ID if available, otherwise auto-generate
    const initPeer = (id?: string) => {
        const newPeer = id ? new Peer(id) : new Peer();

        newPeer.on('open', (id) => {
          setPeerId(id);
          localStorage.setItem('bingo_host_id', id);
          addLog(`My Peer ID: ${id} (Persistent)`);
        });

        newPeer.on('error', (err: any) => {
           addLog(`Peer Error: ${err.type}`);
           // If ID is taken (maybe ghost session), clear storage and retry with new random ID
           if (err.type === 'unavailable-id') {
               addLog('⚠️ Stored ID unavailable. Generating new identity...');
               localStorage.removeItem('bingo_host_id');
               newPeer.destroy();
               initPeer(); // Retry without ID (auto-gen)
           }
        });

        // Resilience Logic (Mobile Background Handling)
        newPeer.on('disconnected', () => {
           addLog('⚠️ Peer disconnected from Signaling Server. Reconnecting...');
           newPeer.reconnect();
        });

        const handleVisibilityChange = () => {
           if (document.visibilityState === 'visible') {
              if (newPeer.disconnected) {
                 addLog('👁️ App foregrounded: Reconnecting Signaling...');
                 newPeer.reconnect();
              } else if (newPeer.destroyed) {
                 addLog('👁️ App foregrounded: Peer destroyed. Re-init...');
                 document.removeEventListener('visibilitychange', handleVisibilityChange);
                 initPeer(localStorage.getItem('bingo_host_id') || undefined);
              }
           }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);

        newPeer.on('connection', (conn) => {
          addLog(`New connection from: ${conn.peer}`);
          
          // Validate Secret
          const clientSecret = (conn.metadata as any)?.secret;
          if (clientSecret !== secret) {
            addLog(`❌ REJECTED: Invalid secret from ${conn.peer}`);
            conn.send({ type: 'error', msg: 'Invalid room secret' });
            setTimeout(() => conn.close(), 500);
            return;
          }

          // Initial accept (temporary)
          addLog(`✅ VALIDATED: ${conn.peer} secret accepted.`);
          setConnections((prev) => [...prev, conn]);

          // LAN Isolation Evaluation
          if (lanOnlyRef.current) {
            addLog(`🕒 EVALUATING path for ${conn.peer} (5s)...`);
            
            let evaluationPassed = false;
            const evaluationStart = Date.now();
            
            const evalInterval = setInterval(async () => {
              const pc = conn.peerConnection;
              if (!pc) return;
              
              try {
                const report = await pc.getStats();
                let remoteAddr = '';
                let candidateType = '';
                
                report.forEach(stat => {
                  if (stat.type === 'remote-candidate') {
                    remoteAddr = stat.ip || stat.address;
                    candidateType = stat.candidateType;
                  }
                });
                
                if (remoteAddr) {
                  const isLocal = checkIsLocal(remoteAddr);
                  // Relaxed: Allow 'srflx' (Server Reflexive) IF the IP is local.
                  // This handles "Hairpin NAT" where routers reflect local traffic via public IP logic,
                  // or mDNS obfuscation where candidate type might be misleading.
                  const isRelay = candidateType === 'relay'; // Only strictly ban TURN relays
                  
                  if (isLocal && !isRelay) {
                    addLog(`🛡️ LAN VERIFIED: ${conn.peer} (${remoteAddr} / ${candidateType})`);
                    evaluationPassed = true;
                    clearInterval(evalInterval);
                  }
                }
              } catch (e) {
                // ignore errors during eval
              }
              
              if (Date.now() - evaluationStart > 6000) {
                clearInterval(evalInterval);
                if (!evaluationPassed) {
                  addLog(`🚫 ISOLATION FAILURE: ${conn.peer} appears external or relay. Closing.`);
                  conn.send({ type: 'error', msg: 'LAN Isolation Enforcement: External connection rejected.' });
                  setConnections(prev => prev.filter(c => c.peer !== conn.peer));
                  setTimeout(() => conn.close(), 500);
                }
              }
            }, 1000);
          }

          conn.on('data', (data: any) => {
            // Handle Ping (latency test)
            if (data && data.type === 'ping') {
               conn.send({ type: 'pong', timestamp: data.timestamp });
               addLog(`Ping received from ${conn.peer} (replied)`);
               return;
            }

            addLog(`Received from ${conn.peer}: ${JSON.stringify(data)}`);
          });

          conn.on('open', () => {
             conn.send({ type: 'welcome', msg: 'Hello from Host!' });
          });
          
          conn.on('close', () => {
            addLog(`Connection closed: ${conn.peer}`);
            setConnections(prev => prev.filter(c => c.peer !== conn.peer));
          });
        });

        setPeer(newPeer);
    };
    
    initPeer(storedId || undefined);
  };

  // Client Logic
  const startClient = async (autoHostId?: string, autoSecret?: string) => {
    setRole('client');
    addLog('Starting PeerJS Client...');

    const { Peer } = await import('peerjs');
    const newPeer = new Peer();

    newPeer.on('open', (id) => {
      setPeerId(id);
      addLog(`My Peer ID: ${id}`);
      
      const targetId = autoHostId || localStorage.getItem('bingo_last_host');
      const targetSecret = autoSecret || localStorage.getItem('bingo_last_secret');
      
      if (targetId) {
        addLog(`Processing auto-connect to ${targetId}...`);
        // If we have auto params, update storage
        if (autoHostId) {
             localStorage.setItem('bingo_last_host', autoHostId);
             if (autoSecret) localStorage.setItem('bingo_last_secret', autoSecret);
        }
        
        connectToHost(targetId, targetSecret || undefined, newPeer);
      } else {
        addLog('No previous host found. Waiting for manual input.');
      }
    });

    setPeer(newPeer);
  };

  const connectToHost = (targetId: string, secret?: string, peerOverride?: Peer) => {
    const activePeer = peerOverride || peer;
    if (!activePeer) {
      addLog('❌ ERROR: Peer not initialized yet.');
      return;
    }
    
    addLog(`Connecting to host: ${targetId}...`);
    
    // Store for persistence
    localStorage.setItem('bingo_last_host', targetId);
    if (secret) localStorage.setItem('bingo_last_secret', secret);
    
    const startTime = performance.now();
    
    // Pass metadata during connection
    const metadata = {
       userAgent: navigator.userAgent,
       timestamp: Date.now(),
       secret: secret || '' 
    };

    const conn = activePeer.connect(targetId, {
       metadata: metadata,
       serialization: 'json'
    });
    
    conn.on('open', () => {
      const timeTaken = Math.round(performance.now() - startTime);
      setConnectionTime(timeTaken);
      
      addLog(`Connection established in ${timeTaken}ms!`);
      setIsConnected(true);
      setMyConn(conn);
      conn.send({ type: 'join', msg: 'Hello Host, I am here!' });
    });

    conn.on('data', (data: any) => {
      if (data && data.type === 'error') {
        addLog(`⚠️ SERVER ERROR: ${data.msg}`);
      }
      
      // Handle Pong (latency test)
      if (data && data.type === 'pong') {
         const rtt = Date.now() - data.timestamp;
         setLastRtt(rtt);
         addLog(`Pong received! RTT: ${rtt}ms`);
         return;
      }
      
      addLog(`Received from Host: ${JSON.stringify(data)}`);
    });
    
    conn.on('error', (err) => {
      addLog(`Connection error: ${err.message}`);
    });
    
    conn.on('close', () => {
       addLog('Disconnected from host. Attempting reconnect...');
       setIsConnected(false);
       setMyConn(null);
       
       // Reconnection Logic
       let attempts = 0;
       const attemptReconnect = () => {
           attempts++;
           const delay = attempts <= 5 ? 500 : 1000;
           addLog(`Reconnecting in ${delay}ms (Attempt ${attempts})...`);
           
           setTimeout(() => {
               // Must check if user hasn't quit or role changed
               if (!activePeer.destroyed) {
                   connectToHost(targetId, secret, activePeer);
               }
           }, delay);
       };
       
       attemptReconnect();
    });
  };

  const sendChat = () => {
    if (!chatMessage) return;
    if (role === 'client' && myConn) {
       myConn.send({ type: 'chat', msg: chatMessage });
       addLog(`Sent: ${chatMessage}`);
       setChatMessage('');
    }
  };

  const sendPing = () => {
     if (role === 'client' && myConn) {
        myConn.send({ type: 'ping', timestamp: Date.now() });
        addLog('Sent PING');
     }
  };

  const renderConnectionDetails = (conn: any) => {
     // Try to peek at internals if possible, though Typescript might complain without casting
     const pc = conn.peerConnection as RTCPeerConnection;
     
     return (
        <div className="bg-cocoa-dark/10 p-4 rounded text-xs font-mono overflow-auto space-y-2">
           <div><strong>Peer ID:</strong> {conn.peer}</div>
           <div><strong>Label:</strong> {conn.label}</div>
           <div><strong>Serialization:</strong> {conn.serialization}</div>
           <div className="bg-white/50 p-2 rounded">
              <strong>Metadata (Passed from Client):</strong>
              <pre>{JSON.stringify(conn.metadata, null, 2)}</pre>
           </div>
           
           {pc && (
              <div className="space-y-2 mt-2 pt-2 border-t border-cocoa/10">
                 <div className="font-bold text-cocoa">WebRTC Internals (RTCPeerConnection)</div>
                 <div><strong>Connection State:</strong> {pc.connectionState}</div>
                 <div><strong>ICE State:</strong> {pc.iceConnectionState}</div>
                 
                 {connStats && connStats.activeRemote && (
                    <div className="bg-red-50 p-2 rounded border border-red-100 mt-2">
                       <div className="font-bold text-crimson text-[10px] uppercase tracking-wider">Active Remote Path</div>
                       <div className="text-sm">
                          {connStats.activeRemote.ip || connStats.activeRemote.address}:{connStats.activeRemote.port}
                       </div>
                       <div className="text-[10px] uppercase font-bold opacity-50">
                          {connStats.activeRemote.protocol} • {connStats.activeRemote.candidateType}
                       </div>
                       
                       {connStats.pair && (
                           <div className="mt-1 text-[10px]">
                              RTT: {Math.round(connStats.pair.currentRoundTripTime * 1000)}ms
                           </div>
                       )}
                    </div>
                 )}
                 
                 {connStats && connStats.activeLocal && (
                   <div className="text-[10px] opacity-50 mt-1">
                      via Local: {connStats.activeLocal.candidateType} ({connStats.activeLocal.protocol})
                   </div>
                 )}

                 {connStats && connStats.transport && (
                    <div className="text-[10px] mt-2">
                       <strong>DTLS:</strong> {connStats.transport.dtlsState} {connStats.transport.dtlsCipher}
                    </div>
                 )}

                 <details className="mt-2">
                    <summary className="cursor-pointer font-bold text-forest text-[10px]">Raw Remote SDP</summary>
                    <pre className="mt-1 p-2 bg-black/5 rounded text-[10px] whitespace-pre-wrap max-h-32 overflow-auto">
                       {pc.remoteDescription?.sdp || 'No SDP available'}
                    </pre>
                 </details>
              </div>
           )}
        </div>
     );
  };

  const exitSession = () => {
     localStorage.removeItem('bingo_role');
     // We keep the host ID/secret in case they want to rejoin later as the same person
     // But we clear the active auto-join role
     
     if (peer) peer.destroy();
     setRole('none');
     setPeer(null);
     setConnections([]);
     setIsConnected(false);
     setMyConn(null);
     setLogs([]);
  };

  const qrValue = `http://${LAN_IP}:${PORT}/serverless?host=${peerId}#${roomSecret}`;

  return (
    <div className="min-h-screen relative p-4 font-sans text-cocoa">
      <ChristmasBackground />
      
      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        <h1 className="text-4xl font-display font-bold text-center text-gradient-gold">
          Serverless Prototype
        </h1>

        {role === 'none' && (
          <div className="flex gap-4 justify-center">
            <button 
              onClick={startHost}
              className="btn btn-primary text-xl px-8 py-4"
            >
              👑 Become Host
            </button>
            <button 
              onClick={() => startClient()}
              className="btn btn-secondary text-xl px-8 py-4"
            >
              👤 Join as Client
            </button>
          </div>
        )}
        
        {role !== 'none' && (
           <div className="flex justify-center">
               <button 
                  onClick={exitSession}
                  className="text-xs text-cocoa/50 hover:text-crimson underline"
                >
                  Exit Session (Clear Role)
                </button>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Left Panel: Controls */}
           <div className="card-elevated bg-ivory-warm p-6 rounded-xl">
              {role === 'host' && (
                 <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-cocoa">Host Panel</h2>
                    
                    <div className="flex items-center gap-2 bg-cocoa/5 p-3 rounded-lg">
                      <input 
                        type="checkbox" 
                        id="lanOnly"
                        checked={lanOnly}
                        onChange={(e) => setLanOnly(e.target.checked)}
                        className="w-4 h-4 accent-forest"
                      />
                      <label htmlFor="lanOnly" className="text-sm font-semibold cursor-pointer">
                        🔒 Enforce LAN Isolation
                      </label>
                    </div>

                    {peerId ? (
                       <div className="flex flex-col items-center gap-4">
                          <div className="bg-white p-4 rounded-lg shadow-inner">
                             <QRCodeSVG value={qrValue} size={250} />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-mono bg-cocoa/5 p-2 rounded break-all select-all mb-2">
                               {qrValue}
                            </p>
                            <p className="text-cocoa-light text-sm italic">Scan to join automatically (LAN)</p>
                          </div>
                          
                          <div className="w-full bg-cocoa/5 p-4 rounded mt-4">
                             <p className="font-bold mb-2">Connected Clients ({connections.length})</p>
                             <div className="space-y-2 max-h-60 overflow-y-auto">
                                {connections.map(conn => (
                                   <div key={conn.peer} className="bg-white/50 p-2 rounded">
                                      <div className="flex justify-between items-center mb-2">
                                         <span className="font-mono text-xs">{conn.peer}</span>
                                         <button 
                                            onClick={() => setSelectedConnId(selectedConnId === conn.peer ? null : conn.peer)}
                                            className="text-xs bg-cocoa text-ivory px-2 py-1 rounded hover:bg-cocoa-light"
                                         >
                                            {selectedConnId === conn.peer ? 'Hide Details' : 'Inspect'}
                                         </button>
                                      </div>
                                      
                                      {selectedConnId === conn.peer && renderConnectionDetails(conn)}
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    ) : (
                       <p>Generating ID...</p>
                    )}
                 </div>
              )}

              {role === 'client' && (
                 <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-cocoa">Client Panel</h2>
                    {!isConnected ? (
                       <div className="space-y-4">
                          <div id="reader" className="w-full bg-black/10 rounded-lg overflow-hidden"></div>
                          <Scanner 
                            onScan={(decoded) => {
                               // Try to parse as URL
                               try {
                                  const url = new URL(decoded);
                                  const host = url.searchParams.get('host');
                                  const secret = url.hash.replace('#', '');
                                  if (host) {
                                     setHostIdInput(host);
                                     connectToHost(host, secret);
                                  }
                               } catch (e) {
                                  // Fallback to plain text ID
                                  setHostIdInput(decoded);
                                  connectToHost(decoded);
                               }
                            }} 
                          />
                          <div className="flex flex-col gap-2">
                             <input 
                               type="text" 
                               value={hostIdInput}
                               onChange={e => setHostIdInput(e.target.value)}
                               placeholder="Or paste Host ID"
                               className="input-field"
                             />
                             <button 
                               onClick={() => connectToHost(hostIdInput)}
                               className="btn btn-primary w-full"
                             >
                               Connect Manually
                             </button>
                          </div>
                       </div>
                    ) : (
                       <div className="space-y-4">
                          <div className="bg-forest-light/20 text-forest p-4 rounded-lg font-bold text-center">
                             ✅ Connected to Host
                             {connectionTime && (
                                <div className="text-xs font-mono font-normal opacity-70 mt-1">
                                   Connected in {connectionTime}ms
                                </div>
                             )}
                          </div>
                          <div className="flex gap-2">
                             <input 
                               type="text" 
                               value={chatMessage}
                               onChange={e => setChatMessage(e.target.value)}
                               placeholder="Type message..."
                               className="input-field flex-1"
                             />
                             <button onClick={sendChat} className="btn btn-secondary">Send</button>
                          </div>
                          <div className="flex gap-2 items-center">
                             <button onClick={sendPing} className="btn-outline flex-1">
                                📡 Test Latency
                             </button>
                             {lastRtt !== null && (
                                <div className="font-mono text-sm bg-cocoa/5 px-3 py-2 rounded">
                                   RTT: <strong>{lastRtt}ms</strong>
                                </div>
                             )}
                          </div>
                       </div>
                    )}
                 </div>
              )}
           </div>

           {/* Right Panel: Logs */}
           <div className="card-elevated bg-cocoa-dark text-ivory p-6 rounded-xl h-[600px] flex flex-col">
              <h3 className="text-lg font-bold mb-4 border-b border-ivory/20 pb-2">Logs & Events</h3>
              <div className="flex-1 overflow-auto font-mono text-xs space-y-1">
                 {logs.length === 0 && <span className="opacity-30 italic">No events yet...</span>}
                 {logs.map((log, i) => (
                    <div key={i} className="border-b border-ivory/5 pb-1 mb-1 last:border-0">
                       {log}
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function ServerlessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-cocoa-dark text-gold-light">Carregando...</div>}>
      <ServerlessContent />
    </Suspense>
  );
}

// Helper component for HTML5 Scanner to avoid strict mode issues
function Scanner({ onScan }: { onScan: (res: string) => void }) {
   const scannerRef = useRef<Html5QrcodeScanner | null>(null);
   const scanned = useRef(false);

   useEffect(() => {
      // Small timeout to ensure DOM is ready
      const timer = setTimeout(() => {
         if (scannerRef.current) return;
         
         const newScanner = new Html5QrcodeScanner(
             "reader", 
             { fps: 10, qrbox: { width: 250, height: 250 } },
             /* verbose= */ false
         );
         
         newScanner.render((decodedText) => {
            if (!scanned.current) {
               scanned.current = true;
               onScan(decodedText);
               newScanner.clear();
            }
         }, (error) => {
            // ignore errors
         });

         scannerRef.current = newScanner;
      }, 100);

      return () => {
         clearTimeout(timer);
         scannerRef.current?.clear().catch(console.error);
      };
   }, [onScan]);

   return null; 
}
