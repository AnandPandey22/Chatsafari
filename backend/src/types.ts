export interface User {
  id: string;
  username: string;
  gender: 'male' | 'female';
  age: number;
  avatar: string;
  isOnline: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'emoji';
  timestamp: number;
  seen: boolean;
  delivered: boolean;
  reactions: MessageReaction[];
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: number;
}
