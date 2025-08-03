import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  logout: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface StoredUser extends User {
  password: string;
}

// Mock Database
class MockDatabase {
  private users: StoredUser[] = [
    {
      id: '1',
      email: 'john.doe@email.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'password123',
      createdAt: new Date('2024-01-01')
    }
  ];

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async createUser(userData: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Check if user already exists
    const existingUser = await this.findUserByEmail(userData.email);
    if (existingUser) {
      return { success: false, error: 'An account with this email already exists' };
    }

    // Create new user
    const newUser: StoredUser = {
      id: Date.now().toString(),
      email: userData.email.toLowerCase(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: userData.password,
      createdAt: new Date()
    };

    this.users.push(newUser);

    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return { success: true, user: userWithoutPassword };
  }

  async validateCredentials(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = await this.findUserByEmail(email);
    if (!user) {
      return { success: false, error: 'No account found with this email address' };
    }

    if (user.password !== password) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
  }
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
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  static sanitizeEmail(email: string): string {
    const sanitized = this.sanitizeString(email).toLowerCase();
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(sanitized) ? sanitized : '';
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
    const nameRegex = /^[\p{L}\s\-']+$/u;
    
    if (!nameRegex.test(sanitized)) {
    return {
        isValid: false,
        error: 'Name can only contain letters (from any language), spaces, hyphens, and apostrophes'
    };
    }

    return { isValid: true };
  }
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock Database Instance
const mockDB = new MockDatabase();

// AuthProvider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('flowo_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('flowo_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Sanitize inputs
      const sanitizedEmail = InputSanitizer.sanitizeEmail(email);
      if (!sanitizedEmail) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      const passwordValidation = InputSanitizer.validatePassword(password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error };
      }

      // Validate credentials
      const result = await mockDB.validateCredentials(sanitizedEmail, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        localStorage.setItem('flowo_user', JSON.stringify(result.user));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    } finally {
      setIsLoading(false);
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
      const sanitizedUserData: RegisterData = {
        email: sanitizedEmail,
        firstName: InputSanitizer.sanitizeString(userData.firstName),
        lastName: InputSanitizer.sanitizeString(userData.lastName),
        password: userData.password
      };

      // Create user
      const result = await mockDB.createUser(sanitizedUserData);
      
      if (result.success && result.user) {
        setUser(result.user);
        localStorage.setItem('flowo_user', JSON.stringify(result.user));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('flowo_user');
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const sanitizedEmail = InputSanitizer.sanitizeEmail(email);
      if (!sanitizedEmail) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      // Check if user exists
      const user = await mockDB.findUserByEmail(sanitizedEmail);
      if (!user) {
        return { success: false, error: 'No account found with this email address' };
      }

      // Simulate sending reset email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'An unexpected error occurred. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    resetPassword
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
