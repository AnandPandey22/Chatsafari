import { create } from 'zustand';
import { Socket as SocketType } from 'socket.io-client';
import io from 'socket.io-client';
import { User, Message, ChatRoom } from '../types';

interface ChatStore {
  socket: typeof SocketType | null;
  currentUser: User | null;
  users: User[];
  messages: Message[];
  selectedUser: User | null;
  chatRooms: ChatRoom[];
  activeUsers: User[];
  notifications: { [userId: string]: number };
  setCurrentUser: (user: User) => void;
  setUsers: (users: User[]) => void;
  addMessage: (message: Message) => void;
  updateMessages: (messages: Message[]) => void;
  setSelectedUser: (user: User | null) => void;
  setChatRooms: (rooms: ChatRoom[]) => void;
  setActiveUsers: (users: User[]) => void;
  setNotifications: (notifications: { [userId: string]: number }) => void;
  connect: () => void;
  disconnect: () => void;
  logout: () => void;
  clearNotifications: (userId: string) => void;
  sendMessage: (message: Message) => void;
  restoreSession: () => void;
}

// Using a CDN-hosted notification sound
const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
const notificationSound = new Audio(NOTIFICATION_SOUND_URL);
notificationSound.volume = 0.08; // Set volume to 8%

type SetState = {
  (
    partial: ChatStore | Partial<ChatStore> | ((state: ChatStore) => ChatStore | Partial<ChatStore>),
    replace?: boolean | undefined
  ): void;
};

type GetState = () => ChatStore;

let socket: typeof SocketType | null = null;

// Remove all existing listeners before adding new ones
const removeAllListeners = (socket: typeof SocketType) => {
  socket.removeAllListeners();
};

