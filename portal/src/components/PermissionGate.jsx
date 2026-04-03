import { hasPermission } from '../api';

export function usePermission(key) {
  return hasPermission(key);
}

export default function PermissionGate({ permission, children, fallback = null }) {
  if (!hasPermission(permission)) return fallback;
  return children;
}
