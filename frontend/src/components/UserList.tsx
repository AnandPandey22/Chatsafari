import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { User } from '../types';
import { Search, Users, Volume2, VolumeX, Heart, HeartOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

// @ts-ignore
window.__groupCounts = window.__groupCounts || {};

const UserList: React.FC = () => {
  const { activeUsers, setSelectedUser, currentUser, notifications, isJoiningGroup, setIsJoiningGroup, selectedUser } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'groups'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [groupCounts, setGroupCounts] = useState<{ [groupId: string]: number }>({});
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const socket = useStore(state => state.socket);
  const prevGroupIdRef = useRef<string | null>(null);
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('notificationSoundEnabled');
    return stored === null ? true : stored === 'true';
  });
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [showFriendsPopup, setShowFriendsPopup] = useState(false);
  const [favoriteFriends, setFavoriteFriends] = useState<string[]>(() => {
    const stored = localStorage.getItem('favoriteFriends');
    return stored ? JSON.parse(stored) : [];
  });
  // Track users with whom the current user has chatted in this session (recent DMs)
  const recentDMUserIds = useRef<Set<string>>(new Set());

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('recentDMUserIds');
    if (stored) {
      try {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) {
          recentDMUserIds.current = new Set(arr);
        }
      } catch {}
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('recentDMUserIds', JSON.stringify(Array.from(recentDMUserIds.current)));
  }, [Array.from(recentDMUserIds.current).join(',')]);

  const groups = [
    { id: 'group-flirty-vibes', name: 'Flirty Vibes', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=flirty' },
    { id: 'group-midnight-chat', name: 'Midnight Chat', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=midnight' },
    { id: 'group-hot-topics', name: 'Hot Topics', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=hot' },
    { id: 'group-healing-space', name: 'Healing Space', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=healing' },
    { id: 'group-naughty-corner', name: 'Naughty Corner', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=naughty' },
    { id: 'group-singles-room', name: 'Singles Room', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=singles' },
    { id: 'group-only-boys', name: 'Only Boys', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=boys' },
    { id: 'group-only-girls', name: 'Only Girls', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=girls' },
    { id: 'group-teen-zone', name: 'Teen Zone', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=teen' },
  ];

  useEffect(() => {
    if (genderFilter !== 'groups' || !socket || !currentUser) return;
    // Fetch active member counts for all groups
    groups.forEach(group => {
      socket.emit('group:getActiveMembers', group.id, (count: number) => {
        setGroupCounts(prev => ({ ...prev, [group.id]: count }));
      });
    });
  }, [genderFilter, socket, currentUser]);

  useEffect(() => {
    if (!socket) return;
    // Listen for real-time group member count updates
    const handleGroupCountUpdate = (groupId: string, count: number) => {
      setGroupCounts(prev => ({ ...prev, [groupId]: count }));
    };
    socket.on('group:activeMembers', handleGroupCountUpdate);
    return () => {
      socket.off('group:activeMembers', handleGroupCountUpdate);
    };
  }, [socket]);

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

  // Join/leave group logic
  const handleGroupClick = (group: typeof groups[0]) => {
    if (!socket || !currentUser) return;
    setIsJoiningGroup(true);
    // Leave previous group if any
    if (prevGroupIdRef.current && prevGroupIdRef.current !== group.id) {
      socket.emit('group:leave', { groupId: prevGroupIdRef.current, userId: currentUser.id });
    }
    // Join new group
    socket.emit('group:join', { groupId: group.id, userId: currentUser.id });
    setActiveGroupId(group.id);
    prevGroupIdRef.current = group.id;
    setSelectedUser({
      id: group.id,
      username: group.name,
      isGroup: true,
      gender: 'group',
      age: 0,
      isOnline: true,
      avatar: group.avatar,
    });
    // Immediately fetch updated member count after joining
    socket.emit('group:getActiveMembers', group.id, (count: number) => {
      setGroupCounts(prev => ({ ...prev, [group.id]: count }));
    });
  };

  useEffect(() => {
    if (!socket) return;
    const handleGroupJoined = ({ groupId }: { groupId: string }) => {
      setIsJoiningGroup(false);
    };
    socket.on('group:joined', handleGroupJoined);
    return () => {
      socket.off('group:joined', handleGroupJoined);
    };
  }, [socket, setIsJoiningGroup]);

  // Leave group when leaving group tab or changing selectedUser
  useEffect(() => {
    if (genderFilter !== 'groups' && prevGroupIdRef.current && socket && currentUser) {
      socket.emit('group:leave', { groupId: prevGroupIdRef.current, userId: currentUser.id });
      // Fetch updated count for the group just left
      socket.emit('group:getActiveMembers', prevGroupIdRef.current, (count: number) => {
        setGroupCounts(prev => ({ ...prev, [prevGroupIdRef.current!]: count }));
      });
      prevGroupIdRef.current = null;
      setActiveGroupId(null);
    }
  }, [genderFilter, socket, currentUser]);

  // When gender filter changes, close group chat if open and leaving 'groups'
  useEffect(() => {
    if (genderFilter !== 'groups' && selectedUser && selectedUser.isGroup) {
      setSelectedUser(null);
    }
  }, [genderFilter, selectedUser, setSelectedUser]);

  const handleUserClick = (user: User) => {
    try {
      setSelectedUser(user);
    } catch (error) {
      console.error('Error selecting user:', error);
      toast.error('Failed to open chat. Please try again.');
    }
  };

  useEffect(() => {
    localStorage.setItem('genderFilter', genderFilter);
  }, [genderFilter]);

  useEffect(() => {
    // Sync groupCounts to window and dispatch event
    // @ts-ignore
    window.__groupCounts = groupCounts;
    window.dispatchEvent(new Event('groupCountsUpdated'));
  }, [groupCounts]);

  useEffect(() => {
    // Add to history when a DM is opened
    if (selectedUser && !selectedUser.isGroup && !selectedUser.id.startsWith('bot-')) {
      recentDMUserIds.current.add(selectedUser.id);
      // Save immediately
      localStorage.setItem('recentDMUserIds', JSON.stringify(Array.from(recentDMUserIds.current)));
    }
  }, [selectedUser]);

  const recentDMUsers = activeUsers.filter(u => recentDMUserIds.current.has(u.id));

  const handleMuteTabClick = () => {
    setNotificationSoundEnabled((prev) => {
      localStorage.setItem('notificationSoundEnabled', String(!prev));
      window.dispatchEvent(new Event('notificationSoundChanged'));
      return !prev;
    });
  };

  const handleToggleFavorite = (userId: string) => {
    setFavoriteFriends((prev) =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Friends list: all real users (not bots, not groups, not self)
  const friendsList = activeUsers.filter(u => !u.id.startsWith('bot-') && !u.isGroup && u.id !== currentUser?.id);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Tabs Bar */}
      <div className="flex space-x-2 px-4 pt-4 pb-2">
        {['Friends', 'History', 'Mute'].map(tab => (
          tab === 'Mute' ? (
            <button
              key={tab}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 focus:outline-none flex items-center justify-center gap-2 ${
                notificationSoundEnabled
                  ? 'bg-violet-100 text-violet-700 hover:bg-violet-200 hover:text-violet-800'
                  : 'bg-violet-200 text-violet-400 hover:bg-violet-300 hover:text-violet-600 border-2 border-violet-300'
              }`}
              type="button"
              onClick={handleMuteTabClick}
              title="Mute all notifications"
            >
              {notificationSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {tab}
            </button>
          ) : tab === 'History' ? (
            <button
              key={tab}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-violet-100 text-violet-700 transition-colors duration-150 hover:bg-violet-200 hover:text-violet-800 focus:outline-none"
              type="button"
              onClick={() => { setShowHistoryPopup(true); setShowFriendsPopup(false); }}
            >
              {tab}
            </button>
          ) : tab === 'Friends' ? (
            <button
              key={tab}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-violet-100 text-violet-700 transition-colors duration-150 hover:bg-violet-200 hover:text-violet-800 focus:outline-none"
              type="button"
              onClick={() => { setShowFriendsPopup(true); setShowHistoryPopup(false); }}
            >
              {tab}
            </button>
          ) : (
            <button
              key={tab}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-violet-100 text-violet-700 transition-colors duration-150 hover:bg-violet-200 hover:text-violet-800 focus:outline-none"
              type="button"
            >
              {tab}
            </button>
          )
        ))}
      </div>
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
          <button
            onClick={() => setGenderFilter('groups')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              genderFilter === 'groups'
                ? 'bg-violet-100 text-violet-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
          </div>
        ) : genderFilter === 'groups' ? (
          <div className="space-y-2">
            {groups.map(group => (
              <div key={group.id} className="flex items-center p-3 bg-white rounded-lg shadow cursor-pointer hover:bg-violet-50" onClick={() => handleGroupClick(group)}>
                <img
                  src={group.avatar}
                  alt={group.name}
                  className="w-10 h-10 rounded-full mr-3 border-2 border-violet-200 object-cover"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{group.name}</div>
                </div>
                <div className="ml-2 text-base min-w-[70px] text-right font-bold" style={{ color: '#a78bfa' }}>
                  {groupCounts[group.id] === 1
                    ? '1 member'
                    : `${groupCounts[group.id] || 0} members`}
                </div>
              </div>
            ))}
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
      {/* History Popup */}
      {showHistoryPopup && (
        <div className="fixed inset-0 z-40 flex items-start justify-center sm:justify-end bg-black bg-opacity-10">
          <div className="absolute left-0 top-0 w-full h-full" onClick={() => setShowHistoryPopup(false)} />
          <div
            className="relative z-50 w-11/12 max-w-xs sm:w-full sm:max-w-[340px] bg-white rounded-2xl sm:rounded-l-2xl sm:rounded-r-none shadow-2xl border-l-0 sm:border-l-4 border-violet-200 mt-24 sm:mt-0 h-auto sm:h-full flex flex-col max-h-[80vh] sm:max-h-full animate-slide-in-right"
            style={{ minHeight: '320px' }}
          >
            <div className="p-5 border-b border-violet-100 text-xl font-bold text-violet-700 flex items-center justify-center">
              <span className="inline-block bg-violet-100 text-violet-700 rounded-full px-3 py-1 text-base font-semibold text-center w-full">Recent Chats</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {recentDMUsers.length === 0 ? (
                <div className="text-center text-gray-400 py-16">No recent chats</div>
              ) : (
                recentDMUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center px-5 py-4 cursor-pointer hover:bg-violet-50 transition rounded-xl mx-2 my-1"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowHistoryPopup(false);
                    }}
                  >
                    <img src={user.avatar} alt={user.username} className="w-12 h-12 rounded-full mr-4 border-2 border-violet-100" />
                    <div>
                      <div className="font-semibold text-gray-900 text-base">{user.username}</div>
                      <div className="text-xs text-gray-500">{user.gender}, {user.age} years</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              className="w-full py-4 bg-violet-50 text-violet-700 hover:bg-violet-200 font-semibold rounded-b-2xl border-t border-violet-100 transition text-lg"
              onClick={() => setShowHistoryPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Friends Popup */}
      {showFriendsPopup && (
        <div className="fixed inset-0 z-40 flex items-start justify-center sm:justify-end bg-black bg-opacity-10">
          <div className="absolute left-0 top-0 w-full h-full" onClick={() => setShowFriendsPopup(false)} />
          <div
            className="relative z-50 w-11/12 max-w-xs sm:w-full sm:max-w-[340px] bg-white rounded-2xl sm:rounded-l-2xl sm:rounded-r-none shadow-2xl border-l-0 sm:border-l-4 border-violet-200 mt-24 sm:mt-0 h-auto sm:h-full flex flex-col max-h-[80vh] sm:max-h-full animate-slide-in-right"
            style={{ minHeight: '320px' }}
          >
            <div className="p-5 border-b border-violet-100 text-xl font-bold text-violet-700 flex items-center justify-center">
              <span className="inline-block bg-violet-100 text-violet-700 rounded-full px-3 py-1 text-base font-semibold text-center w-full">Friends</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {friendsList.length === 0 ? (
                <div className="text-center text-gray-400 py-16">No friends found</div>
              ) : (
                friendsList.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center px-5 py-4 cursor-pointer hover:bg-violet-50 transition rounded-xl mx-2 my-1"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowFriendsPopup(false);
                    }}
                  >
                    <img src={user.avatar} alt={user.username} className="w-12 h-12 rounded-full mr-4 border-2 border-violet-100" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-base">{user.username}</div>
                      <div className="text-xs text-gray-500">{user.gender}, {user.age} years</div>
                    </div>
                    <button
                      className="ml-2 p-2 rounded-full hover:bg-violet-100 transition"
                      onClick={e => { e.stopPropagation(); handleToggleFavorite(user.id); }}
                      title={favoriteFriends.includes(user.id) ? 'Unfavorite' : 'Favorite'}
                    >
                      {favoriteFriends.includes(user.id)
                        ? <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                        : <Heart className="w-5 h-5 text-gray-400" />}
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              className="w-full py-4 bg-violet-50 text-violet-700 hover:bg-violet-200 font-semibold rounded-b-2xl border-t border-violet-100 transition text-lg"
              onClick={() => setShowFriendsPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
