import React, { useState } from 'react';
import { useStore } from '../Store/useStore';
import { User } from '../types';
import { Search, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';

const UserList: React.FC = () => {
  const { activeUsers, setSelectedUser, currentUser, notifications } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Get unread message counts for each user
  const getUnreadCount = (userId: string) => {
    return notifications[userId] || 0;
  };

  // Sort users by unread messages and then by online status
  const sortedUsers = [...activeUsers]
    .filter((user: User) => user.id !== currentUser?.id)
    .sort((a, b) => {
      const aCount = getUnreadCount(a.id);
      const bCount = getUnreadCount(b.id);
      if (aCount !== bCount) return bCount - aCount;
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return 0;
    });

  // Filter users based on search and gender
  const filteredUsers = sortedUsers.filter((user: User) => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'all' || user.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  const handleUserClick = (user: User) => {
    try {
      setSelectedUser(user);
    } catch (error) {
      console.error('Error selecting user:', error);
      toast.error('Failed to open chat. Please try again.');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Search and Filter */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => setGenderFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              genderFilter === 'all'
                ? 'bg-violet-100 text-violet-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setGenderFilter('male')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              genderFilter === 'male'
                ? 'bg-violet-100 text-violet-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Male
          </button>
          <button
            onClick={() => setGenderFilter('female')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              genderFilter === 'female'
                ? 'bg-violet-100 text-violet-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Female
          </button>
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <Users className="h-12 w-12 mb-4" />
            <p>No users found</p>
            <p className="text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredUsers.map((user: User) => {
            const unreadCount = getUnreadCount(user.id);
            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                onClick={() => handleUserClick(user)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-12 h-12 rounded-full ring-2 ring-violet-500 ring-offset-2"
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
                {unreadCount > 0 && (
                  <div className="bg-violet-600 text-white text-xs font-medium rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
                    {unreadCount}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UserList;
