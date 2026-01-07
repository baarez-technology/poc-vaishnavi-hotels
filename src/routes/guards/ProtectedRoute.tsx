import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { ROUTES } from '@/config/constants';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
};
