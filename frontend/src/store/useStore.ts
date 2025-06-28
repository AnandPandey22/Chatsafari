import { create } from 'zustand';
import { Socket as SocketType } from 'socket.io-client';
import io from 'socket.io-client';
import { User, Message, ChatRoom } from '../types';
import { allBotUsers, generateBotResponse, updateBotUsersStatus, hasUserReceivedResponse } from '../utils/botUsers';

interface ChatStore {
  socket: typeof SocketType | null;
  currentUser: User | null;
  users: User[];
  messages: Message[];
  selectedUser: User | null;
  chatRooms: ChatRoom[];
  activeUsers: User[];
  notifications: { [userId: string]: number };
  incomingCall: any | null;
  showCallNotification: boolean;
  isCallOpen: boolean;
  isIncoming: boolean;
  callFrom: string | null;
  callTo: string | null;
  callType: 'audio' | 'video';
  lastOffer: any | null;
  autoAcceptCall: boolean;
  isJoiningGroup: boolean;
  setCurrentUser: (user: User) => void;
  setUsers: (users: User[]) => void;
  addMessage: (message: Message | { id: string; delivered: true }) => void;
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
  setIncomingCall: (call: any) => void;
  clearIncomingCall: () => void;
  setIsCallOpen: (v: boolean) => void;
  setIsIncoming: (v: boolean) => void;
  setCallFrom: (v: string | null) => void;
  setCallTo: (v: string | null) => void;
  setCallType: (v: 'audio' | 'video') => void;
  setLastOffer: (v: any | null) => void;
  setAutoAcceptCall: (v: boolean) => void;
  setIsJoiningGroup: (v: boolean) => void;
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

// Initialize state with data from localStorage
const initialState: ChatStore = {
  socket: null,
  currentUser: null,
  users: [],
  messages: [],
  selectedUser: null,
  chatRooms: [],
  activeUsers: [],
  notifications: {},
  incomingCall: null,
  showCallNotification: false,
  isCallOpen: false,
  isIncoming: false,
  callFrom: null,
  callTo: null,
  callType: 'video',
  lastOffer: null,
  autoAcceptCall: false,
  isJoiningGroup: false,
  setCurrentUser: () => {},
  setUsers: () => {},
  addMessage: () => {},
  updateMessages: () => {},
  setSelectedUser: () => {},
  setChatRooms: () => {},
  setActiveUsers: () => {},
  setNotifications: () => {},
  connect: () => {},
  disconnect: () => {},
  logout: () => {},
  clearNotifications: () => {},
  sendMessage: () => {},
  restoreSession: () => {},
  setIncomingCall: () => {},
  clearIncomingCall: () => {},
  setIsCallOpen: () => {},
  setIsIncoming: () => {},
  setCallFrom: () => {},
  setCallTo: () => {},
  setCallType: () => {},
  setLastOffer: () => {},
  setAutoAcceptCall: () => {},
  setIsJoiningGroup: () => {}
};

// Load initial state from localStorage
const loadInitialState = () => {
  try {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      return {
        ...initialState,
        currentUser: JSON.parse(savedUser)
      };
    }
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
  }
  return initialState;
};

