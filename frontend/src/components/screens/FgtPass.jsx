import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMail, HiArrowLeft } from 'react-icons/hi';
import validator from 'validator';
import toast from 'react-hot-toast';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

const FgtPass = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!validator.isEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      toast.success('Reset link sent to your email!');
    }, 2000);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-8 text-center">
              <div className="text-6xl mb-6">📧</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Check your email
              </h2>
              <p className="text-gray-600 mb-8">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <Link to="/login">
                <Button variant="primary" fullWidth>
                  Back to Login
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

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
              <span className="text-white font-bold text-xl">🔒</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
            Forgot Password?
          </h2>
          <p className="text-gray-600">
            Enter your email and we'll send you a reset link
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<HiMail className="w-5 h-5" />}
                autoComplete="email"
                autoFocus
              />

              <Button
                type="submit"
                variant="facebook"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Link to="/login">
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  className="flex items-center justify-center space-x-2"
                >
                  <HiArrowLeft className="w-4 h-4" />
                  <span>Back to Login</span>
                </Button>
              </Link>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default FgtPass;