import { Navigate, Outlet } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { Role } from '../types';

interface ProtectedRouteProps {
  allowedRole?: Role;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRole }) => {
  const currentUser = useAppStore(state => state.currentUser);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && currentUser.role !== allowedRole) {
    // If a staff tries to access student page or vice versa
    return <Navigate to={currentUser.role === 'staff' ? '/staff' : '/student'} replace />;
  }

  return <Outlet />;
};
