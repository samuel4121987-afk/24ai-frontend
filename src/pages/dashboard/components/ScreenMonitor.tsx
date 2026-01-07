import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { API_CONFIG, getWebSocketUrl } from '../../../config/api';

export default function ScreenMonitor() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quality, setQuality] = useState<'HD' | 'SD'>('HD');
  const [fps, setFps] = useState(5);
  const [showControls, setShowControls] = useState(false);
  const [screenImage, setScreenImage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to Railway backend WebSocket for screen capture
    const accessCode = 'test-code'; // This should come from user's session
    const wsUrl = getWebSocketUrl(API_CONFIG.WS_PATHS.DASHBOARD(accessCode));
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to Railway backend');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'screen_frame') {
            // Update screen image
            setScreenImage(data.image);
            setLatency(data.latency || 0);
            setFps(data.fps || 5);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('Disconnected from Railway backend');
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnected(false);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex-1 bg-[#161B22] rounded-2xl border border-gray-800 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <i className="ri-eye-line text-cyan-400 text-xl"></i>
          <h3 className="text-white font-bold">Live Screen Monitor</h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
            <motion.div
              className="w-2 h-2 bg-green-400 rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            ></motion.div>
            <span className="text-xs font-semibold text-green-400">{fps} FPS</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuality(quality === 'HD' ? 'SD' : 'HD')}
            className="px-3 py-1.5 bg-[#21262D] text-gray-400 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            {quality}
          </button>
          <button className="w-9 h-9 flex items-center justify-center bg-[#21262D] text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer">
            <i className="ri-camera-line"></i>
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-9 h-9 flex items-center justify-center bg-[#21262D] text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <i className={isFullscreen ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'}></i>
          </button>
        </div>
      </div>

      {/* Screen Display */}
      <div
        className="flex-1 relative bg-[#0D1117] overflow-hidden"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Screen Content */}
        {screenImage ? (
          <img
            src={`data:image/jpeg;base64,${screenImage}`}
            alt="Screen capture"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"
              ></motion.div>
              <p className="text-gray-400 text-sm">
                {isConnected ? 'Waiting for screen capture...' : 'Connecting to backend...'}
              </p>
              <p className="text-gray-600 text-xs mt-2">
                {isConnected 
                  ? 'Install and run the desktop agent to start monitoring'
                  : 'Establishing connection to Railway backend...'}
              </p>
            </div>
          </div>
        )}

        {/* Screen Border Glow */}
        <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-lg pointer-events-none"></div>

        {/* Overlay Controls */}
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-4 right-4 flex gap-2"
          >
            <button className="px-4 py-2 bg-black/80 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-black transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <i className="ri-screenshot-line"></i>
              Screenshot
            </button>
            <button className="px-4 py-2 bg-black/80 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-black transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <i className="ri-refresh-line"></i>
              Refresh
            </button>
          </motion.div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 border-t border-gray-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <i className="ri-time-line text-gray-500"></i>
            <span className="text-gray-400">Latency: <strong className="text-cyan-400">{latency}ms</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <i className="ri-signal-wifi-line text-gray-500"></i>
            <span className="text-gray-400">Quality: <strong className="text-cyan-400">{quality}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <i className="ri-database-2-line text-gray-500"></i>
            <span className="text-gray-400">Bandwidth: <strong className="text-cyan-400">2.4 MB/s</strong></span>
          </div>
        </div>
        <div className="text-gray-500">
          Resolution: 1920x1080
        </div>
      </div>
    </div>
  );
}