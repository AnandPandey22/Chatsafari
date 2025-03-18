import { create } from 'zustand';
import { Socket as SocketType } from 'socket.io-client';
import io from 'socket.io-client';
import { User, Message, ChatRoom } from '../types';
import { toast } from 'react-hot-toast';

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

let socket: typeof SocketType | null = null;

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
    const { connect } = get();
    connect();
  },

  setUsers: (users: User[]) => {
    console.log('Setting users with:', users);
    const currentUser = get().currentUser;
    if (currentUser) {
      const rooms = users
        .filter((user) => user.id !== currentUser.id)
        .map((user) => ({
          id: [currentUser.id, user.id].sort().join('-'),
          participants: [currentUser, user],
          messages: []
        }));
      
      const otherUsers = users.filter(user => user.id !== currentUser.id);
      console.log('Filtered other users:', otherUsers);
      
      set({ 
        users,
        activeUsers: otherUsers,
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
        console.log('Setting selected user, room ID:', roomId);
        
        const room = state.chatRooms.find(r => r.id === roomId);
        const messages = room?.messages || [];
        
        if (state.socket?.connected) {
          state.socket.emit('get:messages', roomId);
        }
        
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
      const otherUsers = users.filter(user => user.id !== currentUser.id);
      console.log('Setting filtered active users:', otherUsers);
      set({ activeUsers: otherUsers });
    }
  },

  setNotifications: (notifications: { [userId: string]: number }) => set({ notifications }),

  connect: () => {
    const { socket: existingSocket, currentUser } = get();
    if (existingSocket?.connected && currentUser) {
      console.log('Already connected with user:', currentUser);
      existingSocket.emit('get:users');
      return;
    }

    if (existingSocket) {
      console.log('Cleaning up existing socket');
      existingSocket.disconnect();
      set({ socket: null });
    }

    console.log('Creating new socket connection to:', import.meta.env.VITE_WS_URL);
    const newSocket = io(import.meta.env.VITE_WS_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: false,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected with ID:', newSocket.id);
      const currentUser = get().currentUser;
      if (currentUser) {
        console.log('Joining as user:', currentUser.username);
        newSocket.emit('user:join', currentUser);
        setTimeout(() => {
          console.log('Requesting initial users list');
          newSocket.emit('get:users');
        }, 500);
      }
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error.message);
      console.log('Connection URL:', import.meta.env.VITE_WS_URL);
      toast.error('Connection error. Retrying...');
    });

    newSocket.on('users:update', (users: User[]) => {
      console.log('Received users:update with users:', users);
      const { setUsers } = get();
      setUsers(users);
    });

    newSocket.on('messages:history', ({ roomId, messages }: { roomId: string, messages: Message[] }) => {
      console.log('Received message history for room:', roomId, 'messages:', messages.length);
      set(state => {
        const updatedRooms = [...state.chatRooms];
        const roomIndex = updatedRooms.findIndex(room => room.id === roomId);
        let mergedMessages: Message[] = [];
        
        if (roomIndex !== -1) {
          const existingMessages = updatedRooms[roomIndex].messages;
          mergedMessages = [...existingMessages];
          messages.forEach(newMessage => {
            if (!mergedMessages.some(m => m.id === newMessage.id)) {
              mergedMessages.push(newMessage);
            }
          });
          
          mergedMessages.sort((a, b) => a.timestamp - b.timestamp);
          
          updatedRooms[roomIndex] = {
            ...updatedRooms[roomIndex],
            messages: mergedMessages,
            lastMessage: mergedMessages[mergedMessages.length - 1]
          };

          localStorage.setItem('chatRooms', JSON.stringify(updatedRooms));
        }

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
        const updatedRooms = state.chatRooms.map(room => ({
          ...room,
          messages: room.messages.map(msg => 
            msg.id === messageId ? { ...msg, delivered: true } : msg
          )
        }));

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
      
      get().addMessage(message);

      if (message.senderId !== currentUser?.id && selectedUser?.id !== message.senderId) {
        notificationSound.play().catch(console.error);
        set(state => ({
          notifications: {
            ...state.notifications,
            [message.senderId]: (state.notifications[message.senderId] || 0) + 1
          }
        }));
      }
    });

    newSocket.connect();
    set({ socket: newSocket });
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
    window.location.href = 'https://chatsafari.com';
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
      console.log('Sending message:', message);
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
