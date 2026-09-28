export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  code?: string;
  error?: string;
}

export interface TokenPair {
  access_token: string;
  access_token_expires_at: string;
  refresh_token: string;
  refresh_token_expires_at: string;
}

export interface DefaultLoginRequest {
  username: string;
  password: string;
}

export interface EmailOption {
  email: string;
}

export interface PhoneOption {
  phone: string;
}

export interface LoginRequest {
  default?: DefaultLoginRequest;
  email_option?: EmailOption;
  phone_option?: PhoneOption;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export interface SendAuthOTPRequest {
  identifier?: string;
  target?: string;
  type: 'email' | 'phone' | 'link';
}

export interface SendAuthOTPResponse {
  message: string;
  expires_in_seconds?: number;
  expires_in?: number;
  code?: string;
}

export interface VerifyAuthOTPRequest {
  identifier?: string;
  target?: string;
  type: 'email' | 'phone' | 'link';
  code: string;
}

export interface CreateCompanyPayload {
  name: string;
  code?: string;
  slug?: string;
  description?: string;
}

export interface CreateMeUserPayload {
  username: string;
  password?: string;
  firstname?: string;
  lastname?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
}

export interface RegisterWithCompanyRequest {
  company?: CreateCompanyPayload;
  me?: CreateMeUserPayload;
  company_name?: string;
  company_slug?: string;
  company_description?: string;
  username?: string;
  password?: string;
  firstname?: string;
  lastname?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export interface VerifyRegisterWithOTPRequest {
  code?: string;
  otp?: string;
  me?: CreateMeUserPayload;
  username?: string;
  password?: string;
  firstname?: string;
  lastname?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}
