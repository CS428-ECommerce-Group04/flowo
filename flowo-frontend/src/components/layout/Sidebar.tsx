import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

interface MenuItemProps {
  icon: string;
  label: string;
  href: string;
  isActive?: boolean;
  onClick?: () => void;
}

const MenuItem = ({ icon, label, href, isActive, onClick }: MenuItemProps) => {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={`flex items-center px-6 py-3.5 mx-6 rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-green-800 text-white'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <img src={icon} alt={label} className="w-6 h-6 mr-4" />
      <span className="text-base font-medium">{label}</span>
    </Link>
  );
};

export default function Sidebar({ isOpen, onClose, isLoggedIn = false, user }: SidebarProps) {
  const location = useLocation();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useAuth();

  const menuItems = [
    {
      icon: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/b79249ed-94ab-40d0-a8a8-6e82494b4887',
      label: 'Home',
      href: '/'
    },
    {
      icon: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/3d94c07f-334e-4969-bc5e-58ae6648ddba',
      label: 'Messages',
      href: '/messages'
    },
    {
      icon: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/2e3f4b7a-69b9-422a-a711-ada3081677e4',
      label: 'Settings',
      href: '/settings'
    },
    {
      icon: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/fb4c1d9f-3289-4fc2-aef1-61c6c8c1f3d1',
      label: 'Help & Support',
      href: '/support'
    },
    {
      icon: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/a8304bf6-9966-4a91-8832-a441af4a6182',
      label: 'Billing',
      href: '/billing'
    },
    {
      icon: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/ad135f7e-7921-4553-a317-decc77c6fc9c',
      label: 'Reports',
      href: '/reports'
    },
    {
      icon: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/fb167217-8bec-4273-9a1b-3327f136e90c',
      label: 'Analytics',
      href: '/analytics'
    }
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError('');

    try {
      const result = await logout();

      if (result.success) {
        // Close sidebar and show success feedback
        onClose();
        // You could add a toast notification here for success feedback
      } else {
        setLogoutError(result.error || 'Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      setLogoutError('An unexpected error occurred during logout.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      <div
        className={`fixed right-0 top-0 h-full w-[420px] bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col bg-gray-50">
          <div className="bg-white shadow-lg flex-1 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-800">Menu</h2>
              <button
                onClick={onClose}
                className="p-3 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                <img
                  src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/22ea65ae-9fd5-4521-afbe-7318181d6d08"
                  alt="Close"
                  className="w-5 h-5"
                />
              </button>
            </div>

            {isLoggedIn && user ? (
              <>
                <div className="p-6 border-b border-gray-200">
                  <div
                    className="flex items-center p-5 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    <div className="w-14 h-14 bg-green-800 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-lg">{user.name.split(' ').map(n => n[0]).join('')}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-medium text-gray-800">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    <img
                      src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/f5d4b17b-c1f1-46bf-a27f-b8c3660e648c"
                      alt="Dropdown"
                      className={`w-5 h-5 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {/* User Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="mt-4 space-y-2">
                      {/* Error Message */}
                      {logoutError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600">{logoutError}</p>
                        </div>
                      )}

                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                      </button>
                    </div>
                  )}
                </div>

                <nav className="flex-1 py-6">
                  {menuItems.map((item, index) => (
                    <MenuItem
                      key={item.href}
                      icon={item.icon}
                      label={item.label}
                      href={item.href}
                      isActive={location.pathname === item.href}
                      onClick={onClose}
                    />
                  ))}
                </nav>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-10">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Welcome to Flowo</h3>
                  <p className="text-base text-gray-600 mb-8 leading-relaxed">
                    Please log in with your Gmail address to access your dashboard and manage your account.
                  </p>
                  <div className="space-y-4">
                    <Button
                      to="/login"
                      className="w-full bg-green-800 hover:bg-green-900 text-white text-base py-3 px-6"
                      onClick={() => {
                        onClose();
                      }}
                    >
                      Log In
                    </Button>
                    <Button
                      variant="outline"
                      to="/register"
                      className="w-full text-base py-3 px-6"
                      onClick={() => {
                        onClose();
                      }}
                    >
                      Sign Up
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">© 2025 Flowo</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
