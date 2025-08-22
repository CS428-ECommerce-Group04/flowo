import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/store/cart";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";

export default function Header() {
  const items = useCart((s) => s.items);
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, isLoading, checkAuth } = useAuth();
  const isAuthenticated = !isLoading && !!user?.email;

  // derive display name: local-part of email (before '@'), fallback to firstName
  const displayName = useMemo(() => {
    if (user?.email) return user.email.split("@")[0];
    return user?.firstName || "";
  }, [user]);

  useEffect(() => {
    if (!user && !isLoading) checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.email) checkAuth();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, checkAuth]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 lg:h-24">
            {/* Logo */}
            <Link
              to="/"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-green-700 hover:text-green-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm"
              aria-label="Flowo - Go to homepage"
            >
              Flowo
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-8" role="navigation" aria-label="Main navigation">
              <Link 
                to="/" 
                className="text-sm lg:text-base font-medium text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm px-1 py-1"
                aria-label="Go to home page"
              >
                Home
              </Link>
              <Link 
                to="/shop" 
                className="text-sm lg:text-base font-medium text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm px-1 py-1"
                aria-label="Browse our flower shop"
              >
                Shop
              </Link>
              <Link 
                to="/order-tracking" 
                className="text-sm lg:text-base font-medium text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm px-1 py-1"
                aria-label="Track your flower orders"
              >
                Order Tracking
              </Link>
              <Link 
                to="/learn-more" 
                className="text-sm lg:text-base font-medium text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm px-1 py-1"
                aria-label="Learn more about our flowers and services"
              >
                Learn More
              </Link>
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-3 lg:space-x-4">
              {/* Cart */}
              <Link 
                to="/cart" 
                className="relative p-2 text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm"
                aria-label={`Shopping cart with ${totalItems} item${totalItems !== 1 ? 's' : ''}`}
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
                </svg>
                {totalItems > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
                    aria-label={`${totalItems} items in cart`}
                  >
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Auth */}
              <div className="hidden md:flex items-center space-x-3">
                {isLoading ? (
                  <div className="animate-pulse" aria-label="Loading user information">
                    <div className="h-4 bg-slate-200 rounded w-20" />
                  </div>
                ) : isAuthenticated ? (
                  // show ONLY the name (local-part of email)
                  <span className="text-sm font-medium text-slate-700" aria-label={`Logged in as ${displayName}`}>
                    {displayName}
                  </span>
                ) : (
                  <div>
                    <Link
                      to="/login"
                      className="text-sm font-medium text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm px-2 py-1"
                      aria-label="Sign in to your account"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
                      aria-label="Create a new account"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>

              {/* Menu Button (Sidebar) */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm"
                aria-label="Open navigation menu"
                aria-expanded={sidebarOpen}
                aria-controls="site-sidebar"
              >
                <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar (unchanged) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isLoggedIn={isAuthenticated}
        user={
          isAuthenticated
            ? { name: displayName, email: user!.email }
            : undefined
        }
      />
    </>
  );
}
