import React, { ReactNode } from 'react';
import { usePermission } from './usePermission';
import { PermissionAction } from '../types/rbac';

interface PermissionGuardProps {
  resource?: string;
  action?: PermissionAction | string;
  endpoint?: string;
  method?: string;
  fallback?: ReactNode;
  mode?: 'hide' | 'disable';
  tooltip?: string;
  children: ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  resource,
  action,
  endpoint,
  method = 'GET',
  fallback = null,
  mode = 'hide',
  tooltip = 'You do not have permission for this action',
  children,
}) => {
  const { can, hasPermission, isSuperAdmin } = usePermission();

  let isAllowed = false;

  if (isSuperAdmin) {
    isAllowed = true;
  } else if (resource && action) {
    isAllowed = hasPermission(resource, action);
  } else if (action) {
    isAllowed = can(action);
  } else if (endpoint) {
    isAllowed = hasPermission(endpoint, method);
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (mode === 'hide') {
    return <>{fallback}</>;
  }

  return (
    <div
      className="inline-block cursor-not-allowed opacity-50 select-none relative group"
      title={tooltip}
    >
      <div className="pointer-events-none">{children}</div>
    </div>
  );
};
