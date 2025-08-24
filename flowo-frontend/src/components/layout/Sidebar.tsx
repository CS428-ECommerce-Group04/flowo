import { useState } from 'react';
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  user?: {
    name: string;
    email: string;
  };
}

export default function Sidebar({ isOpen, onClose, isLoggedIn, user }: SidebarProps) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div 
        id="site-sidebar"
        className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-green-700">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm"
              aria-label="Close navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-6" role="navigation" aria-label="Mobile navigation">
            <div className="space-y-4">
              <Link
                to="/"
                onClick={onClose}
                className="block text-lg font-medium text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm px-2 py-2"
                aria-label="Go to home page"
              >
                Home
              </Link>
              <Link
                to="/shop"
                onClick={onClose}
                className="block text-lg font-medium text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm px-2 py-2"
                aria-label="Browse our flower shop"
              >
                Shop
              </Link>
              <Link
                to="/order-tracking"
                onClick={onClose}
                className="block text-lg font-medium text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm px-2 py-2"
                aria-label="Track your flower orders"
              >
                Order Tracking
              </Link>
              <Link
                to="/learn-more"
                onClick={onClose}
                className="block text-lg font-medium text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm px-2 py-2"
                aria-label="Learn more about our flowers and services"
              >
                Learn More
              </Link>
              <Link
                to="/cart"
                onClick={onClose}
                className="block text-lg font-medium text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm px-2 py-2"
                aria-label="View shopping cart"
              >
                Cart
              </Link>
              <Link
                to="/admin"
                onClick={onClose}
                className="block text-lg font-medium text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm px-2 py-2"
                aria-label="Admin Feature"
              >
                Admin
              </Link>
            </div>
          </nav>

          {/* User Section */}
          <div className="border-t border-slate-200 p-6">
            {isLoggedIn && user ? (
              <div className="space-y-4">
                <div className="text-sm text-slate-600">
                  <p className="font-medium text-slate-900">{user.name}</p>
                  <p>{user.email}</p>
                </div>

                  {/* Profile link */}
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="block text-lg font-medium text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm px-2 py-2"
                  aria-label="View your profile"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-lg font-medium text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm px-2 py-2"
                  aria-label="Sign out of your account"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="block text-lg font-medium text-slate-700 hover:text-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 rounded-sm px-2 py-2"
                  aria-label="Sign in to your account"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={onClose}
                  className="block bg-green-700 text-white px-4 py-3 rounded-lg text-lg font-medium hover:bg-green-800 transition-colors duration-200 text-center focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
                  aria-label="Create a new account"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
