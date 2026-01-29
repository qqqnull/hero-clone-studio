import { Package } from 'lucide-react';

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

export function ServiceIcon({ icon, name, className = '', size = 'md' }: ServiceIconProps) {
  // If icon is a path (SVG file)
  if (icon?.startsWith('/')) {
    return (
      <img 
        src={icon} 
        alt={name}
        className={`${sizeClasses[size]} object-contain ${className}`}
        onError={(e) => {
          // Fallback to Package icon on error
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.parentElement?.classList.add('fallback-icon');
        }}
      />
    );
  }

  // If icon is a URL (external image)
  if (icon?.startsWith('http')) {
    return (
      <img 
        src={icon} 
        alt={name}
        className={`${sizeClasses[size]} object-contain ${className}`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    );
  }

  // If icon is emoji or text
  if (icon && icon.length <= 4) {
    return (
      <span className={`${emojiSizeClasses[size]} ${className}`}>
        {icon}
      </span>
    );
  }

  // Fallback to default Package icon
  return <Package className={`${sizeClasses[size]} text-muted-foreground ${className}`} />;
}
