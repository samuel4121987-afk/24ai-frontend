
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

interface AccessRequest {
  id: string;
  email: string;
  use_case: string;
  message: string;
  status: string;
  created_at: string;
}

interface AccessCode {
  id: string;
  code: string;
  email: string;
  status: string;
  created_at: string;
  expires_at: string;
  usage_count: number;
  last_used_at: string | null;
}

interface Stats {
  totalRequests: number;
  pendingRequests: number;
  activeCodes: number;
  totalUsers: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    pendingRequests: 0,
    activeCodes: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const handleLogin = () => {
    // Simple password check - in production, use proper authentication
    if (password === 'admin2024') {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
      loadData();
    } else {
      alert('Invalid password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Load codes
      const { data: codesData, error: codesError } = await supabase
        .from('access_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (codesError) throw codesError;

      setRequests(requestsData || []);
      setCodes(codesData || []);

      // Calculate stats
      setStats({
        totalRequests: requestsData?.length || 0,
        pendingRequests: requestsData?.filter(r => r.status === 'pending').length || 0,
        activeCodes: codesData?.filter(c => c.status === 'active').length || 0,
        totalUsers: codesData?.length || 0
      });
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (request: AccessRequest) => {
    try {
      // Generate access code
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/generate-access-code`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestId: request.id,
            email: request.email
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Send email
        const emailResponse = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/send-access-code-email`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: request.email,
              code: result.code.code,
              userName: request.email.split('@')[0]
            })
          }
        );

        if (!emailResponse.ok) {
          console.warn('Email failed to send, but access code was generated');
        }

        alert(`Access code generated and sent to ${request.email}`);
        loadData();
      } else {
        throw new Error(result.error || 'Failed to generate access code');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
      
      loadData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    }
  };

  const revokeCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('access_codes')
        .update({ status: 'revoked' })
        .eq('id', codeId);

      if (error) throw error;
      
      loadData();
    } catch (error) {
      console.error('Error revoking code:', error);
      alert('Failed to revoke code. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#161B22] rounded-2xl border border-gray-800 p-8 w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ri-shield-keyhole-line text-3xl text-white"></i>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-gray-400 text-sm">Enter password to continue</p>
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Admin password"
            className="w-full bg-[#0A0E27] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 mb-4"
          />

          <button
            onClick={handleLogin}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg transition-all whitespace-nowrap cursor-pointer"
          >
            Login
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full mt-3 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#161B22]">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <i className="ri-admin-line text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-gray-400">Manage users and access codes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-refresh-line mr-2"></i>
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-logout-box-line mr-2"></i>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-[#161B22] rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Requests</span>
              <i className="ri-file-list-line text-cyan-400 text-xl"></i>
            </div>
            <p className="text-3xl font-bold">{stats.totalRequests}</p>
          </div>

          <div className="bg-[#161B22] rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Pending</span>
              <i className="ri-time-line text-orange-400 text-xl"></i>
            </div>
            <p className="text-3xl font-bold">{stats.pendingRequests}</p>
          </div>

          <div className="bg-[#161B22] rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Active Codes</span>
              <i className="ri-key-line text-green-400 text-xl"></i>
            </div>
            <p className="text-3xl font-bold">{stats.activeCodes}</p>
          </div>

          <div className="bg-[#161B22] rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Users</span>
              <i className="ri-user-line text-blue-400 text-xl"></i>
            </div>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#161B22] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 px-6 py-4 font-medium transition-colors cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="ri-inbox-line mr-2"></i>
              Access Requests
            </button>
            <button
              onClick={() => setActiveTab('codes')}
              className={`flex-1 px-6 py-4 font-medium transition-colors cursor-pointer ${
                activeTab === 'codes'
                  ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className="ri-key-line mr-2"></i>
              Access Codes
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading...</p>
              </div>
            ) : activeTab === 'requests' ? (
              <div className="space-y-4">
                {requests.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <i className="ri-inbox-line text-6xl mb-4"></i>
                    <p>No access requests yet</p>
                  </div>
                ) : (
                  requests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#0A0E27] rounded-xl border border-gray-700 p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg">{request.email}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              request.status === 'pending'
                                ? 'bg-orange-500/20 text-orange-400'
                                : request.status === 'approved'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">
                            <strong>Use case:</strong> {request.use_case}
                          </p>
                          {request.message && (
                            <p className="text-sm text-gray-400 mb-2">
                              <strong>Message:</strong> {request.message}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Requested: {new Date(request.created_at).toLocaleString()}
                          </p>
                        </div>

                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveRequest(request)}
                              className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <i className="ri-check-line mr-1"></i>
                              Approve
                            </button>
                            <button
                              onClick={() => rejectRequest(request.id)}
                              className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <i className="ri-close-line mr-1"></i>
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {codes.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <i className="ri-key-line text-6xl mb-4"></i>
                    <p>No access codes generated yet</p>
                  </div>
                ) : (
                  codes.map((code) => (
                    <motion.div
                      key={code.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#0A0E27] rounded-xl border border-gray-700 p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <code className="text-lg font-mono font-bold text-cyan-400">
                              {code.code}
                            </code>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              code.status === 'active'
                                ? 'bg-green-500/20 text-green-400'
                                : code.status === 'revoked'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {code.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-1">
                            <strong>Email:</strong> {code.email}
                          </p>
                          <p className="text-sm text-gray-400 mb-1">
                            <strong>Usage:</strong> {code.usage_count} times
                          </p>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(code.created_at).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Expires: {new Date(code.expires_at).toLocaleString()}
                          </p>
                          {code.last_used_at && (
                            <p className="text-xs text-gray-500">
                              Last used: {new Date(code.last_used_at).toLocaleString()}
                            </p>
                          )}
                        </div>

                        {code.status === 'active' && (
                          <button
                            onClick={() => revokeCode(code.id)}
                            className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                          >
                            <i className="ri-forbid-line mr-1"></i>
                            Revoke
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
