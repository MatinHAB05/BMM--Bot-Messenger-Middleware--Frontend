import React, { useState, useEffect } from 'react';
import { User } from '../types/user';
import { usersApi } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ContactVerifier } from '../components/common/ContactVerifier';
import { formatDate } from '../utils/date';
import {
  User as UserIcon,
  Shield,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user: authUser, company, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { t, isFA } = useLanguage();

  const [user, setUser] = useState<User | null>(authUser);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await usersApi.getMe();
      setUser(data);
      setFirstName(data.firstname || data.first_name || '');
      setLastName(data.lastname || data.last_name || '');
      setUsername(data.username || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setEmailVerified(Boolean(data.is_email_verified));
      setPhoneVerified(Boolean(data.is_phone_verified));
    } catch (err: any) {
      showToast(err.message || 'Failed to load user profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstname || user.first_name || '');
      setLastName(user.lastname || user.last_name || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setEmailVerified(Boolean(user.is_email_verified));
      setPhoneVerified(Boolean(user.is_phone_verified));
    }
  }, [user]);

  const curEmail = (user?.email || '').trim();
  const curPhone = (user?.phone || '').trim();
  const isEmailChanged = user ? email.trim() !== curEmail : false;
  const isPhoneChanged = user ? phone.trim() !== curPhone : false;

  const hasUnverifiedContactChanges =
    (isEmailChanged && !!email.trim() && !emailVerified) ||
    (isPhoneChanged && !!phone.trim() && !phoneVerified);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (isEmailChanged && !!email.trim() && !emailVerified) {
      showToast(
        isFA
          ? 'لطفاً ابتدا ایمیل جدید را با کد تایید (OTP) اعتبارسنجی کنید'
          : 'Please verify your new email address with OTP before saving',
        'warning'
      );
      return;
    }

    if (isPhoneChanged && !!phone.trim() && !phoneVerified) {
      showToast(
        isFA
          ? 'لطفاً ابتدا شماره موبایل جدید را با کد تایید (OTP) اعتبارسنجی کنید'
          : 'Please verify your new phone number with OTP before saving',
        'warning'
      );
      return;
    }

    try {
      setIsSaving(true);

      // 1. Basic profile name
      const curF = user.firstname || user.first_name || '';
      const curL = user.lastname || user.last_name || '';
      if (firstName.trim() !== curF || lastName.trim() !== curL) {
        await usersApi.update(user.id, {
          firstname: firstName.trim(),
          lastname: lastName.trim(),
        });
      }

      // 2. Username
      if (username.trim() !== user.username) {
        await usersApi.updateUsername(user.id, username.trim());
      }

      // 3. Email (only if changed and verified)
      if (isEmailChanged && emailVerified) {
        await usersApi.updateEmail(user.id, email.trim());
      }

      // 4. Phone (only if changed and verified)
      if (isPhoneChanged && phoneVerified) {
        await usersApi.updatePhone(user.id, phone.trim());
      }

      await refreshUser();
      showToast(t('success'), 'success');
      fetchProfile();
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const role = user?.roles?.[0] || 'admin';
  const isSuperAdmin = role === 'super-admin';

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-blue-400" />
            {t('myProfile')}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('profileDesc')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchProfile}
          disabled={isLoading}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          {t('refresh')}
        </Button>
      </div>

      {user ? (
        <div className="space-y-6">
          {/* Identity Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {user.firstname || user.lastname || user.first_name || user.last_name
                      ? `${user.firstname || user.first_name || ''} ${user.lastname || user.last_name || ''}`.trim()
                      : user.username}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">@{user.username}</p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isSuperAdmin
                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                }`}
              >
                {isSuperAdmin ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : (
                  <Shield className="w-3.5 h-3.5" />
                )}
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
              <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                <p className="text-slate-400">{t('assignedCompany')}</p>
                <p className="font-semibold text-slate-200 mt-1">
                  {company?.name || 'Assigned Workspace'}
                </p>
              </div>
              <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                <p className="text-slate-400">{t('accountId')}</p>
                <p className="font-semibold text-slate-200 mt-1 font-mono">#{user.id}</p>
              </div>
              <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl">
                <p className="text-slate-400">{t('joined')}</p>
                <p className="font-semibold text-slate-200 mt-1">
                  {formatDate(user.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
              {isFA ? 'به‌روزرسانی اطلاعات فردی و ارتباطی' : 'Update Personal & Contact Details'}
            </h4>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('firstName')}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSaving}
                  required
                />
                <Input
                  label={t('lastName')}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              <Input
                label={t('username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSaving}
                required
                leftIcon={<UserIcon className="w-4 h-4 text-slate-500" />}
              />

              {/* Email with inline ContactVerifier */}
              <ContactVerifier
                type="email"
                label={t('emailAddress')}
                value={email}
                onChange={(val) => {
                  setEmail(val);
                  if (user && val.trim() === (user.email || '').trim()) {
                    setEmailVerified(Boolean(user.is_email_verified));
                  } else {
                    setEmailVerified(false);
                  }
                }}
                isVerified={emailVerified}
                onVerified={setEmailVerified}
                placeholder="user@example.com"
                disabled={isSaving}
              />

              {/* Phone with inline ContactVerifier */}
              <ContactVerifier
                type="phone"
                label={t('phoneNumber')}
                value={phone}
                onChange={(val) => {
                  setPhone(val);
                  if (user && val.trim() === (user.phone || '').trim()) {
                    setPhoneVerified(Boolean(user.is_phone_verified));
                  } else {
                    setPhoneVerified(false);
                  }
                }}
                isVerified={phoneVerified}
                onVerified={setPhoneVerified}
                placeholder="09123456789"
                disabled={isSaving}
              />

              {hasUnverifiedContactChanges && (
                <p className="text-center text-[11px] text-amber-400 flex items-center justify-center gap-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {isFA
                    ? 'جهت ثبت تغییرات، لطفاً ابتدا ایمیل یا شماره موبایل جدید را با کد تایید (OTP) اعتبارسنجی کنید.'
                    : 'Please verify any changed email or phone number with an OTP code before saving.'}
                </p>
              )}

              <div className="flex justify-end pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSaving}
                  disabled={isSaving || hasUnverifiedContactChanges}
                >
                  {t('save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-xs">{t('loading')}</p>
        </div>
      )}
    </div>
  );
};
