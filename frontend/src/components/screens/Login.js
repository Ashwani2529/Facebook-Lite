import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMail, HiLockClosed } from 'react-icons/hi';
import validator from 'validator';
import toast from 'react-hot-toast';

import { UserContext } from '../../App';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import SERVER_URL from '../../server_url';

const Login = () => {
  const { dispatch } = useContext(UserContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validator.isEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 5) {
      newErrors.password = 'Password must be at least 5 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${SERVER_URL}/api/v1/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        localStorage.setItem('jwt', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        dispatch({ type: 'USER', payload: data.user });
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 rounded-full bg-gradient-to-br from-primary-400/20 to-purple-600/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/20 to-primary-600/20 blur-3xl"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">FL</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-300">
            Sign in to your Facebook Lite account
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <Input
                  type="email"
                  style={{
                    paddingLeft: '42px',
                  }}
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  icon={<HiMail className="w-5 h-5" />}
                  error={errors.email}
                  autoComplete="email"
                />
              </div>

              {/* Password Field */}
              <div>
                <Input
                  type="password"
                  style={{
                    paddingLeft: '42px',
                  }}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  icon={<HiLockClosed className="w-5 h-5" />}
                  error={errors.password}
                  autoComplete="current-password"
                />
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-between">
                <div></div>
                <Link
                  to="/forgot"
                  className="text-sm text-primary-600 hover:text-primary-500 transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="facebook"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-facebook-card text-gray-500">
                    Don't have an account?
                  </span>
                </div>
              </div>

              {/* Sign Up Link */}
              <Link to="/signup">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  fullWidth
                >
                  Create New Account
                </Button>
              </Link>
            </form>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
                      <p className="text-sm text-gray-500">
            By signing in, you agree to our{' '}
            <button 
              type="button"
              onClick={() => toast.info('Terms of Service - Feature coming soon!')}
                              className="text-primary-600 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 rounded"
              >
                Terms of Service
            </button>{' '}
            and{' '}
            <button 
              type="button"
              onClick={() => toast.info('Privacy Policy - Feature coming soon!')}
                              className="text-primary-600 hover:underline focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 rounded"
              >
                Privacy Policy
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
