export type UserRole = 'super-admin' | 'admin' | 'super-admin' | string;

export interface Permission {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | '*';
}

export type PermissionAction = string;
