// src/pages/Register.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Validator } from '../utils/validators';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate name
    const nameError = Validator.required(formData.name, 'Full Name');
    if (nameError) newErrors.name = nameError;
    else if (formData.name.length < 2) newErrors.name = 'Name must be at least 2 characters';
    
    // Validate email
    const emailError = Validator.required(formData.email, 'Email');
    if (emailError) newErrors.email = emailError;
    else {
      const emailFormatError = Validator.email(formData.email);
      if (emailFormatError) newErrors.email = emailFormatError;
    }
    
    // Validate password
    const passwordError = Validator.required(formData.password, 'Password');
    if (passwordError) newErrors.password = passwordError;
    else {
      const passwordStrengthError = Validator.password(formData.password);
      if (passwordStrengthError) newErrors.password = passwordStrengthError;
    }
    
    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Validate phone (optional)
    if (formData.phone) {
      const phoneError = Validator.phone(formData.phone);
      if (phoneError) newErrors.phone = phoneError;
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
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setGeneralError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              sign in to your account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          {generalError && (
            <Alert type="error" message={generalError} onClose={() => setGeneralError('')} />
          )}

          <div className="space-y-4">
            <Input
              label="Full Name *"
              type="text"
              required
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) delete errors.name;
              }}
              error={errors.name}
              placeholder="ChuolCore"
              disabled={loading}
            />

            <Input
              label="Email Address *"
              type="email"
              required
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) delete errors.email;
              }}
              error={errors.email}
              placeholder="me@example.com"
              disabled={loading}
            />

            <Input
              label="Phone Number (Optional)"
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
                if (errors.phone) delete errors.phone;
              }}
              error={errors.phone}
              placeholder="+251 (96) 077-9507"
              disabled={loading}
            />

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
              helperText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
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

            <div className="flex items-center">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => {
                  setFormData({ ...formData, acceptTerms: e.target.checked });
                  if (errors.acceptTerms) delete errors.acceptTerms;
                }}
                className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ${
                  errors.acceptTerms ? 'border-red-500' : ''
                }`}
                disabled={loading}
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-red-600 mt-1">{errors.acceptTerms}</p>
            )}
          </div>

          <Button type="submit" loading={loading} fullWidth>
            Create Account
          </Button>

          <div className="text-center text-sm text-gray-600">
            By creating an account, you agree to receive emails about your account and property updates.
          </div>
        </form>
      </div>
    </div>
  );
}