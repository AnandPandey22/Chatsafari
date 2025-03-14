import { Socket, Manager } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const manager = new Manager(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  withCredentials: true,
  transports: ['websocket', 'polling']
});

export const socket = manager.socket('/');

export const connectSocket = (userId: string) => {
  if (!socket.connected) {
    socket.connect();
    socket.emit("user:join", {
      id: userId,
      isOnline: true
    });
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
