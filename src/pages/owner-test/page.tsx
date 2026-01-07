import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ScreenMonitor from '../dashboard/components/ScreenMonitor';
import CommandBar from '../dashboard/components/CommandBar';
import ActivityFeed from '../dashboard/components/ActivityFeed';
import AccessCodeModal from './components/AccessCodeModal';

export default function OwnerTestPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

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

  // Simulate connection when verified
  useEffect(() => {
    if (isVerified) {
      setConnectionStatus('connecting');
      setTimeout(() => {
        setConnectionStatus('connected');
      }, 1500);
    }
  }, [isVerified]);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Screen Monitor */}
          <div className="lg:col-span-2">
            <ScreenMonitor />
          </div>

          {/* Right Column - Activity Feed */}
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>

        {/* Command Bar */}
        <div className="mt-6">
          <CommandBar connectionStatus={connectionStatus} />
        </div>

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