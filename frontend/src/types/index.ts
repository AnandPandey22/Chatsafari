export interface User {
  id: string;
  username: string;
  gender: 'male' | 'female';
  age: number;
  isOnline: boolean;
  avatar: string;
  premiumFeatures?: PremiumFeatures;
  wallet?: UserWallet;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionEndDate?: number;
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

export interface PremiumFeatures {
  isPremium: boolean;
  customThemes: boolean;
  fileSharing: boolean;
  groupChats: boolean;
  videoCall: boolean;
  maxFileSize: number; // in MB
  storageLimit: number; // in GB
}

export interface VirtualGift {
  id: string;
  name: string;
  price: number;
  image: string;
  animation?: string;
}

export interface UserWallet {
  userId: string;
  credits: number;
  purchasedGifts: VirtualGift[];
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: (keyof PremiumFeatures)[];
  maxFileSize: number;
  storageLimit: number;
}