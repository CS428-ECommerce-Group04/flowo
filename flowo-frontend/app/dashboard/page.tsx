'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth, logout, AuthUser } from '../../lib/auth/auth';

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated using session cookie
    const checkAuthStatus = async () => {
      const authResponse = await checkAuth();
      
      if (!authResponse.authenticated || !authResponse.user) {
        router.push('/auth/login');
        return;
      }

      setUser(authResponse.user);
      setLoading(false);
    };

    checkAuthStatus();
  }, [router]);

  const handleLogout = async () => {
    setLoading(true);
    const success = await logout();
    if (success) {
      router.push('/auth/login');
    } else {
      setLoading(false);
      alert('Logout failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.email}</span>
              <button
                onClick={handleLogout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to your Dashboard!</h2>
              <p className="text-gray-600 mb-6">You have successfully logged in.</p>
              
              <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Profile</h3>
                <div className="space-y-2 text-left">
                  <p><span className="font-medium text-gray-700">Email:</span> {user.email}</p>
                  <p><span className="font-medium text-gray-700">User ID:</span> {user.uid}</p>
                  <p><span className="font-medium text-gray-700">Display Name:</span> {user.display_name || 'Not set'}</p>
                  <p><span className="font-medium text-gray-700">Email Verified:</span> 
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs ${user.email_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {user.email_verified ? 'Verified' : 'Not Verified'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-500">
                  Authentication verified via session cookie
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
