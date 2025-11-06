// components/UserProfile.jsx
"use client";

import { useState } from 'react';
import { useAuth } from './Contexts/AuthContext';
import AuthModal from './Auth/AuthModal';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <>
      <div className="user-profile">
        {user ? (
          <>
            <div className="user-info">
              <img 
                src={user.photoURL || '/default-avatar.png'} 
                alt="Profile" 
                className="user-avatar"
              />
              <div className="user-details">
                <h4>{user.displayName || user.email}</h4>
                <p>{user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary">
              Sign Out
            </button>
          </>
        ) : (
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="btn btn-primary"
          >
            Sign In
          </button>
        )}
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
};

export default UserProfile;