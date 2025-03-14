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
  logout: () => Promise<void>;
  clearNotifications: (userId: string) => void;
  sendMessage: (message: Message) => void;
  initializeSocket: () => void;
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

      // ... (keep all other functions the same until logout)

      logout: async () => {
        const { socket } = get();
        if (socket) {
          socket.disconnect();
        }

        // Clear all state
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

        // Clear localStorage
        localStorage.clear();
        sessionStorage.clear();

        // Small delay to ensure state is cleared
        await new Promise(resolve => setTimeout(resolve, 100));

        // Redirect to login
        window.location.href = '/login';
      },

      // ... (keep all other functions the same)
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users,
        chatRooms: state.chatRooms,
        selectedUser: state.selectedUser,
        activeUsers: state.activeUsers
      })
    }
  )
);
