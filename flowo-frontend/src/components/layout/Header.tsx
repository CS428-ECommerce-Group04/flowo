import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/store/cart";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";

export default function Header() {
  const items = useCart((s) => s.items);
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading, checkAuth } = useAuth();

  // Determine if user is authenticated based on email presence
  const isAuthenticated = !isLoading && user && user.email;

  // Call checkAuth on component mount and when needed
  useEffect(() => {
    // Only call checkAuth if we don't have user data and we're not already loading
    if (!user && !isLoading) {
      checkAuth();
    }
  }, [user, isLoading, checkAuth]);

  // Optional: Periodically check auth status (e.g., every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only check if we think we're authenticated
      if (user && user.email) {
        checkAuth();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, checkAuth]);

  // Handle manual auth refresh (can be triggered by user actions)
  const handleAuthRefresh = async () => {
    await checkAuth();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 lg:h-24">
            {/* Logo */}
            <Link 
              to="/" 
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-green-700 hover:text-green-800 transition-colors duration-200"
            >
              Flowo
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <Link 
                to="/" 
                className="text-sm lg:text-base font-medium text-slate-700 hover:text-green-700 transition-colors duration-200"
              >
                Home
              </Link>
              <Link 
                to="/shop" 
                className="text-sm lg:text-base font-medium text-slate-700 hover:text-green-700 transition-colors duration-200"
              >
                Shop
              </Link>
              <Link 
                to="/learn-more" 
                className="text-sm lg:text-base font-medium text-slate-700 hover:text-green-700 transition-colors duration-200"
              >
                Learn More
              </Link>
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-3 lg:space-x-4">
              {/* Cart */}
              <Link 
                to="/cart" 
                className="relative p-2 text-slate-700 hover:text-green-700 transition-colors duration-200"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* User Authentication */}
              <div className="flex items-center">
                {isLoading ? (
                  // Loading state
                  <div className="hidden md:flex items-center space-x-3">
                    <div className="animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-20"></div>
                    </div>
                  </div>
                ) : isAuthenticated ? (
                  // Authenticated state
                  <div className="hidden md:flex items-center space-x-3">
                    <span className="text-sm text-slate-600">
                      Welcome, {user.firstName}
                    </span>
                    <span className="text-xs text-slate-500 max-w-[120px] truncate">
                      ({user.email})
                    </span>
                    {/* Optional: Add refresh button for manual auth check */}
                    <button
                      onClick={handleAuthRefresh}
                      className="text-xs text-slate-400 hover:text-slate-600 transition-colors duration-200"
                      title="Refresh authentication status"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  // Unauthenticated state - show Sign In/Sign Up buttons
                  <div className="hidden md:flex items-center space-x-3">
                    <Link 
                      to="/login" 
                      className="text-sm font-medium text-slate-700 hover:text-green-700 transition-colors duration-200"
                      onClick={handleAuthRefresh} // Refresh auth state when navigating to login
                    >
                      Sign In
                    </Link>
                    <Link 
                      to="/register" 
                      className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors duration-200"
                      onClick={handleAuthRefresh} // Refresh auth state when navigating to register
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>

              {/* Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-slate-700 hover:text-green-700 transition-colors duration-200"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isLoggedIn={isAuthenticated}
        user={isAuthenticated ? {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        } : undefined}
      />
    </>
  );
}