export const useStore = create<ChatStore>((set: SetState, get: GetState) => ({
  socket: null,
  currentUser: null,
  users: [],
  messages: [],
  selectedUser: null,
  chatRooms: [],
  activeUsers: [],
  notifications: {},

  setCurrentUser: (user: User) => {
    // Store user in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    set({
      users: [],
      messages: [],
      selectedUser: null,
      chatRooms: [],
      activeUsers: [],
      notifications: {},
      currentUser: user
    });
    
    // Connect first, then join
    const { connect } = get();
    connect();
  },

  setUsers: (users: User[]) => {
    set({ users, activeUsers: users });
    const currentUser = get().currentUser;
    if (currentUser) {
      // Create chat rooms for all users, ensuring messages can be received from anyone
      const rooms = users
        .filter((user) => user.id !== currentUser.id)
        .map((user) => ({
          id: [currentUser.id, user.id].sort().join('-'),
          participants: [currentUser, user],
          messages: []
        }));
      
      set({ chatRooms: rooms });
    }
  },

  addMessage: (message: Message) => {
    console.log('Adding message:', message);
    set((state: ChatStore) => {
      const roomId = [message.senderId, message.receiverId].sort().join('-');
      
      // Find or create the chat room
      let updatedRooms = [...state.chatRooms];
      const roomIndex = updatedRooms.findIndex(room => room.id === roomId);
      
      if (roomIndex === -1) {
        // Room doesn't exist, create it
        const sender = state.users.find(u => u.id === message.senderId);
        const receiver = state.users.find(u => u.id === message.receiverId);
        
        if (sender && receiver) {
          updatedRooms.push({
            id: roomId,
            participants: [sender, receiver],
            messages: [message],
            lastMessage: message
          });
        }
      } else {
        // Room exists, update its messages
        const existingMessages = updatedRooms[roomIndex].messages;
        // Check if message already exists to prevent duplicates
        if (!existingMessages.some(m => m.id === message.id)) {
          updatedRooms[roomIndex] = {
            ...updatedRooms[roomIndex],
            messages: [...existingMessages, message],
            lastMessage: message
          };
        }
      }

      // Store chat rooms in localStorage
      localStorage.setItem('chatRooms', JSON.stringify(updatedRooms));

      // Check if this message belongs to the current chat
      const selectedUser = state.selectedUser;
      const currentUser = state.currentUser;
      
      if (selectedUser && currentUser) {
        const currentRoomId = [currentUser.id, selectedUser.id].sort().join('-');
        if (currentRoomId === roomId) {
          console.log('Updating current chat messages');
          const updatedMessages = [...state.messages, message];
          return {
            chatRooms: updatedRooms,
            messages: updatedMessages
          };
        }
      }

      return { chatRooms: updatedRooms };
    });
  },

  updateMessages: (messages: Message[]) => {
    // Store messages in localStorage
    localStorage.setItem('messages', JSON.stringify(messages));
    set({ messages });
  },

  setSelectedUser: (user: User | null) => {
    if (user) {
      // Store selected user in localStorage
      localStorage.setItem('selectedUser', JSON.stringify(user));
      
      set(state => {
        const currentUser = state.currentUser;
        if (!currentUser) return { selectedUser: user };

        // Get the room ID
        const roomId = [currentUser.id, user.id].sort().join('-');
        console.log('Setting selected user, room ID:', roomId);
        
        // Find existing room and messages
        const room = state.chatRooms.find(r => r.id === roomId);
        const messages = room?.messages || [];
        
        // Request message history from server if socket is connected
        if (state.socket?.connected) {
          state.socket.emit('get:messages', roomId);
        }
        
        // Clear notifications for this user
        const updatedNotifications = {
          ...state.notifications,
          [user.id]: 0
        };
        
        return {
          selectedUser: user,
          messages,
          notifications: updatedNotifications
        };
      });
    } else {
      // Remove selected user from localStorage
      localStorage.removeItem('selectedUser');
      set({ selectedUser: null, messages: [] });
    }
  },

  setChatRooms: (rooms: ChatRoom[]) => {
    // Store chat rooms in localStorage
    localStorage.setItem('chatRooms', JSON.stringify(rooms));
    set({ chatRooms: rooms });
  },
  setActiveUsers: (users: User[]) => {
    console.log('Setting active users:', users);
    set({ activeUsers: users });
  },
  setNotifications: (notifications: { [userId: string]: number }) => set({ notifications }),

  connect: () => {
    // If there's already a connected socket with the same user, don't create a new one
    const { socket: existingSocket, currentUser } = get();
    if (existingSocket?.connected && currentUser) {
      return;
    }

    // If there's a disconnected socket, clean it up
    if (existingSocket) {
      existingSocket.disconnect();
      set({ socket: null });
    }

    // Create new socket with specific configuration
    const newSocket = io(import.meta.env.VITE_API_URL, {
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 5000,
      autoConnect: false
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      const currentUser = get().currentUser;
      if (currentUser) {
        newSocket.emit('user:join', currentUser);
      }
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error);
      set({ socket: null });
    });

    newSocket.on('disconnect', (reason: string) => {
      console.log('Disconnected from server:', reason);
      if (reason === 'io client disconnect') {
        // Intentional disconnect, clean up the socket
        set({ socket: null });
      }
    });

    newSocket.on('users:update', (users: User[]) => {
      console.log('Received users update:', users);
      // Only show online users that are not the current user
      const { currentUser } = get();
      set({ 
        activeUsers: users.filter(u => u.isOnline && u.id !== currentUser?.id),
        users: users // Store all users for reference
      });
    });

    newSocket.on('messages:history', ({ roomId, messages }: { roomId: string, messages: Message[] }) => {
      console.log('Received message history for room:', roomId, 'messages:', messages.length);
      set(state => {
        // Update chat room messages
        const updatedRooms = [...state.chatRooms];
        const roomIndex = updatedRooms.findIndex(room => room.id === roomId);
        let mergedMessages: Message[] = [];
        
        if (roomIndex !== -1) {
          // Merge existing messages with new history, avoiding duplicates
          const existingMessages = updatedRooms[roomIndex].messages;
          mergedMessages = [...existingMessages];
          messages.forEach(newMessage => {
            if (!mergedMessages.some(m => m.id === newMessage.id)) {
              mergedMessages.push(newMessage);
            }
          });
          
          // Sort messages by timestamp
          mergedMessages.sort((a, b) => a.timestamp - b.timestamp);
          
          updatedRooms[roomIndex] = {
            ...updatedRooms[roomIndex],
            messages: mergedMessages,
            lastMessage: mergedMessages[mergedMessages.length - 1]
          };

          // Store updated chat rooms in localStorage
          localStorage.setItem('chatRooms', JSON.stringify(updatedRooms));
        }

        // If this is the current chat, update messages list
        const selectedUser = state.selectedUser;
        const currentUser = state.currentUser;
        if (selectedUser && currentUser) {
          const currentRoomId = [currentUser.id, selectedUser.id].sort().join('-');
          if (currentRoomId === roomId) {
            console.log('Updating current chat with history');
            return {
              chatRooms: updatedRooms,
              messages: mergedMessages
            };
          }
        }

        return {
          chatRooms: updatedRooms
        };
      });
    });

    newSocket.on('message:delivered', ({ messageId }: { messageId: string }) => {
      set(state => {
        // Update message delivery status in chat rooms
        const updatedRooms = state.chatRooms.map(room => ({
          ...room,
          messages: room.messages.map(msg => 
            msg.id === messageId ? { ...msg, delivered: true } : msg
          )
        }));

        // Update current messages if the delivered message is in the current chat
        const updatedMessages = state.messages.map(msg =>
          msg.id === messageId ? { ...msg, delivered: true } : msg
        );

        return {
          chatRooms: updatedRooms,
          messages: updatedMessages
        };
      });
    });

    newSocket.on('message:receive', ({ roomId, message }: { roomId: string, message: Message }) => {
      console.log('Received message:', message);
      const { currentUser, selectedUser } = get();
      
      // Add message to state
      get().addMessage(message);

      // Only play sound and show notification if:
      // 1. Message is from someone else
      // 2. We're not currently chatting with that person
      if (message.senderId !== currentUser?.id && selectedUser?.id !== message.senderId) {
        notificationSound.play().catch(console.error);
        // Update notification count
        set(state => ({
          notifications: {
            ...state.notifications,
            [message.senderId]: (state.notifications[message.senderId] || 0) + 1
          }
        }));
      }
    });

    set({ socket: newSocket });
    newSocket.connect(); // Manually connect after setup
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('user:leave', get().currentUser?.id);
      socket.disconnect();
      set({ socket: null });
    }
  },

  logout: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('user:leave', get().currentUser?.id);
      socket.disconnect();
    }
    // Clear localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('chatRooms');
    localStorage.removeItem('messages');
    localStorage.removeItem('selectedUser');
    
    set({
      socket: null,
      currentUser: null,
      users: [],
      messages: [],
      selectedUser: null,
      chatRooms: [],
      activeUsers: [],
      notifications: {}
    });
    // Redirect to Chatsafari homepage
    window.location.href = 'https://chatsafari.com';
  },

  clearNotifications: (userId: string) => {
    set(state => ({
      notifications: {
        ...state.notifications,
        [userId]: 0
      }
    }));
  },

  sendMessage: (message: Message) => {
    const { socket } = get();
    if (socket) {
      console.log('Sending message:', message);
      socket.emit('message:send', message);
      // Add message immediately to local state for instant feedback
      get().addMessage(message);
    }
  },

  restoreSession: () => {
    // Try to restore user from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        
        // Restore chat rooms and selected user
        const storedChatRooms = localStorage.getItem('chatRooms');
        const storedSelectedUser = localStorage.getItem('selectedUser');
        
        const chatRooms = storedChatRooms ? JSON.parse(storedChatRooms) : [];
        const selectedUser = storedSelectedUser ? JSON.parse(storedSelectedUser) : null;
        
        // If we have a selected user, get their messages from chat rooms
        let messages = [];
        if (selectedUser) {
          const roomId = [user.id, selectedUser.id].sort().join('-');
          const room = chatRooms.find((r: ChatRoom) => r.id === roomId);
          if (room) {
            messages = room.messages;
          }
        }
        
        set({ 
          currentUser: user,
          messages,
          chatRooms,
          selectedUser
        });
        
        // Reconnect socket
        const { connect } = get();
        connect();
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('chatRooms');
        localStorage.removeItem('selectedUser');
      }
    }
  }
}));
