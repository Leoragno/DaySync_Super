import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

/**
 * Route guard that redirects unauthenticated users to /login.
 * Wrap protected routes with this component.
 */
export default function AuthGuard({ children }) {
  const { isAuthenticated, isLoading, error } = useAuth();

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Errore di inizializzazione</h2>
        <p className="text-muted-foreground text-sm max-w-xs">{error}</p>
        <p className="mt-4 text-xs text-muted-foreground opacity-50">DaySync Build v1.0.0</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
