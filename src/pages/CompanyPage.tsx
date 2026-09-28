import React, { useState, useEffect } from 'react';
import { Company } from '../types/company';
import { companiesApi } from '../api/companies';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePermission } from '../permissions/usePermission';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatDate } from '../utils/date';
import {
  Building2,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const CompanyPage: React.FC = () => {
  const { company: authCompany, refreshCompany } = useAuth();
  const { showToast } = useToast();
  const { hasPermission } = usePermission();
  const { t, isFA } = useLanguage();

  const [company, setCompany] = useState<Company | null>(authCompany);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const canUpdate = hasPermission('company', 'update');
  const canDelete = hasPermission('company', 'delete');

  const fetchCompany = async () => {
    try {
      setIsLoading(true);
      const data = await companiesApi.getMe();
      setCompany(data);
      setName(data.name || '');
      setDescription(data.description || '');
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch company profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    if (!canUpdate) {
      showToast(isFA ? 'شما دسترسی ویرایش تنظیمات شرکت را ندارید' : 'You do not have permission to modify company settings', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await companiesApi.update(company.id, {
        name: name.trim(),
        description: description.trim(),
      });
      setCompany(updated);
      await refreshCompany();
      showToast(t('success'), 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update company settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!company) return;
    try {
      setIsDeleting(true);
      await companiesApi.delete(company.id);
      showToast(t('success'), 'success');
      setShowDeactivateConfirm(false);
      fetchCompany();
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate company', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            {isFA ? 'پروفایل و تنظیمات شرکت' : 'Company Organization Profile'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isFA ? 'مدیریت پیکربندی و اطلاعات فضای کاری شرکت.' : 'Manage your workspace configuration and administrative metadata.'}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fetchCompany}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          {t('refresh')}
        </Button>
      </div>

      {company ? (
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-bold text-lg text-blue-400">
                  {company.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{company.name}</h3>
                  <p className="text-xs font-mono text-slate-400">code: {company.code}</p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  company.is_active
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                    : 'bg-red-950/60 text-red-400 border border-red-800/60'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    company.is_active ? 'bg-emerald-400' : 'bg-red-400'
                  }`}
                />
                {company.is_active ? (isFA ? 'فضای کاری فعال' : 'Workspace Active') : (isFA ? 'فضای کاری تعلیق شده' : 'Workspace Suspended')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-800/80">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5">{isFA ? 'شناسه شرکت' : 'Company ID'}</span>
                <span className="font-mono text-slate-200">#{company.id}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5">{isFA ? 'تاریخ ایجاد' : 'Created Date'}</span>
                <span className="text-slate-200">{formatDate(company.created_at)}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5">{isFA ? 'آخرین به‌روزرسانی' : 'Last Updated'}</span>
                <span className="text-slate-200">
                  {company.updated_at ? formatDate(company.updated_at) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Settings Form */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-400" />
                  {isFA ? 'تنظیمات سازمان' : 'Organization Settings'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isFA ? 'به‌روزرسانی نام عمومی و یادداشت‌های توضیحی.' : 'Update public display name and descriptive notes.'}
                </p>
              </div>

              {!canUpdate && (
                <span className="text-xs text-amber-400/80 bg-amber-950/40 border border-amber-900/50 px-2.5 py-1 rounded-lg">
                  {isFA ? 'فقط خواندنی (نیاز به دسترسی سوپر ادمین)' : 'Read-Only (Super Admin privilege required)'}
                </span>
              )}
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <Input
                label={t('companyName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canUpdate || isSaving}
                placeholder="e.g. Acme Corporation"
                required
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {t('companyDesc')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!canUpdate || isSaving}
                  rows={3}
                  placeholder={isFA ? 'توضیحات و حوزه فعالیت سازمان را شرح دهید...' : "Describe your organization's business or customer service operations..."}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                />
              </div>

              {canUpdate && (
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSaving}
                    disabled={!name.trim()}
                  >
                    {t('saveChanges')}
                  </Button>
                </div>
              )}
            </form>
          </div>

          {/* Danger Zone: Deactivate Workspace */}
          {canDelete && (
            <div className="p-5 rounded-2xl bg-red-950/20 border border-red-900/50 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  {isFA ? 'غیرفعال‌سازی فضای کاری شرکت' : 'Deactivate Organization Workspace'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                  {isFA ? 'غیرفعال‌سازی این شرکت دسترسی تمام کاربران را مسدود و همگام‌سازی بات‌ها را متوقف می‌کند.' : 'Deactivating this company workspace will immediately revoke access for all team members and halt message synchronization.'}
                </p>
              </div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setShowDeactivateConfirm(true)}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                {isFA ? 'غیرفعال کردن' : 'Deactivate'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-xs">{t('loading')}</p>
        </div>
      )}

      {/* Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeactivateConfirm}
        onClose={() => setShowDeactivateConfirm(false)}
        onConfirm={handleDeactivate}
        title={isFA ? 'تأیید غیرفعال‌سازی' : 'Confirm Workspace Deactivation'}
        message={isFA ? 'آیا کاملاً مطمئن هستید که می‌خواهید کل فضای کاری شرکت را غیرفعال کنید؟' : 'Are you completely sure you want to deactivate your entire organization workspace?'}
        confirmText={isFA ? 'بله، غیرفعال کن' : 'Yes, Deactivate Workspace'}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};