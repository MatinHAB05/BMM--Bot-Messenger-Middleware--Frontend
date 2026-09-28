import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { companiesApi } from '../../api/companies';
import { useToast } from '../../contexts/ToastContext';
import { UserRole } from '../../types/user';
import { UserPlus, Copy, Check, Clock, ShieldCheck, Share2 } from 'lucide-react';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [role, setRole] = useState<UserRole>('admin');
  const [expiresMinutes, setExpiresMinutes] = useState<number>(1440); // 24 hours
  const [isLoading, setIsLoading] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await companiesApi.sendRegisterOTP({
        role,
        expires_in_minutes: Number(expiresMinutes),
      });
      setGeneratedOTP(res.otp);
      setExpiresAt(res.expires_at || null);
      showToast('Invitation OTP generated successfully!', 'success');
      onSuccess?.();
    } catch (err: any) {
      showToast(err.message || 'Failed to generate invitation OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const inviteLink = generatedOTP
    ? `${window.location.origin}/register/invite`
    : '';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setGeneratedOTP(null);
    setExpiresAt(null);
    setCopied(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Invite New Company Member"
      maxWidth="md"
    >
      <div className="space-y-5">
        {!generatedOTP ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate a secure, single-use invitation OTP code. The invited member can use this code to register their account and automatically join your company workspace.
            </p>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Assigned Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === 'admin'
                      ? 'border-emerald-500/80 bg-emerald-950/30 text-emerald-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-sm font-semibold">Admin</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Standard operator. Can manage messaging and view company data.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('super-admin')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    role === 'super-admin'
                      ? 'border-blue-500/80 bg-blue-950/30 text-blue-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-sm font-semibold">Super Admin</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Full privileges. Can invite/delete users and modify company settings.
                  </p>
                </button>
              </div>
            </div>

            {/* Expiration Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Invitation Expiry
              </label>
              <select
                value={expiresMinutes}
                onChange={(e) => setExpiresMinutes(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={60}>1 Hour</option>
                <option value={720}>12 Hours</option>
                <option value={1440}>24 Hours (Recommended)</option>
                <option value={4320}>3 Days</option>
                <option value={10080}>7 Days</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Generate Invitation Code
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-center space-y-2">
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                Invitation OTP Code Generated
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl font-bold tracking-widest text-white bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                  {generatedOTP}
                </span>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => copyToClipboard(generatedOTP)}
                  leftIcon={copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                >
                  {copied ? 'Copied' : 'Copy Code'}
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">
                Expires: {expiresAt ? new Date(expiresAt).toLocaleString() : 'in ' + expiresMinutes + ' minutes'}
              </p>
            </div>

            {/* Registration Instructions */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
              <p className="font-semibold text-slate-200">How the invited member signs up:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Direct the user to the registration portal: <code className="text-blue-300">{inviteLink}</code></li>
                <li>They will enter this OTP code manually into the invitation form.</li>
                <li>Once validated, they will set up their username and password.</li>
              </ol>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                Generate Another
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
