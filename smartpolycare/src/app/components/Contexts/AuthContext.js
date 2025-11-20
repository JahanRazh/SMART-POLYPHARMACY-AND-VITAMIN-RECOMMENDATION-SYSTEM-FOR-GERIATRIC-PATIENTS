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
    
    // Add additional scopes for People API to get more profile information
    provider.addScope('https://www.googleapis.com/auth/user.birthday.read');
    provider.addScope('https://www.googleapis.com/auth/user.gender.read');
    provider.addScope('profile');
    
    const result = await signInWithPopup(auth, provider);
    
    try {
      // Extract first and last name from Google profile
      const displayName = result.user.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Try to get age and gender from Google People API
      let age = null;
      let gender = null;
      
      try {
        // Get the access token from the credential
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          // Try to fetch from Google People API
          const peopleApiResponse = await fetch(
            `https://people.googleapis.com/v1/people/me?personFields=birthdays,genders`,
            {
              headers: {
                'Authorization': `Bearer ${credential.accessToken}`
              }
            }
          );
          
          if (peopleApiResponse.ok) {
            const peopleData = await peopleApiResponse.json();
            
            // Extract gender
            if (peopleData.genders && peopleData.genders.length > 0) {
              const genderValue = peopleData.genders[0].value;
              if (genderValue) {
                gender = genderValue.toLowerCase();
              }
            }
            
            // Extract age from birthday
            if (peopleData.birthdays && peopleData.birthdays.length > 0) {
              const birthday = peopleData.birthdays[0];
              if (birthday.date) {
                const birthYear = birthday.date.year;
                if (birthYear) {
                  const currentYear = new Date().getFullYear();
                  age = currentYear - birthYear;
                }
              }
            }
          }
        }
      } catch (peopleApiError) {
        // If People API fails, we'll just continue without age/gender
        // The user will be prompted to provide them
        console.warn('Could not fetch age/gender from Google People API:', peopleApiError.message);
      }
      
      // Save user profile to Firestore - FIX: Ensure photoURL is not undefined
      await saveUserProfile(result.user.uid, {
        firstName,
        lastName,
        email: result.user.email,
        displayName,
        photoURL: result.user.photoURL || null, // ✅ FIX: Use null instead of undefined
        provider: 'google',
        age: age,
        gender: gender
      });
      
      // Return result with age and gender info
      return {
        ...result,
        needsAgeGender: !age || !gender
      };
    } catch (error) {
      console.warn('Could not save user profile to Firestore:', error.message);
      return {
        ...result,
        needsAgeGender: true
      };
    }
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
      // Get existing profile to preserve fields that aren't being updated
      const existingProfile = await getUserProfile(userId) || {};
      
      // Clean the data - remove any undefined values
      const cleanData = { ...profileData };
      
      // Remove undefined fields
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) {
          delete cleanData[key];
        }
      });

      // Merge existing profile with new data
      // Only include fields that are provided in cleanData or exist in existingProfile
      const userProfile = {
        ...existingProfile,
        ...cleanData,
        updatedAt: new Date()
      };
      
      // Set createdAt only if it doesn't exist (for new profiles)
      if (!userProfile.createdAt) {
        userProfile.createdAt = new Date();
      }

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
    
    // Get existing profile to preserve fields that aren't being updated
    const existingProfile = await getUserProfile(user.uid) || {};
    
    // Merge existing profile with new data, preserving existing fields
    const mergedProfile = {
      ...existingProfile,
      ...profileData,
      updatedAt: new Date()
    };
    
    // Only update createdAt if it doesn't exist (for new profiles)
    if (!mergedProfile.createdAt) {
      mergedProfile.createdAt = new Date();
    }
    
    await saveUserProfile(user.uid, mergedProfile);
    
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