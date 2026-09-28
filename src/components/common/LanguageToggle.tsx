import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LanguageToggleProps { className?: string; size?: 'sm' | 'md'; }

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '', size = 'md' }) => {
  const { language, toggleLanguage } = useLanguage();
  const isFa = language === 'fa';
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`rounded-xl border transition-all flex items-center justify-center cursor-pointer font-bold select-none bg-slate-900 border-slate-800 text-violet-400 hover:text-violet-300 hover:bg-slate-800 ${size === 'sm' ? 'text-[11px] w-9 h-9' : 'text-xs w-10 h-10'} ${className}`}
      title={isFa ? 'Switch to English' : '\u062a\u063a\u06cc\u06cc\u0631 \u0628\u0647 \u0641\u0627\u0631\u0633\u06cc'}
      aria-label="Toggle Language"
    >
      {isFa ? 'EN' : 'FA'}
    </button>
  );
};