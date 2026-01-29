import { useState } from 'react';

interface ServiceIconProps {
  icon?: string | null;
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const emojiSizeClasses = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
};

const letterSizeClasses = {
  sm: 'w-4 h-4 text-[8px]',
  md: 'w-6 h-6 text-[10px]',
  lg: 'w-8 h-8 text-xs',
};

// Generate a consistent color based on the service name
const getColorFromName = (name: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-amber-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Get first letter or first two letters for better identification
const getInitials = (name: string): string => {
  const cleanName = name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '');
  if (cleanName.length === 0) return '?';
  
  // For Chinese names, just use first character
  if (/[\u4e00-\u9fa5]/.test(cleanName)) {
    return cleanName.charAt(0);
  }
  
  // For English names, use first letter uppercase
  return cleanName.charAt(0).toUpperCase();
};

export function ServiceIcon({ icon, name, className = '', size = 'md' }: ServiceIconProps) {
  const [imgError, setImgError] = useState(false);
  
  // If icon is a path (SVG file) and no error occurred
  if (icon?.startsWith('/') && !imgError) {
    return (
      <img 
        src={icon} 
        alt={name}
        className={`${sizeClasses[size]} object-contain ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  // If icon is a URL (external image) and no error occurred
  if (icon?.startsWith('http') && !imgError) {
    return (
      <img 
        src={icon} 
        alt={name}
        className={`${sizeClasses[size]} object-contain ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  // If icon is emoji (single emoji character)
  if (icon && /^[\p{Emoji}]$/u.test(icon.trim())) {
    return (
      <span className={`${emojiSizeClasses[size]} ${className}`}>
        {icon}
      </span>
    );
  }
  
  // If icon is emoji but multiple characters (like country flags)
  if (icon && icon.length <= 4 && /[\p{Emoji}]/u.test(icon)) {
    return (
      <span className={`${emojiSizeClasses[size]} ${className}`}>
        {icon}
      </span>
    );
  }

  // Fallback to first letter avatar with colored background
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);
  
  return (
    <div 
      className={`${letterSizeClasses[size]} ${bgColor} rounded-md flex items-center justify-center text-white font-bold ${className}`}
    >
      {initials}
    </div>
  );
}
