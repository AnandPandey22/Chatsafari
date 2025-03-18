import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
});

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
