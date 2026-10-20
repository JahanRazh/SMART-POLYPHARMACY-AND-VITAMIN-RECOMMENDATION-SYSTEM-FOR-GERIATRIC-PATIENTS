/**
 * Centralized API configuration for SmartPolyCare
 * Works seamlessly in both local development and production deployment (Vercel, Render, Railway, etc.)
 */

export const API_BASE_URL: string = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_LOCAL_API_URL ||
  "http://127.0.0.1:5000"
).replace(/\/+$/, ""); // Remove trailing slash if present

/**
 * Helper to build full API endpoint URL
 * @param path - e.g. "/api/meal-plans" or "detect_emotion"
 */
export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export default API_BASE_URL;
