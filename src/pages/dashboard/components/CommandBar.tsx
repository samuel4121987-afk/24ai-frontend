import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useCommandStore } from '../../../store/commandStore';
import { API_CONFIG } from '../../../config/api';

interface CommandBarProps {
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
}

export default function CommandBar({ connectionStatus }: CommandBarProps) {
  const [command, setCommand] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const { addCommand, updateCommandStatus, isExecuting } = useCommandStore();
  const wsRef = useRef<WebSocket | null>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('openai_api_key', apiKey);
    }
  }, [apiKey]);

  // Setup WebSocket connection
  useEffect(() => {
    if (connectionStatus === 'connected' && !wsRef.current) {
      // Get access code from localStorage (set by AccessCodeModal)
      const accessCode = localStorage.getItem('owner_access_verified') === 'true' ? 'Samuel1987@!' : 'test-code';
      const wsUrl = API_CONFIG.WS_URL;
      const ws = new WebSocket(`${wsUrl}?code=${encodeURIComponent(accessCode)}&client_type=web`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message:', data);
          
          if (data.type === 'command_result') {
            updateCommandStatus(
              data.commandId || Date.now().toString(),
              data.success ? 'success' : 'error',
              data.executionTime || 0,
              data.message || data.result || 'Command executed'
            );
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        wsRef.current = null;
      };
      
      wsRef.current = ws;
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectionStatus]);

  const parseCommandToAction = (cmd: string) => {
    const cmdLower = cmd.toLowerCase().trim();
    
    // Parse natural language commands into action objects
    if (cmdLower.includes('youtube') || cmdLower.includes('open youtube')) {
      return { type: 'open_url', params: { url: 'https://www.youtube.com' } };
    } else if (cmdLower.includes('google')) {
      return { type: 'open_url', params: { url: 'https://www.google.com' } };
    } else if (cmdLower.includes('move mouse')) {
      if (cmdLower.includes('center')) {
        return { type: 'mouse_move', params: { x: 960, y: 540 } };
      }
      return { type: 'mouse_move', params: { x: 500, y: 500 } };
    } else if (cmdLower.includes('click')) {
      return { type: 'mouse_click', params: {} };
    } else if (cmdLower.startsWith('type ')) {
      const text = cmd.substring(5).trim();
      return { type: 'keyboard_type', params: { text } };
    } else if (cmdLower.startsWith('open ')) {
      const appName = cmd.substring(5).trim();
      return { type: 'open_app', params: { app: appName } };
    } else {
      // Default: try to open as URL or app
      return { type: 'open_app', params: { app: cmd } };
    }
  };

  const handleExecute = async () => {
    if (!command.trim() || isExecuting) return;

    const commandId = Date.now().toString();
    addCommand(command);
    const startTime = Date.now();

    try {
      // Send command via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Parse command into action object
        const action = parseCommandToAction(command);
        
        wsRef.current.send(JSON.stringify({
          type: 'command',
          command: action,
          apiKey: apiKey,
          commandId: commandId
        }));
        
        console.log('Command sent via WebSocket:', command, '-> Action:', action);
        
        // Set a timeout for command execution
        setTimeout(() => {
          const executionTime = Date.now() - startTime;
          updateCommandStatus(
            commandId,
            'success',
            executionTime,
            `Command "${command}" sent to agent`
          );
        }, 1000);
      } else {
        updateCommandStatus(
          commandId,
          'error',
          0,
          'WebSocket not connected. Please refresh the page.'
        );
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      updateCommandStatus(
        commandId,
        'error',
        executionTime,
        `Failed to send command: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    setCommand('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
    }
  };

  const statusConfig = {
    disconnected: { color: 'text-red-400', bg: 'bg-red-400', label: 'Disconnected', pulse: false },
    connecting: { color: 'text-yellow-400', bg: 'bg-yellow-400', label: 'Connecting...', pulse: true },
    connected: { color: 'text-green-400', bg: 'bg-green-400', label: 'Connected', pulse: true }
  };

  const status = statusConfig[connectionStatus];

  return (
    <div className="bg-[#161B22] border-b border-gray-800 p-6">
      {/* API Key Input Row */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <i className="ri-key-2-line"></i>
          <span>OpenAI API Key:</span>
        </div>
        <div className="flex-1 relative">
          <input
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-4 py-2 bg-[#21262D] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all font-mono text-xs"
          />
        </div>
        <button
          onClick={() => setShowApiKey(!showApiKey)}
          className="px-3 py-2 bg-[#21262D] border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-all"
        >
          <i className={showApiKey ? "ri-eye-off-line" : "ri-eye-line"}></i>
        </button>
        {apiKey && (
          <div className="text-xs text-green-400 flex items-center gap-1">
            <i className="ri-checkbox-circle-fill"></i>
            Saved
          </div>
        )}
      </div>

      {/* Command Input Row */}
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#21262D] rounded-xl border border-gray-700">
          <motion.div
            className={`w-3 h-3 ${status.bg} rounded-full`}
            animate={status.pulse ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          ></motion.div>
          <span className={`text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Command Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type command or use natural language... (e.g., 'Open YouTube', 'Search Google for restaurants')"
            className="w-full px-6 py-4 bg-[#21262D] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all font-mono text-sm"
          />
          {command && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              Press Enter to execute
            </div>
          )}
        </div>

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={!command.trim() || isExecuting}
          className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap cursor-pointer"
        >
          {isExecuting ? (
            <>
              <i className="ri-loader-4-line animate-spin"></i>
              Executing...
            </>
          ) : (
            <>
              <i className="ri-play-fill"></i>
              Execute
            </>
          )}
        </button>
      </div>
    </div>
  );
}