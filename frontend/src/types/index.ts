export interface User {
  id: string;
  username: string;
  gender: 'male' | 'female' | 'group';
  age: number;
  isOnline: boolean;
  avatar: string;
  isGroup?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'emoji' | 'call_request' | 'call_consent';
  timestamp: number;
  seen: boolean;
  delivered: boolean;
  reactions: MessageReaction[];
  sender?: User;
  replyTo?: {
    id: string;
    senderId: string;
    content: string;
    type: string;
  };
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface ChatRoom {
  id: string;
  participants: User[];
  messages: Message[];
  lastMessage?: Message;
}
