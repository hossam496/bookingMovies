// config.js
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://backend-movies-ruby.vercel.app';

export default API_BASE;