import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthCard from '@/components/auth/AuthCard';
import FormField from '@/components/auth/FormField';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const result = await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password
    });

    if (result.success) {
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => navigate('/'), 1500);
    } else {
      setError(result.error || 'Registration failed. Please try again.');
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
          Join Flowo today and discover the perfect flowers for every occasion.
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="First Name"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={(value) => handleChange('firstName', value)}
            required
          />
          <FormField
            label="Last Name"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChange={(value) => handleChange('lastName', value)}
            required
          />
        </div>

        <FormField
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          value={formData.email}
          onChange={(value) => handleChange('email', value)}
          required
        />

        <FormField
          label="Password"
          type="password"
          placeholder="Create a password (min. 6 characters)"
          value={formData.password}
          onChange={(value) => handleChange('password', value)}
          required
        />

        <FormField
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(value) => handleChange('confirmPassword', value)}
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
