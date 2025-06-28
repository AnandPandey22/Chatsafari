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
  maxHttpBufferSize: 25 * 1024 * 1024, // 25MB
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

// In-memory map to store mutual call consent between user pairs
const callConsents = new Map<string, boolean>(); // key: sorted userId-userId, value: true if consented

// Store group messages per group id
const groupMessages = new Map<string, Message[]>();

// Helper to get consent key
function getConsentKey(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('-');
}

// Function to clear all data
function clearAllData() {
  users.clear();
  userSocketMap.clear();
  chatRooms.clear();
  socketUserMap.clear();
  userChatRooms.clear();
  typingUsers.clear();
  callConsents.clear();
  groupMessages.clear();

  // Force disconnect all sockets
  io.sockets.sockets.forEach((socket) => {
    socket.disconnect(true);
  });

  console.log('Cleared all stored data and disconnected all sockets');
}

// Clear all data when server starts
clearAllData();

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

  // --- Remove user's messages from all groups ---
  for (const [groupId, msgs] of groupMessages.entries()) {
    const filtered = msgs.filter(m => m.senderId !== userId);
    if (filtered.length !== msgs.length) {
      groupMessages.set(groupId, filtered);
      // Notify all clients to remove this user's messages from their UI
      io.emit('group:removeUserMessages', { groupId, userId });
    }
  }

  // --- Remove user from all groupActiveMembers and emit updated counts ---
  for (const [groupId, set] of groupActiveMembers.entries()) {
    if (set.has(userId)) {
      set.delete(userId);
      io.emit('group:activeMembers', groupId, set.size);
    }
  }
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

// Static group definitions (can be moved to DB later)
const groups = [
  { id: 'group-flirty-vibes', name: 'Flirty Vibes', members: [] },
  { id: 'group-midnight-chat', name: 'Midnight Chat', members: [] },
  { id: 'group-hot-topics', name: 'Hot Topics', members: [] },
  { id: 'group-healing-space', name: 'Healing Space', members: [] },
  { id: 'group-naughty-corner', name: 'Naughty Corner', members: [] },
  { id: 'group-singles-room', name: 'Singles Room', members: [] },
  { id: 'group-only-boys', name: 'Only Boys', members: [] },
  { id: 'group-only-girls', name: 'Only Girls', members: [] },
  { id: 'group-teen-zone', name: 'Teen Zone', members: [] },
];

