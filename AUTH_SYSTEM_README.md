# Authentication System Documentation

## Overview

This document describes the authentication system implemented for the Flowo e-commerce application. The system uses Firebase Authentication with a custom backend for session management.

## Architecture

### Backend (Go + Firebase Admin SDK)
- **Location**: `flowo-backend/internal/controller/auth_controller.go`
- **Framework**: Gin (Go web framework)
- **Authentication**: Firebase Admin SDK
- **Session Management**: Custom session tokens with expiration

### Frontend (Next.js + Firebase Client SDK)
- **Location**: `flowo-frontend/app/auth/`
- **Framework**: Next.js 14 with TypeScript
- **Authentication**: Firebase Client SDK
- **Styling**: Tailwind CSS
- **Session Management**: Custom SessionManager utility

## API Endpoints

### 1. Signup Endpoint
- **URL**: `POST /api/v1/auth/signup`
- **Purpose**: Create a new user account
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Account created successfully. Verification email will be sent.",
    "email": "user@example.com",
    "password": "temporary_generated_password"
  }
  ```

### 2. Login Endpoint
- **URL**: `POST /api/v1/auth/login`
- **Purpose**: Authenticate user and create session
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "user_password"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "user": {
      "uid": "firebase_user_id",
      "email": "user@example.com",
      "display_name": "User Name",
      "phone_number": "+1234567890",
      "disabled": false,
      "created_at": 1640995200
    },
    "token": "firebase_custom_token",
    "session": {
      "session_id": "unique_session_id",
      "expires_at": 1641081600,
      "created_at": 1640995200
    }
  }
  ```

### 3. Token Verification Endpoint
- **URL**: `POST /api/v1/auth/verify`
- **Purpose**: Verify Firebase ID token
- **Request Body**:
  ```json
  {
    "token": "firebase_id_token"
  }
  ```

## Frontend Components

### 1. Login Page
- **Location**: `flowo-frontend/app/auth/login/page.tsx`
- **Features**:
  - Email and password input fields
  - Form validation
  - Loading states with spinner
  - Error and success message display
  - Link to signup and forgot password pages
  - Responsive design with Tailwind CSS

### 2. Signup Page
- **Location**: `flowo-frontend/app/auth/signup/page.tsx`
- **Features**:
  - Email input field
  - Automatic password generation via backend
  - Email verification flow
  - Link to login page

### 3. Dashboard Page
- **Location**: `flowo-frontend/app/dashboard/page.tsx`
- **Features**:
  - Protected route (requires authentication)
  - User profile display
  - Session information
  - Logout functionality

## Session Management

### SessionManager Utility
- **Location**: `flowo-frontend/lib/auth/session.ts`
- **Features**:
  - Store session data in localStorage
  - Validate session expiration
  - Clear session data on logout
  - Auto-refresh tokens (if needed)

### Key Methods:
```typescript
// Save session data
SessionManager.saveSession(token, sessionData, userData);

// Check if session is valid
SessionManager.isSessionValid();

// Get current user data
SessionManager.getUserData();

// Clear session (logout)
SessionManager.clearSession();

// Get auth token for API requests
SessionManager.getAuthToken();
```

## Authentication Flow

### Signup Flow
1. User enters email on signup page
2. Frontend sends request to backend `/api/v1/auth/signup`
3. Backend validates email and creates Firebase user with temporary password
4. Backend returns success with temporary password
5. Frontend uses temporary password to sign in with Firebase
6. Frontend sends password reset email for user to set their own password

### Login Flow
1. User enters email and password on login page
2. Frontend sends credentials to backend `/api/v1/auth/login`
3. Backend validates user existence and generates custom token
4. Backend creates session and returns user data, token, and session info
5. Frontend uses custom token to authenticate with Firebase
6. Frontend stores session data using SessionManager
7. User is redirected to dashboard

### Protected Route Access
1. Page component checks session validity using SessionManager
2. If session is invalid, user is redirected to login page
3. If session is valid, user data is loaded and page is rendered

## Security Features

### Backend Security
- Email validation with regex patterns
- Secure password generation using crypto/rand
- Session ID generation with timestamp and hashing
- User account status checking (disabled/enabled)
- Comprehensive error handling and logging

### Frontend Security
- Client-side session validation
- Automatic token refresh handling
- Secure localStorage management
- Protected route guards
- CSRF protection through Firebase tokens

## Configuration

### Environment Variables
Make sure these are set in your environment:

#### Backend
- Firebase Admin SDK configuration (private_key.json)
- Server port configuration

#### Frontend
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8081
```

### Firebase Configuration
- **Location**: `flowo-frontend/lib/auth/firebase.ts`
- Contains Firebase client configuration
- Ensure API keys and project settings are correct

## Usage Examples

### Making Authenticated API Requests
```typescript
import { SessionManager } from '../lib/auth/session';

const makeAuthenticatedRequest = async () => {
  const token = SessionManager.getAuthToken();
  
  if (!token) {
    // Redirect to login
    return;
  }

  const response = await fetch('/api/protected-endpoint', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};
```

### Protecting a Page Component
```typescript
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionManager } from '../lib/auth/session';

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    if (!SessionManager.isSessionValid()) {
      router.push('/auth/login');
    }
  }, []);

  // Rest of component...
}
```

## Testing

### Backend Testing
```bash
cd flowo-backend

# Test signup
curl -X POST http://localhost:8081/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test login (use password from signup response)
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"generated_password"}'
```

### Frontend Testing
1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000/auth/login`
3. Test the complete flow: signup → login → dashboard

## Troubleshooting

### Common Issues
1. **Firebase Configuration**: Ensure Firebase config is correct in both client and admin SDK
2. **CORS Issues**: Make sure backend allows frontend origin
3. **Session Expiration**: Check that session times are correctly configured
4. **Token Validation**: Verify that Firebase tokens are being passed correctly

### Error Messages
- `"Invalid email format"`: Email doesn't match validation regex
- `"User with this email already exists"`: Attempt to signup with existing email
- `"Invalid or expired token"`: Firebase token is invalid or expired
- `"Account disabled"`: User account has been disabled

## Future Enhancements

1. **Password Strength Validation**: Add client-side password strength checking
2. **Two-Factor Authentication**: Implement 2FA using Firebase
3. **Social Login**: Add Google/Facebook login options
4. **Session Management**: Add refresh token rotation
5. **Audit Logging**: Track user authentication events
6. **Rate Limiting**: Implement login attempt rate limiting
