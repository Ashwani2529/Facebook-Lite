import React from 'react';

const Loading = ({
  variant = 'spinner',
  size = 'md',
  color = 'primary',
  text = '',
  fullScreen = false,
  className = ''
}) => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colors = {
    primary: 'border-primary-600',
    white: 'border-white',
    gray: 'border-gray-600',
    facebook: 'border-facebook-primary'
  };

  const Spinner = () => (
    <div className={`
      ${sizes[size]} border-4 ${colors[color]} border-t-transparent rounded-full animate-spin
      ${className}
    `} />
  );

  const Dots = () => (
    <div className="flex space-x-2">
      <div className={`${sizes[size]} bg-primary-600 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
      <div className={`${sizes[size]} bg-primary-600 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
      <div className={`${sizes[size]} bg-primary-600 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
    </div>
  );

  const Pulse = () => (
    <div className={`
      ${sizes[size]} bg-primary-600 rounded-full animate-pulse
      ${className}
    `} />
  );

  const Bars = () => (
    <div className="flex space-x-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-1 bg-primary-600 rounded-full animate-pulse ${
            size === 'xs' ? 'h-4' : 
            size === 'sm' ? 'h-6' : 
            size === 'md' ? 'h-8' : 
            size === 'lg' ? 'h-12' : 'h-16'
          }`}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );

  const renderVariant = () => {
    switch (variant) {
      case 'dots':
        return <Dots />;
      case 'pulse':
        return <Pulse />;
      case 'bars':
        return <Bars />;
      default:
        return <Spinner />;
    }
  };

  const loadingContent = (
    <div className="flex flex-col items-center justify-center space-y-4">
      {renderVariant()}
      {text && (
        <p className="text-gray-600 text-sm font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-facebook-dark/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {loadingContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {loadingContent}
    </div>
  );
};

// Skeleton loader components
export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${
          i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
        }`}
      />
    ))}
  </div>
);

export const SkeletonAvatar = ({ size = 'md', className = '' }) => {
  const sizes = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`
      ${sizes[size]} bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse
      ${className}
    `} />
  );
};

export const SkeletonCard = ({ className = '' }) => (
  <div className={`p-6 bg-white dark:bg-facebook-card rounded-xl shadow-soft ${className}`}>
    <div className="flex items-center space-x-4 mb-4">
      <SkeletonAvatar />
      <div className="flex-1">
        <SkeletonText lines={2} />
      </div>
    </div>
    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-4" />
    <SkeletonText lines={3} />
  </div>
);

export const SkeletonPost = ({ className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <div className="flex items-center space-x-3">
      <SkeletonAvatar />
      <div className="flex-1">
        <SkeletonText lines={1} />
        <div className="mt-1 w-1/3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
    <SkeletonText lines={2} />
    <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
    <div className="flex items-center justify-between">
      <div className="flex space-x-4">
        <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  </div>
);

export default Loading; 