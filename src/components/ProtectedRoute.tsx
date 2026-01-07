import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getAccessToken } from '@/api/client';

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

  // Check admin routes - only allow admin or superuser
  const isAdminRoute = location.pathname.startsWith('/admin');
  const userRole = user?.role?.toLowerCase() || '';
  const isSuperuser = user?.isSuperuser || false;

  if (isAdminRoute || requireAdmin) {
    // Only admin or superuser can access admin routes
    const hasAdminAccess = isSuperuser || userRole === 'admin';
    if (!hasAdminAccess) {
      // Redirect guests to dashboard, staff to their portal
      if (['housekeeping', 'maintenance', 'runner'].includes(userRole)) {
        return <Navigate to={`/staff/${userRole}`} replace />;
      }
      if (['front_desk', 'frontdesk'].includes(userRole)) {
        return <Navigate to="/dashboard/frontdesk" replace />;
      }
      // Guest or unknown role - redirect to home
      return <Navigate to="/" replace />;
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
