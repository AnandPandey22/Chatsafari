import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Socket as SocketType } from 'socket.io-client';
import io from 'socket.io-client';
import { User, Message, ChatRoom } from '../types';

export interface ChatStore {
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
  initializeSocket: () => void;
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

export const useStore = create<ChatStore>()(
  persist(
    (set: SetState, get: GetState) => ({
      socket: null,
      currentUser: null,
      users: [],
      messages: [],
      selectedUser: null,
      chatRooms: [],
      activeUsers: [],
      notifications: {},

      initializeSocket: () => {
        const { currentUser, socket } = get();
        if (currentUser && (!socket || !socket.connected)) {
          const { connect } = get();
          connect();
        }
      },

      setCurrentUser: (user: User) => {
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
        set({ users, activeUsers: users });
        const currentUser = get().currentUser;
        if (currentUser) {
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
            updatedRooms[roomIndex] = {
              ...updatedRooms[roomIndex],
              messages: [...updatedRooms[roomIndex].messages, message],
              lastMessage: message
            };
          }

          const selectedUser = state.selectedUser;
          const currentUser = state.currentUser;
          
          if (selectedUser && currentUser) {
            const currentRoomId = [currentUser.id, selectedUser.id].sort().join('-');
            if (currentRoomId === roomId) {
              return {
                chatRooms: updatedRooms,
                messages: [...state.messages, message]
              };
            }
          }

          return { chatRooms: updatedRooms };
        });
      },

      updateMessages: (messages: Message[]) => set({ messages }),

      setSelectedUser: (user: User | null) => {
        if (user) {
          set(state => {
            const currentUser = state.currentUser;
            if (!currentUser) return { selectedUser: user };

            const roomId = [currentUser.id, user.id].sort().join('-');
            
            const room = state.chatRooms.find(r => r.id === roomId);
            const messages = room?.messages || [];
            
            state.socket?.emit('get:messages', roomId);
            
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
          set({ selectedUser: null, messages: [] });
        }
      },

      setChatRooms: (rooms: ChatRoom[]) => set({ chatRooms: rooms }),
      setActiveUsers: (users: User[]) => set({ activeUsers: users }),
      setNotifications: (notifications: { [userId: string]: number }) => set({ notifications }),

      connect: () => {
        const { socket: existingSocket, currentUser } = get();
        if (existingSocket?.connected && currentUser) {
          return;
        }

        if (existingSocket) {
          existingSocket.disconnect();
          set({ socket: null });
        }

        const newSocket = io(import.meta.env.VITE_API_URL, {
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
            newSocket.emit('user:join', currentUser);
          }
        });

        newSocket.on('connect_error', (error: Error) => {
          console.error('Connection error:', error);
        });

        newSocket.on('disconnect', (reason: string) => {
          console.log('Disconnected from server:', reason);
          if (reason === 'io client disconnect' || reason === 'force-logout') {
            set({ socket: null });
            // Clear all state and storage on force logout
            if (reason === 'force-logout') {
              localStorage.removeItem('chat-storage');
              sessionStorage.removeItem('chatSafariState');
              window.location.replace('https://chatsafari.com');
            }
          }
        });

        newSocket.on('force-logout:acknowledged', () => {
          // Handle force logout acknowledgment
          set({
            currentUser: null,
            users: [],
            messages: [],
            notifications: {},
            selectedUser: null,
            socket: null,
            activeUsers: [],
            chatRooms: []
          });
        });

        newSocket.on('users:update', (users: User[]) => {
          console.log('Received users update:', users);
          const { currentUser } = get();
          set({ 
            activeUsers: users.filter(u => u.isOnline && u.id !== currentUser?.id),
            users: users
          });
        });

        newSocket.on('messages:history', ({ roomId, messages }: { roomId: string, messages: Message[] }) => {
          console.log('Received message history for room:', roomId, 'messages:', messages.length);
          set(state => {
            const updatedRooms = [...state.chatRooms];
            const roomIndex = updatedRooms.findIndex(room => room.id === roomId);
            
            if (roomIndex !== -1) {
              updatedRooms[roomIndex] = {
                ...updatedRooms[roomIndex],
                messages
              };
            }

            const selectedUser = state.selectedUser;
            const currentUser = state.currentUser;
            if (selectedUser && currentUser) {
              const currentRoomId = [currentUser.id, selectedUser.id].sort().join('-');
              if (currentRoomId === roomId) {
                return {
                  chatRooms: updatedRooms,
                  messages
                };
              }
            }

            return {
              chatRooms: updatedRooms
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

        set({ socket: newSocket });
        newSocket.connect();
      },

      disconnect: () => {
        const { socket } = get();
        if (socket) {
          // Emit force logout before disconnecting
          const currentUser = get().currentUser;
          if (currentUser) {
            socket.emit('user:force-logout', currentUser.id);
          }
          socket.disconnect();
          set({ socket: null });
        }
      },

      logout: () => {
        try {
          const socket = get().socket;
          const currentUser = get().currentUser;
          
          // First, emit force logout to server if socket exists
          if (socket?.connected && currentUser) {
            socket.emit('user:force-logout', currentUser.id);
            
            // Wait briefly for server to process the logout
            setTimeout(() => {
              // Disconnect socket
              socket.disconnect();
              
              // Clear all state
              set({
                currentUser: null,
                users: [],
                messages: [],
                notifications: {},
                selectedUser: null,
                socket: null,
                activeUsers: [],
                chatRooms: []
              });

              // Clear all storage
              localStorage.removeItem('chat-storage');
              sessionStorage.removeItem('chatSafariState');
              localStorage.clear();
              sessionStorage.clear();

              // Emit logout event
              window.dispatchEvent(new Event('userLoggedOut'));
              
              // Redirect to homepage
              window.location.replace('https://chatsafari.com');
            }, 100);
          } else {
            // If no socket connection, just clear everything
            set({
              currentUser: null,
              users: [],
              messages: [],
              notifications: {},
              selectedUser: null,
              socket: null,
              activeUsers: [],
              chatRooms: []
            });

            localStorage.removeItem('chat-storage');
            sessionStorage.removeItem('chatSafariState');
            localStorage.clear();
            sessionStorage.clear();

            window.dispatchEvent(new Event('userLoggedOut'));
            window.location.replace('https://chatsafari.com');
          }
        } catch (error) {
          console.error('Error during logout:', error);
          
          // Ensure state and storage are cleared even if there's an error
          set({
            currentUser: null,
            users: [],
            messages: [],
            notifications: {},
            selectedUser: null,
            socket: null,
            activeUsers: [],
            chatRooms: []
          });
          
          localStorage.removeItem('chat-storage');
          sessionStorage.removeItem('chatSafariState');
          localStorage.clear();
          sessionStorage.clear();
          
          window.location.replace('https://chatsafari.com');
        }
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
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ 
        currentUser: state.currentUser,
        users: state.users,
        chatRooms: state.chatRooms,
        selectedUser: state.selectedUser,
        activeUsers: state.activeUsers
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.currentUser) {
          state.initializeSocket();
        }
      }
    }
  )
);
