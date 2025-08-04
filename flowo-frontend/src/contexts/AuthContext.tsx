import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { API_CONFIG } from '@/config/api';

// Types
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Input Sanitization Utilities
class InputSanitizer {
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      // Remove XML/HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove XML entities
      .replace(/&[#\w]+;/g, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove control characters except newlines and tabs
      .replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, '');
  }

  static sanitizeEmail(email: string): string {
    const sanitized = this.sanitizeString(email).toLowerCase();
    // Enhanced email format validation with Gmail support
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(sanitized) ? sanitized : '';
  }

  static isGmailAddress(email: string): boolean {
    const sanitized = this.sanitizeEmail(email);
    return sanitized.endsWith('@gmail.com');
  }

  static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password || password.length < 6) {
      return { isValid: false, error: 'Password must be at least 6 characters long' };
    }
    if (password.length > 128) {
      return { isValid: false, error: 'Password must be less than 128 characters' };
    }
    return { isValid: true };
  }

  static validateName(name: string): { isValid: boolean; error?: string } {
    const sanitized = this.sanitizeString(name);
    if (!sanitized || sanitized.length < 1) {
      return { isValid: false, error: 'Name is required' };
    }
    if (sanitized.length > 50) {
      return { isValid: false, error: 'Name must be less than 50 characters' };
    }
    const nameRegex = /^[\\p{L}\\s\-']+$/u;

    if (!nameRegex.test(sanitized)) {
      return {
        isValid: false,
        error: "Name can only contain letters (from any language), spaces, hyphens, and apostrophes"
      };
    }

    return { isValid: true };
  }
}

// Enhanced Auth Token Management
class AuthTokenManager {
  private static readonly TOKEN_KEY = 'flowo_auth_token';
  private static readonly USER_KEY = 'flowo_user';
  private static readonly SESSION_KEY = 'flowo_session_data';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static getStoredUser(): User | null {
    try {
      const storedUser = localStorage.getItem(this.USER_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  }

  static setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  static getSessionData(): any | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch {
      return null;
    }
  }

  static setSessionData(sessionData: any): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
  }

