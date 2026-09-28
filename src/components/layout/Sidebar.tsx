import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Link2, Send, Users, Building2, Paperclip, User, ShieldCheck } from 'lucide-react';
import { usePermission } from '../../permissions/usePermission';
import { PermissionGuard } from '../../permissions/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

export const Sidebar: React.FC = () => {
  const { isSuperAdmin } = usePermission();
  const { company } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const isFA = language === 'fa';

  const labels = {
    messagingChannels: isFA ? 'پیام‌رسانی و کانال‌ها' : 'Messaging & Channels',
    messagingCenter:   isFA ? 'مرکز پیام' : 'Messaging Center',
    linkedChats:       isFA ? 'چت‌های متصل' : 'Linked Chats',
    broadcastHub:      isFA ? 'پخش همگانی' : 'Broadcast Hub',
    attachments:       isFA ? 'پیوست‌ها' : 'Attachments',
    administration:    isFA ? 'مدیریت' : 'Administration',
    userManagement:    isFA ? 'مدیریت کاربران' : 'User Management',
    companySettings:   isFA ? 'تنظیمات شرکت' : 'Company Settings',
    account:           isFA ? 'حساب کاربری' : 'Account',
    myProfile:         isFA ? 'پروفایل من' : 'My Profile',
    currentRole:       isFA ? 'نقش فعلی' : 'Current Role',
    superAdmin:        isFA ? 'سوپر ادمین' : 'Super Admin',
    admin:             isFA ? 'ادمین' : 'Admin',
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all select-none ${
      isActive
        ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 font-semibold'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
    }`;

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 h-screen select-none">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div className="overflow-hidden">
          <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-wide truncate">BMM Dashboard</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            {company?.name || 'Multi-Messenger'}
          </p>
        </div>
      </div>

      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {labels.messagingChannels}
        </div>

        <NavLink to="/messaging" className={navLinkClass}>
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span>{labels.messagingCenter}</span>
        </NavLink>

        <NavLink to="/chats" className={navLinkClass}>
          <Link2 className="w-4 h-4 shrink-0" />
          <span>{labels.linkedChats}</span>
        </NavLink>

        <NavLink to="/broadcasts" className={navLinkClass}>
          <Send className="w-4 h-4 shrink-0" />
          <span>{labels.broadcastHub}</span>
        </NavLink>

        <NavLink to="/attachments" className={navLinkClass}>
          <Paperclip className="w-4 h-4 shrink-0" />
          <span>{labels.attachments}</span>
        </NavLink>

        <div className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {labels.administration}
        </div>

        <PermissionGuard action="users:read" mode="hide">
          <NavLink to="/users" className={navLinkClass}>
            <Users className="w-4 h-4 shrink-0" />
            <span>{labels.userManagement}</span>
          </NavLink>
        </PermissionGuard>

        <NavLink to="/company" className={navLinkClass}>
          <Building2 className="w-4 h-4 shrink-0" />
          <span>{labels.companySettings}</span>
        </NavLink>

        <div className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {labels.account}
        </div>

        <NavLink to="/profile" className={navLinkClass}>
          <User className="w-4 h-4 shrink-0" />
          <span>{labels.myProfile}</span>
        </NavLink>
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
        <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between shadow-xs">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{labels.currentRole}</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            isSuperAdmin ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30' : 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
          }`}>
            {isSuperAdmin ? labels.superAdmin : labels.admin}
          </span>
        </div>
        <button
          type="button"
          onClick={toggleLanguage}
          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/40 text-xs text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <span className="font-semibold text-violet-600 dark:text-violet-400">{isFA ? 'EN' : 'FA'}</span>
          <span>{isFA ? 'Switch to English' : 'تغییر به فارسی'}</span>
        </button>
      </div>
    </aside>
  );
};