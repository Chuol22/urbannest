import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useLocalStorage, useLocalStorageBoolean } from '../hooks/useLocalStorage';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  propertyAlerts: boolean;
}

interface PrivacySettings {
  showProfile: boolean;
  showEmail: boolean;
  showPhone: boolean;
}

export default function Settings() {
  const { theme, setTheme, currentTheme } = useTheme();
  const [language, setLanguage] = useLocalStorage('language', 'en');
  const [currency, setCurrency] = useLocalStorage('currency', 'USD');
  const [distanceUnit, setDistanceUnit] = useLocalStorage('distanceUnit', 'miles');
  const [notifications, setNotifications] = useLocalStorage<NotificationSettings>('notifications', {
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    propertyAlerts: true,
  });
  const [privacy, setPrivacy] = useLocalStorage<PrivacySettings>('privacy', {
    showProfile: true,
    showEmail: true,
    showPhone: false,
  });
  const [autoSave, toggleAutoSave] = useLocalStorageBoolean('autoSave', true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handlePrivacyChange = (key: keyof PrivacySettings) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {saveStatus === 'saved' && (
        <Alert type="success" message="Settings saved successfully!" />
      )}

      <div className="space-y-8">
        {/* Appearance Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Appearance</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <div className="flex space-x-4">
                {(['light', 'dark', 'system'] as const).map((themeOption) => (
                  <button
                    key={themeOption}
                    onClick={() => setTheme(themeOption)}
                    className={`
                      px-4 py-2 rounded-lg capitalize transition-colors
                      ${theme === themeOption
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {themeOption}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Current: {currentTheme} mode
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distance Unit
              </label>
              <div className="flex space-x-4">
                {(['miles', 'kilometers'] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setDistanceUnit(unit)}
                    className={`
                      px-4 py-2 rounded-lg capitalize transition-colors
                      ${distanceUnit === unit
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-gray-700">Email Notifications</span>
                <p className="text-sm text-gray-500">Receive property updates via email</p>
              </div>
              <button
                onClick={() => handleNotificationChange('emailNotifications')}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${notifications.emailNotifications ? 'bg-primary-600' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-gray-700">Push Notifications</span>
                <p className="text-sm text-gray-500">Get instant alerts on your device</p>
              </div>
              <button
                onClick={() => handleNotificationChange('pushNotifications')}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${notifications.pushNotifications ? 'bg-primary-600' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-gray-700">Marketing Emails</span>
                <p className="text-sm text-gray-500">Receive offers and promotions</p>
              </div>
              <button
                onClick={() => handleNotificationChange('marketingEmails')}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${notifications.marketingEmails ? 'bg-primary-600' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${notifications.marketingEmails ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-gray-700">Property Alerts</span>
                <p className="text-sm text-gray-500">Get notified about new listings</p>
              </div>
              <button
                onClick={() => handleNotificationChange('propertyAlerts')}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${notifications.propertyAlerts ? 'bg-primary-600' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${notifications.propertyAlerts ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </label>
          </div>
        </motion.div>

        {/* Privacy Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy</h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-gray-700">Show Profile in Search</span>
                <p className="text-sm text-gray-500">Allow others to find your profile</p>
              </div>
              <button
                onClick={() => handlePrivacyChange('showProfile')}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${privacy.showProfile ? 'bg-primary-600' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${privacy.showProfile ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-gray-700">Show Email Address</span>
                <p className="text-sm text-gray-500">Display email on your profile</p>
              </div>
              <button
                onClick={() => handlePrivacyChange('showEmail')}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${privacy.showEmail ? 'bg-primary-600' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${privacy.showEmail ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-gray-700">Show Phone Number</span>
                <p className="text-sm text-gray-500">Display phone on your profile</p>
              </div>
              <button
                onClick={() => handlePrivacyChange('showPhone')}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${privacy.showPhone ? 'bg-primary-600' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${privacy.showPhone ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </label>
          </div>
        </motion.div>

        {/* Data & Storage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data & Storage</h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-gray-700">Auto-save Search Filters</span>
                <p className="text-sm text-gray-500">Remember your filter preferences</p>
              </div>
              <button
                onClick={toggleAutoSave}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${autoSave ? 'bg-primary-600' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${autoSave ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </label>

            <div className="pt-4 border-t border-gray-200">
              <Button variant="outline" className="text-red-600 hover:bg-red-50">
                Clear All Data
              </Button>
              <p className="mt-2 text-xs text-gray-500">
                This will reset all your preferences and clear cached data.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}