  static removeSessionData(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  static clearAll(): void {
    this.removeToken();
    this.removeUser();
    this.removeSessionData();
  }
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status - wrapped in useCallback to prevent recreation
  const checkAuth = useCallback(async (): Promise<void> => {
    try {
      const token = AuthTokenManager.getToken();
      if (!token) {
        // No token found, check if we have stored user data
        const storedUser = AuthTokenManager.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        }
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/auth/check-auth`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          // 'Authorization': `Bearer ${token}`,
          
          // Alternative header formats if your API expects different format:
          // 'Session-ID': token,
          // 'X-Session-Token': token,
        },
        credentials: "include",
      });

      if (response.status === 200) {
        const data = await response.json();
        
        // Extract user data from response
        let userData: User | null = null;
        
        if (data.user && data.user.email) {
          // User data is nested in response.user
          userData = {
            id: data.user.id || '',
            email: data.user.email,
            firstName: data.user.firstName || data.user.first_name || '',
            lastName: data.user.lastName || data.user.last_name || '',
            createdAt: data.user.createdAt ? new Date(data.user.createdAt) : new Date()
          };
        } else if (data.email) {
          // User data is at root level
          userData = {
            id: data.id || '',
            email: data.email,
            firstName: data.firstName || data.first_name || '',
            lastName: data.lastName || data.last_name || '',
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
          };
        }

        if (userData) {
          setUser(userData);
          AuthTokenManager.setUser(userData);
          
          // Store any updated session data
          if (data.session) {
            AuthTokenManager.setSessionData(data.session);
          }
        } else {
          console.error('Invalid user data received from check-auth');
          AuthTokenManager.clearAll();
          setUser(null);
        }
      } else if (response.status === 401) {
        // Token is invalid or expired
        console.log('Authentication token is invalid or expired');
        AuthTokenManager.clearAll();
        setUser(null);
      } else {
        console.error('Auth check failed with status:', response.status);
        // On other errors, try to use stored user data
        const storedUser = AuthTokenManager.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // On network error, try to use stored user data
      const storedUser = AuthTokenManager.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array since it doesn't depend on state

  // Initialize auth state on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]); // Now properly depends on checkAuth

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Don't set loading here to avoid conflicts with checkAuth
      // setIsLoading(true);

      // Sanitize inputs
      const sanitizedEmail = InputSanitizer.sanitizeEmail(email);
      if (!sanitizedEmail) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      // Optional: Validate Gmail address if required
      // if (!InputSanitizer.isGmailAddress(sanitizedEmail)) {
      //   return { success: false, error: 'Please use a Gmail address to sign in' };
      // }

      const passwordValidation = InputSanitizer.validatePassword(password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error };
      }

      // Make login request
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: sanitizedEmail,
          password: password.trim()
        }),
        credentials: 'include'
      });

      if (response.status === 200) {
        const data = await response.json();
        
        // Store authentication token
        if (data.token) {
          AuthTokenManager.setToken(data.token);
        }
        
        // Extract and store user data
        let userData: User | null = null;
        
        if (data.user && data.user.email) {
          // User data is nested in response.user
          userData = {
            id: data.user.id || '',
            email: data.user.email,
            firstName: data.user.firstName || '',
            lastName: data.user.lastName || '',
            createdAt: data.user.createdAt ? new Date(data.user.createdAt) : new Date()
          };
        } else if (data.email) {
          // User data is at root level
          userData = {
            id: data.id || '',
            email: data.email,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
          };
        }

        if (userData) {
          setUser(userData);
          AuthTokenManager.setUser(userData);
        } else {
          return { success: false, error: 'Invalid response from server. Please try again.' };
        }

        return { success: true };
      } else if (response.status === 400) {
        try {
          const errorData = await response.json();
          return { success: false, error: errorData.message || 'Invalid request. Please check your input.' };
        } catch {
          return { success: false, error: 'Invalid request. Please check your email and password.' };
        }
      } else if (response.status === 401) {
        try {
          const errorData = await response.json();
          return { success: false, error: errorData.message || 'Invalid email or password. Please try again.' };
        } catch {
          return { success: false, error: 'Invalid email or password. Please try again.' };
        }
      } else if (response.status === 500) {
        return { success: false, error: 'Server error. Please try again later.' };
      } else {
        return { success: false, error: 'An unexpected error occurred. Please try again.' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Unable to connect to the server. Please check your internet connection and try again.' };
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Sanitize and validate inputs
      const sanitizedEmail = InputSanitizer.sanitizeEmail(userData.email);
      if (!sanitizedEmail) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      // Optional: Validate Gmail address if required
      // if (!InputSanitizer.isGmailAddress(sanitizedEmail)) {
      //   return { success: false, error: 'Please use a Gmail address to register' };
      // }

      const firstNameValidation = InputSanitizer.validateName(userData.firstName);
      if (!firstNameValidation.isValid) {
        return { success: false, error: `First name: ${firstNameValidation.error}` };
      }

      const lastNameValidation = InputSanitizer.validateName(userData.lastName);
      if (!lastNameValidation.isValid) {
        return { success: false, error: `Last name: ${lastNameValidation.error}` };
      }

      const passwordValidation = InputSanitizer.validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error };
      }

      // Create sanitized user data
      const sanitizedUserData = {
        email: sanitizedEmail,
        firstName: InputSanitizer.sanitizeString(userData.firstName),
        lastName: InputSanitizer.sanitizeString(userData.lastName),
        password: userData.password.trim()
      };

      // Make registration request
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedUserData),
      });

      if (response.status === 200 || response.status === 201) {
        const data = await response.json();
        
        // Store authentication token if provided
        if (data.token) {
          AuthTokenManager.setToken(data.token);
        }
        
        // Extract and store user data
        let newUser: User | null = null;
        
        if (data.user && data.user.email) {
          // User data is nested in response.user
          newUser = {
            id: data.user.id || '',
            email: data.user.email,
            firstName: data.user.firstName || '',
            lastName: data.user.lastName || '',
            createdAt: data.user.createdAt ? new Date(data.user.createdAt) : new Date()
          };
        } else if (data.email) {
          // User data is at root level
          newUser = {
            id: data.id || '',
            email: data.email,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
          };
        }

        if (newUser) {
          setUser(newUser);
          AuthTokenManager.setUser(newUser);
        }

        return { success: true };
      } else if (response.status === 400) {
        try {
          const errorData = await response.json();
          return { success: false, error: errorData.message || 'Invalid request. Please check your input.' };
        } catch {
          return { success: false, error: 'Invalid request. Please check your information.' };
        }
      } else if (response.status === 409) {
        return { success: false, error: 'An account with this email already exists.' };
      } else if (response.status === 500) {
        return { success: false, error: 'Server error. Please try again later.' };
      } else {
        return { success: false, error: 'An unexpected error occurred. Please try again.' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Unable to connect to the server. Please check your internet connection and try again.' };
    }
  };

  const logout = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const token = AuthTokenManager.getToken();

      // Make logout request to backend
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include'
      });

      if (response.status === 200) {
        // Clear auth state and stored data
        setUser(null);
        AuthTokenManager.clearAll();
        return { success: true };
      } else if (response.status === 401) {
        // Token is invalid or expired, still clear local state
        setUser(null);
        AuthTokenManager.clearAll();
        return { success: true }; // Treat as successful logout
      } else if (response.status === 500) {
        return { success: false, error: 'Server error during logout. Please try again.' };
      } else {
        return { success: false, error: 'An unexpected error occurred during logout.' };
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, clear local state
      setUser(null);
      AuthTokenManager.clearAll();
      return { success: false, error: 'Unable to connect to the server. You have been logged out locally.' };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const sanitizedEmail = InputSanitizer.sanitizeEmail(email);
      if (!sanitizedEmail) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      // Make password reset request
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: sanitizedEmail }),
      });

      if (response.status === 200) {
        return { success: true };
      } else if (response.status === 400) {
        try {
          const errorData = await response.json();
          return { success: false, error: errorData.message || 'Invalid request. Please check your email address.' };
        } catch {
          return { success: false, error: 'Invalid request. Please check your email address.' };
        }
      } else if (response.status === 404) {
        return { success: false, error: 'No account found with this email address.' };
      } else if (response.status === 500) {
        return { success: false, error: 'Server error. Please try again later.' };
      } else {
        return { success: false, error: 'An unexpected error occurred. Please try again.' };
      }
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'Unable to connect to the server. Please check your internet connection and try again.' };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    resetPassword,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { User, RegisterData };
