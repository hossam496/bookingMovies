/**
 * Centralized API configuration
 * Switches between local development and production Vercel backend.
 */
const API_BASE = import.meta.env.VITE_API_URL || "https://backend-movies-eta.vercel.app";

export default API_BASE;
