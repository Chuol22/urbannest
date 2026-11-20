import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import logo from '../assets/images/unlogo.png';

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'owner', // Default to broker/owner (Property Owner)
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate first name
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }

    // Validate last name
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }

    // Validate email (Optional)
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate phone (Primary & Required)
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Validate terms acceptance
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email.trim() || '', // Optional
        password: formData.password,
        phone: formData.phone.trim(),
        role: formData.role,
      });
      navigate('/dashboard'); // Go directly to dashboard
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setGeneralError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F4F5EF] dark:bg-[#0F1116]">
      {/* Left branding panel - Charcoal Slate */}
      <div className="md:w-1/2 bg-gradient-to-br from-[#181B22] to-[#262C37] flex flex-col justify-between p-8 md:p-12 text-white animate-fadeIn">
        <div className="flex items-center">
          <Link to="/" className="inline-block group" aria-label="UrbanNest Home">
            <div className="bg-white/95 px-3.5 py-2 rounded-2xl shadow-lg border border-[#C9A865]/35 inline-flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <img src={logo} alt="UrbanNest Logo" className="h-10 w-auto object-contain" />
            </div>
          </Link>
        </div>

        <div className="my-auto space-y-6 max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight">
            Market Your Property Professionally.
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed">
            Create an account to gain your professional online profile, manage all your listings in one centralized place, and share easily on WhatsApp and social media.
          </p>
          <div className="border-l-4 border-[#C9A865] pl-4 py-2 italic text-gray-300 text-sm">
            "Your platform focuses on discovery and connection. Buyers connect directly with you via phone or WhatsApp."
          </div>
        </div>

        <div className="text-sm text-gray-400">
          © {new Date().getFullYear()} UrbanNEST. All rights reserved.
        </div>
      </div>

      {/* Right form panel */}
      <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16 bg-[#F4F5EF] dark:bg-[#181B22]/10">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-[#181B22] p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-[#2E3543]">
          <div>
            {/* Mobile / Form Header Logo */}
            <div className="md:hidden flex justify-center mb-6">
              <Link to="/" aria-label="UrbanNest Home">
                <div className="bg-white/95 px-3.5 py-2 rounded-2xl shadow-sm border border-[#C9A865]/30 inline-flex items-center justify-center">
                  <img src={logo} alt="UrbanNest Logo" className="h-9 w-auto object-contain" />
                </div>
              </Link>
            </div>
            <h2 className="text-3xl font-extrabold text-[#181B22] dark:text-white">
              Create Your Account
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#181B22] dark:text-[#C9A865] hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {generalError && (
              <Alert type="error" message={generalError} onClose={() => setGeneralError('')} />
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name *"
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => {
                  setFormData({ ...formData, first_name: e.target.value });
                  if (errors.first_name) delete errors.first_name;
                }}
                error={errors.first_name}
                placeholder="Chuol"
                disabled={loading}
              />

              <Input
                label="Last Name *"
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => {
                  setFormData({ ...formData, last_name: e.target.value });
                  if (errors.last_name) delete errors.last_name;
                }}
                error={errors.last_name}
                placeholder="Vanguard"
                disabled={loading}
              />
            </div>

            <Input
              label="Phone Number * (Primary Account ID)"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
                if (errors.phone) delete errors.phone;
              }}
              error={errors.phone}
              placeholder="+251912345678"
              helperText="Include country code (e.g., +251)"
              disabled={loading}
            />

            <Input
              label="Email Address (Optional)"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) delete errors.email;
              }}
              error={errors.email}
              placeholder="you@example.com"
              disabled={loading}
            />

            <div>
              <label className="block text-sm font-medium text-[#181B22] dark:text-gray-300 mb-1">
                Register as a *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-[#2E3543] rounded-lg text-[#181B22] dark:text-white bg-white dark:bg-[#262C37]/30 focus:ring-2 focus:ring-[#C9A865] focus:border-[#C9A865] outline-none transition"
                disabled={loading}
              >
                <option value="owner">Property Owner / Landlord (Have property to rent/sell)</option>
                <option value="agent">Real Estate Agent / Broker</option>
                <option value="seeker">Property Seeker (Looking to rent/buy)</option>
              </select>
            </div>

            <Input
              label="Password *"
              type="password"
              required
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (errors.password) delete errors.password;
              }}
              error={errors.password}
              placeholder="••••••••"
              helperText="At least 8 characters, with capital letter and number"
              disabled={loading}
            />

            <Input
              label="Confirm Password *"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                if (errors.confirmPassword) delete errors.confirmPassword;
              }}
              error={errors.confirmPassword}
              placeholder="••••••••"
              disabled={loading}
            />

            <div className="flex items-start">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => {
                  setFormData({ ...formData, acceptTerms: e.target.checked });
                  if (errors.acceptTerms) delete errors.acceptTerms;
                }}
                className="h-4 w-4 mt-1 accent-[#181B22] border-gray-300 rounded cursor-pointer"
                disabled={loading}
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-[#181B22] dark:text-gray-300 cursor-pointer">
                I agree to the{' '}
                <Link to="/terms" className="text-[#C9A865] hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-[#C9A865] hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-xs text-red-500 mt-1">{errors.acceptTerms}</p>
            )}

            <Button
              type="submit"
              loading={loading}
              fullWidth
              className="bg-[#181B22] hover:bg-[#262C37] text-white shadow-lg shadow-[#181B22]/20 py-3 font-semibold rounded-xl border border-[#C9A865] transition duration-200"
            >
              Create Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}