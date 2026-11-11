// lib/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase credentials are provided
const hasValidConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "undefined" &&
  firebaseConfig.projectId
);

// Fallback dummy config used during Next.js SSG / build-time prerendering (e.g., /_not-found)
const buildFallbackConfig = {
  apiKey: "AIzaSyDummyBuildKeyPlaceholder123456789",
  authDomain: "dummy.firebaseapp.com",
  projectId: "dummy-project",
  storageBucket: "dummy.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:placeholder",
};

const activeConfig = hasValidConfig ? firebaseConfig : buildFallbackConfig;

// Initialize Firebase
const app = !getApps().length ? initializeApp(activeConfig) : getApp();

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

if (typeof window !== "undefined" && !hasValidConfig) {
  console.warn(
    "Firebase environment variables are missing. Please check NEXT_PUBLIC_FIREBASE_* in your environment settings."
  );
}

export default app;
