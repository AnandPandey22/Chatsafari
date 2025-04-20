import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import UserList from '../components/UserList';
import ChatWindow from '../components/ChatWindow';
import { LogOut, Menu, X, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// Define adsbygoogle for TypeScript
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const Dashboard: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

   // Define all available ad slots
  const horizontalAdSlots = [
    "1455746969",  // Original slot
    "6743920017",  // Second slot
    // Add more slots here as needed
    // "your-new-slot-id",
  ];
  
  const [currentAdSlotIndex, setCurrentAdSlotIndex] = useState(0);
  const [isAdInitialized, setIsAdInitialized] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { currentUser, logout, selectedUser, notifications, setSelectedUser, activeUsers, restoreSession } = useStore();

// Single AdSense initialization
  useEffect(() => {
    if (currentUser && !window.adsbygoogle) {
       window.adsbygoogle = [];
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9696449443766781';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        setIsAdInitialized(true);
       // Initialize ads
        try {
           window.adsbygoogle.push({});
        } catch (error) {
          console.error('Error initializing ads:', error);
        }
      };
      document.head.appendChild(script);
    }
  }, [currentUser]);

  // Handle ad rotation
  useEffect(() => {
    if (selectedUser && isAdInitialized) {
      // Move to next slot
      setCurrentAdSlotIndex(prevIndex => (prevIndex + 1) % horizontalAdSlots.length);
      
      // Give DOM time to update before initializing new ad
      const timer = setTimeout(() => {
         window.adsbygoogle.push({});
        } catch (error) {
          console.error('Error loading rotated ad:', error);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [selectedUser, isAdInitialized]);
  
  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle back button press
  useEffect(() => {
    // Function to handle back button press
    const handlePopState = (event: PopStateEvent) => {
      // Always prevent default to handle back button ourselves
      event.preventDefault();
      
      // If chat window is open, close it
      if (selectedUser) {
        setSelectedUser(null);
        // Push a new state to maintain history stack
        window.history.pushState({ page: 'dashboard' }, '', '/dashboard');
      } else {
        // If on main dashboard, show logout confirmation
        setShowLogoutConfirm(true);
        // Push a new state to maintain history stack
        window.history.pushState({ page: 'dashboard' }, '', '/dashboard');
      }
    };

    // Function to handle beforeunload event
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    // Add initial states when component mounts
    window.history.pushState({ page: 'dashboard' }, '', '/dashboard');
    window.history.pushState({ page: 'dashboard' }, '', '/dashboard');

    // Add event listeners
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [selectedUser, setSelectedUser]);

  // Handle Alt+Left arrow key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Alt + Left Arrow (browser back shortcut)
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        if (selectedUser) {
          setSelectedUser(null);
          // Push a new state to maintain history stack
          window.history.pushState({ page: 'dashboard' }, '', '/dashboard');
        } else {
          setShowLogoutConfirm(true);
          // Push a new state to maintain history stack
          window.history.pushState({ page: 'dashboard' }, '', '/dashboard');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUser, setSelectedUser]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
    // Push a new state to maintain history stack
    window.history.pushState({ page: 'dashboard' }, '', '/dashboard');
  };

  const handleNotificationClick = (userId: string) => {
    const user = activeUsers.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setShowNotifications(false);
    }
  };

  // Calculate total notifications
  const totalNotifications = Object.values(notifications).reduce((sum, count) => sum + count, 0);


  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Logout</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Fixed Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-none z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left section - Empty to help with centering */}
            <div className="w-20"></div>

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
                          onClick={handleLogoutClick}
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
                onClick={handleLogoutClick}
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
          <div className="h-[calc(100vh-64px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
          <div className={`${isMobile ? 'h-[410px]' : 'h-[530px]'} overflow-hidden`}>
            {selectedUser ? (
              <ChatWindow isMobile={isMobile} />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="text-center">
                  <div className="text-gray-400 mb-4">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Select a user to start chatting</h3>
                  <p className="mt-1 text-sm text-gray-500">Choose someone from the list to begin a conversation</p>
                </div>
              </div>
            )}
          </div>

         {/* Bottom Ad Space - Always visible in mobile */}
          <div className={`${isMobile ? 'block' : 'flex-1'} bg-white border-t border-gray-200`}>
            <div className="h-full w-full">
              {isAdInitialized && (
                <ins 
                  className="adsbygoogle"
                  style={{ display: 'block', height: '100%', width: '100%' }}
                  data-ad-client="ca-pub-9696449443766781"
                  data-ad-slot={horizontalAdSlots[currentAdSlotIndex]}
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                 data-ad-layout="in-article"
                ></ins>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Ad Space (desktop only) */}
        <div className="hidden lg:block w-[320px] h-[830px] border-l border-gray-200 bg-white">
         <div className="h-full w-full">
          <ins 
              className="adsbygoogle"
              style={{ 
                display: 'block', 
                height: '100%', 
                width: '100%',
               minHeight: '250px'
              }}
              data-ad-client="ca-pub-9696449443766781"
              data-ad-slot="8719654150"
              data-ad-format="vertical"
              data-full-width-responsive="false"
            ></ins>
           </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
