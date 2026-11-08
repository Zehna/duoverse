import { useState, useEffect, useCallback } from 'react';

export interface ConnectedPeer {
  id: string;
  name: string;
  platform: 'pc' | 'android';
  platformLabel: string;
  isHost: boolean;
  transport: 'Steam SDR (AppID 480)' | 'WebRTC DataChannel';
  pingMs: number;
}

export type ConnectionState = 'idle' | 'hosting' | 'joining' | 'connected' | 'error';

export function useLobby() {
  const [roomCode, setRoomCode] = useState<string>('DUO-7K2');
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [isHost, setIsHost] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [peers, setPeers] = useState<ConnectedPeer[]>([
    {
      id: 'p1',
      name: 'Local Host (You)',
      platform: 'pc',
      platformLabel: 'Windows x86_64',
      isHost: true,
      transport: 'Steam SDR (AppID 480)',
      pingMs: 0,
    },
    {
      id: 'p2',
      name: 'Mobile Co-op Partner',
      platform: 'android',
      platformLabel: 'Android ARM64',
      isHost: false,
      transport: 'WebRTC DataChannel',
      pingMs: 24,
    },
  ]);

  // Live ping simulation: slightly jitters between 22ms and 36ms for connected peers
  useEffect(() => {
    if (connectionState !== 'connected' && connectionState !== 'hosting') return;

    const interval = setInterval(() => {
      setPeers((prev) =>
        prev.map((p) =>
          p.isHost ? p : { ...p, pingMs: Math.max(18, Math.min(48, p.pingMs + (Math.floor(Math.random() * 5) - 2))) }
        )
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [connectionState]);

  // Generate a random 6-character room code: DUO-XXX
  const generateRandomCode = useCallback((): string => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let suffix = '';
    for (let i = 0; i < 3; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `DUO-${suffix}`;
  }, []);

  const createRoom = useCallback(() => {
    const newCode = generateRandomCode();
    setRoomCode(newCode);
    setIsHost(true);
    setConnectionState('hosting');
    setErrorMessage(null);
  }, [generateRandomCode]);

  const joinRoom = useCallback(
    async (codeToJoin: string): Promise<boolean> => {
      const cleaned = codeToJoin.trim().toUpperCase();
      if (!/^DUO-[A-Z0-9]{3}$/.test(cleaned) && cleaned.length < 6) {
        setErrorMessage('Invalid Room Code format. Expected format: DUO-XXX');
        return false;
      }

      setConnectionState('joining');
      setErrorMessage(null);

      // Simulate handshake connection delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      setRoomCode(cleaned);
      setIsHost(false);
      setConnectionState('connected');
      return true;
    },
    []
  );

  const leaveRoom = useCallback(() => {
    setConnectionState('idle');
    setErrorMessage(null);
  }, []);

  const copyRoomCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomCode]);

  return {
    roomCode,
    isHost,
    connectionState,
    peers,
    copied,
    errorMessage,
    createRoom,
    joinRoom,
    leaveRoom,
    copyRoomCode,
    setRoomCode,
  };
}
