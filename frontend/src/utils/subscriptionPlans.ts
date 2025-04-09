import { SubscriptionPlan } from '../types';

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 4.99,
    interval: 'month',
    features: ['customThemes', 'fileSharing'],
    maxFileSize: 10, // 10MB
    storageLimit: 1 // 1GB
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    interval: 'month',
    features: ['customThemes', 'fileSharing', 'groupChats'],
    maxFileSize: 50, // 50MB
    storageLimit: 5 // 5GB
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    price: 14.99,
    interval: 'month',
    features: ['customThemes', 'fileSharing', 'groupChats', 'videoCall'],
    maxFileSize: 100, // 100MB
    storageLimit: 10 // 10GB
  }
];

export const yearlyDiscount = 0.2; // 20% discount for yearly plans

export const virtualGifts = [
  {
    id: 'heart',
    name: 'Heart',
    price: 50,
    image: '/gifts/heart.png',
    animation: 'floating'
  },
  {
    id: 'diamond',
    name: 'Diamond',
    price: 100,
    image: '/gifts/diamond.png',
    animation: 'sparkle'
  },
  {
    id: 'crown',
    name: 'Crown',
    price: 200,
    image: '/gifts/crown.png',
    animation: 'shine'
  }
]; 
