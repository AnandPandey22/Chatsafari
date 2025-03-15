import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import UserList from '../components/UserList';
import ChatWindow from '../components/ChatWindow';
import { LogOut, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '../types';

const Dashboard: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentUser, 
    logout, 
    selectedUser, 
    notifications, 
    setSelectedUser, 
    activeUsers, 
    initializeSocket 
  } = useStore(state => ({
    currentUser: state.currentUser,
    logout: state.logout,
    selectedUser: state.selectedUser,
    notifications: state.notifications,
    setSelectedUser: state.setSelectedUser,
    activeUsers: state.activeUsers,
    initializeSocket: state.initializeSocket
  }));

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Initialize socket connection
    initializeSocket();

    // Handle window resize
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
    };

    // Handle page visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUser) {
        initializeSocket();
      }
    };

    // Add event listeners
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, navigate, initializeSocket]);

  // Handle back button and chat state
  useEffect(() => {
    const handleBackButton = (event: PopStateEvent) => {
      if (selectedUser) {
        event.preventDefault();
        setSelectedUser(null);
        window.history.pushState({ page: 'dashboard' }, '', window.location.pathname);
      } else {
        // Store current state
        sessionStorage.setItem('lastPath', window.location.pathname);
        // Get the homepage URL
        const homepageUrl = window.location.origin;
        // Redirect to homepage
        window.location.replace(homepageUrl);
      }
    };

    // Check if returning from homepage
    const lastPath = sessionStorage.getItem('lastPath');
    if (lastPath === '/dashboard') {
      sessionStorage.removeItem('lastPath');
      initializeSocket();
    }

    // Add event listeners
    window.addEventListener('popstate', handleBackButton);

    // Add history entry when component mounts
    if (!selectedUser) {
      window.history.pushState({ page: 'dashboard' }, '', window.location.pathname);
    }

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [selectedUser, setSelectedUser, initializeSocket]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setShowNotifications(false);
      // First clear all state and storage
      await logout();
      // Force a complete page reload and redirect
      window.location.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback redirect
      window.location.href = '/login';
    }
  };

  const handleNotificationClick = (userId: string) => {
    const user = activeUsers.find((u: User) => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setShowNotifications(false);
    }
  };

  // Calculate total notifications with proper typing
  const totalNotifications = Object.values(notifications).reduce((sum: number, count: number) => sum + count, 0);

  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Fixed Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-none z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left section - Empty now since we removed the back button */}
            <div className="w-20 flex items-center">
            </div>

            {/* Center section - Brand */}
            <div className="flex-1 flex justify-center">
              <h1 className="text-2xl font-bold text-violet-600" style={{ fontFamily: 'Pacifico, cursive' }}>
                ChatSafari
              </h1>
            </div>

            {/* Right section */}
            <div className="w-20 flex justify-end items-center space-x-4">
              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-600 hover:text-violet-600 relative"
                >
                  <Bell className="h-5 w-5" />
                  {totalNotifications > 0 && (
                    <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalNotifications}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                    {Object.entries(notifications).some(([_, count]) => count > 0) ? (
                      Object.entries(notifications).map(([userId, count]) => {
                        if (count === 0) return null;
                        const user = activeUsers.find(u => u.id === userId);
                        if (!user) return null;
                        return (
                          <div
                            key={userId}
                            onClick={() => handleNotificationClick(userId)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                          >
                            <span className="font-medium text-gray-900">{user.username}</span>
                            <span className="bg-violet-100 text-violet-600 text-xs font-medium rounded-full px-2 py-1">
                              {count} messages
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No new messages
                      </div>
                    )}
                    
                    {/* Logout option in dropdown - Only on mobile */}
                    {isMobile && (
                      <div className="border-t border-gray-100 mt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Logout Button - Only visible on desktop */}
              <button
                onClick={handleLogout}
                className="hidden md:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition duration-150 ease-in-out"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Fixed Height */}
      <div className="flex-1 flex overflow-hidden">
        {/* User List - Scrollable */}
        <div 
          className={`${
            isMobile && selectedUser ? 'hidden' : 'block'
          } w-full md:w-80 md:block flex-col border-r border-gray-200 bg-white`}
        >
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <UserList />
          </div>
        </div>

        {/* Chat Window and Bottom Ad Container */}
        <div 
          className={`${
            isMobile && !selectedUser ? 'hidden' : 'flex'
          } flex-1 flex-col overflow-hidden`}
        >
          {/* Chat Window Container */}
          <div className="flex-1 overflow-hidden">
            <ChatWindow isMobile={isMobile} />
          </div>

          {/* Large Banner Ad below chat - Fixed Height */}
          <div className="h-48 bg-white border-t border-gray-200 flex-none">
            <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
              <span>Large Banner Ad (728x90)</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Ad Space (desktop only) */}
        <div className="hidden lg:block w-96 border-l border-gray-200 bg-white p-4 flex-none">
          <div className="h-full flex flex-col justify-center">
            <div className="bg-gray-50 rounded-xl shadow-sm p-4 h-[calc(100vh-8rem)] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
              <span>Large Banner Ad</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
