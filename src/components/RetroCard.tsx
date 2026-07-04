import React from 'react';
import { cn } from '../utils/cn';

interface RetroCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  color?: 'cyan' | 'purple' | 'pink' | 'yellow' | 'green';
}

export const RetroCard: React.FC<RetroCardProps> = ({ children, className, title, color = 'cyan' }) => {
  const colors = {
    cyan: 'border-cyan-400/60 shadow-[3px_3px_0_0_rgb(34,211,238,0.4)]',
    purple: 'border-purple-400/60 shadow-[3px_3px_0_0_rgb(192,132,252,0.4)]',
    pink: 'border-pink-400/60 shadow-[3px_3px_0_0_rgb(244,114,182,0.4)]',
    yellow: 'border-yellow-400/60 shadow-[3px_3px_0_0_rgb(250,204,21,0.4)]',
    green: 'border-green-400/60 shadow-[3px_3px_0_0_rgb(74,222,128,0.4)]'
  };

  return (
    <div className={cn('bg-gray-900/90 border rounded-lg p-4', colors[color], className)}>
      {title && (<h2 className="text-lg font-bold text-white mb-3 uppercase tracking-wider">{title}</h2>)}
      {children}
    </div>
  );
};
