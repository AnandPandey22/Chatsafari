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

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
const notificationSound = new Audio(NOTIFICATION_SOUND_URL);
notificationSound.volume = 0.08;

type SetState = {
  (
    partial: ChatStore | Partial<ChatStore> | ((state: ChatStore) => ChatStore | Partial<ChatStore>),
    replace?: boolean | undefined
  ): void;
};

type GetState = () => ChatStore;

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
    localStorage.setItem('currentUser', JSON.stringify(user));
    set({
      currentUser: user,
      users: [],
      messages: [],
      selectedUser: null,
      chatRooms: [],
      activeUsers: [],
      notifications: {}
    });
    const { connect } = get();
    connect();
  },

  setUsers: (users: User[]) => {
    const currentUser = get().currentUser;
    if (currentUser) {
      const otherUsers = users.filter(user => user.id !== currentUser.id);
      const rooms = otherUsers.map(user => ({
        id: [currentUser.id, user.id].sort().join('-'),
        participants: [currentUser, user],
        messages: []
      }));
      set({ 
        users,
        activeUsers: otherUsers.filter(user => user.isOnline),
        chatRooms: rooms 
      });
    }
  },

  addMessage: (message: Message) => {
    console.log('Adding message:', message);
    set((state: ChatStore) => {
      const roomId = [message.senderId, message.receiverId].sort().join('-');
      let updatedRooms = [...state.chatRooms];
      const roomIndex = updatedRooms.findIndex(room => room.id === roomId);
      
      if (roomIndex === -1) {
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
        const existingMessages = updatedRooms[roomIndex].messages;
        if (!existingMessages.some(m => m.id === message.id)) {
          updatedRooms[roomIndex] = {
            ...updatedRooms[roomIndex],
            messages: [...existingMessages, message],
            lastMessage: message
          };
        }
      }

      localStorage.setItem('chatRooms', JSON.stringify(updatedRooms));

      const selectedUser = state.selectedUser;
      const currentUser = state.currentUser;
      
      if (selectedUser && currentUser) {
        const currentRoomId = [currentUser.id, selectedUser.id].sort().join('-');
        if (currentRoomId === roomId) {
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
    localStorage.setItem('messages', JSON.stringify(messages));
    set({ messages });
  },

  setSelectedUser: (user: User | null) => {
    if (user) {
      localStorage.setItem('selectedUser', JSON.stringify(user));
      set(state => {
        const currentUser = state.currentUser;
        if (!currentUser) return { selectedUser: user };

        const roomId = [currentUser.id, user.id].sort().join('-');
        const room = state.chatRooms.find(r => r.id === roomId);
        const messages = room?.messages || [];
        
        if (state.socket?.connected) {
          state.socket.emit('get:messages', roomId);
        }
        
        return {
          selectedUser: user,
          messages,
          notifications: {
            ...state.notifications,
            [user.id]: 0
          }
        };
      });
    } else {
      localStorage.removeItem('selectedUser');
      set({ selectedUser: null, messages: [] });
    }
  },

  setChatRooms: (rooms: ChatRoom[]) => {
    localStorage.setItem('chatRooms', JSON.stringify(rooms));
    set({ chatRooms: rooms });
  },

  setActiveUsers: (users: User[]) => {
    console.log('Setting active users:', users);
    const currentUser = get().currentUser;
    if (currentUser) {
      const otherActiveUsers = users.filter(user => 
        user.id !== currentUser.id && user.isOnline
      );
      set({ activeUsers: otherActiveUsers });
    }
  },

  setNotifications: (notifications: { [userId: string]: number }) => set({ notifications }),

  connect: () => {
    const { socket: existingSocket, currentUser } = get();
    if (existingSocket?.connected && currentUser) {
      console.log('Already connected with user:', currentUser.username);
      return;
    }

    if (existingSocket) {
      console.log('Cleaning up existing socket');
      existingSocket.disconnect();
      set({ socket: null });
    }

    const SOCKET_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";
    console.log('Creating new socket connection to:', SOCKET_URL);

    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000,
      autoConnect: false,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      const currentUser = get().currentUser;
      if (currentUser) {
        console.log('Emitting user:join with data:', currentUser);
        newSocket.emit('user:join', currentUser);
      }
    });

    newSocket.on('users:update', (users: User[]) => {
      console.log('Received users:update:', users);
      const currentUser = get().currentUser;
      if (currentUser) {
        const otherActiveUsers = users.filter(user => 
          user.id !== currentUser.id && user.isOnline
        );
        console.log('Setting active users:', otherActiveUsers);
        set({ 
          activeUsers: otherActiveUsers,
          users: users
        });
      }
    });

    // Add other event listeners...
    [Previous event listeners for messages, etc. remain the same]

    set({ socket: newSocket });
    newSocket.connect();
  },

  disconnect: () => {
    const { socket: currentSocket } = get();
    if (currentSocket) {
      currentSocket.disconnect();
      set({ socket: null });
    }
  },

  logout: () => {
    const { disconnect } = get();
    disconnect();
    localStorage.clear();
    set({
      currentUser: null,
      users: [],
      messages: [],
      selectedUser: null,
      chatRooms: [],
      activeUsers: [],
      notifications: {}
    });
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
      socket.emit('message:send', message);
      get().addMessage(message);
    }
  },

  restoreSession: () => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const storedChatRooms = localStorage.getItem('chatRooms');
        const storedSelectedUser = localStorage.getItem('selectedUser');
        
        const chatRooms = storedChatRooms ? JSON.parse(storedChatRooms) : [];
        const selectedUser = storedSelectedUser ? JSON.parse(storedSelectedUser) : null;
        
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
        
        const { connect } = get();
        connect();
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.clear();
      }
    }
  }
}));
