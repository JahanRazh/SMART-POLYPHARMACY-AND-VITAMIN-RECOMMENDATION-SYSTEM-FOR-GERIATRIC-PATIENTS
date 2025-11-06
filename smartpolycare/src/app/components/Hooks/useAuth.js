// Hooks/useAuth.js
"use client";

import { useState } from 'react';
import { useAuth } from '../Contexts/AuthContext';

export const useAuthForm = () => {
  const { login, signup, signInWithGoogle, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSignUp = async (firstName, lastName, email, password, confirmPassword) => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return { success: false, error: 'Passwords do not match' };
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      return { success: false, error: 'Password should be at least 6 characters' };
    }

    if (!firstName || !lastName) {
      setError('First name and last name are required');
      return { success: false, error: 'First name and last name are required' };
    }

    setLoading(true);
    setError('');
    
    try {
      // Create user with email/password
      const userCredential = await signup(email, password);
      const user = userCredential.user;
      
      // Update user profile with name (photoURL will be null for email signup)
      await updateUserProfile({
        displayName: `${firstName} ${lastName}`,
        firstName: firstName,
        lastName: lastName,
        email: email
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (email, password) => {
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      return { success: true };
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      await signInWithGoogle();
      return { success: true };
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setError,
    handleEmailSignUp,
    handleEmailLogin,
    handleGoogleSignIn
  };
};

// Helper function for user-friendly error messages
function getAuthErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please use a different email or sign in.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Popup was blocked. Please allow popups for this site.';
    default:
      return 'An error occurred. Please try again.';
  }
}