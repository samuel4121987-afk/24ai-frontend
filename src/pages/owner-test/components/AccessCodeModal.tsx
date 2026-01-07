import { useState } from 'react';
import { motion } from 'framer-motion';

interface AccessCodeModalProps {
  onSuccess: () => void;
}

export default function AccessCodeModal({ onSuccess }: AccessCodeModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const OWNER_CODE = 'Samuel1987@!';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setError('');

    setTimeout(() => {
      if (code === OWNER_CODE) {
        localStorage.setItem('owner_access_verified', 'true');
        localStorage.setItem('owner_access_time', Date.now().toString());
        onSuccess();
      } else {
        setError('Invalid access code. This area is restricted to the owner only.');
        setCode('');
      }
      setIsChecking(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0E27]/95 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-[#161B22] rounded-2xl p-8 border-2 border-orange-500/30">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <i className="ri-lock-line text-3xl text-white"></i>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Owner Access Required</h2>
            <p className="text-gray-400">This testing dashboard is restricted to the owner only</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Access Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Access Code</label>
              <input
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError('');
                }}
                placeholder="Enter owner access code"
                className="w-full px-4 py-3 bg-[#21262D] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                autoFocus
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-2 flex items-center gap-2"
                >
                  <i className="ri-error-warning-line"></i>
                  {error}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isChecking || !code.trim()}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              {isChecking ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Verifying...
                </>
              ) : (
                <>
                  Verify Access
                  <i className="ri-arrow-right-line"></i>
                </>
              )}
            </button>
          </form>

          {/* Back Button */}
          <button
            onClick={() => window.location.href = '/'}
            className="w-full mt-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Back to Home
          </button>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <i className="ri-shield-line text-orange-400 text-lg mt-0.5"></i>
              <div className="text-xs text-orange-200">
                <p className="font-medium mb-1">Security Notice</p>
                <p className="text-orange-300/80">
                  This area contains sensitive testing tools and should only be accessed by the system owner.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}