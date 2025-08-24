import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  shadow = 'soft',
  hover = true,
  className = '',
  onClick,
  ...props
}) => {
  const variants = {
    default: 'bg-white dark:bg-facebook-card border border-gray-200 dark:border-gray-700',
    glass: 'bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-white/10',
    gradient: 'bg-gradient-to-br from-primary-500 to-primary-700 text-white',
    outlined: 'bg-transparent border-2 border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-facebook-card shadow-strong'
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const shadows = {
    none: '',
    soft: 'shadow-soft',
    medium: 'shadow-medium',
    strong: 'shadow-strong'
  };

  const baseClasses = `
    rounded-xl transition-all duration-300
    ${variants[variant]}
    ${paddings[padding]}
    ${shadows[shadow]}
    ${hover ? 'hover:shadow-medium hover:-translate-y-1' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const CardComponent = onClick ? motion.div : 'div';
  const motionProps = onClick ? {
    whileHover: { y: -2, scale: 1.02 },
    whileTap: { scale: 0.98 }
  } : {};

  return (
    <CardComponent
      className={baseClasses}
      onClick={onClick}
      {...motionProps}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

// Card sub-components for better composition
const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

const CardBody = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, as: Component = 'h3', className = '' }) => (
      <Component className={`text-xl font-semibold text-gray-900 ${className}`}>
    {children}
  </Component>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`text-gray-600 ${className}`}>
    {children}
  </p>
);

// Assign sub-components to main Card component
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Title = CardTitle;
Card.Description = CardDescription;

export default Card; 