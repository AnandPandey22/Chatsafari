import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../Store/useStore';
import { Image, Smile, Send, ArrowLeft, Paperclip } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ChatRoom, User, Message } from '../types';

interface ChatWindowProps {
  isMobile: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ isMobile }) => {
  const { selectedUser, setSelectedUser, currentUser, addMessage, chatRooms, socket } = useStore();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize notification sound
    notificationSound.current = new Audio('/notification.mp3');
    // Set volume to 100%
    if (notificationSound.current) {
      notificationSound.current.volume = 1.0;
    }
  }, []);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatRooms]);

  // Play notification sound when receiving a new message
  useEffect(() => {
    const lastMessage = chatRooms[chatRooms.length - 1]?.messages[chatRooms[chatRooms.length - 1].messages.length - 1];
    if (lastMessage && lastMessage.senderId !== currentUser?.id) {
      notificationSound.current?.play().catch(error => {
        console.error('Error playing notification sound:', error);
      });
    }
  }, [chatRooms, currentUser?.id]);

  if (!selectedUser || !currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Select a user to start chatting</h3>
          <p className="mt-1 text-sm text-gray-500">Choose someone from the list to begin a conversation</p>
        </div>
      </div>
    );
  }

  const roomId = [currentUser.id, selectedUser.id].sort().join('-');
  const currentRoom = chatRooms.find((room: ChatRoom) => room.id === roomId);
  const messages = currentRoom?.messages || [];

  const handleBack = () => {
    setSelectedUser(null);
  };

  const handleSend = () => {
    if (message.trim() && currentUser && selectedUser && socket) {
      try {
        const newMessage: Message = {
          id: crypto.randomUUID(),
          senderId: currentUser.id,
          receiverId: selectedUser.id,
          content: message.trim(),
          type: 'text',
          timestamp: Date.now(),
          seen: false,
          delivered: false,
          reactions: [],
        };

        // Clear the input first for better UX
        setMessage('');

        // Emit the message to the server
        socket.emit('message:send', newMessage, (error: any) => {
          if (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message. Please try again.');
            return;
          }
          
          // Add message to local state
          addMessage(newMessage);
          scrollToBottom();
        });
      } catch (error) {
        console.error('Error in handleSend:', error);
        toast.error('Something went wrong. Please try again.');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser && selectedUser && socket) {
      try {
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image size should be less than 5MB');
          return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          toast.error('Only image files are allowed');
          return;
        }

        // Convert image to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        // Create and send image message
        const newMessage: Message = {
          id: crypto.randomUUID(),
          senderId: currentUser.id,
          receiverId: selectedUser.id,
          content: base64,
          type: 'image',
          timestamp: Date.now(),
          seen: false,
          delivered: false,
          reactions: [],
        };

        // Emit the message to the server
        socket.emit('message:send', newMessage, (error: any) => {
          if (error) {
            console.error('Error sending image:', error);
            toast.error('Failed to send image. Please try again.');
            return;
          }
          
          // Add message to local state
          addMessage(newMessage);
          scrollToBottom();
        });
      } catch (error) {
        console.error('Error in handleImageUpload:', error);
        toast.error('Failed to process image. Please try again.');
      }
    }
  };

  const renderMessage = (msg: Message) => {
    const isCurrentUser = msg.senderId === currentUser.id;
    return (
      <div
        key={msg.id}
        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`rounded-2xl py-3 px-4 max-w-[75%] shadow-sm ${
            isCurrentUser
              ? 'bg-violet-600 text-white rounded-br-none'
              : 'bg-white text-black rounded-bl-none'
          }`}
        >
          {msg.type === 'image' ? (
            <div className="relative">
              <img 
                src={msg.content} 
                alt="Sent image" 
                className="rounded-lg max-w-full max-h-[300px] object-contain hover:opacity-95 transition-opacity cursor-pointer"
                onClick={() => {
                  const newWindow = window.open('', '_blank');
                  if (newWindow) {
                    newWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Chat Image</title>
                          <style>
                            body {
                              margin: 0;
                              padding: 0;
                              display: flex;
                              justify-content: center;
                              align-items: center;
                              min-height: 100vh;
                              background: #1a1a1a;
                            }
                            img {
                              max-width: 95vw;
                              max-height: 95vh;
                              object-fit: contain;
                            }
                          </style>
                        </head>
                        <body>
                          <img src="${msg.content}" alt="Chat Image" />
                        </body>
                      </html>
                    `);
                    newWindow.document.close();
                  }
                }}
              />
            </div>
          ) : (
            <p className="text-sm break-words">{msg.content}</p>
          )}
          <div
            className={`text-xs mt-1 flex items-center ${
              isCurrentUser ? 'text-violet-200' : 'text-gray-500'
            }`}
          >
            <span>{format(msg.timestamp, 'HH:mm')}</span>
            {isCurrentUser && (
              <span className="ml-2">
                {msg.seen ? (
                  <span className="text-red-500">✓✓</span>
                ) : msg.delivered ? (
                  <span className="text-violet-200">✓✓</span>
                ) : (
                  <span className="text-violet-200">✓</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="shrink-0 p-4 border-b border-gray-200 flex items-center space-x-4 bg-white">
        {isMobile && (
          <button 
            onClick={handleBack} 
            className="text-gray-600 hover:text-gray-900 p-2 -ml-2"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <div className="relative">
          <img
            src={selectedUser.avatar}
            alt={selectedUser.username}
            className="w-12 h-12 rounded-full ring-2 ring-violet-500 ring-offset-2"
          />
          {selectedUser.isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
          )}
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{selectedUser.username}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{selectedUser.gender}</span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">{selectedUser.age} years</span>
          </div>
        </div>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 min-h-0">
        <div className="p-4 space-y-4">
          <div className="flex justify-center">
            <div className="bg-white rounded-full py-2 px-4 text-sm text-gray-500 shadow-sm">
              Start of your conversation with {selectedUser.username}
            </div>
          </div>
          
          {messages.map((msg) => renderMessage(msg))}
          
          <div ref={messageEndRef} />
        </div>
      </div>

      {/* Input - Fixed */}
      <div className="shrink-0 p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-2">
          <label className="cursor-pointer text-gray-600 hover:text-violet-600 transition duration-150 ease-in-out relative group">
            <Paperclip size={20} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Send image
            </span>
          </label>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-gray-600 hover:text-violet-600 transition duration-150 ease-in-out"
          >
            <Smile size={20} />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition duration-150 ease-in-out"
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            className="text-violet-600 hover:text-violet-700 transition duration-150 ease-in-out"
          >
            <Send size={20} />
          </button>
        </div>
        {showEmojiPicker && (
          <div className="absolute bottom-20 right-4">
            <EmojiPicker
              onEmojiClick={(emojiData: EmojiClickData) => {
                setMessage((prev) => prev + emojiData.emoji);
                setShowEmojiPicker(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
