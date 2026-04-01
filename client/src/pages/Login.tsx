// src/pages/Login.tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Validator } from '../utils/validators';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [rateLimit, setRateLimit] = useState(0);
  
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  // Rate limiting effect
  useEffect(() => {
    if (rateLimit > 0) {
      const timer = setTimeout(() => setRateLimit(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Rate limiting check
    if (rateLimit >= 5) {
      setError('Too many attempts. Please wait a moment before trying again.');
      return;
    }
    
    try {
      if (isRegistering) {
        // Validate registration data
        const validation = Validator.validateUserRegistration({ name, email, password });
        if (!validation.isValid) {
          setError(Object.values(validation.errors)[0]);
          return;
        }
        
        await register({ name, email, password });
      } else {
        // Validate login data
        const validation = Validator.validateLogin({ email, password });
        if (!validation.isValid) {
          setError(Object.values(validation.errors)[0]);
          return;
        }
        
        await login({ email, password });
      }
      
      navigate(from, { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setRateLimit(prev => prev + 1);
      console.error('Login/Register error:', errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegistering ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegistering ? 'Join UrbanNEST today' : 'Welcome back to UrbanNEST'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}
          
          {isRegistering && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="John Doe"
                disabled={loading}
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete={isRegistering ? 'email' : 'username'}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="••••••••"
              disabled={loading}
            />
            {isRegistering && (
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            )}
          </div>

          {!isRegistering && (
            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-500">
                Forgot your password?
              </Link>
            </div>
          )}

          <div>
            <Button
              type="submit"
              loading={loading}
              fullWidth
              disabled={rateLimit >= 5}
            >
              {isRegistering ? 'Sign up' : 'Sign in'}
            </Button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setRateLimit(0);
              }}
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
              disabled={loading}
            >
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {!isRegistering && (
            <div className="text-center text-sm text-gray-600">
              <span>By signing in, you agree to our </span>
              <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                Terms of Service
              </Link>
              <span> and </span>
              <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}