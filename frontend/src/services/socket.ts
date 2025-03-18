import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";

// Check if we're in production and using secure protocol
if (window.location.protocol === 'https:' && !WS_URL.startsWith('wss://')) {
  console.error('Warning: WebSocket must use WSS when page is served over HTTPS');
}

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  secure: window.location.protocol === 'https:' // Enable secure connection in production
});

export const connectSocket = (userId: string) => {
  if (!socket.connected) {
    try {
      socket.connect();
      socket.emit("user:join", {
        id: userId,
        isOnline: true
      });
    } catch (error) {
      console.error('Socket connection error:', error);
      // If connection fails and we're not using WSS in production, show helpful error
      if (window.location.protocol === 'https:' && !WS_URL.startsWith('wss://')) {
        console.error('Error: WebSocket connection failed. In production, WebSocket connections must use WSS protocol when the page is served over HTTPS.');
      }
    }
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
