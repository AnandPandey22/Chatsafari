// Import the User type from types.js
import { User } from './types.js';

// Indian male bot users
const indianMaleBots: User[] = [
  { id: 'bot-m1', username: 'Arjun', gender: 'male', age: 23, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun' },
  { id: 'bot-m2', username: 'Rahul', gender: 'male', age: 25, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul' },
  { id: 'bot-m3', username: 'Vikram', gender: 'male', age: 21, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram' },
  { id: 'bot-m4', username: 'Aditya', gender: 'male', age: 24, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya' },
  { id: 'bot-m5', username: 'Rohan', gender: 'male', age: 22, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan' },
  { id: 'bot-m6', username: 'Karan', gender: 'male', age: 26, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karan' },
  { id: 'bot-m7', username: 'Nikhil', gender: 'male', age: 20, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nikhil' },
  { id: 'bot-m8', username: 'Varun', gender: 'male', age: 27, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Varun' },
  { id: 'bot-m9', username: 'Raj', gender: 'male', age: 23, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raj' },
  { id: 'bot-m10', username: 'Amit', gender: 'male', age: 25, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit' },
  { id: 'bot-m11', username: 'Sanjay', gender: 'male', age: 24, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sanjay' },
  { id: 'bot-m12', username: 'Deepak', gender: 'male', age: 22, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Deepak' },
  { id: 'bot-m13', username: 'Ajay', gender: 'male', age: 26, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ajay' },
  { id: 'bot-m14', username: 'Vijay', gender: 'male', age: 21, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vijay' },
  { id: 'bot-m15', username: 'Ravi', gender: 'male', age: 25, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi' }
];

// Indian female bot users
const indianFemaleBots: User[] = [
  { id: 'bot-f1', username: 'Priya', gender: 'female', age: 22, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
  { id: 'bot-f2', username: 'Neha', gender: 'female', age: 24, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neha' },
  { id: 'bot-f3', username: 'Anjali', gender: 'female', age: 21, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali' },
  { id: 'bot-f4', username: 'Pooja', gender: 'female', age: 23, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja' },
  { id: 'bot-f5', username: 'Riya', gender: 'female', age: 20, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riya' },
  { id: 'bot-f6', username: 'Shreya', gender: 'female', age: 25, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shreya' },
  { id: 'bot-f7', username: 'Divya', gender: 'female', age: 22, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Divya' },
  { id: 'bot-f8', username: 'Aisha', gender: 'female', age: 24, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha' },
  { id: 'bot-f9', username: 'Meera', gender: 'female', age: 21, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meera' },
  { id: 'bot-f10', username: 'Kavya', gender: 'female', age: 23, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kavya' },
  { id: 'bot-f11', username: 'Ananya', gender: 'female', age: 20, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya' },
  { id: 'bot-f12', username: 'Sakshi', gender: 'female', age: 25, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sakshi' },
  { id: 'bot-f13', username: 'Nisha', gender: 'female', age: 22, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nisha' },
  { id: 'bot-f14', username: 'Tanvi', gender: 'female', age: 24, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tanvi' },
  { id: 'bot-f15', username: 'Zara', gender: 'female', age: 21, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zara' },
  { id: 'bot-f16', username: 'Sonia', gender: 'female', age: 23, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sonia' },
  { id: 'bot-f17', username: 'Isha', gender: 'female', age: 20, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isha' },
  { id: 'bot-f18', username: 'Kritika', gender: 'female', age: 25, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kritika' },
  { id: 'bot-f19', username: 'Aditi', gender: 'female', age: 22, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditi' },
  { id: 'bot-f20', username: 'Rhea', gender: 'female', age: 24, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rhea' }
];

// Foreign female bot users
const foreignFemaleBots: User[] = [
  { id: 'bot-ff1', username: 'Emma', gender: 'female', age: 23, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma' },
  { id: 'bot-ff2', username: 'Sophia', gender: 'female', age: 25, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia' },
  { id: 'bot-ff3', username: 'Isabella', gender: 'female', age: 22, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella' },
  { id: 'bot-ff4', username: 'Olivia', gender: 'female', age: 24, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia' },
  { id: 'bot-ff5', username: 'Mia', gender: 'female', age: 21, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia' },
  { id: 'bot-ff6', username: 'Ava', gender: 'female', age: 23, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ava' },
  { id: 'bot-ff7', username: 'Emily', gender: 'female', age: 25, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily' },
  { id: 'bot-ff8', username: 'Charlotte', gender: 'female', age: 22, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlotte' },
  { id: 'bot-ff9', username: 'Amelia', gender: 'female', age: 24, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia' },
  { id: 'bot-ff10', username: 'Luna', gender: 'female', age: 21, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna' }
];

// American male bot users
const americanMaleBots: User[] = [
  { id: 'bot-am1', username: 'James', gender: 'male', age: 24, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James' },
  { id: 'bot-am2', username: 'William', gender: 'male', age: 26, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=William' },
  { id: 'bot-am3', username: 'Benjamin', gender: 'male', age: 23, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Benjamin' },
  { id: 'bot-am4', username: 'Lucas', gender: 'male', age: 25, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas' },
  { id: 'bot-am5', username: 'Henry', gender: 'male', age: 22, isOnline: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Henry' }
];

// Combine all bot users
export const allBotUsers: User[] = [
  ...indianMaleBots,
  ...indianFemaleBots,
  ...foreignFemaleBots,
  ...americanMaleBots
];

// Function to update bot users' online status
export const updateBotUsersStatus = (): User[] => {
  // Bots are always present and online
  return allBotUsers.map(user => ({
    ...user,
    isOnline: true
  }));
}; 
