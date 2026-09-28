import React, { useState, useEffect } from 'react';
import { authApi } from '../../api/auth';
import { getErrorMessage } from '../../utils/error';
import { useToast } from '../../contexts/ToastContext';
import { Input } from './Input';
import { Button } from './Button';
import {
  Mail,
  Phone,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Send,
  Edit2,
  Lock,
} from 'lucide-react';

interface ContactVerifierProps {
  type: 'email' | 'phone';
  value: string;
  onChange: (val: string) => void;
  isVerified: boolean;
  onVerified: (verified: boolean) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
}

export const ContactVerifier: React.FC<ContactVerifierProps> = ({
  type,
  value,
  onChange,
  isVerified,
  onVerified,
  required = false,
  disabled = false,
  placeholder,
  label,
}) => {
  const { showToast } = useToast();

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOTP = async () => {
    const identifier = value.trim();
    if (!identifier) {
      showToast(
        type === 'email' ? 'لطفاً ابتدا آدرس ایمیل را وارد کنید' : 'لطفاً ابتدا شماره موبایل را وارد کنید',
        'warning'
      );
      return;
    }

    try {
      setIsSending(true);
      await authApi.sendAuthOTP({
        type,
        identifier,
      });
      setOtpSent(true);
      setCountdown(120);
      showToast(`کد تایید یک‌بار مصرف برای ${type === 'email' ? 'ایمیل' : 'شماره موبایل'} ارسال شد.`, 'success');
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    const identifier = value.trim();
    if (!otpCode.trim()) {
      showToast('لطفاً کد تایید دریافتی را وارد کنید', 'warning');
      return;
    }

    try {
      setIsVerifying(true);
      const verified = await authApi.verifyAuthOTP({
        type,
        identifier,
        code: otpCode.trim(),
      });

      if (verified) {
        onVerified(true);
        setOtpSent(false);
        setOtpCode('');
        showToast(`${type === 'email' ? 'ایمیل' : 'شماره موبایل'} با موفقیت تایید شد!`, 'success');
      } else {
        showToast('کد تایید وارد شده نامعتبر یا منقضی شده است', 'error');
      }
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleEdit = () => {
    onVerified(false);
    setOtpSent(false);
    setOtpCode('');
  };

  const defaultLabel = type === 'email' ? 'Email Address' : 'Phone Number';
  const defaultPlaceholder = type === 'email' ? 'user@example.com' : '09123456789';

  return (
    <div className="space-y-2">
      {/* Input Row with verification badge */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 light:text-slate-700 uppercase tracking-wider">
            {label || defaultLabel} {required && <span className="text-rose-500">*</span>}
          </label>

          {isVerified ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 light:text-emerald-600 bg-emerald-950/40 light:bg-emerald-50 border border-emerald-800/60 light:border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
              <button
                type="button"
                onClick={handleEdit}
                className="text-[11px] text-slate-400 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800 underline"
              >
                Change
              </button>
            </div>
          ) : value.trim() ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 light:text-amber-600 bg-amber-950/40 light:bg-amber-50 border border-amber-800/50 light:border-amber-200 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-2.5 h-2.5" />
              Verification Required
            </span>
          ) : null}
        </div>

        <Input
          type={type === 'email' ? 'email' : 'tel'}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (isVerified) onVerified(false);
          }}
          disabled={disabled || isVerified}
          placeholder={placeholder || defaultPlaceholder}
          required={required}
          leftIcon={
            isVerified ? (
              <Lock className="w-4 h-4 text-emerald-400" />
            ) : type === 'email' ? (
              <Mail className="w-4 h-4 text-slate-500" />
            ) : (
              <Phone className="w-4 h-4 text-slate-500" />
            )
          }
        />
      </div>

      {/* Verification triggers when not yet verified */}
      {value.trim() && !isVerified && (
        <div className="p-3 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-100/70 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl space-y-2.5">
          {!otpSent ? (
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 light:text-slate-600 text-[11px]">
                {type === 'email'
                  ? 'برای اعتبارسنجی ایمیل، کد تایید ارسال کنید.'
                  : 'برای اعتبارسنجی شماره موبایل، کد تایید ارسال کنید.'}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSendOTP}
                isLoading={isSending}
                className="shrink-0 text-xs py-1"
                leftIcon={<Send className="w-3 h-3" />}
              >
                Send OTP Code
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 light:text-slate-700 font-medium flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                  کد تایید ۶ رقمی را وارد کنید:
                </span>
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={countdown > 0 || isSending}
                  className="text-[11px] text-blue-400 hover:text-blue-300 light:text-blue-600 disabled:opacity-50"
                >
                  {countdown > 0 ? `ارسال مجدد (${countdown}s)` : 'ارسال مجدد کد'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-36 bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-lg px-3 py-1.5 text-center font-mono text-sm tracking-widest text-slate-100 light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleVerifyOTP}
                  isLoading={isVerifying}
                  disabled={!otpCode.trim()}
                >
                  Confirm & Verify
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
