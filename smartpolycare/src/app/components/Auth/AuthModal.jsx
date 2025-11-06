// components/Auth/AuthModal.jsx
"use client";

import { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content auth-modal">
        <div className="modal-header">
          <h2>{isLogin ? 'Welcome Back' : 'Join Us'}</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {isLogin ? (
            <LoginForm onToggleMode={() => setIsLogin(false)} />
          ) : (
            <SignupForm onToggleMode={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;