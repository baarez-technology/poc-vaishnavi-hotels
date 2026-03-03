import { ReactNode, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getAccessToken } from '@/api/client';
import { DEFAULT_PERMISSIONS, getModuleForRoute, canViewModule, resolveRolePermissions } from '@/config/rolePermissions';
import type { PermissionMap, StaffRole } from '@/config/rolePermissions';
import { POC_MODE, POC_ALLOWED_ROUTE_PREFIXES } from '@/config/pocConfig';

// Roles that access admin panel (all 10 RBAC StaffRole values + common backend aliases)
const ADMIN_PANEL_ROLES = new Set<string>([
  ...Object.keys(DEFAULT_PERMISSIONS),
  // Backend seed / external auth aliases
  'manager', 'supervisor',
  'front_desk', 'frontdesk', 'concierge', 'night_auditor',
  'housekeeping',        // POC: housekeeping account accesses admin panel
]);

// Map backend role aliases to canonical StaffRole for permissions resolution
const ROLE_ALIAS_MAP: Partial<Record<string, StaffRole>> = {
  'manager':       'general_manager',
  'supervisor':    'duty_manager',
  'front_desk':    'receptionist',
  'frontdesk':     'receptionist',
  'concierge':     'receptionist',
  'night_auditor': 'duty_manager',
  'housekeeping':  'housekeeping_manager',
};

// Roles that should go to the staff portal instead of admin panel
const STAFF_PORTAL_ROLES = ['housekeeper', 'maintenance', 'runner'];

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, allowedRoles, requireAdmin }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Double-check: ensure we have both a user AND a valid token
  const hasToken = !!getAccessToken();
  const isReallyAuthenticated = isAuthenticated && user && hasToken;

  // Resolve RBAC permissions (checks Settings customizations via localStorage)
  // Backend role aliases are mapped to canonical StaffRole values first
  const userPermissions: PermissionMap | undefined = useMemo(() => {
    if (!user) return undefined;
    if (user.permissions) return user.permissions as PermissionMap;
    if (user.isSuperuser) return DEFAULT_PERMISSIONS.admin;
    const role = user.role?.toLowerCase() || '';
    const canonical = (ROLE_ALIAS_MAP[role] || role) as StaffRole;
    if (canonical && canonical in DEFAULT_PERMISSIONS) {
      return resolveRolePermissions(canonical);
    }
    return undefined;
  }, [user]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (check both user and token)
  if (!isReallyAuthenticated) {
    // Clear any stale localStorage data
    localStorage.removeItem('glimmora_user');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin routes
  const isAdminRoute = location.pathname.startsWith('/admin');
  const userRole = user?.role?.toLowerCase() || '';
  const isSuperuser = user?.isSuperuser || false;

  if (isAdminRoute || requireAdmin) {
    // Allow superuser, admin, or any of the 10 RBAC roles into the admin panel
    const hasAdminAccess = isSuperuser || ADMIN_PANEL_ROLES.has(userRole);

    if (!hasAdminAccess) {
      // Staff portal roles → redirect to staff portal
      if (STAFF_PORTAL_ROLES.includes(userRole)) {
        return <Navigate to={`/staff/${userRole}`} replace />;
      }
      // Guest or unknown role → redirect to home
      return <Navigate to="/" replace />;
    }

    // TEMP: POC route guard — blocks access to restricted routes (remove when POC ends)
    if (POC_MODE) {
      const isPocAllowed =
        location.pathname === '/admin' ||
        location.pathname === '/admin/' ||
        POC_ALLOWED_ROUTE_PREFIXES.some(prefix => location.pathname.startsWith(prefix));
      if (!isPocAllowed) {
        return <Navigate to="/admin/access-denied" replace />;
      }
    }

    // RBAC: check module-level permission for the specific admin route
    const module = getModuleForRoute(location.pathname);
    if (module && userPermissions && !canViewModule(userPermissions, module)) {
      return <Navigate to="/admin/access-denied" replace />;
    }
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some(
      role => role.toLowerCase() === userRole || (role === 'admin' && isSuperuser)
    );
    if (!hasAllowedRole) {
      return <Navigate to="/" replace />;
    }
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
}
