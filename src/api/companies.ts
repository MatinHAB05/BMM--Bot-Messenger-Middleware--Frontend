import { apiClient } from './client';
import { ApiResponse } from '../types/auth';
import {
  Company,
  UpdateCompanyRequest,
  SendRegisterOTPRequest,
  SendRegisterOTPResponse,
} from '../types/company';

export const companiesApi = {
  getMe: async (): Promise<Company> => {
    const { data } = await apiClient.get<ApiResponse<Company>>('/companies/me');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch company profile');
    }
    return data.data;
  },

  update: async (id: number, payload: UpdateCompanyRequest): Promise<Company> => {
    const { data } = await apiClient.put<ApiResponse<Company>>(`/companies/${id}`, payload);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to update company');
    }
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(`/companies/${id}`);
    if (!data.success) {
      throw new Error(data.error || 'Failed to deactivate company');
    }
  },

  sendRegisterOTP: async (payload: SendRegisterOTPRequest): Promise<SendRegisterOTPResponse> => {
    const body = {
      roles: payload.roles || (payload.role ? [payload.role] : ['admin']),
    };
    const { data } = await apiClient.post<ApiResponse<SendRegisterOTPResponse>>(
      '/companies/users/send-register-otp',
      body
    );
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to generate invitation OTP');
    }
    const code = data.data.code || data.data.otp || '';
    return {
      ...data.data,
      otp: code,
    };
  },
};
