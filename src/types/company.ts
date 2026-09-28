export interface Company {
  id: number;
  name: string;
  code?: string;
  slug?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  code?: string;
  slug?: string;
  description?: string;
  is_active?: boolean;
}

export interface SendRegisterOTPRequest {
  role?: string;
  roles?: string[];
  expires_in_minutes?: number;
}

export interface SendRegisterOTPResponse {
  otp: string;
  code?: string;
  message?: string;
  expires_at?: string;
  expires_in_seconds?: number;
}
