const envUrl = import.meta.env.VITE_API_URL;
const API_BASE = envUrl 
  ? envUrl.replace(/\/$/, '') 
  : (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://backend-movies-ruby.vercel.app');

export default API_BASE;