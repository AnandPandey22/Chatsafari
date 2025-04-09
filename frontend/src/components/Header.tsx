import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import ConfirmDialog from './ConfirmDialog';

const Header: React.FC = () => {
  const { currentUser, logout } = useStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <img src="/logo.png" alt="ChatSafari" className="h-8" />
          <h1 className="text-xl font-semibold ml-2">ChatSafari</h1>
        </div>
        <div className="flex items-center gap-4">
          {currentUser && (
            <>
              <span className="text-gray-600">
                Welcome, {currentUser.username}
              </span>
              <button
                onClick={handleLogoutClick}
                className="px-4 py-2 text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </header>
  );
};

export default Header; 