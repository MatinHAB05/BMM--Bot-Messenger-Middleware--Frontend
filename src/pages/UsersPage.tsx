import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../types/user';
import { usersApi } from '../api/users';
import { useToast } from '../contexts/ToastContext';
import { usePermission } from '../permissions/usePermission';
import { useLanguage } from '../contexts/LanguageContext';
import { PermissionGuard } from '../permissions/PermissionGuard';
import { UserListTable } from '../components/users/UserListTable';
import { InviteUserModal } from '../components/users/InviteUserModal';
import { Button } from '../components/common/Button';
import { Users, UserPlus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { showToast } = useToast();
  const { hasPermission } = usePermission();
  const { t, isFA } = useLanguage();

  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await usersApi.list(page, pageSize);
      setUsers(res.users || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch team members', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const canInvite = hasPermission('company', 'send-register-otp');
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            {t('teamMembersTitle')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('teamMembersDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {t('refresh')}
          </Button>

          <PermissionGuard
            resource="company"
            action="send-register-otp"
            mode="disable"
            fallback={
              <Button
                variant="primary"
                size="sm"
                disabled
                title={isFA ? 'تنها سوپر ادمین مجاز به ایجاد کد دعوت است' : 'Only Super Admins can generate invitation OTP codes'}
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              >
                {t('inviteMember')}
              </Button>
            }
          >
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowInviteModal(true)}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              {t('inviteMember')}
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Unified User Table */}
      <UserListTable
        users={users}
        isLoading={isLoading}
        onRefresh={fetchUsers}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <span className="text-slate-400">
            {isFA
              ? `صفحه ${page} از ${totalPages} (مجموع ${total} عضو)`
              : `Showing Page ${page} of ${totalPages} (Total ${total} members)`}
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              {isFA ? 'قبلی' : 'Previous'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              {isFA ? 'بعدی' : 'Next'}
            </Button>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
};