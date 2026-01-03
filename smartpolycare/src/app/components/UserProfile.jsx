// components/UserProfile.jsx
"use client";

import { useState } from 'react';
import { useAuth } from './Contexts/AuthContext';
import AuthModal from './Auth/AuthModal';
import ProfileModal from './Auth/ProfileModal';

const UserProfile = () => {
  const { user, userProfile, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const getDisplayName = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    return user?.displayName || user?.email || 'User';
  };

  const getInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <>
      <div className="user-profile">
        {user ? (
          <div className="flex items-center space-x-4">
            {/* User Avatar with Dropdown */}
            <div className="relative group">
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-teal-500"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold">
                    {getInitials()}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <div className="font-semibold text-gray-900 text-sm">
                    {getDisplayName()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {userProfile?.provider === 'google' ? 'Google Account' : 'Email Account'}
                  </div>
                </div>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    📝 Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="btn btn-primary bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Sign In
          </button>
        )}
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
      
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </>
  );
};

export default UserProfile;