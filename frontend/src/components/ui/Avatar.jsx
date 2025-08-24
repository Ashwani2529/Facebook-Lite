import React, { useState } from 'react';
import { generateUserIconPlaceholder } from '../../utils/avatarUtils';

const Avatar = ({
  src,
  alt,
  name,
  size = 'md',
  variant = 'circle',
  status,
  className = '',
  onClick,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    xs: 'w-8 h-8 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-24 h-24 text-2xl'
  };

  const variants = {
    circle: 'rounded-full',
    rounded: 'rounded-lg',
    square: 'rounded-none'
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarClasses = `
    relative inline-flex items-center justify-center
    ${sizes[size]}
    ${variants[variant]}
    ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const showFallback = !src || imageError;

  return (
    <div className={avatarClasses} onClick={onClick} {...props}>
      {!showFallback ? (
        <img
          src={src}
          alt={alt || name}
          className={`w-full h-full object-cover ${variants[variant]}`}
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <div className={`
          w-full h-full flex items-center justify-center font-semibold
          bg-gradient-to-br from-primary-500 to-primary-700 text-white
          ${variants[variant]} animate-pulse
        `}>
          {name ? getInitials(name) : (
            <div dangerouslySetInnerHTML={{
              __html: generateUserIconPlaceholder(parseInt(sizes[size].match(/\d+/)[0]), '6366f1', 'ffffff').replace('data:image/svg+xml;charset=utf-8,', '')
            }} />
          )}
        </div>
      )}
      
      {status && (
        <div className={`
          absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800
          ${statusColors[status]}
        `} />
      )}
    </div>
  );
};

// Avatar Group component for showing multiple avatars
export const AvatarGroup = ({ 
  children, 
  max = 5, 
  spacing = '-ml-2',
  className = '' 
}) => {
  const childArray = React.Children.toArray(children);
  const visibleChildren = childArray.slice(0, max);
  const hiddenCount = childArray.length - max;

  return (
    <div className={`flex items-center ${className}`}>
      {visibleChildren.map((child, index) => (
        <div
          key={index}
          className={`relative ${index > 0 ? spacing : ''} hover:z-10 transition-all duration-200 hover:scale-110`}
          style={{ zIndex: visibleChildren.length - index }}
        >
          {child}
        </div>
      ))}
      {hiddenCount > 0 && (
        <div className={`
          relative ${spacing} flex items-center justify-center
          w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600
          text-sm font-medium text-gray-700
        `}>
          +{hiddenCount}
        </div>
      )}
    </div>
  );
};

export default Avatar; 