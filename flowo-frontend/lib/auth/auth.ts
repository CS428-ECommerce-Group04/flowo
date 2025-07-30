// Authentication utilities for session cookie based auth

export interface AuthUser {
  uid: string;
  email: string;
  display_name: string;
  email_verified: boolean;
}

export interface AuthSession {
  expires_at: number;
  issued_at: number;
}

export interface AuthResponse {
  authenticated: boolean;
  user?: AuthUser;
  session?: AuthSession;
}

/**
 * Check authentication status using session cookie
 * This calls the backend /check-auth endpoint which verifies the session cookie
 */
export async function checkAuth(): Promise<AuthResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8081'}/api/v1/auth/check-auth`, {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok && data.authenticated) {
      return {
        authenticated: true,
        user: data.user,
        session: data.session,
      };
    } else {
      return {
        authenticated: false,
      };
    }
  } catch (error) {
    console.error('Error checking authentication:', error);
    return {
      authenticated: false,
    };
  }
}

/**
 * Logout user by calling backend logout endpoint
 */
export async function logout(): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8081'}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return response.ok && data.success;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
}

/**
 * Make authenticated API request with automatic session cookie handling
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const defaultOptions: RequestInit = {
    credentials: 'include', // Always include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, defaultOptions);
  
  // If we get a 401, the session might be expired
  if (response.status === 401) {
    // Optionally redirect to login or handle session expiry
    console.warn('Session expired or unauthorized');
  }
  
  return response;
}
