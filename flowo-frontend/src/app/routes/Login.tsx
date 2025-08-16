import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthCard from "@/components/auth/AuthCard";
import FormField from "@/components/auth/FormField";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";

const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const validate = (): string | null => {
    if (!email.trim()) return "Email address is required.";
    if (!emailOk(email)) return "Please enter a valid email address.";
    if (!password.trim()) return "Password is required.";
    if (password.trim().length < 6) return "Password must be at least 6 characters long.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const v = validate();
    if (v) return setError(v);

    setSubmitting(true);
    try {
      const res = await login(email.trim(), password.trim());
      if (!res.success) {
        setError(res.error || "Invalid email or password. Please try again.");
        return;
      }
      navigate("/");
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard>
      <div className="text-center">
        <div className="w-16 h-16 bg-[#e8f5d8] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#2d5016]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <h1 className="text-[#2d5016] font-bold text-3xl mb-4">Welcome Back</h1>
        <p className="text-[#666666] text-lg leading-7 mb-8 text-center">
          Sign in to your account to continue exploring beautiful flowers.
        </p>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError("")} />}

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
            <input type="checkbox" className="mr-2" disabled={submitting} />
            <span className="text-sm text-[#666666]">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-[#2d5016] hover:underline">
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#2d5016] hover:bg-[#1e3a0f] text-white text-lg py-3 px-6 mb-6"
        >
          {submitting ? "Signing In..." : "Sign In"}
        </Button>

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
