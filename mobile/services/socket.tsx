import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './api';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
});

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ token, children }: { token: string | null; children: React.ReactNode }) {
  const [socketState, setSocketState] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const backgroundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Connect/disconnect based on token
  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocketState(null);
        setConnected(false);
      }
      return;
    }

    const socket = io(`${SOCKET_URL}/chat-customer`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socketRef.current = socket;
    setSocketState(socket);

    socket.on('connect', () => {
      console.log('[Socket] Connected to /chat-customer');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketState(null);
      setConnected(false);
    };
  }, [token]);

  // Handle app state changes — keep alive for 30s in background, then disconnect
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      const socket = socketRef.current;
      if (!socket || !token) return;

      if (nextState === 'background' || nextState === 'inactive') {
        backgroundTimerRef.current = setTimeout(() => {
          socket.disconnect();
        }, 30000);
      } else if (nextState === 'active') {
        if (backgroundTimerRef.current) {
          clearTimeout(backgroundTimerRef.current);
          backgroundTimerRef.current = null;
        }
        if (!socket.connected) {
          socket.connect();
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      sub.remove();
      if (backgroundTimerRef.current) {
        clearTimeout(backgroundTimerRef.current);
      }
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket: socketState, connected }}>
      {children}
    </SocketContext.Provider>
  );
}
