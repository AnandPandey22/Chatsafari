import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { User, Message } from './types.js';
import { allBotUsers, updateBotUsersStatus } from './botUsers.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
});

app.use(cors());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Store connected users and their socket IDs
const users = new Map<string, User>();
const userSocketMap = new Map<string, string>(); // Maps user.id to socket.id
const chatRooms = new Map<string, Message[]>(); // Store messages per chat room
const socketUserMap = new Map<string, string>(); // Maps socket.id to user.id
const userChatRooms = new Map<string, Set<string>>(); // Track which chat rooms each user is part of
const typingUsers = new Map<string, Set<string>>(); // Track who is typing to whom

// Function to clear all data
function clearAllData() {
  users.clear();
  userSocketMap.clear();
  chatRooms.clear();
  socketUserMap.clear();
  userChatRooms.clear();
  typingUsers.clear();

  // Force disconnect all sockets
  io.sockets.sockets.forEach((socket) => {
    socket.disconnect(true);
  });

  console.log('Cleared all stored data and disconnected all sockets');
}

// Clear all data when server starts
clearAllData();

// Schedule periodic cleanup of stale connections
setInterval(() => {
  const connectedSockets = Array.from(io.sockets.sockets.keys());
  
  // Clean up any users with stale socket connections
  Array.from(users.entries()).forEach(([socketId, user]) => {
    if (!connectedSockets.includes(socketId)) {
      console.log('Cleaning up stale connection for:', user.username);
      handleUserDisconnect(socketId);
    }
  });
}, 30000); // Run every 30 seconds

// Helper function to get or create a chat room
function getOrCreateChatRoom(userId1: string, userId2: string): string {
  const roomId = [userId1, userId2].sort().join('-');
  if (!chatRooms.has(roomId)) {
    chatRooms.set(roomId, []);
  }
  
  // Track this room for both users
  [userId1, userId2].forEach(userId => {
    if (!userChatRooms.has(userId)) {
      userChatRooms.set(userId, new Set());
    }
    userChatRooms.get(userId)?.add(roomId);
  });
  
  return roomId;
}

// Helper function to clean up user data
function cleanupUserData(userId: string) {
  // Get all chat rooms this user is part of
  const userRooms = userChatRooms.get(userId) || new Set();
  
  // Remove user's chat rooms and messages
  userRooms.forEach(roomId => {
    chatRooms.delete(roomId);
  });
  
  // Remove user's chat room tracking
  userChatRooms.delete(userId);
  
  // Clean up any lingering socket mappings
  Array.from(userSocketMap.entries()).forEach(([uid, sid]) => {
    if (uid === userId) {
      userSocketMap.delete(uid);
      socketUserMap.delete(sid);
      users.delete(sid);
    }
  });
}

// Helper function to handle user disconnection
function handleUserDisconnect(socketId: string) {
  const userId = socketUserMap.get(socketId);
  if (userId) {
    // Get user from users map using socketId (not userId)
    const user = users.get(socketId);
    if (user) {
      console.log('User disconnected:', user.username);
      
      // Clean up all user data
      users.delete(socketId);
      userSocketMap.delete(userId);
      socketUserMap.delete(socketId);
      cleanupUserData(userId);

      // Double check and remove any lingering references
      Array.from(users.entries()).forEach(([sid, u]) => {
        if (u.id === userId) {
          users.delete(sid);
        }
      });

      Array.from(userSocketMap.entries()).forEach(([uid, sid]) => {
        if (uid === userId || sid === socketId) {
          userSocketMap.delete(uid);
        }
      });

      Array.from(socketUserMap.entries()).forEach(([sid, uid]) => {
        if (uid === userId || sid === socketId) {
          socketUserMap.delete(sid);
        }
      });

      // Broadcast updated user list
      const activeUsers = Array.from(users.values()).filter(u => u.id !== userId);
      io.emit('users:update', activeUsers);
      console.log('Active users after disconnect:', activeUsers.map(u => u.username));
    }
  }
}

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down...');
  clearAllData();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Server shutting down...');
  clearAllData();
  process.exit(0);
});

