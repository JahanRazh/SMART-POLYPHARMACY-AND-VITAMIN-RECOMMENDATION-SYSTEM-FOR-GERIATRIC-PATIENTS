// lib/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const rawApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const rawProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Clean up any extraneous quotes or whitespace (common when pasting into Vercel dashboard)
const cleanApiKey = rawApiKey ? rawApiKey.replace(/^['"]|['"]$/g, "").trim() : "";
const cleanProjectId = rawProjectId ? rawProjectId.replace(/^['"]|['"]$/g, "").trim() : "";

const firebaseConfig = {
  apiKey: cleanApiKey,
  authDomain: (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "").replace(/^['"]|['"]$/g, "").trim(),
  projectId: cleanProjectId,
  storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "").replace(/^['"]|['"]$/g, "").trim(),
  messagingSenderId: (process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID || "").replace(/^['"]|['"]$/g, "").trim(),
  appId: (process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "").replace(/^['"]|['"]$/g, "").trim(),
};

// Check if a real, valid Firebase configuration is present
// Note: Firebase throws auth/invalid-api-key if apiKey is empty or contains a colon ':'
const hasValidConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "undefined" &&
  !firebaseConfig.apiKey.includes(":") &&
  firebaseConfig.projectId
);

// Fallback config used during Next.js SSG / build-time prerendering (e.g., /_not-found)
const buildFallbackConfig = {
  apiKey: "AIzaSyDummyBuildKeyPlaceholder123456789",
  authDomain: "dummy.firebaseapp.com",
  projectId: "dummy-project",
  storageBucket: "dummy.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:placeholder",
};

const activeConfig = hasValidConfig ? firebaseConfig : buildFallbackConfig;

// Initialize Firebase App safely
let app;
try {
  app = !getApps().length ? initializeApp(activeConfig) : getApp();
} catch {
  try {
    app = !getApps().length ? initializeApp(buildFallbackConfig) : getApp();
  } catch {
    app = null;
  }
}

// Initialize Services safely with try-catch so build prerendering never crashes
let auth = null;
if (app) {
  try {
    auth = getAuth(app);
  } catch (err) {
    console.warn("Firebase Auth initialization skipped/failed:", err?.message || err);
  }
}

let db = null;
if (app) {
  try {
    db = getFirestore(app);
  } catch (err) {
    console.warn("Firestore initialization skipped/failed:", err?.message || err);
  }
}

if (typeof window !== "undefined" && !hasValidConfig) {
  console.warn(
    "Firebase environment variables are missing or invalid. Please check NEXT_PUBLIC_FIREBASE_* in your environment settings."
  );
}

export { auth, db };
export default app;
