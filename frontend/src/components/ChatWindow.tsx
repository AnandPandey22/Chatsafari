import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Image, Smile, Send, ArrowLeft, Paperclip, Ban, Phone, Video, MoreVertical, Reply, Users } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ChatRoom, User, Message } from '../types';
import CallModal from './CallModal';

// @ts-ignore
window.__groupCounts = window.__groupCounts || {};

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
  const { selectedUser, setSelectedUser, currentUser, addMessage, chatRooms, socket, activeUsers, isCallOpen, setIsCallOpen, isIncoming, setIsIncoming, callFrom, setCallFrom, callTo, setCallTo, callType, setCallType, lastOffer, setLastOffer, clearIncomingCall, autoAcceptCall, setAutoAcceptCall, sendMessage, isJoiningGroup } = useStore();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    const saved = localStorage.getItem('blockedUsers');
    return saved ? JSON.parse(saved) : [];
  });
  const [isBlocked, setIsBlocked] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  const imageRefs = useRef<{ [key: string]: HTMLImageElement | null }>({});
  const [isSecureMode, setIsSecureMode] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [callConsent, setCallConsent] = useState(false);
  const [pendingCallRequest, setPendingCallRequest] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isFullDesktop, setIsFullDesktop] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const callingAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneAudioRef = useRef<HTMLAudioElement | null>(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callHandled, setCallHandled] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (!currentUser || !selectedUser) return false;
    const key = `callHandled-${currentUser?.id}-${selectedUser?.id}`;
    return localStorage.getItem(key) === 'true';
  });
  const [callHandledReady, setCallHandledReady] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [file, setFile] = useState<File | null>(null);
  // Track genderFilter in state and sync with localStorage
  const [genderFilter, setGenderFilter] = useState(() => localStorage.getItem('genderFilter') || 'all');
  // Group popup states
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showActiveMembers, setShowActiveMembers] = useState(false);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('notificationSoundEnabled');
    return stored === null ? true : stored === 'true';
  });

  // Auto scroll to bottom for messages only
  const scrollToBottom = () => {
    if (messageEndRef.current && chatContainerRef.current) {
      if (isMobile) {
        setTimeout(() => {
          if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 150);
      } else {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
  };

  // Scroll messages when new ones arrive or when chat window is opened
  useEffect(() => {
    if (selectedUser) {
      // Use requestAnimationFrame to ensure DOM is updated before scrolling
      requestAnimationFrame(() => {
      scrollToBottom();
      });
    }
  }, [selectedUser, chatRooms]);

  // Handle keyboard appearance on mobile
  useEffect(() => {
    if (isMobile) {
      const handleFocus = (e: Event) => {
        e.preventDefault();
        // Prevent page scroll when keyboard opens
        if (chatContainerRef.current) {
          chatContainerRef.current.style.height = '450px';
          chatContainerRef.current.style.position = 'fixed';
          chatContainerRef.current.style.bottom = '0';
          chatContainerRef.current.style.left = '0';
          chatContainerRef.current.style.right = '0';
          chatContainerRef.current.style.zIndex = '50';
        }
      };

      const handleBlur = () => {
        if (chatContainerRef.current) {
          chatContainerRef.current.style.position = '';
          chatContainerRef.current.style.bottom = '';
          chatContainerRef.current.style.left = '';
          chatContainerRef.current.style.right = '';
          chatContainerRef.current.style.zIndex = '';
        }
      };

      const inputElement = document.querySelector('input[type="text"]');
      inputElement?.addEventListener('focus', handleFocus);
      inputElement?.addEventListener('blur', handleBlur);

      return () => {
        inputElement?.removeEventListener('focus', handleFocus);
        inputElement?.removeEventListener('blur', handleBlur);
      };
    }
  }, [isMobile]);

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

  // Check if user is blocked when component mounts or selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      setIsBlocked(blockedUsers.includes(selectedUser.id));
    }
  }, [selectedUser, blockedUsers]);

  // Sync with localStorage changes (from other tabs/components)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'notificationSoundEnabled') {
        setNotificationSoundEnabled(e.newValue === null ? true : e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Also listen for changes from UserList (in the same tab)
  useEffect(() => {
    const handleLocalChange = () => {
      const stored = localStorage.getItem('notificationSoundEnabled');
      setNotificationSoundEnabled(stored === null ? true : stored === 'true');
    };
    window.addEventListener('notificationSoundChanged', handleLocalChange);
    return () => window.removeEventListener('notificationSoundChanged', handleLocalChange);
  }, []);

  // Play notification sound when receiving a new message
  useEffect(() => {
    const lastMessage = chatRooms[chatRooms.length - 1]?.messages[chatRooms[chatRooms.length - 1].messages.length - 1];
    if (lastMessage && 
        lastMessage.senderId !== currentUser?.id && 
        !blockedUsers.includes(lastMessage.senderId)) {
      if (notificationSoundEnabled) {
      notificationSound.current?.play().catch(error => {
        console.error('Error playing notification sound:', error);
      });
    }
    }
  }, [chatRooms, currentUser?.id, blockedUsers, notificationSoundEnabled]);

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

  // Check call consent on chat load
  useEffect(() => {
    if (!socket || !selectedUser || !currentUser) return;
    socket.emit('call:consent:check', { userId1: currentUser.id, userId2: selectedUser.id }, (consent: boolean) => {
      setCallConsent(consent);
    });
  }, [socket, selectedUser, currentUser]);

  // Persist callHandled in localStorage per user pair
  useEffect(() => {
    if (!currentUser || !selectedUser) return;
    const key = `callHandled-${currentUser.id}-${selectedUser.id}`;
    const handled = localStorage.getItem(key) === 'true';
    setCallHandled(handled);
    setCallHandledReady(true);
  }, [currentUser, selectedUser]);

  // Handle call request/consent messages
  const handleApproveCall = (msg: Message) => {
    if (!socket || !currentUser || !selectedUser) return;
    socket.emit('call:respond', { senderId: msg.senderId, receiverId: msg.receiverId, approved: true });
    setCallConsent(true);
    setCallHandled(true);
    // Persist
    const key = `callHandled-${currentUser.id}-${selectedUser.id}`;
    localStorage.setItem(key, 'true');
  };
  const handleDeclineCall = (msg: Message) => {
    if (!socket || !currentUser || !selectedUser) return;
    socket.emit('call:respond', { senderId: msg.senderId, receiverId: msg.receiverId, approved: false });
    setPendingCallRequest(false);
    setCallHandled(true);
    // Persist
    const key = `callHandled-${currentUser.id}-${selectedUser.id}`;
    localStorage.setItem(key, 'true');
  };
  const handleRequestCall = (callType: 'audio' | 'video') => {
    if (!socket || !currentUser || !selectedUser) return;
    socket.emit('call:request', { senderId: currentUser.id, receiverId: selectedUser.id, callType });
    setPendingCallRequest(true);
  };

  // Listen for call_request and call_consent messages to update state
  useEffect(() => {
    if (!socket) return;
    const onMessageReceive = ({ roomId, message }: { roomId: string; message: Message }) => {
      addMessage(message);
      requestAnimationFrame(() => scrollToBottom());
      // If the message is from the selected user and the chat is open, mark as viewed immediately
      if (
        selectedUser && currentUser &&
        message.senderId === selectedUser.id &&
        message.receiverId === currentUser.id
      ) {
        socket.emit('messages:viewed', { roomId, viewerId: currentUser.id });
      }
      // If the message is a call_consent, set callConsent to true for both users
      if (message.type === 'call_consent') {
        setCallConsent(true);
      }
    };
    socket.on('message:receive', onMessageReceive);
    return () => {
      socket.off('message:receive', onMessageReceive);
    };
  }, [socket, selectedUser, currentUser, addMessage]);

  // When clicking outside the menu, close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);

  // Utility: get media constraints
  const getMediaConstraints = (type: 'audio' | 'video') =>
    type === 'video' ? { video: true, audio: true } : { video: false, audio: true };

  // Outgoing call logic
  const handleStartCall = async (type: 'audio' | 'video') => {
    setCallType(type);
    setIsIncoming(false);
    setIsCallOpen(true);
    setCallTo(selectedUser!.id);
    setCallFrom(currentUser!.id);
    setIsFullDesktop(false);
    setCallAccepted(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints(type));
      setLocalStream(stream);
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun.services.mozilla.com' },
          { urls: 'stun:stun.stunprotocol.org:3478' },
          {
            urls: "stun:stun.relay.metered.ca:80",
          },
          {
            urls: "turn:global.relay.metered.ca:80",
            username: "b4e3763007b69227a9314d5f",
            credential: "Yhtr/8yu/GGQ/fLP",
          },
          {
            urls: "turn:global.relay.metered.ca:80?transport=tcp",
            username: "b4e3763007b69227a9314d5f",
            credential: "Yhtr/8yu/GGQ/fLP",
          },
          {
            urls: "turn:global.relay.metered.ca:443",
            username: "b4e3763007b69227a9314d5f",
            credential: "Yhtr/8yu/GGQ/fLP",
          },
          {
            urls: "turns:global.relay.metered.ca:443?transport=tcp",
            username: "b4e3763007b69227a9314d5f",
            credential: "Yhtr/8yu/GGQ/fLP",
          },
        ]
      });
      peerConnectionRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.onicecandidate = (event) => {
        if (event.candidate && socket && selectedUser) {
          socket!.emit('webrtc:ice-candidate', {
            to: selectedUser.id,
            from: currentUser!.id,
            candidate: event.candidate,
          });
        }
      };
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (socket && selectedUser) {
        socket!.emit('webrtc:offer', {
          to: selectedUser.id,
          from: currentUser!.id,
          offer,
          callType: type,
        });
      }
    } catch (err) {
      toast.error('Could not start call: ' + err);
      setIsCallOpen(false);
    }
  };

  // Incoming call: Accept
  const handleAccept = async () => {
    stopCallSounds();
    setCallAccepted(true);
    setIsIncoming(false);
    try {
      if (!currentUser) return;
      // Notify caller to stop calling sound instantly
      if (socket && callFrom && currentUser) {
        socket.emit('call:accepted', { to: callFrom, from: currentUser.id });
      }
      const stream = await navigator.mediaDevices.getUserMedia(getMediaConstraints(callType));
      setLocalStream(stream);
      setCallTo(callFrom);
      setCallFrom(currentUser.id);
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun.services.mozilla.com' },
          { urls: 'stun:stun.stunprotocol.org:3478' },
          {
            urls: "stun:stun.relay.metered.ca:80",
          },
          {
            urls: "turn:global.relay.metered.ca:80",
            username: "b4e3763007b69227a9314d5f",
            credential: "Yhtr/8yu/GGQ/fLP",
          },
          {
            urls: "turn:global.relay.metered.ca:80?transport=tcp",
            username: "b4e3763007b69227a9314d5f",
            credential: "Yhtr/8yu/GGQ/fLP",
          },
          {
            urls: "turn:global.relay.metered.ca:443",
            username: "b4e3763007b69227a9314d5f",
            credential: "Yhtr/8yu/GGQ/fLP",
          },
          {
            urls: "turns:global.relay.metered.ca:443?transport=tcp",
            username: "b4e3763007b69227a9314d5f",
            credential: "Yhtr/8yu/GGQ/fLP",
          },
        ]
      });
      peerConnectionRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      pc.onicecandidate = (event) => {
        if (event.candidate && socket && callFrom) {
          socket!.emit('webrtc:ice-candidate', {
            to: callFrom,
            from: currentUser.id,
            candidate: event.candidate,
          });
        }
      };
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };
      if (socket) {
        socket.on('webrtc:answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          stopCallSounds();
          setCallAccepted(true);
        });
      }
      // Listen for ICE candidates
      if (socket) {
        socket.on('webrtc:ice-candidate', ({ candidate }: { candidate: RTCIceCandidateInit }) => {
          if (candidate && peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'closed') {
            peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });
      }
      // Set remote offer
      if (socket && callFrom && lastOffer) {
        await pc.setRemoteDescription(new RTCSessionDescription(lastOffer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket!.emit('webrtc:answer', {
          to: callFrom,
          from: currentUser.id,
          answer,
        });
      }
    } catch (err) {
      toast.error('Could not accept call: ' + err);
      setIsCallOpen(false);
    }
  };

  // Listen for signaling events
  useEffect(() => {
    if (!socket) return;
    // Incoming offer
    const handleOffer = async ({ from, offer, callType }: { from: string; offer: RTCSessionDescriptionInit; callType: 'audio' | 'video' }) => {
      setCallType(callType);
      setIsIncoming(true);
      setIsCallOpen(true);
      setCallFrom(from);
      setCallTo(currentUser!.id);
      setLastOffer(offer);
      setCallAccepted(false);
    };
    // Incoming answer
    const handleAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        stopCallSounds();
        setCallAccepted(true);
      }
    };
    // Incoming ICE candidate
    const handleCandidate = ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      const pc = peerConnectionRef.current;
      if (pc && candidate && pc.signalingState !== 'closed') {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };
    // Hangup
    const handleHangup = () => {
      console.log('[SIGNAL] webrtc:hangup received, cleaning up call (modal should close)');
      cleanupCall();
      setCallAccepted(false);
    };
    // Call accepted (for caller to stop calling sound instantly)
    const handleCallAccepted = () => {
      stopCallSounds();
      setCallAccepted(true);
    };
    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleCandidate);
    socket.on('webrtc:hangup', handleHangup);
    socket.on('call:accepted', handleCallAccepted);
    return () => {
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleCandidate);
      socket.off('webrtc:hangup', handleHangup);
      socket.off('call:accepted', handleCallAccepted);
    };
  }, [socket, currentUser?.id]);

  // Cleanup function
  const cleanupCall = () => {
    console.log('[DEBUG] cleanupCall called');
    setIsCallOpen(false);
    setIsIncoming(false);
    setIsFullDesktop(false);
    setLocalStream(null);
    setRemoteStream(null);
    setCallAccepted(false);
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    clearIncomingCall();
  };

  // Hangup handler
  const handleHangup = () => {
    stopCallSounds();
    if (socket && (callTo || callFrom)) {
      console.log('[SIGNAL] Emitting webrtc:hangup to', (callTo || callFrom));
      socket.emit('webrtc:hangup', {
        to: (callTo || callFrom)!,
        from: currentUser!.id,
      });
    }
    cleanupCall();
  };

  // Decline handler
  const handleDecline = () => {
    stopCallSounds();
    if (socket && callFrom) {
      socket!.emit('webrtc:hangup', {
        to: callFrom,
        from: currentUser!.id,
      });
    }
    cleanupCall();
  };

  // Call close handler
  const handleCallClose = () => {
    stopCallSounds();
    cleanupCall();
  };

  // Mute handler (optional, for future)
  const handleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Play/stop call sounds
  useEffect(() => {
    if (isCallOpen && !isIncoming && !callAccepted) {
      // Outgoing call: play calling.mp3
      if (!callingAudioRef.current) {
        callingAudioRef.current = new Audio('/calling.mp3');
        callingAudioRef.current.loop = true;
      }
      callingAudioRef.current.currentTime = 0;
      callingAudioRef.current.play().catch(() => {});
    } else if (callingAudioRef.current) {
      callingAudioRef.current.pause();
      callingAudioRef.current.currentTime = 0;
    }
    if (isCallOpen && isIncoming && !callAccepted) {
      // Incoming call: play ringtone.mp3
      if (!ringtoneAudioRef.current) {
        ringtoneAudioRef.current = new Audio('/ringtone.mp3');
        ringtoneAudioRef.current.loop = true;
      }
      ringtoneAudioRef.current.currentTime = 0;
      ringtoneAudioRef.current.play().catch(() => {});
    } else if (ringtoneAudioRef.current) {
      ringtoneAudioRef.current.pause();
      ringtoneAudioRef.current.currentTime = 0;
    }
    // Cleanup on unmount
    return () => {
      if (callingAudioRef.current) {
        callingAudioRef.current.pause();
        callingAudioRef.current.currentTime = 0;
      }
      if (ringtoneAudioRef.current) {
        ringtoneAudioRef.current.pause();
        ringtoneAudioRef.current.currentTime = 0;
      }
    };
  }, [isCallOpen, isIncoming, callAccepted]);

  // Stop sounds on accept, decline, or hangup
  const stopCallSounds = () => {
    if (callingAudioRef.current) {
      callingAudioRef.current.pause();
      callingAudioRef.current.currentTime = 0;
    }
    if (ringtoneAudioRef.current) {
      ringtoneAudioRef.current.pause();
      ringtoneAudioRef.current.currentTime = 0;
    }
  };

  // Add a useEffect to clear notification when selectedUser changes:
  useEffect(() => {
    clearIncomingCall();
  }, [selectedUser]);

  // Add this useEffect to auto-accept the call if needed:
  useEffect(() => {
    if (isCallOpen && isIncoming && autoAcceptCall && selectedUser?.id === callFrom) {
      const timeout = setTimeout(() => {
        handleAccept();
        setAutoAcceptCall(false);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isCallOpen, isIncoming, autoAcceptCall, selectedUser, callFrom]);

  // When selectedUser changes, emit messages:viewed for that room
  useEffect(() => {
    if (!socket || !currentUser || !selectedUser) return;
    const roomId = [currentUser.id, selectedUser.id].sort().join('-');
    socket.emit('messages:viewed', { roomId, viewerId: currentUser.id });
  }, [socket, currentUser, selectedUser]);

  // Remove delivery acknowledgment from message:receive handler
  useEffect(() => {
    if (!socket || !currentUser || !selectedUser) return;

    const onMessageReceive = ({ roomId, message }: { roomId: string; message: Message }) => {
      addMessage(message);
      requestAnimationFrame(() => scrollToBottom());
    };

    socket.on('message:receive', onMessageReceive);

    const onMessageDelivered = ({ messageId, roomId }: { messageId: string; roomId: string }) => {
      addMessage({ id: messageId, delivered: true });
    };
    socket.on('message:delivered', onMessageDelivered);

    return () => {
      socket.off('message:receive', onMessageReceive);
      socket.off('message:delivered', onMessageDelivered);
    };
  }, [socket, currentUser, selectedUser, addMessage]);

  // Track genderFilter in state and sync with localStorage
  useEffect(() => {
    const onStorage = () => {
      setGenderFilter(localStorage.getItem('genderFilter') || 'all');
    };
    window.addEventListener('storage', onStorage);
    // Also update on mount in case UserList changed it in same tab
    const interval = setInterval(onStorage, 200);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(interval);
    };
  }, []);

  // Helper to get active member count for group from global groupCounts
  const getActiveGroupMembers = (groupId: string) => {
    // @ts-ignore
    return window.__groupCounts?.[groupId] ?? 0;
  };

  // Listen for groupCounts updates from UserList
  useEffect(() => {
    const handler = () => {
      // Force re-render when groupCounts changes
      setMessage((m) => m);
    };
    window.addEventListener('groupCountsUpdated', handler);
    return () => window.removeEventListener('groupCountsUpdated', handler);
  }, []);

  useEffect(() => {
    if (!socket || !selectedUser || !selectedUser.isGroup) return;
    const handleGroupActiveMembers = (groupId: string, count: number) => {
      if (selectedUser && selectedUser.isGroup && selectedUser.id === groupId) {
        // Force re-render to update header
        setMessage((m) => m);
      }
    };
    socket.on('group:activeMembers', handleGroupActiveMembers);
    return () => {
      socket.off('group:activeMembers', handleGroupActiveMembers);
    };
  }, [socket, selectedUser]);

  if (!selectedUser || !currentUser) {
    // Show different message for group tab
    if (genderFilter === 'groups') {
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
            <h3 className="text-lg font-medium text-gray-900">Select a group to start chatting</h3>
            <p className="mt-1 text-sm text-gray-500">Choose any group from the list to begin a conversation</p>
          </div>
        </div>
      );
    }
    // Default (private chat) message
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

  // Determine the correct roomId for DMs and groups
  const isGroup = selectedUser.isGroup;
  const roomId = isGroup ? selectedUser.id : [currentUser.id, selectedUser.id].sort().join('-');
  const currentRoom = chatRooms.find((room: ChatRoom) => room.id === roomId);
  const messages = currentRoom?.messages || [];

  // Filter messages from blocked users
  const filteredMessages = messages.filter(msg => !blockedUsers.includes(msg.senderId));

  const handleBack = () => {
    setSelectedUser(null);
  };

  const handleSend = () => {
    if (!message.trim() && !file) return;
    if (currentUser && selectedUser) {
      try {
        const newMessage: Message = {
          id: crypto.randomUUID(),
          senderId: currentUser.id,
          receiverId: selectedUser.id,
          content: message,
          type: 'text',
          timestamp: Date.now(),
          seen: false,
          delivered: false,
          reactions: [],
          ...(replyingTo ? {
            replyTo: {
              id: replyingTo.id,
              senderId: replyingTo.senderId,
              content: replyingTo.content,
              type: replyingTo.type,
            }
          } : {})
        };
        setMessage('');
        sendMessage(newMessage);
        setReplyingTo(null);
        requestAnimationFrame(() => scrollToBottom());
      } catch (error) {
        console.error('Error in handleSend:', error);
        toast.error('Something went wrong. Please try again.');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser && selectedUser) {
        if (!file.type.startsWith('image/')) {
          toast.error('Only image files are allowed');
          return;
        }
      let toastId: string | undefined;
      try {
        toastId = toast.loading('Sending image...');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'chatsafari_images');
        const response = await fetch(`https://api.cloudinary.com/v1_1/duzw0d3lr/image/upload`, {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        if (result.secure_url) {
          const imageUrl = result.secure_url;
        const newMessage: Message = {
          id: crypto.randomUUID(),
          senderId: currentUser.id,
          receiverId: selectedUser.id,
            content: imageUrl,
          type: 'image',
          timestamp: Date.now(),
          seen: false,
          delivered: false,
          reactions: [],
        };
          sendMessage(newMessage);
          toast.success('Image sent!', { id: toastId });
        } else {
          toast.error('Failed to upload image. Please try again.', { id: toastId });
        }
      } catch (error) {
        console.error('Error in handleImageUpload:', error);
        toast.error('Failed to process image. Please try again.', { id: toastId });
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

  // Add block/unblock user functionality
  const handleBlockToggle = () => {
    if (selectedUser && currentUser) {
      if (isBlocked) {
        // Unblock user
        const newBlockedUsers = blockedUsers.filter(id => id !== selectedUser.id);
        setBlockedUsers(newBlockedUsers);
        localStorage.setItem('blockedUsers', JSON.stringify(newBlockedUsers));
        setIsBlocked(false);
        toast.success(`You have unblocked ${selectedUser.username}`);
      } else {
        // Show block confirmation
        setShowBlockConfirm(true);
      }
    }
  };

  const handleBlockConfirm = () => {
    if (selectedUser && currentUser) {
      const newBlockedUsers = [...blockedUsers, selectedUser.id];
      setBlockedUsers(newBlockedUsers);
      localStorage.setItem('blockedUsers', JSON.stringify(newBlockedUsers));
      setIsBlocked(true);
      setShowBlockConfirm(false);
      toast.error(`You have blocked ${selectedUser.username}`);
      setSelectedUser(null); // Close the chat window
    }
  };

  const handleBlockMenuClick = () => {
    if (selectedUser && currentUser) {
      if (isBlocked) {
        // Show unblock confirmation
        setShowUnblockConfirm(true);
      } else {
        // Show block confirmation
        setShowBlockConfirm(true);
      }
    }
  };

  const handleUnblockConfirm = () => {
    if (selectedUser && currentUser) {
      const newBlockedUsers = blockedUsers.filter(id => id !== selectedUser.id);
      setBlockedUsers(newBlockedUsers);
      localStorage.setItem('blockedUsers', JSON.stringify(newBlockedUsers));
      setIsBlocked(false);
      toast.success(`You have unblocked ${selectedUser.username}`);
      setShowMenu(false);
      setShowUnblockConfirm(false);
    }
  };

  // Group menu handlers
  const handleGroupInfo = () => {
    setShowGroupInfo(true);
    setShowMenu(false);
  };

  const handleViewMembers = () => {
    if (selectedUser && selectedUser.isGroup && socket) {
      socket.emit('group:getMembers', selectedUser.id, (memberIds: string[]) => {
        setGroupMembers(memberIds);
        setShowActiveMembers(true);
      });
    }
    setShowMenu(false);
  };

  const handleLeaveGroup = () => {
    if (selectedUser && selectedUser.isGroup && socket && currentUser) {
      socket.emit('group:leave', { groupId: selectedUser.id, userId: currentUser.id });
      setSelectedUser(null);
      setShowMenu(false);
      toast.success('You have left the group');
    }
  };

  const handleMemberClick = (user: User) => {
    setSelectedUser(user);
    setShowActiveMembers(false);
  };

  // Get group-specific description
  const getGroupDescription = (groupId: string) => {
    const descriptions: { [key: string]: string } = {
      'group-flirty-vibes': 'A space to flirt, vibe, and spark a connection. Keep it fun and respectful. 🌹',
      'group-midnight-chat': 'For the night owls who crave late-night conversations. Talk freely under the stars. 🌌',
      'group-hot-topics': 'Debate, gossip, and drop your hottest takes. Trending talk only—no filters! 🔥',
      'group-healing-space': 'Share feelings, vent, and heal together. A soft corner for emotional support. 🕊️',
      'group-naughty-corner': 'Flirty, fun, and a little wild. Enter with a smile—exit with a memory. 🔥😉',
      'group-singles-room': 'Looking, chatting, mingling. Whether flirty or friendly, this one\'s for singles only. 💬❤️',
      'group-only-boys': 'Boys-only zone. Talk anything from games to gossip—freely and openly. 🎮🗣️',
      'group-only-girls': 'A safe, girls-only chat room. Chill, connect, and be heard. 💅💬',
      'group-teen-zone': 'A casual space for teens (13–19) to connect, share, and chat it up. 🎧📱'
    };
    return descriptions[groupId] || 'A vibrant community for engaging conversations and meaningful connections.';
  };

  // Lookup user objects for caller and callee
  const callerUser = isIncoming ? activeUsers.find(u => u.id === callFrom) : currentUser;
  const calleeUser = isIncoming ? currentUser : activeUsers.find(u => u.id === callTo);

  const renderMessage = (message: Message) => {
    const isCurrentUser = message.senderId === currentUser?.id;
    const isReceiver = message.receiverId === currentUser?.id;
    const isGroup = selectedUser && selectedUser.isGroup;
    const messageClass = isCurrentUser ? 'bg-violet-600 text-white' : 'bg-white text-gray-900';
    const containerClass = isCurrentUser ? 'justify-end' : 'justify-start';

    // Special rendering for call request/consent
    if (message.type === 'call_request') {
      // If callHandledReady is not true, don't render the call card yet
      if (!callHandledReady) return null;
      if (callHandled) return null;
      // If this is a decline message, just show the text
      const isDecline = message.content.toLowerCase().includes('declined');
      return (
        <div key={message.id} className={`flex ${containerClass} mb-4`}>
          <div className={`flex flex-col max-w-[90%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
            <div className={`rounded-lg px-4 py-2 ${messageClass} shadow-sm break-words w-full`}>
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              {!isDecline && isReceiver && !callConsent && (
                <div className="flex space-x-2 mt-2">
                  <button className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-full mr-2 transition" onClick={() => handleApproveCall(message)}>Approve</button>
                  <button onClick={() => handleDeclineCall(message)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full transition">Decline</button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    if (message.type === 'call_consent') {
      // Only show to the original call requester
      if (currentUser?.id !== message.receiverId) return null;
      return (
        <div key={message.id} className="flex justify-center mb-4">
          <div className="bg-white border border-gray-200 shadow-sm text-green-800 px-4 py-2 rounded-xl mt-2 text-center">
            {message.content}
          </div>
        </div>
      );
    }
    // Default rendering for other message types
    // Check if the message is an image
    const isImage = message.content.startsWith('data:image/') || 
                   message.content.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                   message.content.includes('cloudinary.com');
    return (
      <div key={message.id} className={`flex ${containerClass} mb-4`}>
        <div className={`flex flex-col max-w-[90%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
          {/* Show sender name in group chats, except for current user's own messages */}
          {isGroup && !isCurrentUser && (
            <div className="text-sm font-bold text-violet-600 mb-1">
              {activeUsers.find(u => u.id === message.senderId)?.username || message.senderId}
            </div>
          )}
          {/* Show reply snippet if this message is a reply */}
          {message.replyTo && (
            <div className="border-l-4 border-violet-400 bg-violet-50 px-3 py-2 mb-1 rounded w-full">
              <div className="text-xs font-semibold text-violet-700 mb-0.5">
                {message.replyTo?.senderId === currentUser?.id ? 'You' : (activeUsers.find(u => u.id === message.replyTo?.senderId)?.username || 'User')}
              </div>
              <div className="text-xs text-gray-700 truncate max-w-xs">
                {message.replyTo?.type === 'image' ? (
                  <img src={message.replyTo?.content} alt="Replied image" className="w-16 h-16 object-cover rounded mt-1 border border-violet-200" />
                ) : (
                  message.replyTo?.content
                )}
              </div>
            </div>
          )}
          <div className={`rounded-lg px-4 py-2 ${messageClass} shadow-sm break-words w-full`}>
            {isImage ? (
              <div 
                className="relative group cursor-pointer"
                onClick={() => {
                  window.open(message.content, '_blank');
                }}
              >
                <img
                  src={message.content}
                  alt="Shared image"
                  className="max-w-full h-auto rounded-lg"
                  onLoad={() => scrollToBottom()}
                />
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
            {/* Reply button for all messages */}
            <button
              className="p-1 text-violet-500 hover:text-violet-700 focus:outline-none"
              title="Reply"
              onClick={() => setReplyingTo(message)}
            >
              <Reply size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="shrink-0 p-4 border-b border-gray-200 flex items-center justify-between bg-white">
        <div className={`flex items-center justify-between w-full${isMobile ? '' : ''}`}>
          {isMobile ? (
            <>
              {/* Avatar and user info */}
              <div className="flex items-center space-x-2">
                <div className="relative cursor-pointer" onClick={() => setShowUserProfile(true)}>
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
                    {selectedUser.isGroup ? (
                      <span className="text-sm" style={{ color: '#a78bfa' }}>
                        {getActiveGroupMembers(selectedUser.id)} active members
                      </span>
                    ) : (
                      <>
                    <span className="text-sm text-gray-500">{selectedUser.gender}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-gray-500">{selectedUser.age} years</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Call icons and three dots menu tightly grouped on the right */}
              {!selectedUser.isGroup && (
              <div className="flex items-center space-x-1 ml-auto">
                {!isBlocked && (!callConsent ? (
                  <button
                    title={pendingCallRequest ? 'Call request pending...' : 'Request Call'}
                    onClick={() => { if (!isBlocked) handleRequestCall('video'); }}
                    className={`text-violet-600 hover:text-violet-800 p-2 rounded-full`}
                    disabled={pendingCallRequest}
                    style={{ pointerEvents: pendingCallRequest ? 'none' : 'auto' }}
                  >
                    <Phone size={22} />
                  </button>
                ) : (
                  <>
                    <button title="Audio Call" className="text-violet-600 hover:text-violet-800 p-2 rounded-full" onClick={() => handleStartCall('audio')}>
                      <Phone size={22} />
                    </button>
                    <button title="Video Call" className="text-violet-600 hover:text-violet-800 p-2 rounded-full" onClick={() => handleStartCall('video')}>
                      <Video size={22} />
                    </button>
                  </>
                ))}
                </div>
              )}
                {/* Three dots menu at the rightmost position */}
              <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu((prev) => !prev)}
                  className="p-2 rounded-full text-violet-600"
                    title="More options"
                  >
                    <MoreVertical size={22} />
                  </button>
                  {showMenu && (
                      <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {selectedUser.isGroup ? (
                      <>
                        <button
                          onClick={handleGroupInfo}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg"
                        >
                          Group Info
                        </button>
                        <button
                          onClick={handleViewMembers}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Active Members
                        </button>
                        <button
                          onClick={handleLeaveGroup}
                          className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-b-lg"
                        >
                          Leave Group
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => toast.success('This feature coming soon')}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg"
                        >
                          Add Friend
                        </button>
                        <button
                          onClick={() => toast.success('This feature coming soon')}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Mute
                        </button>
                        <button
                          onClick={handleBlockMenuClick}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-b-lg"
                        >
                          {isBlocked ? 'Unblock' : 'Block'}
                        </button>
                    </>
                  )}
                </div>
                )}
              </div>
            </>
          ) : (
            // Desktop layout (unchanged)
            <>
        <div className="flex items-center space-x-4">
        {isMobile && (
          <button 
            onClick={handleBack} 
            className="text-gray-600 hover:text-gray-900 p-2 -ml-2"
          >
            <ArrowLeft size={24} />
          </button>
        )}
                <div className="relative cursor-pointer" onClick={() => setShowUserProfile(true)}>
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
                    {selectedUser.isGroup ? (
                      <span className="text-sm" style={{ color: '#a78bfa' }}>
                        {getActiveGroupMembers(selectedUser.id)} active members
                      </span>
                    ) : (
                      <>
            <span className="text-sm text-gray-500">{selectedUser.gender}</span>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-500">{selectedUser.age} years</span>
                      </>
                    )}
          </div>
        </div>
        </div>
              {/* Call icons and three dots menu tightly grouped on the right */}
              {!selectedUser.isGroup && (
                <div className="flex items-center space-x-1 ml-auto">
                {!isBlocked && (!callConsent ? (
        <button
                    title={pendingCallRequest ? 'Call request pending...' : 'Request Call'}
                    onClick={() => { if (!isBlocked) handleRequestCall('video'); }}
                      className={`text-violet-600 hover:text-violet-800 p-2 rounded-full`}
                    disabled={pendingCallRequest}
                    style={{ pointerEvents: pendingCallRequest ? 'none' : 'auto' }}
                  >
                    <Phone size={22} />
                  </button>
                ) : (
                    <>
                    <button title="Audio Call" className="text-violet-600 hover:text-violet-800 p-2 rounded-full" onClick={() => handleStartCall('audio')}>
                      <Phone size={22} />
                    </button>
                    <button title="Video Call" className="text-violet-600 hover:text-violet-800 p-2 rounded-full" onClick={() => handleStartCall('video')}>
                      <Video size={22} />
                    </button>
                    </>
                ))}
                </div>
              )}
              {/* Three dots menu at the rightmost position */}
              <div className="relative ml-2" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu((prev) => !prev)}
                  className="p-2 rounded-full text-violet-600"
                    title="More options"
                  >
                    <MoreVertical size={22} />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {selectedUser.isGroup ? (
                      <>
                      <button
                          onClick={handleGroupInfo}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg"
        >
                          Group Info
                        </button>
                        <button
                          onClick={handleViewMembers}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Active Members
                        </button>
                        <button
                          onClick={handleLeaveGroup}
                          className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-b-lg"
                        >
                          Leave Group
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => toast.success('This feature coming soon')}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg"
                        >
                          Add Friend
                        </button>
                        <button
                          onClick={() => toast.success('This feature coming soon')}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Mute
                        </button>
                        <button
                          onClick={handleBlockMenuClick}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-b-lg"
                        >
          {isBlocked ? 'Unblock' : 'Block'}
        </button>
                      </>
                    )}
                    </div>
                  )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Block Confirmation Popup */}
      {showBlockConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Block User</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to block {selectedUser.username}?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition duration-150 ease-in-out"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150 ease-in-out"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unblock Confirmation Popup */}
      {showUnblockConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Unblock User</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to unblock {selectedUser.username}?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowUnblockConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition duration-150 ease-in-out"
              >
                Cancel
              </button>
              <button
                onClick={handleUnblockConfirm}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition duration-150 ease-in-out"
              >
                Unblock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages - Scrollable */}
      {callHandledReady ? (
        <div className="flex-1 overflow-y-auto" ref={chatContainerRef}>
        <div className="p-4 space-y-4">
          <div className="flex justify-center">
              <div className="bg-white rounded-full py-2 px-4 text-base text-gray-500 shadow-sm">
                {selectedUser.isGroup
                  ? 'Start of your conversation with Members'
                  : `Start of your conversation with ${selectedUser.username}`}
            </div>
          </div>
          {filteredMessages.map((msg) => renderMessage(msg))}
          {isTyping && !blockedUsers.includes(selectedUser.id) && (
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
      ) : null}

      {/* Input - Fixed */}
      <div className="shrink-0 p-4 border-t border-gray-200 bg-white">
        {/* Reply preview above input */}
        {replyingTo && (
          <div className="flex items-center bg-violet-50 border-l-4 border-violet-500 px-3 py-2 mb-2 rounded relative w-full">
            <div className="flex-1">
              <div className="text-xs text-violet-700 font-semibold">
                {replyingTo.senderId === currentUser?.id ? 'You' : (activeUsers.find(u => u.id === replyingTo.senderId)?.username || 'User')}
              </div>
              <div className="text-xs text-gray-700 truncate max-w-xs">
                {replyingTo.type === 'image' ? (
                  <img src={replyingTo.content} alt="Replied image" className="w-16 h-16 object-cover rounded mt-1 border border-violet-200" />
                ) : (
                  replyingTo.content
                )}
              </div>
            </div>
            <button className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none" onClick={() => setReplyingTo(null)}>
              &times;
            </button>
          </div>
        )}
        {/* Disable input if joining group */}
        {selectedUser?.isGroup && isJoiningGroup ? (
          <div className="flex items-center justify-center text-violet-500 font-semibold py-2">
            Joining group...
          </div>
        ) : (
        <div className="flex items-center space-x-2">
          <label className="cursor-pointer text-gray-600 hover:text-violet-600 transition duration-150 ease-in-out relative group">
            <Paperclip size={20} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
              <span className="absolute -top-10 left-[80%] transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-3 rounded min-w-[80px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
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
              disabled={selectedUser?.isGroup && isJoiningGroup}
          />
          <button
            onClick={handleSend}
            className="text-violet-600 hover:text-violet-700 transition duration-150 ease-in-out"
              disabled={selectedUser?.isGroup && isJoiningGroup}
          >
            <Send size={20} />
          </button>
          </div>
        )}
        {showEmojiPicker && (
          <div className="absolute bottom-20 right-4 z-50">
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="absolute bottom-2 right-2 text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow focus:outline-none z-50"
                title="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            <EmojiPicker
              onEmojiClick={(emojiData: EmojiClickData) => {
                setMessage((prev) => prev + emojiData.emoji);
                setShowEmojiPicker(false);
              }}
            />
            </div>
          </div>
        )}
      </div>

      {/* Call Modal */}
      {isCallOpen && ((isIncoming && selectedUser?.id === callFrom) || (!isIncoming)) && (
      <CallModal
        isOpen={isCallOpen}
        onClose={handleCallClose}
        isMobile={isMobile}
        isFullDesktop={isFullDesktop}
        setIsFullDesktop={setIsFullDesktop}
        localStream={localStream}
        remoteStream={remoteStream}
        callType={callType}
        caller={callerUser}
        callee={calleeUser}
        isIncoming={isIncoming}
          onAccept={!(autoAcceptCall && isIncoming && selectedUser?.id === callFrom) ? handleAccept : undefined}
          onDecline={!(autoAcceptCall && isIncoming && selectedUser?.id === callFrom) ? handleDecline : undefined}
        onHangup={handleHangup}
      />
      )}

      {/* Group Info Popup */}
      {showGroupInfo && selectedUser && selectedUser.isGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Group Info</h3>
              <button
                onClick={() => setShowGroupInfo(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Room Name</h4>
                <p className="text-gray-600">{selectedUser.username}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{getGroupDescription(selectedUser.id)}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Rules</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Be respectful and kind to all members</li>
                  <li>• No spam or inappropriate content</li>
                  <li>• Keep conversations engaging and relevant</li>
                  <li>• Report any violations to moderators</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Topics</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm">General Chat</span>
                  <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm">Entertainment</span>
                  <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm">Technology</span>
                  <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm">Lifestyle</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Members Popup */}
      {showActiveMembers && selectedUser && selectedUser.isGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Active Members</h3>
              <button
                onClick={() => setShowActiveMembers(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2">
              {activeUsers
                .filter(user => 
                  !user.id.startsWith('bot-') && 
                  user.id !== currentUser?.id && 
                  groupMembers.includes(user.id)
                )
                .map((user: User) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 rounded-lg"
                    onClick={() => handleMemberClick(user)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-10 h-10 rounded-full ring-2 ring-violet-500 ring-offset-2"
                        />
                        {user.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{user.username}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{user.gender}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">{user.age} years</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              {activeUsers.filter(user => 
                !user.id.startsWith('bot-') && 
                user.id !== currentUser?.id && 
                groupMembers.includes(user.id)
              ).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-10 h-10 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <p>No active members in this group</p>
                  <p className="text-sm mt-2">Be the first to join the conversation!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Profile Popup for private chats */}
      {showUserProfile && selectedUser && !selectedUser.isGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-xs w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowUserProfile(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex flex-col items-center space-y-4">
              <img
                src={selectedUser.avatar}
                alt={selectedUser.username}
                className="w-32 h-32 rounded-full ring-2 ring-violet-500 ring-offset-2 object-cover"
              />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">{selectedUser.username}</h3>
                <div className="flex items-center justify-center space-x-2 mt-1">
                  <span className="text-sm text-gray-500">{selectedUser.gender}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500">{selectedUser.age} years</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
