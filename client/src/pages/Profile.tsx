import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

import { useAuth } from '../hooks/useAuth';

import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader } from '../components/ui/Loader';

export default function Profile() {
  const { user, updateProfile, loading: authLoading, changePassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateStatus('idle');

    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
      });

      setUpdateStatus('success');
      setIsEditing(false);
      setTimeout(() => setUpdateStatus('idle'), 3000);
    } catch (error: any) {
      setUpdateStatus('error');
      setErrorMessage(error.message || 'Failed to update profile');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!passwordData.currentPassword) {
      setUpdateStatus('error');
      setErrorMessage('Current password is required');
      setTimeout(() => setUpdateStatus('idle'), 3000);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setUpdateStatus('error');
      setErrorMessage('New password must be at least 6 characters');
      setTimeout(() => setUpdateStatus('idle'), 3000);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setUpdateStatus('error');
      setErrorMessage('New passwords do not match');
      setTimeout(() => setUpdateStatus('idle'), 3000);
      return;
    }

    setIsUpdating(true);
    setUpdateStatus('idle');

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);

      setUpdateStatus('success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setUpdateStatus('idle'), 3000);
    } catch (error: any) {
      setUpdateStatus('error');
      setErrorMessage(error.message || 'Failed to update password');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Profile</h1>

      <div className="space-y-8">
        {/* Profile Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 dark:border dark:border-gray-700"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Information</h2>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>

          {updateStatus === 'success' && (
            <Alert type="success" message="Profile updated successfully!" />
          )}

          {updateStatus === 'error' && (
            <Alert type="error" message={errorMessage} />
          )}

          <form onSubmit={handleProfileUpdate}>
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                required
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-50 dark:bg-gray-700/50"
              />

              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                placeholder="+251 9 11 11 11 11"
              />
            </div>

            {isEditing && (
              <div className="mt-6 flex space-x-3">
                <Button type="submit" loading={isUpdating}>
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    if (user) {
                      setFormData({
                        name: user.name || '',
                        email: user.email || '',
                        phone: user.phone || '',
                      });
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 dark:border dark:border-gray-700"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Change Password</h2>

          <form onSubmit={handlePasswordUpdate}>
            <div className="space-y-4">
              <Input
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />

              <Input
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
                helperText="Must be at least 6 characters"
              />

              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <div className="mt-6">
              <Button type="submit" loading={isUpdating}>
                Update Password
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Account Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 dark:border dark:border-gray-700"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Account Type</p>
              <p className="font-medium text-gray-900 dark:text-white capitalize">{user?.role || 'Tenant'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email Status</p>
              <p className={`font-medium ${user?.emailVerified ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                {user?.emailVerified ? 'Verified ✓' : 'Not Verified'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}