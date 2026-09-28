import React, { useState } from 'react';
import { User } from '../../types/user';
import { usersApi } from '../../api/users';
import { useToast } from '../../contexts/ToastContext';
import { usePermission } from '../../permissions/usePermission';
import { useLanguage } from '../../contexts/LanguageContext';
import { PermissionGuard } from '../../permissions/PermissionGuard';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EditUserModal } from './EditUserModal';
import { formatDate } from '../../utils/date';
import {
  Shield,
  ShieldCheck,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface UserListTableProps {
  users: User[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const UserListTable: React.FC<UserListTableProps> = ({
  users,
  isLoading,
  onRefresh,
}) => {
  const { showToast } = useToast();
  const { hasPermission } = usePermission();
  const { t, isFA } = useLanguage();

  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDeleteUser = hasPermission('user', 'delete');
  const canUpdateUser = hasPermission('user', 'update') || hasPermission('user', 'update-roles');

  const handleDelete = async () => {
    if (!selectedUserForDelete) return;
    try {
      setIsDeleting(true);
      await usersApi.delete(selectedUserForDelete.id);
      showToast(t('success'), 'success');
      setSelectedUserForDelete(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove user', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">{isFA ? 'کاربر' : 'Member'}</th>
                <th className="py-3 px-4">{t('role')}</th>
                <th className="py-3 px-4">{t('email')}</th>
                <th className="py-3 px-4">{t('phone')}</th>
                <th className="py-3 px-4">{t('joinedDate')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>{t('loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium">{isFA ? 'هیچ عضوی یافت نشد' : 'No company members found'}</p>
                    <p className="text-xs text-slate-600 mt-1">{isFA ? 'از دکمه دعوت عضو برای افزودن افراد استفاده کنید.' : 'Use "Invite Member" above to add your team.'}</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const role = user.roles?.[0] || 'admin';
                  const isSuperAdmin = role === 'super-admin';

                  const isEmailVerified = Boolean(
                    (user as any).is_email_verified === true ||
                    (user as any).email_verified === true ||
                    (user as any).IsEmailVerified === true ||
                    (user as any).emailVerified === true ||
                    (user as any).is_email_verified === 1 ||
                    (user as any).email_verified === 1 ||
                    (user as any).is_email_verified === 'true' ||
                    (user as any).email_verified === 'true'
                  );

                  const isPhoneVerified = Boolean(
                    (user as any).is_phone_verified === true ||
                    (user as any).phone_verified === true ||
                    (user as any).IsPhoneVerified === true ||
                    (user as any).phoneVerified === true ||
                    (user as any).is_phone_verified === 1 ||
                    (user as any).phone_verified === 1 ||
                    (user as any).is_phone_verified === 'true' ||
                    (user as any).phone_verified === 'true'
                  );

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Member Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 shrink-0">
                            {user.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">
                              {user.firstname || user.lastname || user.first_name || user.last_name
                                ? `${user.firstname || user.first_name || ''} ${user.lastname || user.last_name || ''}`.trim()
                                : user.username}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">@{user.username}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                            isSuperAdmin
                              ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
                              : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                          }`}
                        >
                          {isSuperAdmin ? (
                            <ShieldCheck className="w-3 h-3 text-purple-400" />
                          ) : (
                            <Shield className="w-3 h-3 text-emerald-400" />
                          )}
                          {isSuperAdmin ? t('superAdmin') : t('admin')}
                        </span>
                      </td>

                      {/* Email & Verification */}
                      <td className="py-3 px-4">
                        {user.email ? (
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <span>{user.email}</span>
                            {isEmailVerified ? (
                              <span title={t('verified')}><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /></span>
                            ) : (
                              <span
                                className="text-[10px] text-amber-400 bg-amber-950/50 px-1 rounded border border-amber-900/50"
                                title={t('unverified')}
                              >
                                {t('unverified')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Phone & Verification */}
                      <td className="py-3 px-4">
                        {user.phone ? (
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <span>{user.phone}</span>
                            {isPhoneVerified ? (
                              <span title={t('verified')}><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /></span>
                            ) : (
                              <span
                                className="text-[10px] text-amber-400 bg-amber-950/50 px-1 rounded border border-amber-900/50"
                                title={t('unverified')}
                              >
                                {t('unverified')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-slate-400">
                        {formatDate(user.created_at)}
                      </td>

                      {/* RBAC Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit User Button */}
                          <PermissionGuard
                            resource="user"
                            action="update"
                            mode="disable"
                            fallback={
                              <button
                                disabled
                                className="p-1.5 text-slate-600 cursor-not-allowed rounded-lg"
                                title={t('editMember')}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            }
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedUserForEdit(user)}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title={t('editMember')}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </PermissionGuard>

                          {/* Delete User Button */}
                          <PermissionGuard
                            resource="user"
                            action="delete"
                            mode="disable"
                            fallback={
                              <button
                                disabled
                                className="p-1.5 text-slate-600 cursor-not-allowed rounded-lg"
                                title={t('removeMember')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            }
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedUserForDelete(user)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                              title={t('removeMember')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        user={selectedUserForEdit}
        isOpen={!!selectedUserForEdit}
        onClose={() => setSelectedUserForEdit(null)}
        onUserUpdated={onRefresh}
      />

      {/* Delete User Confirmation */}
      <ConfirmDialog
        isOpen={!!selectedUserForDelete}
        onClose={() => setSelectedUserForDelete(null)}
        onConfirm={handleDelete}
        title={t('removeMember')}
        message={t('confirmRemoveUser', { username: selectedUserForDelete?.username || '' })}
        confirmText={t('removeMember')}
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};