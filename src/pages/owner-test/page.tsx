import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import AccessCodeModal from './components/AccessCodeModal';
import SetupInstructions from './components/SetupInstructions';

export default function OwnerTestPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [screenImage, setScreenImage] = useState<string | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [command, setCommand] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Check if owner access is already verified
    const verified = localStorage.getItem('owner_access_verified');
    const accessTime = localStorage.getItem('owner_access_time');
    
    if (verified === 'true' && accessTime) {
      // Check if access is still valid (24 hours)
      const timeDiff = Date.now() - parseInt(accessTime);
      const hoursElapsed = timeDiff / (1000 * 60 * 60);
      
      if (hoursElapsed < 24) {
        setIsVerified(true);
      } else {
        // Access expired, clear storage
        localStorage.removeItem('owner_access_verified');
        localStorage.removeItem('owner_access_time');
      }
    }
    
    setIsCheckingAccess(false);
  }, []);

  // DON'T auto-connect - let user click Connect button
  useEffect(() => {
    if (isVerified) {
      // Just set to disconnected, user will click Connect button
      setConnectionStatus('disconnected');
    }
  }, [isVerified]);

  const addActivity = (type: string, message: string) => {
    setActivities(prev => [{
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 50)); // Keep last 50 activities
  };

  const handleExecuteCommand = () => {
    if (!command.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    setIsExecuting(true);
    setIsPaused(false);
    addActivity('user', `Command: ${command}`);

    wsRef.current.send(JSON.stringify({
      type: 'execute_command',
      command: command.trim(),
      apiKey: apiKey || localStorage.getItem('openai_api_key') || ''
    }));

    setCommand('');
  };

  const handlePauseCommand = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    setIsPaused(true);
    setIsExecuting(false);
    addActivity('system', 'Pausing command execution...');

    wsRef.current.send(JSON.stringify({
      type: 'pause_command'
    }));
  };

  const handleAccessGranted = () => {
    setIsVerified(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('owner_access_verified');
    localStorage.removeItem('owner_access_time');
    setIsVerified(false);
    setConnectionStatus('disconnected');
  };

  // Show loading while checking access
  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-orange-500 animate-spin"></i>
          <p className="text-gray-400 mt-4">Checking access...</p>
        </div>
      </div>
    );
  }

  // Show access code modal if not verified
  if (!isVerified) {
    return <AccessCodeModal onSuccess={handleAccessGranted} />;
  }

  // Show owner testing dashboard if verified
  return (
    <div className="min-h-screen bg-[#0A0E27]">
      {/* Header */}
      <header className="bg-[#161B22] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <i className="ri-settings-3-line text-xl text-white"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Owner Testing Dashboard</h1>
                <p className="text-sm text-gray-400">Test your AI control system</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400 font-medium">Owner Access</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <i className="ri-logout-box-line"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Setup Instructions */}
        <div className="mb-6">
          <SetupInstructions />
        </div>

        {/* Ready to Go Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <i className="ri-checkbox-circle-line text-2xl text-green-400"></i>
            <div>
              <h3 className="text-lg font-semibold text-green-400">Ready to Go!</h3>
              <p className="text-sm text-green-300/80">
                Once the agent is running, you'll see your screen in the monitor above and can start giving AI commands!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Backend Connection Info */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <i className="ri-server-line text-xl text-purple-400 mt-0.5"></i>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-purple-400 mb-2">Backend Connection</h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-purple-300/60">API:</span>
                  <code className="text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">https://twodai-backend.onrender.com</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-300/60">WebSocket:</span>
                  <code className="text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">ws://localhost:8765</code>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Screen Monitor */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#161B22] rounded-xl border border-gray-800 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="ri-tv-2-line text-xl text-blue-400"></i>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Live Screen Monitor</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                        connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                        'bg-gray-600'
                      }`}></div>
                      <span className="text-xs text-gray-400">
                        {connectionStatus === 'connected' ? '5 FPS' :
                         connectionStatus === 'connecting' ? 'Connecting...' :
                         'Disconnected'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Latency: 0ms</span>
                  <span className="text-xs text-gray-600">|</span>
                  <span className="text-xs text-gray-500">Bandwidth: 2.4 MB/s</span>
                  <span className="text-xs text-gray-600">|</span>
                  <span className="text-xs text-gray-500">Quality: HD</span>
                </div>
              </div>
              <div className="relative bg-black aspect-video">
                {screenImage ? (
                  <img
                    src={screenImage}
                    alt="Screen capture"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <i className="ri-computer-line text-6xl text-gray-700 mb-4"></i>
                      <p className="text-gray-500">Waiting for screen capture...</p>
                      <p className="text-sm text-gray-600 mt-2">Agent not connected</p>
                      {connectionStatus === 'disconnected' && (
                        <button
                          onClick={() => {
                            setIsConnecting(true);
                            addActivity('system', 'Attempting to launch AI Control Agent...');
                            // Try to launch via custom protocol
                            window.location.href = 'ai-control://launch';
                            // Also try to reconnect after a delay
                            setTimeout(() => {
                              const ws = new WebSocket('ws://localhost:8765');
                              wsRef.current = ws;
                              setConnectionStatus('connecting');
                              
                              ws.onopen = () => {
                                console.log('Connected to Electron AI Control');
                                setConnectionStatus('connected');
                                setIsConnecting(false);
                                addActivity('success', 'Connected to AI Control Agent');
                              };
                              
                              ws.onerror = () => {
                                setConnectionStatus('disconnected');
                                setIsConnecting(false);
                                addActivity('error', 'Failed to connect. Please launch "AI Control Assistant" from Applications.');
                              };
                              
                              ws.onclose = () => {
                                setConnectionStatus('disconnected');
                                setIsConnecting(false);
                                addActivity('system', 'Disconnected from agent');
                              };
                              
                              ws.onmessage = (event) => {
                                try {
                                  const data = JSON.parse(event.data);
                                  console.log('WebSocket message received:', data.type);
                                  
                                  if (data.type === 'screen_update' || data.type === 'screen_frame') {
                                    const imageData = data.image.startsWith('data:') ? data.image : `data:image/png;base64,${data.image}`;
                                    setScreenImage(imageData);
                                  } else if (data.type === 'status') {
                                    addActivity('agent', data.message);
                                  } else if (data.type === 'thinking') {
                                    addActivity('thinking', data.message);
                                  } else if (data.type === 'action') {
                                    addActivity('action', `${data.action}: ${JSON.stringify(data.params)}`);
                                  } else if (data.type === 'complete') {
                                    addActivity('success', data.message);
                                    setIsExecuting(false);
                                  } else if (data.type === 'error') {
                                    addActivity('error', data.message);
                                    setIsExecuting(false);
                                  }
                                } catch (error) {
                                  console.error('Failed to parse message:', error);
                                }
                              };
                            }, 2000);
                          }}
                          disabled={isConnecting}
                          className={`mt-4 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 ${isConnecting ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                          {isConnecting ? (
                            <>
                              <i className="ri-loader-4-line animate-spin"></i>
                              Connecting...
                            </>
                          ) : (
                            <>
                              🚀 Connect to Agent
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Activity Feed */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#161B22] rounded-xl border border-gray-800 overflow-hidden h-full"
            >
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <i className="ri-robot-line text-xl text-purple-400"></i>
                  <h2 className="text-lg font-semibold text-white">Activity Feed</h2>
                </div>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: '500px' }}>
                {activities.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="ri-chat-3-line text-4xl text-gray-700 mb-2"></i>
                    <p className="text-gray-500 text-sm">No activity yet</p>
                  </div>
                ) : (
                  activities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg border ${
                        activity.type === 'user' ? 'bg-blue-500/10 border-blue-500/30' :
                        activity.type === 'agent' ? 'bg-purple-500/10 border-purple-500/30' :
                        activity.type === 'thinking' ? 'bg-yellow-500/10 border-yellow-500/30' :
                        activity.type === 'action' ? 'bg-green-500/10 border-green-500/30' :
                        activity.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
                        activity.type === 'error' ? 'bg-red-500/10 border-red-500/30' :
                        'bg-gray-500/10 border-gray-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <i className={`text-sm mt-0.5 ${
                          activity.type === 'user' ? 'ri-user-line text-blue-400' :
                          activity.type === 'agent' ? 'ri-robot-line text-purple-400' :
                          activity.type === 'thinking' ? 'ri-lightbulb-line text-yellow-400' :
                          activity.type === 'action' ? 'ri-play-line text-green-400' :
                          activity.type === 'success' ? 'ri-checkbox-circle-line text-green-400' :
                          activity.type === 'error' ? 'ri-error-warning-line text-red-400' :
                          'ri-information-line text-gray-400'
                        }`}></i>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-300 break-words">{activity.message}</p>
                          <p className="text-xs text-gray-600 mt-1">{activity.timestamp}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Command Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-[#161B22] rounded-xl border border-gray-800 p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' :
              connectionStatus === 'connecting' ? 'bg-yellow-400' :
              'bg-red-400'
            }`}></div>
            <span className="text-sm font-medium text-white">
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               'Disconnected'}
            </span>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleExecuteCommand()}
              placeholder="Type command or use natural language... (e.g., 'open YouTube', 'search Google for restaurants')"
              disabled={connectionStatus !== 'connected' || isExecuting}
              className="flex-1 bg-[#0A0E27] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {!isExecuting ? (
              <button
                onClick={handleExecuteCommand}
                disabled={connectionStatus !== 'connected' || !command.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <i className="ri-play-line"></i>
                Execute
              </button>
            ) : (
              <button
                onClick={handlePauseCommand}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <i className="ri-stop-circle-line"></i>
                Stop
              </button>
            )}
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <i className="ri-information-line text-orange-400 text-xl mt-0.5"></i>
            <div className="text-sm text-orange-200">
              <p className="font-medium mb-1">Testing Environment</p>
              <p className="text-orange-300/80">
                This is your private testing dashboard. Your access will remain active for 24 hours before requiring re-authentication.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}