import { motion } from 'framer-motion';
import { useState } from 'react';

export default function SetupInstructions() {
  const [isExpanded, setIsExpanded] = useState(true);

  const steps = [
    {
      number: '1️⃣',
      title: 'Install Python 3.9+',
      description: 'Download from: https://www.python.org/downloads/',
      note: '✓ Check "Add Python to PATH" during installation',
      link: 'https://www.python.org/downloads/',
    },
    {
      number: '2️⃣',
      title: 'Download Desktop Agent',
      description: 'Download the agent files to your computer',
      note: 'Extract to any folder on your computer',
      action: 'download',
    },
    {
      number: '3️⃣',
      title: 'Install Dependencies',
      description: 'Open terminal in agent folder and run:',
      code: 'pip install -r requirements.txt',
      note: 'This installs PyAutoGUI, MSS, Pillow, and WebSockets',
    },
    {
      number: '4️⃣',
      title: 'Run Desktop Agent',
      description: 'Start the agent with your access code:',
      code: 'python agent.py YOUR-ACCESS-CODE',
      note: 'Replace YOUR-ACCESS-CODE with your unique code from the dashboard',
    },
    {
      number: '5️⃣',
      title: 'Grant Permissions',
      description: 'Allow screen recording and accessibility:',
      note: 'Mac: System Preferences → Security & Privacy → Screen Recording\nWindows: Run as Administrator',
    },
  ];

  const downloadAgent = async () => {
    // Download the desktop agent ZIP file with all code included
    const link = document.createElement('a');
    link.href = '/24ai-desktop-agent.zip';
    link.download = '24ai-desktop-agent.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAgentOld = async () => {
    // Old method - kept for reference
    try {
      const response = await fetch('https://github.com/samuel4121987-afk/24ai-frontend/raw/main/desktop-agent/24ai-desktop-agent.zip');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '24ai-desktop-agent.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download agent:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#161B22] rounded-2xl border border-gray-800 overflow-hidden"
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b border-gray-800 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <i className="ri-book-open-line text-orange-400 text-xl"></i>
          <h3 className="text-white font-bold">Setup Instructions</h3>
          <div className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full">
            <span className="text-xs font-semibold text-orange-400">Required Setup</span>
          </div>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
          <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-xl`}></i>
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Introduction */}
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <i className="ri-information-line text-cyan-400 text-xl mt-0.5"></i>
              <div className="text-sm text-cyan-200">
                <p className="font-medium mb-1">How This Works</p>
                <p className="text-cyan-300/80">
                  The desktop agent runs on your computer, captures your screen, and executes AI commands.
                  Follow these steps to set it up:
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className="p-4 bg-[#0D1117] border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{step.number}</div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-2">{step.title}</h4>
                    <p className="text-gray-400 text-sm mb-2">{step.description}</p>
                    
                    {step.code && (
                      <div className="mt-2 p-3 bg-black/50 border border-gray-700 rounded-lg font-mono text-sm text-cyan-400">
                        {step.code}
                      </div>
                    )}
                    
                    {step.link && (
                      <a
                        href={step.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-2 text-cyan-400 hover:text-cyan-300 text-sm"
                      >
                        <i className="ri-external-link-line"></i>
                        Open Download Page
                      </a>
                    )}
                    
                    {step.action === 'download' && (
                      <button
                        onClick={downloadAgent}
                        className="mt-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <i className="ri-download-line"></i>
                        Download Desktop Agent
                      </button>
                    )}
                    
                    {step.note && (
                      <p className="mt-2 text-xs text-gray-500 whitespace-pre-line">{step.note}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Success Message */}
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <i className="ri-checkbox-circle-line text-green-400 text-xl mt-0.5"></i>
              <div className="text-sm text-green-200">
                <p className="font-medium mb-1">Ready to Go!</p>
                <p className="text-green-300/80">
                  Once the agent is running, you'll see your screen in the monitor above and can start giving AI commands!
                </p>
              </div>
            </div>
          </div>

          {/* Backend URL Info */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <i className="ri-server-line text-purple-400 text-xl mt-0.5"></i>
              <div className="text-sm text-purple-200 flex-1">
                <p className="font-medium mb-2">Backend Connection</p>
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">API:</span>
                    <span className="text-purple-300">https://twodai-backend.onrender.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">WebSocket:</span>
                    <span className="text-purple-300">wss://twodai-backend.onrender.com/ws</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
