export interface User {
  id: string;
  username: string;
  gender: 'male' | 'female';
  age: number;
  isOnline: boolean;
  avatar: string;
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
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}
