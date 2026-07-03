import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Registration fields - MATCH BACKEND EXPECTATIONS
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('seeker');

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
        // Validate registration data - MATCH BACKEND
        if (!firstName.trim()) {
          setError('First name is required');
          return;
        }
        if (!lastName.trim()) {
          setError('Last name is required');
          return;
        }
        if (!phone.trim()) {
          setError('Phone number is required');
          return;
        }
        if (!email.trim()) {
          setError('Email is required');
          return;
        }
        if (!password.trim()) {
          setError('Password is required');
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          return;
        }

        // Send data in format backend expects
        await register({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          email: email,
          password: password,
          role: role
        });
      } else {
        // Validate login data
        if (!email.trim()) {
          setError('Email or phone number is required');
          return;
        }
        if (!password.trim()) {
          setError('Password is required');
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

  // Reset form when toggling between login/register
  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setRateLimit(0);
    // Reset registration fields
    setFirstName('');
    setLastName('');
    setPhone('');
    setRole('seeker');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-bold text-white">U</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isRegistering ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            {isRegistering ? 'Join UrbanNEST today' : 'Welcome back to UrbanNEST'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          {isRegistering && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent sm:text-sm"
                    placeholder="John"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent sm:text-sm"
                    placeholder="Doe"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent sm:text-sm"
                  placeholder="+251912345678"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  I am a *
                </label>
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent sm:text-sm"
                  disabled={loading}
                >
                  <option value="seeker">Property Seeker (Looking to rent/buy)</option>
                  <option value="owner">Property Owner (Have property to rent/sell)</option>
                  <option value="agent">Real Estate Agent</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address or Phone Number *
            </label>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete={isRegistering ? 'email' : 'username'}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent sm:text-sm"
              placeholder="you@example.com or +251912345678"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent sm:text-sm"
              placeholder="••••••••"
              disabled={loading}
            />
            {isRegistering && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Must be at least 8 characters with uppercase, lowercase, number
              </p>
            )}
          </div>

          {!isRegistering && (
            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-sm text-blue-900 hover:text-amber-600">
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRegistering ? 'Create Account' : 'Sign in'}
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-900 hover:text-amber-600 text-sm font-medium"
              disabled={loading}
            >
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {!isRegistering && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-300">
              <span>By signing in, you agree to our </span>
              <Link to="/terms" className="text-blue-900 hover:text-amber-600">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-blue-900 hover:text-amber-600">
                Privacy Policy
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}