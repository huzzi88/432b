import React from 'react';
import { cn } from '../utils/cn';

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
}

export const RetroButton: React.FC<RetroButtonProps> = ({ children, variant = 'primary', size = 'md', className, ...props }) => {
  const variants = {
    primary: 'bg-cyan-400 text-black border-cyan-600 hover:bg-cyan-300 shadow-[2px_2px_0_0_rgb(8,145,178)]',
    secondary: 'bg-purple-400 text-black border-purple-600 hover:bg-purple-300 shadow-[2px_2px_0_0_rgb(126,34,206)]',
    success: 'bg-green-400 text-black border-green-600 hover:bg-green-300 shadow-[2px_2px_0_0_rgb(22,163,74)]',
    danger: 'bg-red-400 text-black border-red-600 hover:bg-red-300 shadow-[2px_2px_0_0_rgb(220,38,38)]',
    warning: 'bg-yellow-400 text-black border-yellow-600 hover:bg-yellow-300 shadow-[2px_2px_0_0_rgb(202,138,4)]'
  };
  const sizes = { sm: 'px-2.5 py-1 text-xs', md: 'px-3.5 py-1.5 text-sm', lg: 'px-5 py-2.5 text-base' };

  return (
    <button className={cn('font-bold border rounded uppercase tracking-wide transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
};
