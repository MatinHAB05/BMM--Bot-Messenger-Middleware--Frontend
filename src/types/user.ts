export type UserRole = 'super-admin' | 'admin' | 'super-admin' | string;

export interface User {
  id: number;
  company_id: number;
  username: string;
  firstname?: string | null;
  lastname?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  roles: string[];
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  page_size: number;
}

export interface UpdateUserRequest {
  firstname?: string;
  lastname?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

export interface UpdateUserRolesRequest {
  roles: string[];
}

export interface UpdateUserEmailRequest {
  email: string;
}

export interface UpdateUserPhoneRequest {
  phone: string;
}

export interface UpdateUserUsernameRequest {
  username: string;
}
