import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon = null,
  className = '',
  onClick,
  type = 'button',
  fullWidth = false,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-200 dark:focus:ring-primary-800 shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-200 shadow-md hover:shadow-lg',
    facebook: 'bg-facebook-primary hover:bg-blue-600 text-white focus:ring-blue-200 shadow-lg hover:shadow-xl',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-200 shadow-lg hover:shadow-xl',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-200 shadow-lg hover:shadow-xl',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-200 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white focus:ring-primary-200',
    ghost: 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-200',
    link: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline focus:ring-0'
  };
  
  const sizes = {
    sm: 'text-sm px-3 py-2 rounded-lg',
    md: 'text-base px-4 py-3 rounded-xl',
    lg: 'text-lg px-6 py-4 rounded-xl',
    xl: 'text-xl px-8 py-5 rounded-2xl'
  };
  
  const buttonClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      {...props}
    >
      {loading && (
        <div className="mr-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </motion.button>
  );
};

export default Button; 