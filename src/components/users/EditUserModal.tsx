import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types/user';
import { usersApi } from '../../api/users';
import { useToast } from '../../contexts/ToastContext';
import { usePermission } from '../../permissions/usePermission';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Shield, Mail, Phone, User as UserIcon } from 'lucide-react';

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const { showToast } = useToast();
  const { hasPermission } = usePermission();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [isSaving, setIsSaving] = useState(false);

  const canUpdateInfo = hasPermission('user', 'update');
  const canUpdateRole = hasPermission('user', 'update-roles');
  const canUpdateEmail = hasPermission('user', 'update-email');
  const canUpdatePhone = hasPermission('user', 'update-phone');
  const canUpdateUsername = hasPermission('user', 'update-username');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstname || user.first_name || '');
      setLastName(user.lastname || user.last_name || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      const primaryRole = (user.roles?.[0] as UserRole) || 'admin';
      setSelectedRole(primaryRole);
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      // 1. Update basic info if changed and permitted
      const curF = user.firstname || user.first_name || '';
      const curL = user.lastname || user.last_name || '';
      if (canUpdateInfo && (firstName !== curF || lastName !== curL)) {
        await usersApi.update(user.id, {
          firstname: firstName.trim(),
          lastname: lastName.trim(),
        });
      }

      // 2. Update role if changed and permitted
      const currentRole = user.roles?.[0] || 'admin';
      if (canUpdateRole && selectedRole !== currentRole) {
        await usersApi.updateRoles(user.id, [selectedRole]);
      }

      // 3. Update username if changed and permitted
      if (canUpdateUsername && username.trim() !== user.username) {
        await usersApi.updateUsername(user.id, username.trim());
      }

      // 4. Update email if changed and permitted
      if (canUpdateEmail && email.trim() !== user.email) {
        await usersApi.updateEmail(user.id, email.trim());
      }

      // 5. Update phone if changed and permitted
      if (canUpdatePhone && phone.trim() !== user.phone) {
        await usersApi.updatePhone(user.id, phone.trim());
      }

      showToast('User updated successfully', 'success');
      onUserUpdated();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Member Information & Permissions"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Identity Banner */}
        <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-bold text-blue-400">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              {(user.firstname || user.first_name) ? `${user.firstname || user.first_name} ${user.lastname || user.last_name || ''}`.trim() : user.username}
            </h4>
            <p className="text-xs text-slate-400">User ID: #{user.id}</p>
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={!canUpdateInfo || isSaving}
          />
          <Input
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={!canUpdateInfo || isSaving}
          />
        </div>

        {/* Username */}
        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={!canUpdateUsername || isSaving}
          leftIcon={<UserIcon className="w-4 h-4 text-slate-500" />}
          helperText={!canUpdateUsername ? 'Modifying username requires administrative privileges' : undefined}
        />

        {/* Role Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            Company Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!canUpdateRole || isSaving}
              onClick={() => setSelectedRole('admin')}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedRole === 'admin'
                  ? 'border-emerald-500/80 bg-emerald-950/30 text-emerald-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <p className="text-xs font-semibold">Admin</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Operator privileges</p>
            </button>

            <button
              type="button"
              disabled={!canUpdateRole || isSaving}
              onClick={() => setSelectedRole('super-admin')}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedRole === 'super-admin'
                  ? 'border-blue-500/80 bg-blue-950/30 text-blue-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <p className="text-xs font-semibold">Super Admin</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Full company control</p>
            </button>
          </div>
          {!canUpdateRole && (
            <p className="text-[11px] text-slate-500">Only Super Admins can alter member roles.</p>
          )}
        </div>

        {/* Email */}
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!canUpdateEmail || isSaving}
          leftIcon={<Mail className="w-4 h-4 text-slate-500" />}
        />

        {/* Phone */}
        <Input
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={!canUpdatePhone || isSaving}
          leftIcon={<Phone className="w-4 h-4 text-slate-500" />}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
