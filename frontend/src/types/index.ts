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
  type: 'text' | 'image' | 'emoji';
  timestamp: number;
  seen: boolean;
  delivered: boolean;
  reactions: MessageReaction[];
  sender?: User;
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
