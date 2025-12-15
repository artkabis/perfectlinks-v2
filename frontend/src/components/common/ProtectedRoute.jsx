import { Navigate } from 'react-router-dom';
import useAuthStore from '@/hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