// Static group definitions (should match backend)
export const GROUPS = [
  { id: 'group-flirty-vibes', name: 'Flirty Vibes', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=flirty', username: 'Flirty Vibes', gender: 'group' as const, age: 0, isOnline: true },
  { id: 'group-midnight-chat', name: 'Midnight Chat', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=midnight', username: 'Midnight Chat', gender: 'group' as const, age: 0, isOnline: true },
  { id: 'group-hot-topics', name: 'Hot Topics', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=hot', username: 'Hot Topics', gender: 'group' as const, age: 0, isOnline: true },
  { id: 'group-healing-space', name: 'Healing Space', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=healing', username: 'Healing Space', gender: 'group' as const, age: 0, isOnline: true },
  { id: 'group-naughty-corner', name: 'Naughty Corner', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=naughty', username: 'Naughty Corner', gender: 'group' as const, age: 0, isOnline: true },
  { id: 'group-singles-room', name: 'Singles Room', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=singles', username: 'Singles Room', gender: 'group' as const, age: 0, isOnline: true },
  { id: 'group-only-boys', name: 'Only Boys', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=boys', username: 'Only Boys', gender: 'group' as const, age: 0, isOnline: true },
  { id: 'group-only-girls', name: 'Only Girls', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=girls', username: 'Only Girls', gender: 'group' as const, age: 0, isOnline: true },
  { id: 'group-teen-zone', name: 'Teen Zone', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=teen', username: 'Teen Zone', gender: 'group' as const, age: 0, isOnline: true },
];

export const useStore = create<ChatStore>((set: SetState, get: GetState) => ({
  ...loadInitialState(),

  setCurrentUser: (user: User) => {
    // Store user in localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Initialize with empty active users
    set({
      users: [],
      messages: [],
      selectedUser: null,
      chatRooms: [],
      activeUsers: [], // Start with empty active users
      notifications: {},
      currentUser: user
    });
    
    // Connect first, then join
    const { connect } = get();
    connect();

    // Set up bot status update interval
    setInterval(() => {
      set(state => {
        // Get current real users
        const realUsers = state.activeUsers.filter(u => !u.id.startsWith('bot-'));
        // Update bot status
        const updatedBotUsers = updateBotUsersStatus();
        // Combine real users and updated bots
        return {
          activeUsers: [...realUsers, ...updatedBotUsers]
        };
      });
    }, 30000); // Update bot status every 30 seconds
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

  addMessage: (message: Message | { id: string; delivered: true }) => {
    set((state: ChatStore) => {
      // Type guard for delivery update
      if ('delivered' in message && Object.keys(message).length === 2) {
        // Only update delivered status in chatRooms and messages
        const updatedRooms = state.chatRooms.map(room => ({
          ...room,
          messages: room.messages.map(msg =>
            msg.id === message.id ? { ...msg, delivered: true } : msg
          )
        }));
        const updatedMessages = state.messages.map(msg =>
          msg.id === message.id ? { ...msg, delivered: true } : msg
        );
        return {
          chatRooms: updatedRooms,
          messages: updatedMessages
        };
      }
      // Full Message object
      const fullMsg = message as Message;
      // Use group id as room id for groups, sorted pair for DMs
      const isGroup = fullMsg.receiverId.startsWith('group-');
      const roomId = isGroup ? fullMsg.receiverId : [fullMsg.senderId, fullMsg.receiverId].sort().join('-');
      // Find or create the chat room
      let updatedRooms = [...state.chatRooms];
      const roomIndex = updatedRooms.findIndex(room => room.id === roomId);
      if (roomIndex === -1) {
        let participants;
        if (isGroup) {
          // Find group object by id
          const groupObj = GROUPS.find(g => g.id === fullMsg.receiverId);
          if (groupObj) {
            participants = [groupObj];
          } else {
            participants = [{ id: fullMsg.receiverId, name: fullMsg.receiverId, avatar: '', username: fullMsg.receiverId, gender: 'group' as const, age: 0, isOnline: true }];
          }
        } else {
          const sender = fullMsg.senderId.startsWith('bot-') 
            ? allBotUsers.find(bot => bot.id === fullMsg.senderId)
            : state.users.find(u => u.id === fullMsg.senderId);
          const receiver = fullMsg.receiverId.startsWith('bot-')
            ? allBotUsers.find(bot => bot.id === fullMsg.receiverId)
            : state.users.find(u => u.id === fullMsg.receiverId);
          participants = [sender, receiver];
        }
        if (participants.every(Boolean)) {
          updatedRooms.push({
            id: roomId,
            participants: participants as User[],
            messages: [fullMsg],
            lastMessage: fullMsg
          });
        }
      } else {
        // Room exists, update its messages
        const existingMessages = updatedRooms[roomIndex].messages;
        // Check if message already exists to prevent duplicates
        if (!existingMessages.some(m => m.id === fullMsg.id)) {
          updatedRooms[roomIndex] = {
            ...updatedRooms[roomIndex],
            messages: [...existingMessages, fullMsg],
            lastMessage: fullMsg
          };
        }
      }
      // If this is the current chat, update messages list
      if (!state.selectedUser || !state.currentUser) return { chatRooms: updatedRooms };
      const currentRoomId = state.selectedUser.isGroup
        ? state.selectedUser.id
        : [state.currentUser.id, state.selectedUser.id].sort().join('-');
        if (currentRoomId === roomId) {
        const updatedMessages = [...state.messages, fullMsg];
          return {
            chatRooms: updatedRooms,
            messages: updatedMessages
          };
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
    const { socket, currentUser, selectedUser } = get();
    // If leaving a group, emit group:leave for the previous group
    if (selectedUser && selectedUser.isGroup && socket && currentUser && (!user || user.id !== selectedUser.id)) {
      socket.emit('group:leave', { groupId: selectedUser.id, userId: currentUser.id });
      // Fetch updated count for the group just left
      socket.emit('group:getActiveMembers', selectedUser.id, (count: number) => {
        // Optionally update groupCounts in UserList via a global event or state
        // (handled by UserList socket listener)
      });
    }
    if (user) {
      // Store selected user in localStorage
      localStorage.setItem('selectedUser', JSON.stringify(user));
      set(state => {
        const currentUser = state.currentUser;
        if (!currentUser) return { selectedUser: user };
        // Determine room id: group id for groups, sorted pair for DMs
        const isGroup = user.isGroup;
        const roomId = isGroup ? user.id : [currentUser.id, user.id].sort().join('-');
        // Find existing room and messages
        let room = state.chatRooms.find(r => r.id === roomId);
        let messages = room?.messages || [];
        if (isGroup && !room) {
          // Create group chat room if missing
          const groupObj = GROUPS.find(g => g.id === user.id);
          if (groupObj) {
            const newRoom: ChatRoom = {
              id: roomId,
              participants: [groupObj],
              messages: [],
              lastMessage: undefined
            };
            const updatedRooms = [...state.chatRooms, newRoom];
            localStorage.setItem('chatRooms', JSON.stringify(updatedRooms));
            set({ chatRooms: updatedRooms });
            messages = [];
          }
        }
        // Always request message history from server for groups and DMs (except bots)
        if (state.socket?.connected && (!user.id.startsWith('bot-'))) {
          state.socket.emit('get:messages', roomId);
        } else if (user.id.startsWith('bot-')) {
          // For bot users, ensure we have a chat room
          if (!room) {
            const newRoom: ChatRoom = {
              id: roomId,
              participants: [currentUser, user],
              messages: [],
              lastMessage: undefined
            };
            // Update chat rooms
            const updatedRooms = [...state.chatRooms, newRoom];
            localStorage.setItem('chatRooms', JSON.stringify(updatedRooms));
            set({ chatRooms: updatedRooms });
          }
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
    const { socket: existingSocket, currentUser } = get();
    
    // If no user is logged in, don't connect
    if (!currentUser) {
      return;
    }

    // If there's already a connected socket with the same user, don't create a new one
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
      autoConnect: false,
      transports: ['websocket']
    });

    // Remove all existing listeners before adding new ones
    newSocket.removeAllListeners();

    newSocket.on('connect', () => {
      console.log('Connected to server');
      const currentUser = get().currentUser;
      if (currentUser) {
        // Emit join event immediately after connection
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
      const { currentUser } = get();
      // Separate real users (excluding self)
      const realUsers = users.filter(u => !u.id.startsWith('bot-') && u.id !== currentUser?.id);
      // Always get the latest bot users (ensures they are present and online)
      const updatedBotUsers = updateBotUsersStatus();
      // Update state with real users first, then bots
      set({ 
        activeUsers: [...realUsers, ...updatedBotUsers],
        users: users // Store all users for reference
      });
    });

    // Listen for avatar updates
    newSocket.on('user:avatarUpdated', ({ userId, avatar }: { userId: string, avatar: string }) => {
      set(state => {
        const updateAvatar = (arr: User[]) => arr.map(u => u.id === userId ? { ...u, avatar } : u);
        return {
          users: updateAvatar(state.users),
          activeUsers: updateAvatar(state.activeUsers),
          currentUser: state.currentUser && state.currentUser.id === userId ? { ...state.currentUser, avatar } : state.currentUser
        };
      });
    });

    // Handle one-time refresh for new users
    let hasRefreshed = false;
    newSocket.on('users:refresh', () => {
      if (!hasRefreshed) {
        console.log('Received refresh signal');
        const currentUser = get().currentUser;
        if (currentUser) {
          // Request fresh user list
          newSocket.emit('user:join', currentUser);
          hasRefreshed = true;
        }
      }
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
          const currentRoomId = state.selectedUser.isGroup
            ? state.selectedUser.id
            : [currentUser.id, selectedUser.id].sort().join('-');
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
      
      // Get blocked users from localStorage
      const blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
      
      // Add message to state
      get().addMessage(message);

      // Only play sound and show notification if:
      // 1. Message is from someone else
      // 2. We're not currently chatting with that person
      // 3. The sender is not blocked
      if (message.senderId !== currentUser?.id && 
          selectedUser?.id !== message.senderId && 
          !blockedUsers.includes(message.senderId)) {
        const soundEnabled = localStorage.getItem('notificationSoundEnabled');
        if (soundEnabled === null || soundEnabled === 'true') {
        notificationSound.play().catch(console.error);
        }
        // Update notification count
        set(state => ({
          notifications: {
            ...state.notifications,
            [message.senderId]: (state.notifications[message.senderId] || 0) + 1
          }
        }));
      }
    });

    newSocket.on('groupMessage', ({ groupId, message }: { groupId: string, message: Message }) => {
      const { selectedUser } = get();
      console.log('Received group message', groupId, message);
      // Only add message if currently viewing this group
      if (selectedUser && selectedUser.isGroup && selectedUser.id === groupId) {
        get().addMessage(message);
      }
    });

    newSocket.on('group:removeUserMessages', ({ groupId, userId }: { groupId: string, userId: string }) => {
      set(state => {
        // Remove messages from the specified user in the specified group
        const updatedRooms = state.chatRooms.map(room => {
          if (room.id === groupId) {
            return {
              ...room,
              messages: room.messages.filter(msg => msg.senderId !== userId)
            };
          }
          return room;
        });
        // If this is the current chat, update messages list
        let updatedMessages = state.messages;
        if (state.selectedUser && state.selectedUser.isGroup && state.selectedUser.id === groupId) {
          updatedMessages = state.messages.filter(msg => msg.senderId !== userId);
        }
        return {
          chatRooms: updatedRooms,
          messages: updatedMessages
        };
      });
    });

    // Connect the socket
    newSocket.connect();
    set({ socket: newSocket });
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
    localStorage.removeItem('recentDMUserIds');
    set({
      socket: null,
      currentUser: null,
      users: [],
      messages: [],
      selectedUser: null,
      chatRooms: [],
      activeUsers: [],
      notifications: {},
      incomingCall: null,
      showCallNotification: false,
      isCallOpen: false,
      isIncoming: false,
      callFrom: null,
      callTo: null,
      callType: 'video',
      lastOffer: null,
      autoAcceptCall: false,
      isJoiningGroup: false
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
    const { socket, selectedUser } = get();
    if (!socket || !selectedUser) return;
    const isGroup = !!selectedUser && selectedUser.isGroup;
    if (isGroup) {
      socket.emit('groupMessage', { groupId: selectedUser.id, message }, (error: any) => {
        if (!error) {
      get().addMessage(message);
        }
      });
                } else {
      socket.emit('message:send', message, (error: any) => {
        if (!error) {
          get().addMessage(message);
      }
      });
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
          const roomId = selectedUser.isGroup ? selectedUser.id : [user.id, selectedUser.id].sort().join('-');
          const room = chatRooms.find((r: ChatRoom) => r.id === roomId);
          if (room) {
            messages = room.messages;
          }
        }

        // Initialize active users with bot users and merge with any existing active users
        const botUsers = updateBotUsersStatus();
        const existingActiveUsers = chatRooms
          .flatMap((room: ChatRoom) => room.participants)
          .filter((participant: User) => 
            participant.id !== user.id && 
            !participant.id.startsWith('bot-')
          );

        const activeUsers = [
          ...botUsers,
          ...existingActiveUsers
        ];
        
        set({ 
          currentUser: user,
          messages,
          chatRooms,
          selectedUser,
          activeUsers
        });
        
        // Set up bot status update interval
        setInterval(() => {
          set(state => ({
            activeUsers: state.activeUsers.map(user => {
              if (user.id.startsWith('bot-')) {
                return { ...user, isOnline: Math.random() > 0.3 };
              }
              return user;
            })
          }));
        }, 30000); // Update bot status every 30 seconds
        
        // Reconnect socket for non-bot communication
        const { connect } = get();
        connect();
      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('chatRooms');
        localStorage.removeItem('selectedUser');
      }
    }
  },

  setIncomingCall: (call) => set({ incomingCall: call, showCallNotification: true }),
  clearIncomingCall: () => set({ incomingCall: null, showCallNotification: false }),
  setIsCallOpen: (v) => set({ isCallOpen: v }),
  setIsIncoming: (v) => set({ isIncoming: v }),
  setCallFrom: (v: string | null) => set({ callFrom: v }),
  setCallTo: (v: string | null) => set({ callTo: v }),
  setCallType: (v: 'audio' | 'video') => set({ callType: v }),
  setLastOffer: (v) => set({ lastOffer: v }),
  setAutoAcceptCall: (v: boolean) => set({ autoAcceptCall: v }),
  setIsJoiningGroup: (v: boolean) => set({ isJoiningGroup: v })
}));
