import React from 'react';
import { cn } from '../utils/cn';

interface RetroInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const RetroInput: React.FC<RetroInputProps> = ({ label, className, ...props }) => {
  return (
    <div>
      {label && (<label className="block text-cyan-400 font-bold mb-1.5 uppercase tracking-wider text-xs">{label}</label>)}
      <input className={cn('w-full bg-black border border-cyan-400/60 rounded text-white px-3 py-1.5 font-mono text-sm focus:outline-none focus:border-pink-400 transition-colors', className)} {...props} />
    </div>
  );
};
