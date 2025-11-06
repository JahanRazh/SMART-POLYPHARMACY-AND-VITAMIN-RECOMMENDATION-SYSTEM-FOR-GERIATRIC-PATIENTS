// Contexts/AuthContext.js
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseConfig';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(null);

  // Sign up with email/password
  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Sign in with email/password
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, provider);
    
    try {
      // Extract first and last name from Google profile
      const displayName = result.user.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Save user profile to Firestore
      await saveUserProfile(result.user.uid, {
        firstName,
        lastName,
        email: result.user.email,
        displayName,
        photoURL: result.user.photoURL || null, // Ensure photoURL is not undefined
        provider: 'google'
      });
    } catch (error) {
      console.warn('Could not save user profile to Firestore:', error.message);
      // Continue even if Firestore fails - user is still authenticated
    }
    
    return result;
  };

  // Update user profile for email signup
  const updateUserProfile = async (profileData) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    
    // Update Firebase auth profile
    await updateProfile(auth.currentUser, {
      displayName: profileData.displayName,
      photoURL: profileData.photoURL || null // Ensure photoURL is not undefined
    });
    
    try {
      // Save additional profile data to Firestore
      await saveUserProfile(auth.currentUser.uid, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: auth.currentUser.email,
        displayName: profileData.displayName,
        photoURL: profileData.photoURL || null, // Ensure photoURL is not undefined
        provider: 'email'
      });
    } catch (error) {
      console.warn('Could not update user profile in Firestore:', error.message);
      throw error;
    }
  };

  // Save user profile to Firestore with proper data validation
  const saveUserProfile = async (userId, profileData) => {
    try {
      // Clean the data to remove undefined values
      const cleanProfileData = {
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || '',
        displayName: profileData.displayName || '',
        photoURL: profileData.photoURL || null, // Explicitly set to null if undefined
        provider: profileData.provider || 'email',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Remove any undefined values
      Object.keys(cleanProfileData).forEach(key => {
        if (cleanProfileData[key] === undefined) {
          delete cleanProfileData[key];
        }
      });

      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, cleanProfileData, { merge: true });
      setFirestoreError(null);
    } catch (error) {
      console.error('Firestore error:', error);
      setFirestoreError(error.message);
      throw error;
    }
  };

  // Get user profile from Firestore with error handling
  const getUserProfile = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setFirestoreError(null);
        return userSnap.data();
      }
      return null;
    } catch (error) {
      console.warn('Could not load user profile from Firestore:', error.message);
      setFirestoreError(error.message);
      return null;
    }
  };

  // Update user profile data
  const updateProfileData = async (profileData) => {
    if (!user) throw new Error('No user logged in');
    
    await saveUserProfile(user.uid, {
      ...profileData,
      updatedAt: new Date()
    });
    
    // Refresh user profile data
    await loadUserProfile(user.uid);
  };

  // Load user profile
  const loadUserProfile = async (userId) => {
    const profile = await getUserProfile(userId);
    setUserProfile(profile);
    return profile;
  };

  // Logout
  const logout = () => {
    setUserProfile(null);
    setFirestoreError(null);
    return signOut(auth);
  };

  // Reset password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Load user profile from Firestore
        await loadUserProfile(user.uid);
      } else {
        setUserProfile(null);
        setFirestoreError(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userProfile,
    firestoreError,
    signup,
    login,
    logout,
    signInWithGoogle,
    resetPassword,
    updateUserProfile,
    updateProfileData,
    loadUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}