// Map groupId to Set of active userIds
const groupActiveMembers = new Map(groups.map(g => [g.id, new Set()]))

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
  socket.on('message:send', (message: Message, callback: (error?: string) => void) => {
    const sender = users.get(socket.id);
    if (!sender) {
      console.log('Message rejected - sender not found:', socket.id);
      if (callback) callback('Sender not found.');
      return;
    }

    // --- GROUP CHAT MESSAGE LOGIC ---
    if (message.receiverId.startsWith('group-')) {
      // Group message
      const groupId = message.receiverId;
      const msgWithDelivery = { ...message, delivered: true };
      const msgs = groupMessages.get(groupId) || [];
      groupMessages.set(groupId, [...msgs, msgWithDelivery]);
      // Broadcast to all group members (including sender)
      io.to(groupId).emit('message:receive', { roomId: groupId, message: msgWithDelivery });
      // Acknowledge to sender
      if (callback) callback();
      return;
    }
    // --- END GROUP CHAT MESSAGE LOGIC ---

    // ... existing DM logic ...
    const roomId = getOrCreateChatRoom(message.senderId, message.receiverId);
    // Store message in chat room, delivered: false initially
    const roomMessages = chatRooms.get(roomId) || [];
    const messageWithDelivery = { ...message, delivered: false };
    chatRooms.set(roomId, [...roomMessages, messageWithDelivery]);
    // Send to receiver if online
    const receiverSocketId = userSocketMap.get(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('message:receive', { roomId, message: messageWithDelivery });
    }
    // Acknowledge to sender
    if (callback) {
      callback(); // Acknowledge success
    }
  });

  // Handle message delivered acknowledgment
  socket.on('message:delivered', ({ messageId, roomId, senderId }) => {
    // Find and update the message in chatRooms
    const roomMessages = chatRooms.get(roomId) || [];
    const idx = roomMessages.findIndex(m => m.id === messageId);
    if (idx !== -1) {
      roomMessages[idx].delivered = true;
      chatRooms.set(roomId, roomMessages);
      // Notify sender if online
      const senderSocketId = userSocketMap.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('message:delivered', { messageId, roomId });
      }
    }
  });

  // Handle get messages
  socket.on('get:messages', (roomIdRaw: string | number) => {
    const roomId = String(roomIdRaw);
    // --- GROUP CHAT HISTORY LOGIC ---
    if (roomId.startsWith('group-')) {
      const msgs = groupMessages.get(roomId) || [];
      socket.emit('messages:history', { roomId, messages: msgs });
      return;
    }
    // --- END GROUP CHAT HISTORY LOGIC ---
    // ... existing DM logic ...
    const roomMessages = chatRooms.get(roomId) || [];
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

  // Handle call request (as a special message in DM)
  socket.on('call:request', (data) => {
    // data: { senderId, receiverId, callType ('audio'|'video') }
    const { senderId, receiverId, callType } = data;
    const sender = users.get(socket.id);
    if (!sender) return;
    const roomId = getOrCreateChatRoom(senderId, receiverId);
    const message = {
      id: `callreq-${Date.now()}`,
      senderId,
      receiverId,
      content: `${sender.username} wants to start a video or audio call with you.`,
      type: 'call_request' as 'call_request',
      timestamp: Date.now(),
      seen: false,
      delivered: true,
      reactions: [],
    };
    // Store message in chat room
    const roomMessages = chatRooms.get(roomId) || [];
    chatRooms.set(roomId, [...roomMessages, message]);
    // Send to both users
    socket.emit('message:receive', { roomId, message });
    const receiverSocketId = userSocketMap.get(receiverId);
    if (receiverSocketId) {
      const receiverSocket = io.sockets.sockets.get(receiverSocketId);
      if (receiverSocket) {
        receiverSocket.emit('message:receive', { roomId, message });
      }
    }
  });

  // Handle call request response (approve/decline)
  socket.on('call:respond', (data) => {
    // data: { senderId, receiverId, approved: boolean }
    const { senderId, receiverId, approved } = data;
    const responder = users.get(socket.id);
    if (!responder) return;
    const roomId = getOrCreateChatRoom(senderId, receiverId);
    if (approved) {
      // Store consent
      callConsents.set(getConsentKey(senderId, receiverId), true);
      // Send consent message to both users
      const consentMessage = {
        id: `consent-${Date.now()}`,
        senderId: receiverId, // the one who approved
        receiverId: senderId,
        content: `${responder.username} accepted your call request. You can now call each other!`,
        type: 'call_consent' as 'call_consent',
        timestamp: Date.now(),
        seen: false,
        delivered: true,
        reactions: [],
      };
      const roomMessages = chatRooms.get(roomId) || [];
      chatRooms.set(roomId, [...roomMessages, consentMessage]);
      // Notify BOTH the original sender and the acceptor
      const senderSocketId = userSocketMap.get(senderId);
      if (senderSocketId) {
        const senderSocket = io.sockets.sockets.get(senderSocketId);
        if (senderSocket) {
          senderSocket.emit('message:receive', { roomId, message: consentMessage });
        }
      }
      const receiverSocketId = userSocketMap.get(receiverId);
      if (receiverSocketId) {
        const receiverSocket = io.sockets.sockets.get(receiverSocketId);
        if (receiverSocket) {
          receiverSocket.emit('message:receive', { roomId, message: consentMessage });
        }
      }
    } else {
      // Send decline message to sender
      const declineMessage = {
        id: `decline-${Date.now()}`,
        senderId: receiverId,
        receiverId: senderId,
        content: `${responder.username} declined your call request.`,
        type: 'call_request' as 'call_request',
        timestamp: Date.now(),
        seen: false,
        delivered: true,
        reactions: [],
      };
      const senderSocketId = userSocketMap.get(senderId);
      if (senderSocketId) {
        const senderSocket = io.sockets.sockets.get(senderSocketId);
        if (senderSocket) {
          senderSocket.emit('message:receive', { roomId, message: declineMessage });
        }
      }
    }
  });

  // Helper event to check if consent exists for a user pair
  socket.on('call:consent:check', (data, callback) => {
    // data: { userId1, userId2 }
    const { userId1, userId2 } = data;
    let consent = callConsents.get(getConsentKey(userId1, userId2)) || false;
    if (!consent) {
      // Check chat history for call_consent message
      const roomId = getOrCreateChatRoom(userId1, userId2);
      const roomMessages = chatRooms.get(roomId) || [];
      consent = roomMessages.some(
        m => m.type === 'call_consent' &&
          ((m.senderId === userId1 && m.receiverId === userId2) || (m.senderId === userId2 && m.receiverId === userId1))
      );
    }
    callback(consent);
  });

  // WebRTC signaling events
  socket.on('webrtc:offer', ({ to, from, offer, callType }) => {
    const receiverSocketId = userSocketMap.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('webrtc:offer', { from, offer, callType });
    }
  });

  socket.on('webrtc:answer', ({ to, from, answer }) => {
    console.log('[SIGNAL] webrtc:answer received from', from, 'to', to);
    const receiverSocketId = userSocketMap.get(to);
    if (receiverSocketId) {
      console.log('[SIGNAL] Relaying webrtc:answer to socket:', receiverSocketId);
      io.to(receiverSocketId).emit('webrtc:answer', { from, answer });
    } else {
      console.log('[SIGNAL] No receiver socket found for user:', to);
    }
  });

  socket.on('webrtc:ice-candidate', ({ to, from, candidate }) => {
    const receiverSocketId = userSocketMap.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('webrtc:ice-candidate', { from, candidate });
    }
  });

  socket.on('webrtc:hangup', ({ to, from }) => {
    console.log('[SIGNAL] webrtc:hangup received from', from, 'to', to);
    const receiverSocketId = userSocketMap.get(to);
    if (receiverSocketId) {
      console.log('[SIGNAL] Relaying webrtc:hangup to socket:', receiverSocketId);
      io.to(receiverSocketId).emit('webrtc:hangup', { from });
    } else {
      console.log('[SIGNAL] No receiver socket found for user:', to);
    }
  });

  // Relay call:accepted event from callee to caller
  socket.on('call:accepted', ({ to, from }) => {
    const receiverSocketId = userSocketMap.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call:accepted', { from });
    }
  });

  // Handle message seen
  socket.on('message:seen', ({ roomId, messageId }: { roomId: string; messageId: string }) => {
    // Implementation of message:seen event
  });

  // Handle messages:viewed event
  socket.on('messages:viewed', ({ roomId, viewerId }) => {
    const roomMessages = chatRooms.get(roomId) || [];
    let updated = false;
    roomMessages.forEach(msg => {
      if (msg.receiverId === viewerId && !msg.delivered) {
        msg.delivered = true;
        updated = true;
        // Notify sender if online
        const senderSocketId = userSocketMap.get(msg.senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('message:delivered', { messageId: msg.id, roomId });
        }
      }
    });
    if (updated) {
      chatRooms.set(roomId, roomMessages);
    }
  });

  // --- GROUP CHAT SOCKET EVENTS START ---

  // Join a group
  socket.on('group:join', ({ groupId, userId }) => {
    const set = groupActiveMembers.get(groupId);
    if (set) {
      set.add(userId);
      socket.join(groupId); // Join the group room
      // Emit updated count to all clients
      io.emit('group:activeMembers', groupId, set.size);
      // Emit confirmation to the joining socket
      socket.emit('group:joined', { groupId });
    }
  });

  // Leave a group
  socket.on('group:leave', ({ groupId, userId }) => {
    const set = groupActiveMembers.get(groupId);
    if (set) {
      set.delete(userId);
      socket.leave(groupId); // Leave the group room
      // Emit updated count to all clients
      io.emit('group:activeMembers', groupId, set.size);
    }
  });

  // Handle group message send (dedicated event)
  socket.on('groupMessage', ({ groupId, message }, callback) => {
    const msgWithDelivery = { ...message, delivered: true };
    const msgs = groupMessages.get(groupId) || [];
    groupMessages.set(groupId, [...msgs, msgWithDelivery]);
    io.to(groupId).emit('groupMessage', { groupId, message: msgWithDelivery });
    console.log(`User ${socket.id} sent message to group ${groupId}`);
    if (callback) callback();
  });

  // Get number of active members in a group
  socket.on('group:getActiveMembers', (groupId, callback) => {
    const set = groupActiveMembers.get(groupId);
    if (set) {
      callback(Array.from(set).length);
    } else {
      callback(0);
    }
  });

  // Get actual member IDs in a group
  socket.on('group:getMembers', (groupId, callback) => {
    const set = groupActiveMembers.get(groupId);
    if (set) {
      callback(Array.from(set));
    } else {
      callback([]);
    }
  });

  // On disconnecting, remove user from all groups
  socket.on('disconnecting', () => {
    const userId = socketUserMap.get(socket.id);
    if (userId) {
      for (const set of groupActiveMembers.values()) {
        set.delete(userId);
      }
    }
  });

  // --- GROUP CHAT SOCKET EVENTS END ---

  // Update user avatar and broadcast to all users
  socket.on('user:updateAvatar', ({ userId, avatar }) => {
    // Update in users map
    for (const [sid, user] of users.entries()) {
      if (user.id === userId) {
        users.set(sid, { ...user, avatar });
      }
    }
    // Broadcast to all clients
    io.emit('user:avatarUpdated', { userId, avatar });
  });
});

const port = parseInt(process.env.PORT || '3000', 10);
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
