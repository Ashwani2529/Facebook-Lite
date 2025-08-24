import React, { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';

const Input = forwardRef(({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  error = '',
  label = '',
  icon = null,
  rightIcon = null,
  className = '',
  size = 'md',
  variant = 'default',
  fullWidth = true,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = (e) => {
    setFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const sizes = {
    sm: 'text-sm py-2',
    md: 'text-base py-3',
    lg: 'text-lg py-4'
  };

  const variants = {
    default: 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-primary-500 dark:focus:border-primary-400',
    filled: 'bg-gray-100 dark:bg-gray-700 border-0 focus:bg-white dark:focus:bg-gray-800',
    outlined: 'bg-transparent border-2 border-gray-300 dark:border-gray-600 focus:border-primary-500 dark:focus:border-primary-400'
  };

  const baseClasses = `
    w-full rounded-xl transition-all duration-200 
            text-gray-900 dark:text-white
    focus:outline-none focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-800
    disabled:opacity-50 disabled:cursor-not-allowed
    placeholder:text-gray-400 dark:placeholder:text-gray-500
  `;

  const inputClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}
    ${!fullWidth ? 'w-auto' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'w-auto'}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            {icon}
          </div>
        )}
        
        <motion.input
          ref={ref}
          type={type === 'password' && showPassword ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
        
        {rightIcon && type !== 'password' && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      

      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 