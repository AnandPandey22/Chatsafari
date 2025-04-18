import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Image, Smile, Send, ArrowLeft, Paperclip } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ChatRoom, User, Message } from '../types';

// Add CSS for secure image display
const secureImageStyles = `
  .secure-image-container {
    position: relative;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }
  
  .secure-image {
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
    user-drag: none;
  }

  .secure-image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: transparent;
    z-index: 1;
    pointer-events: none;
  }

  @media print {
    .secure-image-container {
      display: none;
    }
  }
`;

// Add style tag to head
const styleSheet = document.createElement("style");
styleSheet.innerText = secureImageStyles;
document.head.appendChild(styleSheet);

interface ChatWindowProps {
  isMobile: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ isMobile }) => {
  const { selectedUser, setSelectedUser, currentUser, addMessage, chatRooms, socket } = useStore();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const imageRefs = useRef<{ [key: string]: HTMLImageElement | null }>({});
  const [isSecureMode, setIsSecureMode] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize notification sound
    notificationSound.current = new Audio('/notification.mp3');
    // Set volume to 100%
    if (notificationSound.current) {
      notificationSound.current.volume = 1.0;
    }
  }, []);

  // Add security measures for images
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // When tab/window loses focus, clear image sources
        Object.values(imageRefs.current).forEach(img => {
          if (img) {
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
          }
        });
      }
    };

    const handleFocusChange = () => {
      if (document.hasFocus()) {
        setIsSecureMode(true);
      } else {
        setIsSecureMode(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocusChange);
    window.addEventListener('blur', handleFocusChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocusChange);
      window.removeEventListener('blur', handleFocusChange);
    };
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

  // Handle typing indicator
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleTypingStatus = ({ userId, username, isTyping }: { userId: string; username: string; isTyping: boolean }) => {
      if (userId === selectedUser.id) {
        setIsTyping(isTyping);
      }
    };

    socket.on('typing:status', handleTypingStatus);

    return () => {
      socket.off('typing:status', handleTypingStatus);
    };
  }, [socket, selectedUser]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    if (!socket || !selectedUser) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing start if not already typing
    if (newMessage.trim() && !isTyping) {
      socket.emit('typing:start', selectedUser.id);
    }

    // Set timeout to emit typing stop
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && selectedUser) {
        socket.emit('typing:stop', selectedUser.id);
      }
    }, 1000); // Stop typing indicator after 1 second of inactivity
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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
    if (file) {
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

        // Convert image to base64 with additional security measures
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            // Add a small random noise to the image data to prevent exact matches
            const base64Data = reader.result as string;
            const randomNoise = Math.random().toString(36).substring(7);
            resolve(`${base64Data}#${randomNoise}`);
          };
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
        if (socket) {
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
        } else {
          toast.error('Connection lost. Please try again.');
        }
      } catch (error) {
        console.error('Error in handleImageUpload:', error);
        toast.error('Failed to process image. Please try again.');
      }
    }
  };

  // Add event listeners for screenshot prevention
  useEffect(() => {
    const preventScreenshot = (e: KeyboardEvent) => {
      // Prevent common screenshot shortcuts
      if (
        (e.ctrlKey && e.key === 'p') || // Print screen
        (e.ctrlKey && e.key === 's') || // Save
        (e.ctrlKey && e.key === 'u') || // View source
        (e.ctrlKey && e.shiftKey && e.key === 'i') || // Developer tools
        (e.ctrlKey && e.shiftKey && e.key === 'j') || // Developer console
        (e.ctrlKey && e.shiftKey && e.key === 'c') || // Developer inspect
        (e.ctrlKey && e.shiftKey && e.key === 'k') || // Developer console
        (e.ctrlKey && e.key === 'u') || // View source
        (e.key === 'PrintScreen') || // Print screen key
        (e.altKey && e.key === 'PrintScreen') // Alt + Print screen
      ) {
        e.preventDefault();
      }
    };

    const preventRightClick = (e: MouseEvent) => {
      e.preventDefault();
    };

    const preventDrag = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', preventScreenshot);
    window.addEventListener('contextmenu', preventRightClick);
    window.addEventListener('dragstart', preventDrag);

    return () => {
      window.removeEventListener('keydown', preventScreenshot);
      window.removeEventListener('contextmenu', preventRightClick);
      window.removeEventListener('dragstart', preventDrag);
    };
  }, []);

  const renderMessage = (message: Message) => {
    const isCurrentUser = message.senderId === currentUser?.id;
    const messageClass = isCurrentUser ? 'bg-violet-600 text-white' : 'bg-white text-gray-900';
    const containerClass = isCurrentUser ? 'justify-end' : 'justify-start';

    // Check if the message is an image
    const isImage = message.content.startsWith('data:image/') || 
                   message.content.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    return (
      <div key={message.id} className={`flex ${containerClass} mb-4`}>
        <div className={`flex flex-col max-w-[90%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
          <div className={`rounded-lg px-4 py-2 ${messageClass} shadow-sm break-words w-full`}>
            {isImage ? (
              <div 
                className="relative group secure-image-container cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const newWindow = window.open('', '_blank');
                  if (newWindow) {
                    newWindow.document.write(`
                      <html>
                        <head>
                          <title>Secure Image View</title>
                          <style>
                            @media print {
                              body * {
                                visibility: hidden;
                              }
                              body {
                                background: white;
                              }
                            }
                            body {
                              margin: 0;
                              background: #000; 
                              display: flex; 
                              justify-content: center; 
                              align-items: center; 
                              min-height: 100vh;
                              user-select: none;
                              -webkit-user-select: none;
                              -moz-user-select: none;
                              -ms-user-select: none;
                              overflow: hidden;
                              -webkit-print-color-adjust: exact;
                              print-color-adjust: exact;
                            }
                            .image-container {
                              position: relative;
                              max-width: 100%;
                              max-height: 100vh;
                              display: flex;
                              justify-content: center;
                              align-items: center;
                              -webkit-print-color-adjust: exact;
                              print-color-adjust: exact;
                            }
                            img {
                              max-width: 100%; 
                              max-height: 100vh; 
                              object-fit: contain;
                              pointer-events: none;
                              -webkit-user-drag: none;
                              -khtml-user-drag: none;
                              -moz-user-drag: none;
                              -o-user-drag: none;
                              user-drag: none;
                              -webkit-touch-callout: none;
                              -webkit-tap-highlight-color: transparent;
                              -webkit-print-color-adjust: exact;
                              print-color-adjust: exact;
                            }
                            .close-btn {
                              position: fixed;
                              top: 20px;
                              right: 20px;
                              background: rgba(0,0,0,0.5);
                              color: white;
                              border: none;
                              border-radius: 50%;
                              width: 40px;
                              height: 40px;
                              cursor: pointer;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              z-index: 1000;
                            }
                            .watermark {
                              position: fixed;
                              bottom: 20px;
                              right: 20px;
                              color: rgba(255,255,255,0.3);
                              font-family: Arial, sans-serif;
                              font-size: 12px;
                              pointer-events: none;
                            }
                          </style>
                        </head>
                        <body>
                          <button class="close-btn" onclick="window.close()">×</button>
                          <div class="image-container">
                            <img src="${message.content}" alt="Full size image">
                          </div>
                          <div class="watermark">ChatSafari - Secure Image View</div>
                          <script>
                            // Prevent right-click
                            document.addEventListener('contextmenu', (e) => e.preventDefault());
                            
                            // Prevent keyboard shortcuts
                            document.addEventListener('keydown', (e) => {
                              if (
                                (e.ctrlKey && e.key === 'p') || // Print screen
                                (e.ctrlKey && e.key === 's') || // Save
                                (e.ctrlKey && e.key === 'u') || // View source
                                (e.ctrlKey && e.shiftKey && e.key === 'i') || // Developer tools
                                (e.ctrlKey && e.shiftKey && e.key === 'j') || // Developer console
                                (e.ctrlKey && e.shiftKey && e.key === 'c') || // Developer inspect
                                (e.ctrlKey && e.shiftKey && e.key === 'k') || // Developer console
                                (e.ctrlKey && e.key === 'u') || // View source
                                (e.key === 'PrintScreen') || // Print screen key
                                (e.altKey && e.key === 'PrintScreen') || // Alt + Print screen
                                (e.ctrlKey && e.key === 'c') || // Copy
                                (e.ctrlKey && e.key === 'v') || // Paste
                                (e.ctrlKey && e.key === 'x') || // Cut
                                (e.ctrlKey && e.key === 'a') || // Select all
                                (e.ctrlKey && e.key === 'z') || // Undo
                                (e.ctrlKey && e.key === 'y') || // Redo
                                (e.ctrlKey && e.key === 'r') || // Refresh
                                (e.ctrlKey && e.key === 'f') || // Find
                                (e.ctrlKey && e.key === 'g') || // Find next
                                (e.ctrlKey && e.key === 'h') || // Replace
                                (e.ctrlKey && e.key === 'l') || // Focus address bar
                                (e.ctrlKey && e.key === 'w') || // Close tab
                                (e.ctrlKey && e.key === 't') || // New tab
                                (e.ctrlKey && e.key === 'n') || // New window
                                (e.ctrlKey && e.key === 'm') || // Minimize
                                (e.ctrlKey && e.key === 'b') || // Bold
                                (e.ctrlKey && e.key === 'i') || // Italic
                                (e.ctrlKey && e.key === 'u') || // Underline
                                (e.ctrlKey && e.key === '1') || // Heading 1
                                (e.ctrlKey && e.key === '2') || // Heading 2
                                (e.ctrlKey && e.key === '3') || // Heading 3
                                (e.ctrlKey && e.key === '4') || // Heading 4
                                (e.ctrlKey && e.key === '5') || // Heading 5
                                (e.ctrlKey && e.key === '6') || // Heading 6
                                (e.ctrlKey && e.key === '7') || // Ordered list
                                (e.ctrlKey && e.key === '8') || // Unordered list
                                (e.ctrlKey && e.key === '9') || // Subscript
                                (e.ctrlKey && e.key === '0') || // Superscript
                                (e.ctrlKey && e.key === '=') || // Zoom in
                                (e.ctrlKey && e.key === '-') || // Zoom out
                                (e.ctrlKey && e.key === '0') || // Reset zoom
                                (e.ctrlKey && e.key === '\\') || // Toggle sidebar
                                (e.ctrlKey && e.key === ']') || // Indent
                                (e.ctrlKey && e.key === '[') || // Outdent
                                (e.ctrlKey && e.key === ';') || // Toggle comment
                                (e.ctrlKey && e.key === '/') || // Toggle comment
                                (e.ctrlKey && e.key === 'k') || // Delete line
                                (e.ctrlKey && e.key === 'd') || // Select word
                                (e.ctrlKey && e.key === 'e') || // Center line
                                (e.ctrlKey && e.key === 'f') || // Find
                                (e.ctrlKey && e.key === 'g') || // Find next
                                (e.ctrlKey && e.key === 'h') || // Replace
                                (e.ctrlKey && e.key === 'i') || // Toggle case
                                (e.ctrlKey && e.key === 'j') || // Join lines
                                (e.ctrlKey && e.key === 'k') || // Delete line
                                (e.ctrlKey && e.key === 'l') || // Select line
                                (e.ctrlKey && e.key === 'm') || // Toggle comment
                                (e.ctrlKey && e.key === 'n') || // New line
                                (e.ctrlKey && e.key === 'o') || // Open file
                                (e.ctrlKey && e.key === 'p') || // Quick open
                                (e.ctrlKey && e.key === 'q') || // Quit
                                (e.ctrlKey && e.key === 'r') || // Refresh
                                (e.ctrlKey && e.key === 's') || // Save
                                (e.ctrlKey && e.key === 't') || // New tab
                                (e.ctrlKey && e.key === 'u') || // Undo
                                (e.ctrlKey && e.key === 'v') || // Paste
                                (e.ctrlKey && e.key === 'w') || // Close tab
                                (e.ctrlKey && e.key === 'x') || // Cut
                                (e.ctrlKey && e.key === 'y') || // Redo
                                (e.ctrlKey && e.key === 'z') || // Undo
                                (e.key === 'F12') || // Developer tools
                                (e.key === 'PrintScreen') || // Print screen
                                (e.altKey && e.key === 'PrintScreen') || // Alt + Print screen
                                (e.key === 'F5') || // Refresh
                                (e.key === 'F11') || // Fullscreen
                                (e.key === 'F12') || // Developer tools
                                (e.key === 'Escape') || // Escape
                                (e.key === 'Tab') || // Tab
                                (e.key === 'Space') || // Space
                                (e.key === 'Enter') || // Enter
                                (e.key === 'Backspace') || // Backspace
                                (e.key === 'Delete') || // Delete
                                (e.key === 'Insert') || // Insert
                                (e.key === 'Home') || // Home
                                (e.key === 'End') || // End
                                (e.key === 'PageUp') || // PageUp
                                (e.key === 'PageDown') || // PageDown
                                (e.key === 'ArrowLeft') || // ArrowLeft
                                (e.key === 'ArrowRight') || // ArrowRight
                                (e.key === 'ArrowUp') || // ArrowUp
                                (e.key === 'ArrowDown') // ArrowDown
                              ) {
                                e.preventDefault();
                              }
                            });

                            // Prevent drag and drop
                            document.addEventListener('dragstart', (e) => e.preventDefault());
                            document.addEventListener('drop', (e) => e.preventDefault());
                            document.addEventListener('dragover', (e) => e.preventDefault());

                            // Prevent selection
                            document.addEventListener('selectstart', (e) => e.preventDefault());
                            document.addEventListener('select', (e) => e.preventDefault());
                            document.addEventListener('copy', (e) => e.preventDefault());
                            document.addEventListener('cut', (e) => e.preventDefault());
                            document.addEventListener('paste', (e) => e.preventDefault());

                            // Prevent zoom
                            document.addEventListener('wheel', (e) => {
                              if (e.ctrlKey) {
                                e.preventDefault();
                              }
                            }, { passive: false });

                            // Prevent touch actions
                            document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
                            document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
                            document.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });

                            // Prevent dev tools
                            setInterval(() => {
                              const devtools = /./;
                              devtools.toString = function() {
                                window.close();
                                return '';
                              }
                            }, 1000);

                            // Prevent print dialog
                            window.onbeforeprint = function() {
                              window.close();
                              return false;
                            };

                            // Prevent print through browser menu
                            window.onprint = function() {
                              window.close();
                              return false;
                            };

                            // Additional print prevention
                            window.addEventListener('beforeprint', function(e) {
                              e.preventDefault();
                              window.close();
                              return false;
                            });

                            // Prevent print through browser menu
                            window.addEventListener('print', function(e) {
                              e.preventDefault();
                              window.close();
                              return false;
                            });

                            // Prevent print through browser menu
                            window.addEventListener('afterprint', function(e) {
                              e.preventDefault();
                              window.close();
                              return false;
                            });

                            // Prevent print through browser menu
                            window.addEventListener('beforeunload', function(e) {
                              e.preventDefault();
                              window.close();
                              return false;
                            });

                            // Prevent print through browser menu
                            window.addEventListener('unload', function(e) {
                              e.preventDefault();
                              window.close();
                              return false;
                            });

                            // Prevent print through browser menu
                            window.addEventListener('load', function(e) {
                              e.preventDefault();
                              window.close();
                              return false;
                            });

                            // Prevent print through browser menu
                            window.addEventListener('DOMContentLoaded', function(e) {
                              e.preventDefault();
                              window.close();
                              return false;
                            });
                          </script>
                        </body>
                      </html>
                    `);
                    newWindow.document.close();
                  }
                }}
              >
                <img
                  src={isSecureMode ? message.content : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
                  alt="Shared image"
                  className="max-w-full h-auto rounded-lg secure-image"
                />
                <div className="secure-image-overlay" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
            </div>
          ) : (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
            <span>{format(new Date(message.timestamp), 'MMM d, h:mm a')}</span>
            {isCurrentUser && (
              <span className="ml-1">
                {message.delivered ? (
                  <svg
                    className="w-4 h-4 inline-block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7M5 19l4 4L19 13"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 inline-block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
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
          
          {isTyping && (
            <div className="flex items-center space-x-2 text-gray-500 text-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>{selectedUser.username} is typing...</span>
            </div>
          )}
          
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
            onChange={handleMessageChange}
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
