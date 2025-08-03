import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_CONFIG } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import AuthCard from '@/components/auth/AuthCard';
import FormField from '@/components/auth/FormField';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Form validation
  const validateForm = (): string | null => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      return 'Email address is required.';
    }

    if (!validateEmail(trimmedEmail)) {
      return 'Please enter a valid email address.';
    }

    if (!trimmedPassword) {
      return 'Password is required.';
    }

    if (trimmedPassword.length < 6) {
      return 'Password must be at least 6 characters long.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        }),
      });

      if (response.status === 200) {
        // Handle successful login
        const data = await response.json();
        
        // Extract and store session token from response.session.session_id
        let sessionToken = null;
        if (data.session && data.session.session_id) {
          sessionToken = data.session.session_id;
        } else if (data.token) {
          // Fallback to token field if session structure is different
          sessionToken = data.token;
        } else if (data.session_id) {
          // Another possible structure
          sessionToken = data.session_id;
        }

        if (sessionToken) {
          // Store the session token securely using AuthTokenManager
          localStorage.setItem('flowo_auth_token', sessionToken);
          
          // Also store any additional session data if needed
          if (data.session) {
            localStorage.setItem('flowo_session_data', JSON.stringify(data.session));
          }
        } else {
          console.warn('No session token found in login response');
        }

        // Store user information if provided
        if (data.user) {
          localStorage.setItem('flowo_user', JSON.stringify(data.user));
        } else if (data.email) {
          // Create user object from response data
          const userData = {
            id: data.id || '',
            email: data.email,
            firstName: data.firstName || data.first_name || '',
            lastName: data.lastName || data.last_name || '',
            createdAt: data.createdAt || data.created_at || new Date().toISOString()
          };
          localStorage.setItem('flowo_user', JSON.stringify(userData));
        }

        // Update auth state by calling checkAuth to refresh the context
        await checkAuth();

        // Navigate to dashboard or home page
        navigate('/');
      } else if (response.status === 400) {
        // Handle bad request
        try {
          const errorData = await response.json();
          setError(errorData.message || errorData.error || 'Invalid request. Please check your input.');
        } catch {
          setError('Invalid request. Please check your email and password.');
        }
      } else if (response.status === 401) {
        // Handle unauthorized (invalid credentials)
        try {
          const errorData = await response.json();
          setError(errorData.message || errorData.error || 'Invalid email or password. Please try again.');
        } catch {
          setError('Invalid email or password. Please try again.');
        }
      } else if (response.status === 422) {
        // Handle validation errors
        try {
          const errorData = await response.json();
          if (errorData.errors && Array.isArray(errorData.errors)) {
            setError(errorData.errors.join(', '));
          } else {
            setError(errorData.message || errorData.error || 'Validation failed. Please check your input.');
          }
        } catch {
          setError('Validation failed. Please check your input.');
        }
      } else if (response.status === 500) {
        // Handle server error
        setError('Server error. Please try again later.');
      } else {
        // Handle other status codes
        try {
          const errorData = await response.json();
          setError(errorData.message || errorData.error || 'An unexpected error occurred. Please try again.');
        } catch {
          setError('An unexpected error occurred. Please try again.');
        }
      }
    } catch (error) {
      // Handle network errors
      console.error('Network error:', error);
      setError('Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      <div className="text-center">
        {/* Icon Circle */}
        <div className="w-16 h-16 bg-[#e8f5d8] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#2d5016]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-[#2d5016] font-bold text-3xl mb-4">
          Welcome Back
        </h1>

        {/* Description */}
        <p className="text-[#666666] text-lg leading-7 mb-8 text-center">
          Sign in to your account to continue exploring beautiful flowers.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <ErrorMessage 
          message={error} 
          onClose={() => setError('')}
        />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <FormField
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={setEmail}
          required
        />

        <FormField
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
          required
        />

        <div className="flex justify-between items-center mb-6">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" />
            <span className="text-sm text-[#666666]">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-[#2d5016] hover:underline">
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#2d5016] hover:bg-[#1e3a0f] text-white text-lg py-3 px-6 mb-6"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        {/* Sign Up Link */}
        <div className="text-center">
          <span className="text-[#666666] text-sm">Don't have an account? </span>
          <Link to="/register" className="text-[#2d5016] font-medium text-sm hover:underline">
            Sign Up
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
