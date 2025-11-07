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
      
      // Save user profile to Firestore - FIX: Ensure photoURL is not undefined
      await saveUserProfile(result.user.uid, {
        firstName,
        lastName,
        email: result.user.email,
        displayName,
        photoURL: result.user.photoURL || null, // ✅ FIX: Use null instead of undefined
        provider: 'google'
      });
    } catch (error) {
      console.warn('Could not save user profile to Firestore:', error.message);
    }
    
    return result;
  };

  // Update user profile for email signup
  const updateUserProfile = async (profileData) => {
    if (!auth.currentUser) throw new Error('No user logged in');
    
    // Update Firebase auth profile - FIX: Ensure photoURL is not undefined
    await updateProfile(auth.currentUser, {
      displayName: profileData.displayName,
      photoURL: profileData.photoURL || null // ✅ FIX: Use null instead of undefined
    });
    
    try {
      // Save additional profile data to Firestore - FIX: Ensure photoURL is not undefined
      await saveUserProfile(auth.currentUser.uid, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: auth.currentUser.email,
        displayName: profileData.displayName,
        photoURL: profileData.photoURL || null, // ✅ FIX: Use null instead of undefined
        provider: 'email'
      });
    } catch (error) {
      console.warn('Could not update user profile in Firestore:', error.message);
      throw error;
    }
  };

  // ✅ FIXED: Save user profile to Firestore with proper data cleaning
  const saveUserProfile = async (userId, profileData) => {
    try {
      // Clean the data - remove any undefined values
      const cleanData = { ...profileData };
      
      // Remove undefined fields
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) {
          delete cleanData[key];
        }
      });

      // Ensure required fields have values
      const userProfile = {
        firstName: cleanData.firstName || '',
        lastName: cleanData.lastName || '',
        email: cleanData.email || '',
        displayName: cleanData.displayName || '',
        photoURL: cleanData.photoURL || null, // Explicitly set to null if not provided
        provider: cleanData.provider || 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...cleanData
      };

      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, userProfile, { merge: true });
    } catch (error) {
      console.error('Firestore error:', error);
      throw error;
    }
  };

  // Get user profile from Firestore
  const getUserProfile = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      }
      return null;
    } catch (error) {
      console.warn('Could not load user profile from Firestore:', error.message);
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
        await loadUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userProfile,
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