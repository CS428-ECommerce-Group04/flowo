// Session management utilities

export interface SessionData {
  sessionId: string;
  expiresAt: number;
  createdAt: number;
}

export interface UserData {
  uid: string;
  email: string;
  display_name: string;
  phone_number: string;
  disabled: boolean;
  created_at: number;
}

export class SessionManager {
  private static readonly AUTH_TOKEN_KEY = 'auth_token';
  private static readonly SESSION_ID_KEY = 'session_id';
  private static readonly SESSION_EXPIRES_KEY = 'session_expires';
  private static readonly USER_DATA_KEY = 'user_data';

  // Save session data to localStorage
  static saveSession(token: string, sessionData: SessionData, userData: UserData): void {
    if (typeof window === 'undefined') return; // Server-side check

    localStorage.setItem(this.AUTH_TOKEN_KEY, token);
    localStorage.setItem(this.SESSION_ID_KEY, sessionData.sessionId);
    localStorage.setItem(this.SESSION_EXPIRES_KEY, sessionData.expiresAt.toString());
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
  }

  // Get session data from localStorage
  static getSession(): {
    token: string | null;
    sessionData: SessionData | null;
    userData: UserData | null;
  } {
    if (typeof window === 'undefined') {
      return { token: null, sessionData: null, userData: null };
    }

    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const sessionId = localStorage.getItem(this.SESSION_ID_KEY);
    const expiresAt = localStorage.getItem(this.SESSION_EXPIRES_KEY);
    const userDataStr = localStorage.getItem(this.USER_DATA_KEY);

    if (!token || !sessionId || !expiresAt || !userDataStr) {
      return { token: null, sessionData: null, userData: null };
    }

    try {
      const sessionData: SessionData = {
        sessionId,
        expiresAt: parseInt(expiresAt),
        createdAt: Date.now() / 1000, // Current time as fallback
      };

      const userData: UserData = JSON.parse(userDataStr);

      return { token, sessionData, userData };
    } catch (error) {
      console.error('Error parsing session data:', error);
      return { token: null, sessionData: null, userData: null };
    }
  }

  // Check if session is valid
  static isSessionValid(): boolean {
    const { sessionData } = this.getSession();
    if (!sessionData) return false;

    const currentTime = Date.now() / 1000;
    return currentTime < sessionData.expiresAt;
  }

  // Clear session data
  static clearSession(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.SESSION_ID_KEY);
    localStorage.removeItem(this.SESSION_EXPIRES_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
  }

  // Get auth token for API requests
  static getAuthToken(): string | null {
    const { token } = this.getSession();
    return this.isSessionValid() ? token : null;
  }

  // Get user data
  static getUserData(): UserData | null {
    const { userData } = this.getSession();
    return this.isSessionValid() ? userData : null;
  }

  // Get session info
  static getSessionInfo(): SessionData | null {
    const { sessionData } = this.getSession();
    return this.isSessionValid() ? sessionData : null;
  }

  // Auto-refresh token if needed (implement based on your requirements)
  static async refreshTokenIfNeeded(): Promise<boolean> {
    if (this.isSessionValid()) return true;

    // Implement token refresh logic here if needed
    // For now, just clear invalid session
    this.clearSession();
    return false;
  }
}

// Export utility functions
export const saveSession = SessionManager.saveSession;
export const getSession = SessionManager.getSession;
export const isSessionValid = SessionManager.isSessionValid;
export const clearSession = SessionManager.clearSession;
export const getAuthToken = SessionManager.getAuthToken;
export const getUserData = SessionManager.getUserData;
export const getSessionInfo = SessionManager.getSessionInfo;
export const refreshTokenIfNeeded = SessionManager.refreshTokenIfNeeded;
