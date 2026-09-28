import { AxiosError } from 'axios';

const ERROR_CODE_TRANSLATIONS: Record<string, string> = {
  // Auth & OTP
  INVALID_CREDENTIALS: 'نام کاربری یا رمز عبور اشتباه است (Invalid credentials)',
  NOT_VERIFIED_EMAIL_CREDENTIAL: 'ایمیل شما هنوز تایید نشده است. ابتدا کد تایید (OTP) را ارسال و تایید کنید.',
  NOT_VERIFIED_PHONE_CREDENTIAL: 'شماره موبایل شما هنوز تایید نشده است. ابتدا کد تایید (OTP) را ارسال و تایید کنید.',
  NOT_VERIFIED_EMAIL_OTP: 'کد تایید ایمیل وارد نشده یا منقضی شده است.',
  NOT_VERIFIED_PHONE_OTP: 'کد تایید شماره موبایل وارد نشده یا منقضی شده است.',
  NOT_VERIFIED_CREDENTIALS: 'اطلاعات تماس (ایمیل یا شماره تلفن) تایید نشده است.',
  OTP_INVALID: 'کد تایید وارد شده نامعتبر یا منقضی شده است.',
  OTP_NOT_FOUND: 'کد تایید یافت نشد یا زمان آن پایان یافته است. لطفاً مجدداً کد ارسال کنید.',
  OTP_UNSUPPORTED_TYPE: 'نوع کد تایید پشتیبانی نمی‌شود.',
  TOKEN_INVALID: 'توکن دسترسی نامعتبر است. لطفاً مجدداً وارد شوید.',
  TOKEN_EXPIRED: 'اعتبار ورود شما منقضی شده است. لطفاً مجدداً وارد شوید.',
  TOKEN_REVOKED: 'نشست ورود شما لغو شده است.',
  MISSING_TOKEN: 'توکن احراز هویت ارسال نشده است.',
  REFRESH_TOKEN_INVALID: 'نشست تمدید توکن نامعتبر است.',
  BAD_LOGIN_REQUEST: 'درخواست ورود نامعتبر است. فقط یکی از حالت‌های نام کاربری، ایمیل یا موبایل باید ارسال شود.',

  // Users
  USER_NOT_FOUND: 'کاربری با این مشخصات یافت نشد.',
  USER_ALREADY_EXISTS: 'کاربری با این مشخصات قبلاً ثبت شده است.',
  USER_EMAIL_ALREADY_EXISTS: 'این ایمیل قبلاً توسط کاربر دیگری ثبت شده است.',
  USER_PHONE_ALREADY_EXISTS: 'این شماره موبایل قبلاً توسط کاربر دیگری ثبت شده است.',
  USER_USERNAME_ALREADY_EXISTS: 'این نام کاربری قبلاً انتخاب شده است. لطفاً نام کاربری دیگری انتخاب کنید.',
  USER_INACTIVE: 'حساب کاربری شما غیرفعال شده است. با مدیر سیستم تماس بگیرید.',
  EMPTY_PHONE_EMAIL: 'وارد کردن حداقل یکی از موارد ایمیل یا شماره موبایل الزامی است.',

  // Company
  COMPANY_NOT_FOUND: 'شرکت یا محیط کاربری یافت نشد.',
  COMPANY_INACTIVE: 'حساب شرکت غیرفعال شده است.',
  COMPANY_ALREADY_EXISTS: 'کد یا نام این شرکت قبلاً ثبت شده است.',

  // Chats & Messaging
  CHAT_NOT_FOUND: 'چت مورد نظر یافت نشد.',
  CHAT_ALREADY_EXISTS: 'این چت قبلاً متصل شده است.',
  CHAT_ALREADY_REG_WITH_COMPANY: 'این چت قبلاً به همین شرکت متصل شده است.',
  MESSAGE_NOT_FOUND: 'پیام مورد نظر یافت نشد.',
  ATTACHMENT_NOT_FOUND: 'فایل پیوست یافت نشد.',
  PLATFORM_FORBIDDEN: 'دسترسی بات به این گروه یا کانال مسدود شده است (مطمئن شوید بات ادمین است).',
  PLATFORM_BAD_REQUEST: 'درخواست ارسالی توسط پلتفرم پیام‌رسان رد شد.',
  PLATFORM_UNAUTHORIZED: 'اعتبار توکن بات پیام‌رسان نامعتبر است.',
  PLATFORM_RATE_LIMITED: 'پلتفرم پیام‌رسان به دلیل درخواست‌های زیاد محدود شده است. لطفاً صبر کنید.',
  PLATFORM_TARGET_NOT_FOUND: 'کانال یا گروه پیام‌رسان مورد نظر حذف شده یا وجود ندارد.',

  // RBAC & System
  FORBIDDEN: 'شما دسترسی لازم برای انجام این عملیات را ندارید.',
  ROLE_NOT_FOUND: 'نقش کاربری یافت نشد.',
  DATABASE_ERROR: 'خطای پایگاه داده در سرور رخ داده است.',
  RATE_LIMITED: 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً چند لحظه صبر کنید.',
  BAD_REQUEST: 'اطلاعات ارسالی به سرور ناقص یا نامعتبر است.',
  INTERNAL_ERROR: 'خطای داخلی در سرور رخ داد. لطفاً لاگ‌های سیستم را بررسی کنید.',
};

export function getErrorMessage(error: any): string {
  if (!error) return 'خطای نامشخصی رخ داده است';

  // If already a processed friendly string
  if (typeof error === 'string') return error;

  // Handle Axios response
  if (error.response && error.response.data) {
    const data = error.response.data;

    // Check backend error code
    if (data.code && ERROR_CODE_TRANSLATIONS[data.code]) {
      return ERROR_CODE_TRANSLATIONS[data.code];
    }

    // Check backend explicit error message
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }

    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
  }

  // Handle HTTP status fallback
  if (error.response && error.response.status) {
    switch (error.response.status) {
      case 400:
        return 'اطلاعات ارسالی نامعتبر است (400 Bad Request)';
      case 401:
        return 'احراز هویت انجام نشد یا نشست شما منقضی شده است (401 Unauthorized)';
      case 403:
        return 'شما مجوز دسترسی به این بخش را ندارید (403 Forbidden)';
      case 404:
        return 'آیتم مورد نظر در سرور یافت نشد (404 Not Found)';
      case 409:
        return 'تداخل داده‌ها رخ داده است؛ ممکن است این مورد قبلاً ثبت شده باشد (409 Conflict)';
      case 422:
        return 'داده‌های فرم اعتبارسنجی نشدند (422 Unprocessable Entity)';
      case 429:
        return 'درخواست‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید (429 Too Many Requests)';
      case 500:
      case 502:
      case 503:
        return 'خطای سرور رخ داده است. لطفاً وضعیت سرور را بررسی کنید (500 Server Error)';
    }
  }

  // Network / Connection Error
  if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
    return 'عدم برقراری ارتباط با سرور. لطفاً بررسی کنید که سرور بک‌اند (پورت 15014) در حال اجرا باشد.';
  }

  return error.message || 'خطایی در پردازش رخ داده است';
}
