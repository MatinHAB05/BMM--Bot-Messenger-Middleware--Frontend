import { useAuth } from '../contexts/AuthContext';
import { PermissionAction, UserRole } from '../types/rbac';
import { ACTION_TO_PERMISSION, ROLE_POLICIES } from './policyMatrix';

export function usePermission() {
  const { user } = useAuth();

  const userRoles = (user?.roles || []) as string[];
  const isSuperAdmin = userRoles.includes('super-admin') || userRoles.includes('super-admin');
  const isAdmin = userRoles.includes('admin') || isSuperAdmin;

  const hasPermission = (resourceOrEndpoint: string, actionOrMethod: string = 'GET'): boolean => {
    if (!user || userRoles.length === 0) return false;
    if (isSuperAdmin) return true; // Super Admin has unrestricted access

    // Check if called as (resource, action) e.g. ('user', 'delete') -> 'users:delete'
    const candidateActions = [
      `${resourceOrEndpoint}:${actionOrMethod}`,
      `${resourceOrEndpoint}s:${actionOrMethod}`,
      `${resourceOrEndpoint}:${actionOrMethod.replace('-', '_')}`,
    ];

    for (const act of candidateActions) {
      const mapped = ACTION_TO_PERMISSION[act];
      if (mapped) {
        return checkEndpointPermission(userRoles, mapped.endpoint, mapped.method);
      }
    }

    return checkEndpointPermission(userRoles, resourceOrEndpoint, actionOrMethod);
  };

  const checkEndpointPermission = (roles: string[], endpoint: string, method: string): boolean => {
    const normalizedMethod = method.toUpperCase();
    const cleanEndpoint = endpoint.split('?')[0];

    return roles.some((role) => {
      // Normalize role name for lookup in policy matrix
      const matrixKey = (role === 'super-admin' ? 'super-admin' : role) as UserRole;
      const policies = ROLE_POLICIES[matrixKey] || [];
      return policies.some((policy) => {
        const methodMatches = policy.method === '*' || policy.method === normalizedMethod;
        if (!methodMatches) return false;

        const policyParts = policy.endpoint.split('/');
        const testParts = cleanEndpoint.split('/');

        if (policyParts.length !== testParts.length) return false;

        return policyParts.every((part, i) => {
          if (part.startsWith(':')) return true;
          return part === testParts[i];
        });
      });
    });
  };

  const can = (action: string): boolean => {
    if (isSuperAdmin) return true;
    const requiredPermission = ACTION_TO_PERMISSION[action];
    if (!requiredPermission) return false;
    return checkEndpointPermission(userRoles, requiredPermission.endpoint, requiredPermission.method);
  };

  return {
    roles: userRoles,
    isSuperAdmin,
    isAdmin,
    hasPermission,
    can,
  };
}
