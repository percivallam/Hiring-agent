import { Bot } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  isAgent?: boolean;
  className?: string;
}

export function Avatar({
  name = '',
  src,
  size = 'md',
  isAgent = false,
  className
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
  };

  if (isAgent) {
    return (
      <div className={cn(
        sizeClasses[size],
        'rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center border border-amber-500/20',
        className
      )}>
        <Bot className="w-4 h-4 text-amber-400" />
      </div>
    );
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          sizeClasses[size],
          'rounded-full object-cover',
          className
        )}
      />
    );
  }

  const initial = name ? getInitials(name) : '?';
  const colors = [
    'bg-blue-600',
    'bg-emerald-600',
    'bg-amber-600',
    'bg-red-600',
    'bg-violet-600',
    'bg-pink-600',
    'bg-indigo-600',
    'bg-teal-600',
  ];
  const colorIndex = name.length % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div className={cn(
      sizeClasses[size],
      'rounded-full flex items-center justify-center text-white font-medium',
      bgColor,
      className
    )}>
      {initial}
    </div>
  );
}
