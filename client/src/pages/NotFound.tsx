import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Animated 404 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="relative mb-8"
        >
          <div className="text-8xl font-bold text-primary-600">404</div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl opacity-20">
            🏠
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-4"
        >
          Page Not Found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-8"
        >
          Oops! The page you're looking for doesn't exist or has been moved.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <Link to="/">
            <Button variant="primary" fullWidth>
              Go to Homepage
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            fullWidth
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </motion.div>

        {/* Helpful Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 pt-6 border-t border-gray-200"
        >
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
        </motion.div>
      </motion.div>
    </div>
  );
}