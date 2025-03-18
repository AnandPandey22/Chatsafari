import io from "socket.io-client";
import type { Socket } from "socket.io-client";

// Define types for our users
interface User {
  id: string;
  username: string;
  isOnline: boolean;
}

const SOCKET_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";

// Check if we're in production and using secure protocol
if (window.location.protocol === 'https:' && !SOCKET_URL.startsWith('wss://')) {
  console.error('Warning: WebSocket must use WSS when page is served over HTTPS');
}

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
  path: '/socket.io'
});

// Add debug logs
socket.on('connect', () => {
  console.log('Socket connected successfully');
  console.log('Socket ID:', socket.id);
  console.log('Connected to URL:', SOCKET_URL);
});

socket.on('connect_error', (error: Error) => {
  console.error('Socket connection error:', error);
  console.log('Failed connecting to:', SOCKET_URL);
});

socket.on('disconnect', (reason: string) => {
  console.log('Socket disconnected:', reason);
});

socket.on('reconnect_attempt', (attemptNumber: number) => {
  console.log('Attempting to reconnect:', attemptNumber);
});

export const connectSocket = (user: { id: string; username: string }) => {
  if (!socket.connected) {
    console.log('Connecting socket for user:', user.username);
    socket.connect();
    socket.emit("user:join", {
      id: user.id,
      username: user.username,
      isOnline: true
    });
  } else {
    console.log('Socket already connected for user:', user.username);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    console.log('Disconnecting socket');
    socket.disconnect();
  }
};

// Add error event listener
socket.on('error', (error: Error) => {
  console.error('Socket error:', error);
});

// Add reconnect event listeners
socket.on('reconnect', (attemptNumber: number) => {
  console.log('Successfully reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect after maximum attempts');
});
