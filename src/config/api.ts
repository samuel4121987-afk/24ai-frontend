// API Configuration for Production Deployment

export const API_CONFIG = {
  // Render Backend URLs
  BACKEND_URL: 'https://twodai-backend.onrender.com',
  WS_URL: 'wss://twodai-backend.onrender.com/ws',
  
  // API Endpoints
  ENDPOINTS: {
    EXECUTE_COMMAND: '/api/execute',
    AGENT_STATUS: '/api/agent/status',
    SCREEN_CAPTURE: '/api/screen/latest',
  },
  
  // WebSocket Paths
  WS_PATHS: {
    AGENT: (accessCode: string) => `/ws/agent/${accessCode}`,
    DASHBOARD: (accessCode: string) => `/ws/dashboard/${accessCode}`,
  },
  
  // Screen Capture Settings
  SCREEN: {
    DEFAULT_FPS: 5,
    MAX_FPS: 10,
    MIN_FPS: 2,
    QUALITY: 'HD' as 'HD' | 'SD',
  },
};

// Helper function to get full WebSocket URL
export function getWebSocketUrl(path: string): string {
  return `${API_CONFIG.WS_URL}${path}`;
}

// Helper function to get full API URL
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.BACKEND_URL}${endpoint}`;
}
