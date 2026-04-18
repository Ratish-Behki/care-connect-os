import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, hasHydrated } = useAuth();

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        Restoring session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;