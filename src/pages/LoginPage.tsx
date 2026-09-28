import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authApi } from '../api/auth';
import { getErrorMessage } from '../utils/error';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ThemeToggle } from '../components/common/ThemeToggle';
import {
  MessageSquare,
  Lock,
  User as UserIcon,
  Mail,
  Phone,
  KeyRound,
  ArrowRight,
  Send,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

type AuthMode = 'username' | 'email' | 'phone';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<AuthMode>('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Email / Phone OTP state
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Switch mode helper
  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setOtpSent(false);
    setOtpCode('');
  };

  // Timer countdown for resending OTP
  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Mode 1: Username + Password Login
  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      showToast('لطفاً نام کاربری و رمز عبور را وارد کنید', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({
        default: {
          username: username.trim(),
          password,
        },
      });
      showToast('ورود با موفقیت انجام شد. خوش آمدید!', 'success');
      navigate('/messaging');
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send OTP for Email or Phone
  const handleSendOTP = async () => {
    const identifier = mode === 'email' ? email.trim() : phone.trim();
    if (!identifier) {
      showToast(
        mode === 'email' ? 'لطفاً آدرس ایمیل را وارد کنید' : 'لطفاً شماره موبایل را وارد کنید',
        'warning'
      );
      return;
    }

    try {
      setIsSendingOTP(true);
      await authApi.sendAuthOTP({
        type: mode === 'email' ? 'email' : 'phone',
        identifier,
      });

      setOtpSent(true);
      setCountdown(120); // 2 minutes cooldown
      showToast(
        `کد تایید یک‌بار مصرف به ${mode === 'email' ? 'ایمیل' : 'شماره موبایل'} شما ارسال شد.`,
        'success'
      );
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsSendingOTP(false);
    }
  };

  // Mode 2 & 3: Verify OTP and Login (NO PASSWORD REQUIRED)
  const handleVerifyOTPAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = mode === 'email' ? email.trim() : phone.trim();
    if (!identifier) {
      showToast('لطفاً اطلاعات تماس را وارد کنید', 'warning');
      return;
    }
    if (!otpCode.trim()) {
      showToast('لطفاً کد تایید دریافتی را وارد کنید', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Verify OTP with backend
      const verified = await authApi.verifyAuthOTP({
        type: mode === 'email' ? 'email' : 'phone',
        identifier,
        code: otpCode.trim(),
      });

      if (!verified) {
        showToast('کد تایید وارد شده نامعتبر یا منقضی شده است', 'error');
        return;
      }

      // 2. Perform Passwordless Login with verified OTP
      if (mode === 'email') {
        await login({ email_option: { email: identifier } });
      } else {
        await login({ phone_option: { phone: identifier } });
      }

      showToast('احراز هویت با موفقیت انجام شد. خوش آمدید!', 'success');
      navigate('/messaging');
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 dark:bg-slate-950 light:bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Header Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-3 shadow-lg shadow-blue-500/10">
          <MessageSquare className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100 light:text-slate-900">
          Sign In to BMM Dashboard
        </h2>
        <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
          Centralized Multi-Messenger Gateway (Telegram & Bale)
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 py-8 px-6 shadow-xl rounded-2xl sm:px-9 backdrop-blur-xl">
          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 dark:bg-slate-950 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleModeChange('username')}
              className={`py-2 rounded-lg transition-all ${
                mode === 'username'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900'
              }`}
            >
              Username
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('email')}
              className={`py-2 rounded-lg transition-all ${
                mode === 'email'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900'
              }`}
            >
              Email OTP
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('phone')}
              className={`py-2 rounded-lg transition-all ${
                mode === 'phone'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900'
              }`}
            >
              Phone OTP
            </button>
          </div>

          {/* Mode 1: Username + Password */}
          {mode === 'username' && (
            <form onSubmit={handleUsernameLogin} className="space-y-4">
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                leftIcon={<UserIcon className="w-4 h-4 text-slate-500" />}
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                leftIcon={<Lock className="w-4 h-4 text-slate-500" />}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In with Password
              </Button>
            </form>
          )}

          {/* Mode 2: Email OTP (NO PASSWORD) */}
          {mode === 'email' && (
            <div className="space-y-4">
              {!otpSent ? (
                <div className="space-y-4">
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    leftIcon={<Mail className="w-4 h-4 text-slate-500" />}
                    helperText="A single-use verification code (OTP) will be sent to this email address."
                  />

                  <Button
                    type="button"
                    variant="primary"
                    className="w-full"
                    onClick={handleSendOTP}
                    isLoading={isSendingOTP}
                    disabled={!email.trim()}
                    rightIcon={<Send className="w-4 h-4" />}
                  >
                    Send Login Code
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOTPAndLogin} className="space-y-4">
                  <div className="p-3 bg-blue-950/40 dark:bg-blue-950/40 light:bg-blue-50 border border-blue-800/60 dark:border-blue-800/60 light:border-blue-200 rounded-xl text-xs text-blue-300 dark:text-blue-300 light:text-blue-800 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-blue-400" />
                      Login Code Sent to {email}
                    </p>
                    <p className="text-[11px] text-slate-400 light:text-slate-600">
                      Enter the 6-digit OTP code below to sign in without a password.
                    </p>
                  </div>

                  <Input
                    label="6-Digit OTP Code"
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="e.g. 123456"
                    required
                    autoFocus
                    leftIcon={<KeyRound className="w-4 h-4 text-blue-400" />}
                  />

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 underline underline-offset-2"
                    >
                      Change Email
                    </button>

                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={countdown > 0 || isSendingOTP}
                      className="text-blue-400 hover:text-blue-300 light:text-blue-600 font-medium disabled:opacity-50"
                    >
                      {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full mt-2"
                    isLoading={isSubmitting}
                    disabled={!otpCode.trim()}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Verify & Sign In
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Mode 3: Phone OTP (NO PASSWORD) */}
          {mode === 'phone' && (
            <div className="space-y-4">
              {!otpSent ? (
                <div className="space-y-4">
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789 or +989123456789"
                    required
                    leftIcon={<Phone className="w-4 h-4 text-slate-500" />}
                    helperText="A single-use verification code (OTP) will be sent to your phone."
                  />

                  <Button
                    type="button"
                    variant="primary"
                    className="w-full"
                    onClick={handleSendOTP}
                    isLoading={isSendingOTP}
                    disabled={!phone.trim()}
                    rightIcon={<Send className="w-4 h-4" />}
                  >
                    Send Login Code
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOTPAndLogin} className="space-y-4">
                  <div className="p-3 bg-emerald-950/40 dark:bg-emerald-950/40 light:bg-emerald-50 border border-emerald-800/60 dark:border-emerald-800/60 light:border-emerald-200 rounded-xl text-xs text-emerald-300 dark:text-emerald-300 light:text-emerald-800 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      Login Code Sent to {phone}
                    </p>
                    <p className="text-[11px] text-slate-400 light:text-slate-600">
                      Enter the 6-digit OTP code below to sign in without a password.
                    </p>
                  </div>

                  <Input
                    label="6-Digit OTP Code"
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="e.g. 123456"
                    required
                    autoFocus
                    leftIcon={<KeyRound className="w-4 h-4 text-emerald-400" />}
                  />

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 underline underline-offset-2"
                    >
                      Change Phone Number
                    </button>

                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={countdown > 0 || isSendingOTP}
                      className="text-emerald-400 hover:text-emerald-300 light:text-emerald-600 font-medium disabled:opacity-50"
                    >
                      {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full mt-2"
                    isLoading={isSubmitting}
                    disabled={!otpCode.trim()}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Verify & Sign In
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Quick Registration Links */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 space-y-3 text-xs text-center">
            <p className="text-slate-400 light:text-slate-600">
              Need a workspace for your organization?{' '}
              <Link
                to="/register/company"
                className="text-blue-400 hover:text-blue-300 light:text-blue-600 font-semibold underline underline-offset-2"
              >
                Register Company
              </Link>
            </p>
            <p className="text-slate-400 light:text-slate-600">
              Received an invitation code?{' '}
              <Link
                to="/register/invite"
                className="text-emerald-400 hover:text-emerald-300 light:text-emerald-600 font-semibold underline underline-offset-2"
              >
                Accept Member Invite
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
