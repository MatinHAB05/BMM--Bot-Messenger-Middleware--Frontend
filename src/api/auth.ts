import { apiClient } from './client';
import {
  ApiResponse,
  TokenPair,
  LoginRequest,
  RegisterWithCompanyRequest,
  VerifyRegisterWithOTPRequest,
  SendAuthOTPRequest,
  SendAuthOTPResponse,
  VerifyAuthOTPRequest,
} from '../types/auth';
import { User } from '../types/user';
import { Company } from '../types/company';

export const authApi = {
  login: async (payload: LoginRequest): Promise<TokenPair> => {
    // Format payload according to Go contract
    let body: any = {};
    if (payload.default) {
      body.default = payload.default;
    } else if (payload.username && payload.password) {
      body.default = { username: payload.username, password: payload.password };
    } else if (payload.email_option) {
      body.email_option = payload.email_option;
    } else if (payload.email) {
      body.email_option = { email: payload.email };
    } else if (payload.phone_option) {
      body.phone_option = payload.phone_option;
    } else if (payload.phone) {
      body.phone_option = { phone: payload.phone };
    } else {
      body = payload;
    }

    const { data } = await apiClient.post<ApiResponse<TokenPair>>('/auth/login', body);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Login failed');
    }
    return data.data;
  },

  registerWithCompany: async (
    payload: RegisterWithCompanyRequest
  ): Promise<{ me: User; company: Company }> => {
    // Format body matching backend Go contract
    const body = {
      company: payload.company || {
        name: payload.company_name || '',
        code: payload.company_slug || '',
      },
      me: payload.me ? {
        ...payload.me,
        firstname: payload.me.firstname || payload.me.first_name || '',
        lastname: payload.me.lastname || payload.me.last_name || '',
      } : {
        username: payload.username || '',
        password: payload.password || '',
        firstname: payload.firstname || (payload as any).first_name || '',
        lastname: payload.lastname || (payload as any).last_name || '',
        email: payload.email || '',
        phone: payload.phone || '',
      },
    };

    const { data } = await apiClient.post<ApiResponse<{ me: User; company: Company }>>(
      '/auth/register-with-company',
      body
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Registration failed');
    }
    return data.data;
  },

  verifyRegisterOTP: async (
    payload: VerifyRegisterWithOTPRequest
  ): Promise<{ me: User; company: Company }> => {
    const body = {
      code: payload.code || payload.otp || '',
      me: payload.me ? {
        ...payload.me,
        firstname: payload.me.firstname || payload.me.first_name || '',
        lastname: payload.me.lastname || payload.me.last_name || '',
      } : {
        username: payload.username || '',
        password: payload.password || '',
        firstname: payload.firstname || (payload as any).first_name || '',
        lastname: payload.lastname || (payload as any).last_name || '',
        email: payload.email || '',
        phone: payload.phone || '',
      },
    };

    const { data } = await apiClient.post<ApiResponse<{ me: User; company: Company }>>(
      '/auth/verify-register-otp',
      body
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to complete registration with OTP');
    }
    return data.data;
  },

  refresh: async (refreshToken: string): Promise<TokenPair> => {
    const { data } = await apiClient.post<ApiResponse<TokenPair>>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to refresh token');
    }
    return data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  sendAuthOTP: async (payload: SendAuthOTPRequest): Promise<SendAuthOTPResponse> => {
    const body = {
      identifier: payload.identifier || payload.target || '',
      type: payload.type,
    };
    const { data } = await apiClient.post<ApiResponse<SendAuthOTPResponse>>('/auth/otp/send', body);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to send OTP');
    }
    return data.data;
  },

  verifyAuthOTP: async (payload: VerifyAuthOTPRequest): Promise<boolean> => {
    const body = {
      identifier: payload.identifier || payload.target || '',
      type: payload.type,
      code: payload.code,
    };
    const { data } = await apiClient.post<ApiResponse<{ status: boolean }>>(
      '/auth/otp/verify',
      body
    );
    if (!data.success) {
      throw new Error(data.error || 'OTP verification failed');
    }
    return !!data.data?.status;
  },
};
