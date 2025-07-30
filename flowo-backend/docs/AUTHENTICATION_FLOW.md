# Authentication Flow Documentation

## Overview
The authentication system uses Firebase Authentication with session cookies for secure, HTTP-only authentication. This approach provides better security than storing tokens in localStorage and enables automatic authentication checking.

## Authentication Routes

### 1. Login Route: `POST /api/v1/auth/login`
**Purpose**: Authenticate user with email/password and establish a session

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Login successful",
  "session": {
    "session_id": "encrypted_session_cookie",
    "expires_at": 1627123456,
    "created_at": 1627037056
  }
}
```

**What it does**:
- Validates credentials with Firebase Authentication
- Creates a secure session cookie (5-day expiration)
- Sets HTTP-only, secure cookie named `session_id`
- Does NOT return ID tokens for security

### 2. Check Auth Route: `GET /api/v1/auth/check-auth`
**Purpose**: Verify current authentication status using session cookie

**Request**: No body required (uses session cookie)

**Response** (Authenticated - 200):
```json
{
  "authenticated": true,
  "user": {
    "uid": "firebase_user_id",
    "email": "user@example.com",
    "display_name": "User Name",
    "email_verified": true
  },
  "session": {
    "expires_at": 1627123456,
    "issued_at": 1627037056
  }
}
```

**Response** (Not Authenticated - 401):
```json
{
  "error": "unauthorized",
  "message": "No session found",
  "authenticated": false
}
```

**What it does**:
- Reads session cookie from request
- Verifies cookie with Firebase
- Returns user information if valid
- Clears invalid/expired cookies

### 3. Logout Route: `POST /api/v1/auth/logout`
**Purpose**: Clear session and logout user
**Authentication**: Required (session cookie or Bearer token)

**Request**: No body required (authentication via cookie or header)

**Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Response** (401 - if not authenticated):
```json
{
  "error": "unauthorized",
  "message": "Authentication required"
}
```

**What it does**:
- Verifies user is authenticated (via session cookie or Bearer token)
- Clears the session cookie
- Logs the logout event with user ID for audit purposes

### 4. Forgot Password Route: `POST /api/v1/auth/forgot-password`
**Purpose**: Send password reset email to user
**Authentication**: Not required (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password reset email sent successfully. Please check your inbox and follow the instructions.",
  "email": "user@example.com"
}
```

**Response** (400 - invalid email):
```json
{
  "error": "bad_request",
  "message": "Invalid email format"
}
```

**Response** (400 - missing email):
```json
{
  "error": "bad_request",
  "message": "Key: 'ForgotPasswordRequest.Email' Error:Field validation for 'Email' failed on the 'required' tag"
}
```

**What it does**:
- Validates email format
- Checks if user exists in Firebase
- Sends password reset email via Firebase
- Returns success message even for non-existent emails (security measure)
- Logs password reset requests for audit purposes

**Security Features**:
- Returns same success message whether user exists or not
- Prevents email enumeration attacks
- Uses Firebase's built-in password reset functionality
- Logs all attempts for monitoring

## Middleware Updates

### RequireAuth Middleware
Now supports both session cookies and Bearer tokens:
1. **First Priority**: Checks for `session_id` cookie
2. **Fallback**: Checks for `Authorization: Bearer <token>` header
3. **Sets Context**: Stores user info in Gin context for route handlers

### RequireSessionAuth Middleware
Specifically for session-only authentication:
- Only accepts session cookies
- More restrictive than RequireAuth
- Use for routes that should only work with session cookies

### OptionalAuth Middleware
Updated to check both authentication methods:
- Non-blocking authentication check
- Sets user context if authenticated
- Continues execution if not authenticated

## Frontend Integration

### Login Flow
```javascript
// Login request
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important: includes cookies
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

if (response.ok) {
  // Session cookie is automatically set
  // No need to handle tokens manually
  console.log('Login successful');
}
```

### Check Authentication Status
```javascript
// Check if user is authenticated
const response = await fetch('/api/v1/auth/check-auth', {
  method: 'GET',
  credentials: 'include', // Important: includes cookies
});

if (response.ok) {
  const data = await response.json();
  if (data.authenticated) {
    // User is authenticated
    console.log('User:', data.user);
  }
} else {
  // User is not authenticated
  console.log('User not authenticated');
}
```

### Logout
```javascript
// Logout user
const response = await fetch('/api/v1/auth/logout', {
  method: 'POST',
  credentials: 'include', // Important: includes cookies
});

if (response.ok) {
  // User logged out, cookie cleared
  console.log('Logged out successfully');
}
```

### Making Authenticated Requests
```javascript
// Any API request to protected routes
const response = await fetch('/api/v1/protected-route', {
  method: 'GET',
  credentials: 'include', // Important: includes cookies
});

// No need to manually add Authorization headers
// Session cookie is automatically included
```

## Security Features

1. **HTTP-Only Cookies**: Prevents XSS attacks by making cookies inaccessible to JavaScript
2. **Secure Cookies**: Cookies are only sent over HTTPS in production
3. **SameSite Protection**: Prevents CSRF attacks
4. **Automatic Expiration**: Sessions expire after 5 days
5. **Token Validation**: All requests verify session validity with Firebase
6. **Cookie Clearing**: Invalid/expired cookies are automatically cleared

## Configuration Notes

### Development vs Production
- **Development**: `secure` flag set to `false` for HTTP testing
- **Production**: `secure` flag should be `true` for HTTPS only

### CORS Configuration
Ensure your frontend domain is properly configured in CORS settings with:
```go
AllowCredentials: true
```

## Migration from Token-Based Auth

If migrating from localStorage/Bearer token authentication:

1. **Remove token storage**: No need to store tokens in localStorage
2. **Add credentials: 'include'**: Add to all fetch requests
3. **Remove Authorization headers**: Session cookies handle authentication
4. **Use check-auth endpoint**: Instead of local token validation
5. **Handle 401 responses**: Redirect to login when session expires

## Error Handling

Common scenarios and responses:

- **No session cookie**: 401 with "No session found"
- **Invalid/expired session**: 401 with "Invalid or expired session" + cookie cleared
- **Server error**: 500 with appropriate error message
- **Invalid credentials**: 401 with "Invalid email or password"

## Best Practices

1. **Always use credentials: 'include'** in frontend requests
2. **Check authentication status** on app initialization
3. **Handle 401 responses** by redirecting to login
4. **Use check-auth endpoint** for authentication state management
5. **Implement proper error handling** for network failures
6. **Consider implementing refresh mechanism** for long-running applications
