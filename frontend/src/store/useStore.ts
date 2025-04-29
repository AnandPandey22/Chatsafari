
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
  restoreSession: () => {}
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

  addMessage: (message: Message) => {
    console.log('Adding message:', message);
    set((state: ChatStore) => {
      const roomId = [message.senderId, message.receiverId].sort().join('-');
      
      // Find or create the chat room
      let updatedRooms = [...state.chatRooms];
      const roomIndex = updatedRooms.findIndex(room => room.id === roomId);
      
      if (roomIndex === -1) {
        // Room doesn't exist, create it
        const sender = message.senderId.startsWith('bot-') 
          ? allBotUsers.find(bot => bot.id === message.senderId)
          : state.users.find(u => u.id === message.senderId);
        
        const receiver = message.receiverId.startsWith('bot-')
          ? allBotUsers.find(bot => bot.id === message.receiverId)
          : state.users.find(u => u.id === message.receiverId);
        
        if (sender && receiver) {
          updatedRooms.push({
            id: roomId,
            participants: [sender, receiver],
            messages: [message],
            lastMessage: message
          });

          // If receiver is a bot and sender is not a bot, trigger bot response
          if (receiver.id.startsWith('bot-') && !sender.id.startsWith('bot-')) {
            // Check if user has already received a response from this bot
            if (!hasUserReceivedResponse(sender.id, receiver.id)) {
              const { sendMessage } = get();
              const botUser = receiver;

              // Update bot's online status and show them as active
              set(state => ({
                activeUsers: state.activeUsers.map(user => 
                  user.id === botUser.id ? { ...user, isOnline: true } : user
                )
              }));

              // Calculate reading time based on message length
              const wordsPerMinute = 200; // Average reading speed
              const wordCount = message.content.split(' ').length;
              const readingTimeMs = (wordCount / wordsPerMinute) * 60 * 1000;
              const minReadingTime = 1000; // Minimum 1 second to read
              const actualReadingTime = Math.max(minReadingTime, Math.min(readingTimeMs, 5000));

              // After reading time, show typing indicator
              setTimeout(() => {
                set(state => ({
                  activeUsers: state.activeUsers.map(user => 
                    user.id === botUser.id ? { ...user, isTyping: true } : user
                  )
                }));

                // Calculate typing time based on response length
                const typingSpeed = 40; // words per minute
                const responseLength = 20; // Fixed length for greeting
                const typingTimeMs = (responseLength / (typingSpeed * 5)) * 60 * 1000;
                const minTypingTime = 1500;
                const actualTypingTime = Math.max(minTypingTime, Math.min(typingTimeMs, 4000));

                // After typing time, send response
                setTimeout(() => {
                  set(state => ({
                    activeUsers: state.activeUsers.map(user => 
                      user.id === botUser.id ? { ...user, isTyping: false } : user
                    )
                  }));

                  const botResponse: Message = {
                    id: crypto.randomUUID(),
                    senderId: botUser.id,
                    receiverId: sender.id,
                    content: generateBotResponse(`${sender.id}|${message.content}`, botUser.id),
                    timestamp: Date.now(),
                    type: 'text',
                    seen: false,
                    delivered: true,
                    reactions: []
                  };

                  sendMessage(botResponse);
                }, actualTypingTime);
              }, actualReadingTime);
            }
          }
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

          // If this is a user message to a bot, trigger bot response
          const receiver = updatedRooms[roomIndex].participants.find(p => p.id === message.receiverId);
          const sender = updatedRooms[roomIndex].participants.find(p => p.id === message.senderId);
          if (receiver && sender && receiver.id.startsWith('bot-') && !sender.id.startsWith('bot-')) {
            // Check if user has already received a response from this bot
            if (!hasUserReceivedResponse(sender.id, receiver.id)) {
              const botUser = receiver;

              // Update bot's online status and show them as active
              set(state => ({
                activeUsers: state.activeUsers.map(user => 
                  user.id === botUser.id ? { ...user, isOnline: true } : user
                )
              }));

              // Calculate reading time based on message length
              const wordsPerMinute = 200; // Average reading speed
              const wordCount = message.content.split(' ').length;
              const readingTimeMs = (wordCount / wordsPerMinute) * 60 * 1000;
              const minReadingTime = 1000; // Minimum 1 second to read
              const actualReadingTime = Math.max(minReadingTime, Math.min(readingTimeMs, 5000));

              // After reading time, show typing indicator
              setTimeout(() => {
                set(state => ({
                  activeUsers: state.activeUsers.map(user => 
                    user.id === botUser.id ? { ...user, isTyping: true } : user
                  )
                }));

                // Calculate typing time based on response length
                const typingSpeed = 40; // words per minute
                const responseLength = 20; // Fixed length for greeting
                const typingTimeMs = (responseLength / (typingSpeed * 5)) * 60 * 1000;
                const minTypingTime = 1500;
                const actualTypingTime = Math.max(minTypingTime, Math.min(typingTimeMs, 4000));

                // After typing time, send response
                setTimeout(() => {
                  set(state => ({
                    activeUsers: state.activeUsers.map(user => 
                      user.id === botUser.id ? { ...user, isTyping: false } : user
                    )
                  }));

                  const botResponse: Message = {
                    id: crypto.randomUUID(),
                    senderId: botUser.id,
                    receiverId: sender.id,
                    content: generateBotResponse(`${sender.id}|${message.content}`, botUser.id),
                    timestamp: Date.now(),
                    type: 'text',
                    seen: false,
                    delivered: true,
                    reactions: []
                  };

                  const { sendMessage } = get();
                  sendMessage(botResponse);
                }, actualTypingTime);
              }, actualReadingTime);
            }
          }
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
        
        // Only request message history from server if the selected user is not a bot
        if (state.socket?.connected && !user.id.startsWith('bot-')) {
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
      
      // Separate real users and bots
      const realUsers = users.filter(u => !u.id.startsWith('bot-') && u.id !== currentUser?.id);
      const botUsers = users.filter(u => u.id.startsWith('bot-'));
      
      // Update state with real users first, then bots
      set({ 
        activeUsers: [...realUsers, ...botUsers],
        users: users // Store all users for reference
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
      
      // Add message immediately to local state for instant feedback
      get().addMessage(message);

      // Check if recipient is a bot
      const recipientId = message.receiverId;
      if (recipientId.startsWith('bot-')) {
        // Check if user has already received a response from this bot
        if (hasUserReceivedResponse(message.senderId, recipientId)) {
          // User has already received a response, do nothing
          return;
        }

        // Handle bot messages locally without server involvement
        const botUser = allBotUsers.find(bot => bot.id === recipientId);
        if (botUser) {
          // Get bot response
          const botResponseContent = generateBotResponse(`${message.senderId}|${message.content}`, recipientId);
          
          // Only proceed with typing animation and response if we have content
          if (botResponseContent) {
            // Calculate reading time based on message length and complexity
            const wordsPerMinute = 200; // Average reading speed
            const wordCount = message.content.split(' ').length;
            const readingTimeMs = (wordCount / wordsPerMinute) * 60 * 1000;
            const minReadingTime = 1000; // Minimum 1 second to read
            const actualReadingTime = Math.max(minReadingTime, Math.min(readingTimeMs, 5000)); // Cap at 5 seconds

            // Calculate typing speed (average 40 WPM)
            const typingSpeed = 40; // words per minute
            const responseLength = 20; // Fixed length for greeting
            const typingTimeMs = (responseLength / (typingSpeed * 5)) * 60 * 1000; // 5 chars per word
            const minTypingTime = 1500; // Minimum 1.5 seconds to type
            const actualTypingTime = Math.max(minTypingTime, Math.min(typingTimeMs, 4000));

            // First, bot reads the message (no typing indicator)
            setTimeout(() => {
              // After reading, show typing indicator
              set(state => ({
                activeUsers: state.activeUsers.map(user => 
                  user.id === recipientId ? { ...user, isTyping: true } : user
                )
              }));

              // Then bot types and sends response
              setTimeout(() => {
                // Stop typing indicator
                set(state => ({
                  activeUsers: state.activeUsers.map(user => 
                    user.id === recipientId ? { ...user, isTyping: false } : user
                  )
                }));

                // Create and send bot response
                const botResponse: Message = {
                  id: crypto.randomUUID(),
                  senderId: recipientId,
                  receiverId: message.senderId,
                  content: botResponseContent,
                  timestamp: Date.now(),
                  type: 'text',
                  seen: false,
                  delivered: true,
                  reactions: []
                };

                // Add bot response to local state and chat room
                get().addMessage(botResponse);

                // Store in localStorage
                const roomId = [message.senderId, recipientId].sort().join('-');
                const chatRooms = JSON.parse(localStorage.getItem('chatRooms') || '[]');
                const roomIndex = chatRooms.findIndex((room: ChatRoom) => room.id === roomId);
                
                if (roomIndex !== -1) {
                  chatRooms[roomIndex].messages.push(botResponse);
                  chatRooms[roomIndex].lastMessage = botResponse;
                } else {
                  const currentUser = get().currentUser;
                  if (currentUser) {
                    chatRooms.push({
                      id: roomId,
                      participants: [currentUser, botUser],
                      messages: [message, botResponse],
                      lastMessage: botResponse
                    });
                  }
                }
                localStorage.setItem('chatRooms', JSON.stringify(chatRooms));
              }, actualTypingTime);
            }, actualReadingTime);
          }
        }
      } else {
        // For non-bot recipients, send message to server
        socket.emit('message:send', message);
      }
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
  }
}));
