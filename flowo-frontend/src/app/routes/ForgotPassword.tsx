import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthCard from '@/components/auth/AuthCard';
import FormField from '@/components/auth/FormField';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { resetPassword, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const result = await resetPassword(email);

    if (result.success) {
      setSuccess('Reset instructions have been sent to your email address.');
    } else {
      setError(result.error || 'Failed to send reset instructions. Please try again.');
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
          onChange={setEmail}
          required
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#2d5016] hover:bg-[#1e3a0f] text-white text-lg py-3 px-6 mb-6"
        >
          {isLoading ? 'Sending...' : 'Send Reset Instructions'}
        </Button>

        {/* Back to Sign In Link */}
        <div className="text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center text-[#2d5016] font-medium text-sm hover:underline"
          >
            <img 
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/b50799a4-b55c-467d-9a1b-1d012a72d550" 
              alt="Back arrow" 
              className="w-4 h-4 mr-2"
            />
            Back to Sign In
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
