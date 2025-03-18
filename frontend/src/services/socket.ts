import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL;
const WS_URL = import.meta.env.VITE_WS_URL;

// Check if we're in production and using secure protocol
if (window.location.protocol === 'https:' && !WS_URL.startsWith('wss://')) {
  console.error('Warning: WebSocket must use WSS when page is served over HTTPS');
}

// Create and export the socket instance
const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  secure: window.location.protocol === 'https:'
});

export { socket };

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
