import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'md' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-800'
          : 'bg-white border-slate-200 text-indigo-600 hover:text-indigo-700 hover:bg-slate-100 shadow-sm'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className={size === 'sm' ? 'w-4 h-4' : 'w-4 h-4'} />
      ) : (
        <Moon className={size === 'sm' ? 'w-4 h-4' : 'w-4 h-4'} />
      )}
    </button>
  );
};