io.on('connection', (socket: Socket) => {
  console.log('Socket connected:', socket.id);

  // Handle user join
  socket.on('user:join', (userData: User) => {
    console.log('User joining:', userData.username);

    // Clean up any existing connections for this user
    const existingSocketId = userSocketMap.get(userData.id);
    if (existingSocketId && existingSocketId !== socket.id) {
      console.log('Cleaning up existing connection for user:', userData.username);
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.disconnect();
      }
      users.delete(existingSocketId);
      socketUserMap.delete(userData.id);
      userSocketMap.delete(userData.id);
      cleanupUserData(userData.id);
    }

    // Add new user connection
    const updatedUser = { ...userData, isOnline: true };
    users.set(socket.id, updatedUser);
    userSocketMap.set(userData.id, socket.id);
    socketUserMap.set(socket.id, userData.id);
    
    // Get all active real users, ensuring no duplicates
    const activeRealUsers = Array.from(users.values())
      .filter(u => !u.id.startsWith('bot-'))
      .reduce((unique: User[], user: User) => {
        if (!unique.some(u => u.id === user.id)) {
          unique.push(user);
        }
        return unique;
      }, []);

    // Get bot users - they are always present and online
    const botUsers = allBotUsers.map((bot: User) => ({ ...bot, isOnline: true }));
    
    // Combine real users and bots
    const activeUsers = [
      ...activeRealUsers, // Real users first
      ...botUsers        // Then bots
    ];

    // Send the updated list to all clients
    io.emit('users:update', activeUsers);

    // Send a one-time refresh signal to the new user after a short delay
    setTimeout(() => {
      socket.emit('users:refresh');
    }, 200);

    console.log('Active users after join:', activeRealUsers.map(u => u.username));
  });

  // Handle message send
  socket.on('message:send', (message: Message) => {
    const sender = users.get(socket.id);
    if (!sender) {
      console.log('Message rejected - sender not found:', socket.id);
      return;
    }

    console.log('Message from:', sender.username);
    const roomId = getOrCreateChatRoom(message.senderId, message.receiverId);
    
    // Store message in chat room
    const roomMessages = chatRooms.get(roomId) || [];
    const messageWithDelivery = { ...message, delivered: true };
    chatRooms.set(roomId, [...roomMessages, messageWithDelivery]);

    // Send to both sender and receiver with delivery status
    socket.emit('message:receive', { roomId, message: messageWithDelivery });
    
    // Find receiver's socket and send them the message
    const receiverSocketId = userSocketMap.get(message.receiverId);
    if (receiverSocketId) {
      const receiverSocket = io.sockets.sockets.get(receiverSocketId);
      if (receiverSocket) {
        receiverSocket.emit('message:receive', { roomId, message: messageWithDelivery });
        // Send delivery confirmation to sender
        socket.emit('message:delivered', { messageId: message.id });
      }
    }
  });

  // Handle get messages
  socket.on('get:messages', (roomId: string) => {
    console.log('Getting messages for room:', roomId);
    const roomMessages = chatRooms.get(roomId) || [];
    console.log('Found messages:', roomMessages.length);
    socket.emit('messages:history', { roomId, messages: roomMessages });
  });

  // Handle typing indicator
  socket.on('typing:start', (receiverId: string) => {
    const sender = users.get(socket.id);
    if (!sender) return;

    // Add to typing users map
    if (!typingUsers.has(receiverId)) {
      typingUsers.set(receiverId, new Set());
    }
    typingUsers.get(receiverId)?.add(sender.id);

    // Notify receiver
    const receiverSocketId = userSocketMap.get(receiverId);
    if (receiverSocketId) {
      const receiverSocket = io.sockets.sockets.get(receiverSocketId);
      if (receiverSocket) {
        receiverSocket.emit('typing:status', {
          userId: sender.id,
          username: sender.username,
          isTyping: true
        });
      }
    }
  });

  socket.on('typing:stop', (receiverId: string) => {
    const sender = users.get(socket.id);
    if (!sender) return;

    // Remove from typing users map
    const typingSet = typingUsers.get(receiverId);
    if (typingSet) {
      typingSet.delete(sender.id);
      if (typingSet.size === 0) {
        typingUsers.delete(receiverId);
      }
    }

    // Notify receiver
    const receiverSocketId = userSocketMap.get(receiverId);
    if (receiverSocketId) {
      const receiverSocket = io.sockets.sockets.get(receiverSocketId);
      if (receiverSocket) {
        receiverSocket.emit('typing:status', {
          userId: sender.id,
          username: sender.username,
          isTyping: false
        });
      }
    }
  });

  // Handle user leave
  socket.on('user:leave', (userId: string) => {
    console.log('User leaving:', userId);
    if (userId) {
      // Clean up typing indicators
      typingUsers.forEach((typingSet, receiverId) => {
        typingSet.delete(userId);
        if (typingSet.size === 0) {
          typingUsers.delete(receiverId);
        }
      });

      cleanupUserData(userId);
      
      // Force cleanup of all data related to this user
      Array.from(users.entries()).forEach(([sid, u]) => {
        if (u.id === userId) {
          users.delete(sid);
        }
      });

      Array.from(userSocketMap.entries()).forEach(([uid, sid]) => {
        if (uid === userId) {
          userSocketMap.delete(uid);
        }
      });

      Array.from(socketUserMap.entries()).forEach(([sid, uid]) => {
        if (uid === userId) {
          socketUserMap.delete(sid);
        }
      });

      // Get remaining real users
      const activeRealUsers = Array.from(users.values())
        .filter(u => !u.id.startsWith('bot-'));

      // Get bot users - they are always present and online
      const botUsers = allBotUsers.map((bot: User) => ({ ...bot, isOnline: true }));
      
      // Combine real users and bots
      const activeUsers = [
        ...activeRealUsers,
        ...botUsers
      ];

      // Broadcast updated user list to all clients
      io.emit('users:update', activeUsers);
    }
    handleUserDisconnect(socket.id);
  });

  // Handle socket disconnect
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    handleUserDisconnect(socket.id);
  });
});

const port = parseInt(process.env.PORT || '3000', 10);
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
