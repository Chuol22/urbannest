import { Link, useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import { Button } from '../ui/Button';

interface NotFoundProps {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
}

export const NotFound: React.FC<NotFoundProps> = ({
  title = "Page Not Found",
  message = "The page you're looking for doesn't exist or has been moved.",
  showHomeButton = true,
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-primary-600 mb-4">404</div>
          <div className="text-6xl mb-4">🔍</div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600 mb-8">{message}</p>

        {/* Action Buttons */}
        <div className="space-y-3">
          {showHomeButton && (
            <Link to="/">
              <Button variant="primary" fullWidth>
                Go to Homepage
              </Button>
            </Link>
          )}

          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">Need help? Try these links:</p>
          <div className="flex justify-center space-x-4 text-sm">
            <Link to="/properties" className="text-primary-600 hover:text-primary-700">
              Browse Properties
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/contact" className="text-primary-600 hover:text-primary-700">
              Contact Support
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/about" className="text-primary-600 hover:text-primary-700">
              About Us
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};