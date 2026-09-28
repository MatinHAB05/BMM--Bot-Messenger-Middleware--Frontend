import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../common/Button';
import { ThemeToggle } from '../common/ThemeToggle';
import { LanguageToggle } from '../common/LanguageToggle';
import { LogOut, Link as LinkIcon, Radio, User as UserIcon } from 'lucide-react';
import { ChatLinkingModal } from '../linking/ChatLinkingModal';
import { BroadcastModal } from '../broadcasts/BroadcastModal';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, company, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isLinkingOpen, setIsLinkingOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await logout(); navigate('/login'); } finally { setIsLoggingOut(false); }
  };

  const getRoleLabel = () => {
    const role = user?.roles?.[0];
    if (role === 'super-admin') return t('superAdmin');
    if (role === 'admin') return t('admin');
    return t('member');
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{company?.name || t('companyWorkspace')}</span>
            {company?.code && <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded">#{company.code}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setIsLinkingOpen(true)} className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
            <LinkIcon className="w-3.5 h-3.5 text-blue-500" /><span>{t('linkChat')}</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsBroadcastOpen(true)}>
            <Radio className="w-3.5 h-3.5" /><span>{t('newBroadcast')}</span>
          </Button>
          <ThemeToggle size="sm" />
          <LanguageToggle size="sm" />
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
          <div onClick={() => navigate('/profile')} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors" title={t('viewProfile')}>
            <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs">
              {user?.username?.substring(0, 2).toUpperCase() || <UserIcon className="w-4 h-4" />}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{user?.username}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">{getRoleLabel()}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} isLoading={isLoggingOut} className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-2" title={t('logout')}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>
      <ChatLinkingModal isOpen={isLinkingOpen} onClose={() => setIsLinkingOpen(false)} />
      <BroadcastModal isOpen={isBroadcastOpen} onClose={() => setIsBroadcastOpen(false)} />
    </>
  );
};