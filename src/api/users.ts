import { apiClient } from './client';
import { ApiResponse } from '../types/auth';
import {
  User,
  UserListResponse,
  UpdateUserRequest,
  UpdateUserRolesRequest,
  UpdateUserEmailRequest,
  UpdateUserPhoneRequest,
  UpdateUserUsernameRequest,
} from '../types/user';

export const usersApi = {
  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>('/users/me');
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch current user profile');
    }
    return data.data;
  },

  list: async (page: number = 1, pageSize: number = 20): Promise<UserListResponse> => {
    const { data } = await apiClient.get<ApiResponse<UserListResponse>>('/users', {
      params: { page, page_size: pageSize },
    });
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to list users');
    }
    return data.data;
  },

  getByID: async (id: number | string): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to fetch user');
    }
    return data.data;
  },

  update: async (id: number | string, payload: UpdateUserRequest): Promise<User> => {
    const { data } = await apiClient.put<ApiResponse<User>>(`/users/${id}`, payload);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to update user');
    }
    return data.data;
  },

  updateRoles: async (id: number | string, roles: string[]): Promise<User> => {
    const payload: UpdateUserRolesRequest = { roles };
    const { data } = await apiClient.put<ApiResponse<User>>(`/users/${id}/roles`, payload);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to update user roles');
    }
    return data.data;
  },

  updateEmail: async (id: number | string, email: string): Promise<User> => {
    const payload: UpdateUserEmailRequest = { email };
    const { data } = await apiClient.put<ApiResponse<User>>(`/users/${id}/email`, payload);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to update user email');
    }
    return data.data;
  },

  updatePhone: async (id: number | string, phone: string): Promise<User> => {
    const payload: UpdateUserPhoneRequest = { phone };
    const { data } = await apiClient.put<ApiResponse<User>>(`/users/${id}/phone`, payload);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to update user phone');
    }
    return data.data;
  },

  updateUsername: async (id: number | string, username: string): Promise<User> => {
    const payload: UpdateUserUsernameRequest = { username };
    const { data } = await apiClient.put<ApiResponse<User>>(`/users/${id}/username`, payload);
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to update username');
    }
    return data.data;
  },

  delete: async (id: number | string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(`/users/${id}`);
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete user');
    }
  },
};