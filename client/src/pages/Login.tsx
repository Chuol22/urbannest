import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rateLimit, setRateLimit] = useState(0);

  const { login, loading } = useAuth();
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

    // Validate login data
    if (!email.trim()) {
      setError('Email or phone number is required');
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    try {
      const loggedUser = await login({ email: email.trim(), password });
      if (loggedUser?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setRateLimit(prev => prev + 1);
      console.error('Login error:', errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-gray-900">
      {/* Left branding panel */}
      <div className="md:w-1/2 bg-gradient-to-br from-blue-900 to-slate-900 flex flex-col justify-between p-8 md:p-12 text-white animate-fadeIn">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-2xl text-white shadow-lg">
            U
          </div>
          <span className="font-extrabold text-2xl tracking-wider">UrbanNEST</span>
        </div>

        <div className="my-auto space-y-6 max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight">
            Find and Manage Properties Seamlessly.
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed">
            Welcome back to UrbanNEST. Sign in to access your My Space dashboard, manage listings, configure payments, and connect directly with tenants or brokers.
          </p>
          <div className="border-l-4 border-emerald-500 pl-4 py-2 italic text-gray-300 text-sm">
            "Your professional gateway to simplified, decentralized real estate connections."
          </div>
        </div>

        <div className="text-sm text-gray-400">
          © {new Date().getFullYear()} UrbanNEST. All rights reserved.
        </div>
      </div>

      {/* Right form panel */}
      <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Sign In
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                Create Account
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {error && (
              <Alert type="error" message={error} onClose={() => setError('')} />
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address or Phone Number *
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                placeholder="you@example.com or +251900000000"
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password *
                </label>
                <Link to="/forgot-password" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              disabled={rateLimit >= 5}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 py-3 font-semibold rounded-xl transition duration-200"
            >
              Sign In
            </Button>

            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              By signing in, you agree to our{' '}
              <Link to="/terms" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                Privacy Policy
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}