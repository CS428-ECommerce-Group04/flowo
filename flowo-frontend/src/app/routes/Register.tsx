import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '@/components/auth/AuthCard';
import FormField from '@/components/auth/FormField';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { API_CONFIG } from '@/config/api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleChange = (value: string) => {
    setEmail(value);
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side email validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email address is required.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail
        }),
        credentials: 'include'
      });

      if (response.status === 200) {
        setSuccess('Account created successfully! Check your email for further instructions.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (response.status === 400) {
        // Handle client error (bad request)
        try {
          const errorData = await response.json();
          setError(errorData.message || 'Invalid request. Please check your email address.');
        } catch {
          setError('Invalid request. Please check your email address.');
        }
      } else if (response.status === 500) {
        // Handle server error
        setError('Server error. Please try again later.');
      } else {
        // Handle other status codes
        setError('An unexpected error occurred. Please try again.');
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-[#2d5016] font-bold text-3xl mb-4">
          Create Account
        </h1>

        {/* Description */}
        <p className="text-[#666666] text-lg leading-7 mb-8 text-center">
          Join Flowo today and discover the perfect flowers for every occasion. Enter your email to get started.
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

        <div className="mb-6">
          <label className="flex items-start">
            <input type="checkbox" className="mr-2 mt-1" required />
            <span className="text-sm text-[#666666]">
              I agree to the <Link to="/terms" className="text-[#2d5016] hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-[#2d5016] hover:underline">Privacy Policy</Link>
            </span>
          </label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#2d5016] hover:bg-[#1e3a0f] text-white text-lg py-3 px-6 mb-6"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>

        {/* Sign In Link */}
        <div className="text-center">
          <span className="text-[#666666] text-sm">Already have an account? </span>
          <Link to="/login" className="text-[#2d5016] font-medium text-sm hover:underline">
            Sign In
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
