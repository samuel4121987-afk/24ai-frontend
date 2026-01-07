// Backend Configuration
// Update BACKEND_URL after deploying to Railway/Render/Heroku

const isDevelopment = import.meta.env.DEV;

// 🚀 PRODUCTION: Railway Backend URL
const PRODUCTION_BACKEND_URL = 'https://24ai-backend-production.up.railway.app';

// Local development URL
const DEVELOPMENT_BACKEND_URL = 'http://localhost:8000';

// Automatically use the right URL based on environment
export const BACKEND_URL = isDevelopment 
  ? DEVELOPMENT_BACKEND_URL 
  : PRODUCTION_BACKEND_URL;

// WebSocket URL (converts http to ws, https to wss)
export const WS_URL = BACKEND_URL.replace('http://', 'ws://').replace('https://', 'wss://');

// API endpoints
export const API_ENDPOINTS = {
  health: `${BACKEND_URL}/api/health`,
  websocket: (code: string, clientType: 'agent' | 'web') => 
    `${WS_URL}/ws?code=${code}&client_type=${clientType}`,
};

export default {
  BACKEND_URL,
  WS_URL,
  API_ENDPOINTS,
};
