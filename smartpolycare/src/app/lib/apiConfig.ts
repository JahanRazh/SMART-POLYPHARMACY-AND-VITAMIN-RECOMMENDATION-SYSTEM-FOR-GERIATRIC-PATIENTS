/**
 * Centralized API configuration for SmartPolyCare
 * Works seamlessly in both local development and production deployment (Vercel, Render, Railway, etc.)
 */

const DEFAULT_PROD_API_URL = "https://smartpolycare-server.onrender.com";
const DEFAULT_LOCAL_API_URL = "http://127.0.0.1:5000";

const resolveApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  // Client-side browser checks
  if (typeof window !== "undefined") {
    const isHttps = window.location.protocol === "https:";
    const isLocalhostHost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // If website is served on HTTPS (Production domain) but envUrl is HTTP localhost,
    // browsers will reject it with Mixed Content error. Auto-fallback to production URL.
    if (isHttps && !isLocalhostHost) {
      if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
        return DEFAULT_PROD_API_URL;
      }
    }

    // If browsing locally and no envUrl set, default to local backend
    if (isLocalhostHost && !envUrl) {
      return process.env.NEXT_PUBLIC_LOCAL_API_URL || DEFAULT_LOCAL_API_URL;
    }
  }

  // Server-side / Build-time resolution
  if (envUrl) {
    return envUrl;
  }

  if (process.env.NODE_ENV === "production") {
    return DEFAULT_PROD_API_URL;
  }

  return process.env.NEXT_PUBLIC_LOCAL_API_URL || DEFAULT_LOCAL_API_URL;
};

export const API_BASE_URL: string = resolveApiBaseUrl().replace(/\/+$/, "");

/**
 * Helper to build full API endpoint URL
 * @param path - e.g. "/api/meal-plans" or "detect_emotion"
 */
export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export default API_BASE_URL;
