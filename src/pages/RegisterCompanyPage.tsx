import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { getErrorMessage } from '../utils/error';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ContactVerifier } from '../components/common/ContactVerifier';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { Building2, User, Lock, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';

export const RegisterCompanyPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Contacts & Verifications
  const [email, setEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [phone, setPhone] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleNameChange = (val: string) => {
    setCompanyName(val);
    if (!companySlug) {
      setCompanySlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
      );
    }
  };

  // Check if at least one contact is provided and all provided contacts are verified
  const hasAtLeastOneContact = Boolean(email.trim() || phone.trim());
  const isEmailValid = !email.trim() || isEmailVerified;
  const isPhoneValid = !phone.trim() || isPhoneVerified;
  const isReadyToSubmit = hasAtLeastOneContact && isEmailValid && isPhoneValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasAtLeastOneContact) {
      showToast('وارد کردن حداقل یکی از موارد ایمیل یا شماره موبایل الزامی است', 'warning');
      return;
    }

    if (email.trim() && !isEmailVerified) {
      showToast('لطفاً قبل از ثبت‌نام، ایمیل خود را با کد تایید (OTP) اعتبارسنجی کنید', 'warning');
      return;
    }

    if (phone.trim() && !isPhoneVerified) {
      showToast('لطفاً قبل از ثبت‌نام، شماره موبایل خود را با کد تایید (OTP) اعتبارسنجی کنید', 'warning');
      return;
    }

    try {
      setIsLoading(true);
      await authApi.registerWithCompany({
        company: {
          name: companyName.trim(),
          code: companySlug.trim(),
          description: companyDescription.trim(),
        },
        me: {
          username: username.trim(),
          password,
          firstname: firstName.trim(),
          lastname: lastName.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        },
      });

      showToast('ثبت‌نام شرکت و کاربر با موفقیت انجام شد! اکنون می‌توانید وارد شوید.', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 dark:bg-slate-950 light:bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors">
      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center relative z-10 px-4 sm:px-0">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-900 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </Link>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mb-2">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100 light:text-slate-900">
          Register New Organization
        </h2>
        <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
          Create your company workspace and your Super Admin account
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 py-8 px-6 shadow-xl rounded-2xl sm:px-9 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Company Profile */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Company Name"
                  value={companyName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  required
                />
                <Input
                  label="Workspace Code / Slug"
                  value={companySlug}
                  onChange={(e) => setCompanySlug(e.target.value)}
                  placeholder="acme-corp"
                  required
                />
              </div>
              <Input
                label="Company Description (Optional)"
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                placeholder="Enterprise customer support & notification gateway"
              />
            </div>

            {/* Section 2: Super Admin Account */}
            <div className="space-y-4 pt-3 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" />
                Super Admin Account
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
                <Input
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="superadmin"
                  required
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
              </div>

              {/* Section 3: Contact Verification (Pre-Verification Required by Backend) */}
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-blue-950/30 dark:bg-blue-950/30 light:bg-blue-50 border border-blue-800/40 dark:border-blue-800/40 light:border-blue-200 rounded-xl text-xs text-blue-300 dark:text-blue-300 light:text-blue-800 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    Contact Verification (Required)
                  </p>
                  <p className="text-[11px] text-slate-400 light:text-slate-600">
                    وارد کردن حداقل یکی از موارد (ایمیل یا شماره موبایل) و اعتبارسنجی آن با کد OTP قبل از ثبت‌نام الزامی است.
                  </p>
                </div>

                <ContactVerifier
                  type="email"
                  value={email}
                  onChange={setEmail}
                  isVerified={isEmailVerified}
                  onVerified={setIsEmailVerified}
                  label="Email Address"
                  placeholder="admin@company.com"
                />

                <ContactVerifier
                  type="phone"
                  value={phone}
                  onChange={setPhone}
                  isVerified={isPhoneVerified}
                  onVerified={setIsPhoneVerified}
                  label="Phone Number"
                  placeholder="09123456789"
                />
              </div>
            </div>

            {/* Validation warning if contacts unverified */}
            {!isReadyToSubmit && hasAtLeastOneContact && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/40 light:bg-amber-50 border border-amber-800/50 light:border-amber-200 text-xs text-amber-300 light:text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  لطفاً پیش از ثبت نهایی، ایمیل یا شماره موبایل خود را با کد تایید ارسالی تایید فرمایید.
                </span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              disabled={!isReadyToSubmit}
            >
              Complete Registration
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
