// components/Auth/SignupForm.jsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthForm } from '../Hooks/useAuth';

const SignupForm = ({ onToggleMode, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const router = useRouter();
  const { loading, error, handleEmailSignUp, handleGoogleSignIn } = useAuthForm();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Call handleEmailSignUp with the correct parameters
    const result = await handleEmailSignUp(
      formData.firstName,
      formData.lastName,
      formData.email, 
      formData.password, 
      formData.confirmPassword
    );
    
    if (result.success) {
      // Close modal and redirect to home
      onClose();
      router.push('/');
    }
  };

  const handleGoogleSignUp = async () => {
    const result = await handleGoogleSignIn();
    if (result.success) {
      // Close modal and redirect to home
      onClose();
      router.push('/');
    }
  };

  return (
    <div className="auth-form">
      <h2>Create Account</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter your first name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter your last name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
            disabled={loading}
            placeholder="Enter your password"
          />
          <small>Password must be at least 6 characters</small>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Confirm your password"
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-full"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-divider">
        <span>OR</span>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignUp}
        className="btn btn-google btn-full"
        disabled={loading}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign up with Google
      </button>

      <div className="auth-switch">
        <p>
          Already have an account?{' '}
          <button 
            type="button" 
            onClick={onToggleMode}
            className="link-button"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;