import React from 'react';
import { useApp } from '../context/AppContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useApp();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center p-2 rounded-lg 
                 bg-theme-secondary border border-theme shadow-theme
                 text-theme-primary hover:bg-theme-tertiary 
                 transition-all duration-400 ease-in-out
                 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                 group"
      aria-label="Toggle theme"
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-6 h-6">
        <Sun
          className={`absolute inset-0 w-6 h-6 transition-all duration-400 ease-in-out
                      ${isDarkMode ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
                      text-amber-500`}
        />
        <Moon
          className={`absolute inset-0 w-6 h-6 transition-all duration-400 ease-in-out
                      ${isDarkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
                      text-primary-600 dark:text-primary-400`}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
