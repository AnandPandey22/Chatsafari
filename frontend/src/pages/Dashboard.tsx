import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import UserList from '../components/UserList';
import ChatWindow from '../components/ChatWindow';
import { LogOut, Menu, X, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';


const Dashboard: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [adKey, setAdKey] = useState(0);
  const hasOpenedFirstChat = useRef(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { currentUser, logout, selectedUser, notifications, setSelectedUser, activeUsers, restoreSession } = useStore();


  
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

  // Load AdSense script
  useEffect(() => {
    if (!window.adsbygoogle) {
      window.adsbygoogle = [];
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9696449443766781';
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  }, []);

  // Initialize ads once when user logs in
  useEffect(() => {
    if (currentUser) {
      const timer = setTimeout(() => {
        try {
          // Initialize both ads
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
          console.error('Error initializing ads:', err);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  // Add retry logic for right sidebar ad
  useEffect(() => {
    if (currentUser && !isMobile) {
      let retryCount = 0;
      const maxRetries = 3;
      const retryInterval = 2000; // 2 seconds between retries

      const initializeRightSidebarAd = () => {
        const rightSidebarAd = document.querySelector('.right-sidebar-ad');
        if (rightSidebarAd) {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            console.log('Right sidebar ad initialized successfully');
          } catch (err) {
            console.error('Error initializing right sidebar ad:', err);
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(initializeRightSidebarAd, retryInterval);
            }
          }
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initializeRightSidebarAd, retryInterval);
        }
      };

      // Initial attempt
      setTimeout(initializeRightSidebarAd, 1500);
    }
  }, [currentUser, isMobile]);

  // Handle first chat window open in mobile
  useEffect(() => {
    if (selectedUser && isMobile && !hasOpenedFirstChat.current) {
      hasOpenedFirstChat.current = true;
      setAdKey(prev => prev + 1);
      
      // Initialize the mobile ad
      const timer = setTimeout(() => {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
          console.error('Error initializing mobile ad:', err);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [selectedUser, isMobile]);

  // Handle mobile ad visibility
  useEffect(() => {
    if (selectedUser && isMobile) {
      const refreshMobileAd = () => {
        const adElement = document.querySelector('.adsbygoogle');
        if (adElement) {
          try {
            // Force ad refresh
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          } catch (err) {
            console.error('Error refreshing mobile ad:', err);
          }
        }
      };

      // Refresh ad immediately and after a short delay to ensure visibility
      refreshMobileAd();
      const timer = setTimeout(refreshMobileAd, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedUser, isMobile]);

  // Handle ad clicks globally
  useEffect(() => {
    const handleAdClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.adsbygoogle')) {
        const link = target.closest('a');
        if (link) {
          event.preventDefault();
          const newWindow = window.open(link.href, '_blank');
          if (newWindow) {
            newWindow.focus();
          }
        }
      }
    };

    document.addEventListener('click', handleAdClick);
    return () => document.removeEventListener('click', handleAdClick);
  }, []);

  // Prevent browser leave confirmation
  useEffect(() => {
    window.onbeforeunload = null;
  }, []);



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
          {/* Mobile Ad Space - Only visible in mobile above chat */}
          {isMobile && (
            <div className="bg-white border-b border-gray-200">
              <div className="h-full w-full" key={adKey}>
                <ins 
                  className="adsbygoogle"
                  style={{ display: 'block', height: '100%', width: '100%' }}
                  data-ad-client="ca-pub-9696449443766781"
                  data-ad-slot="1455746969"
                  data-ad-format="auto"
                  data-full-width-responsive="true"
                  data-ad-targeting="target=_blank"
                ></ins>
              </div>
            </div>
          )}

          {/* Chat Window Container */}
         <div className={`${isMobile ? 'h-[410px]' : 'h-[530px]'} overflow-hidden ${isMobile ? 'pt-[30px] bg-violet-50' : ''}`}>
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

          {/* Bottom Ad Space - Only visible in desktop */}
          <div className={`${isMobile ? 'hidden' : 'flex-1'} bg-white border-t border-gray-200`}>
            <div className="h-full w-full" key={adKey}>
              <ins 
                className="adsbygoogle"
                style={{ display: 'block', height: '100%', width: '100%' }}
                data-ad-client="ca-pub-9696449443766781"
                data-ad-slot="1455746969"
                data-ad-format="auto"
                data-full-width-responsive="true"
                data-ad-targeting="target=_blank"
              ></ins>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Ad Space (desktop only) */}
        <div className="hidden lg:block w-[320px] h-[830px] border-l border-gray-200 bg-white">
          <div className="h-full w-full">
            <ins 
              className="adsbygoogle right-sidebar-ad"
              style={{ 
                display: 'block', 
                height: '100%', 
                width: '100%',
                minHeight: '600px'
              }}
              data-ad-client="ca-pub-9696449443766781"
              data-ad-slot="8719654150"
              data-ad-format="vertical"
              data-full-width-responsive="true"
            ></ins>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
