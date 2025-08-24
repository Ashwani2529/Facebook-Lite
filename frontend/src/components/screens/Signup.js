import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMail, HiLockClosed, HiUser, HiPhone, HiCalendar, HiUserGroup, HiChevronDown } from 'react-icons/hi';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';
import SERVER_URL from '../../server_url';

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    gender: ''
  });

  // Email validation helper
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const { name, email, password, phone, dateOfBirth } = formData;
    
    if (!name.trim()) {
      toast.error('Name is required');
      return false;
    }
    
    if (!email.trim()) {
      toast.error('Email is required');
      return false;
    }
    
    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    
    if (!password) {
      toast.error('Password is required');
      return false;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }

    if (!phone.trim()) {
      toast.error('Phone number is required');
      return false;
    }

    if (phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return false;
    }

    if (!dateOfBirth) {
      toast.error('Date of birth is required');
      return false;
    }

    // Check if user is at least 13 years old
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (age < 13 || (age === 13 && monthDiff < 0) || (age === 13 && monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      toast.error('You must be at least 13 years old to create an account');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`${SERVER_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Account created successfully! Please login.');
        navigate('/login');
      } else {
        toast.error(data.error || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100 dark:from-facebook-dark dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white"
          >
            Create Account
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-sm text-gray-600 dark:text-gray-400"
          >
            Join our community and start sharing
          </motion.p>
        </div>

        {/* Signup Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 space-y-4"
          onSubmit={handleSubmit}
        >
          <div className="mb-4">
            <Input
              type="text"
              style={{
                paddingLeft: '42px',
              }}
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              icon={<HiUser />}
              required
            />
          </div>

          <div className="mb-4">
            <Input
              type="email"
              style={{
                paddingLeft: '42px',
              }}
              placeholder="Enter your email address"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              icon={<HiMail />}
              required
            />
          </div>

          <div className="mb-4">
            <Input
              type="password"
              style={{
                paddingLeft: '42px',
              }}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              icon={<HiLockClosed />}
              required
            />
          </div>

          <div className="mb-4">
            <Input
              type="tel"
              style={{
                paddingLeft: '42px',
              }}
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
              icon={<HiPhone />}
              required
            />
          </div>

          <div className="mb-4">
            <div className="relative" style={{
                  paddingLeft: '42px',
                }}>
              <input
                type="date"
                
                value={formData.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-gray-900"
                required
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <HiCalendar size={20} />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative"
            style={{
              paddingLeft: '42px',
            }}>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-gray-900 appearance-none"
                required
              >
                <option value="">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <HiUserGroup size={20} />
              </div>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <HiChevronDown size={20} />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </motion.form>

        {/* Login Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup;