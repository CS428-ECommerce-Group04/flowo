import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_CONFIG } from '@/config/api';
import AuthCard from '@/components/auth/AuthCard';
import FormField from '@/components/auth/FormField';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Form validation
  const validateForm = (): string | null => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return 'Email address is required.';
    }

    if (!validateEmail(trimmedEmail)) {
      return 'Please enter a valid email address.';
    }

    return null;
  };

  const handleChange = (value: string) => {
    setEmail(value);
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim()
        }),
      });

      if (response.status === 200) {
        // Handle successful request
        const data = await response.json();
        setSuccess(
          data.message || 
          'Password reset instructions have been sent to your email address. Please check your inbox and follow the instructions to reset your password.'
        );

        // Clear the email field on success
        setEmail('');
      } else if (response.status === 400) {
        // Handle bad request
        try {
          const errorData = await response.json();
          setError(
            errorData.message || 
            errorData.error || 
            'Invalid request. Please check your email address and try again.'
          );
        } catch {
          setError('Invalid request. Please check your email address and try again.');
        }
      } else if (response.status === 404) {
        // Handle user not found
        try {
          const errorData = await response.json();
          setError(
            errorData.message || 
            errorData.error || 
            'No account found with this email address. Please check your email or create a new account.'
          );
        } catch {
          setError('No account found with this email address. Please check your email or create a new account.');
        }
      } else if (response.status === 422) {
        // Handle validation errors
        try {
          const errorData = await response.json();
          if (errorData.errors && Array.isArray(errorData.errors)) {
            setError(errorData.errors.join(', '));
          } else {
            setError(
              errorData.message || 
              errorData.error || 
              'Validation failed. Please check your email address format.'
            );
          }
        } catch {
          setError('Validation failed. Please check your email address format.');
        }
      } else if (response.status === 429) {
        // Handle rate limiting
        try {
          const errorData = await response.json();
          setError(
            errorData.message || 
            errorData.error || 
            'Too many requests. Please wait a few minutes before trying again.'
          );
        } catch {
          setError('Too many requests. Please wait a few minutes before trying again.');
        }
      } else if (response.status === 500) {
        // Handle server error
        try {
          const errorData = await response.json();
          setError(
            errorData.message || 
            errorData.error || 
            'Server error. Please try again later.'
          );
        } catch {
          setError('Server error. Please try again later.');
        }
      } else {
        // Handle other status codes
        try {
          const errorData = await response.json();
          setError(
            errorData.message || 
            errorData.error || 
            'An unexpected error occurred. Please try again.'
          );
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
          <img 
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/836423d3-1dde-479b-9fcf-07e516fd15a5" 
            alt="Key icon" 
            className="w-8 h-8"
          />
        </div>

        {/* Heading */}
        <h1 className="text-[#2d5016] font-bold text-3xl mb-4">
          Forgot Password?
        </h1>

        {/* Description */}
        <p className="text-[#666666] text-lg leading-7 mb-8 text-center">
          No worries! Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <ErrorMessage 
          message={error} 
          onClose={() => setError('')}
        />
      )}
      {success && (
        <ErrorMessage 
          message={success} 
          type="success"
          onClose={() => setSuccess('')}
        />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <FormField
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={handleChange}
          required
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#2d5016] hover:bg-[#1e3a0f] text-white text-lg py-3 px-6 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending Instructions...' : 'Send Reset Instructions'}
        </Button>

        {/* Additional Information */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-green-700">
                <p className="font-medium mb-1">Check your email</p>
                <p>If you don't see the email in your inbox, please check your spam folder. The reset link will expire in 24 hours.</p>
              </div>
            </div>
          </div>
        )}

        {/* Back to Sign In Link */}
        <div className="text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center text-[#2d5016] font-medium text-sm hover:underline transition-colors duration-200"
          >
            <img 
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/b50799a4-b55c-467d-9a1b-1d012a72d550" 
              alt="Back arrow" 
              className="w-4 h-4 mr-2"
            />
            Back to Sign In
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-[#666666] mb-2">
            Still having trouble?
          </p>
          <Link 
            to="/support" 
            className="text-sm text-[#2d5016] hover:underline font-medium"
          >
            Contact Support
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
