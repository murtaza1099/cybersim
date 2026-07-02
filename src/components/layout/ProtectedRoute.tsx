import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import SuperAdminLoginPage from '@/pages/SuperAdminLoginPage';

const rolePaths: Record<string, string> = {
  super_admin: '/super-admin',
  org_admin: '/org-admin',
  employee: '/dashboard',
};

export function ProtectedRoute({ role, children }: { role: string; children: React.ReactNode }) {
  const { isHydrated, isAuthenticated, role: userRole } = useAuthStore();

  // Wait for restoreSession() to resolve so we never flash-redirect on refresh.
  if (!isHydrated) {
    return <div className="min-h-screen" />;
  }

  // Super-admin area: show the SA login in place rather than bouncing to "/".
  if (role === 'super_admin') {
    if (!isAuthenticated || userRole !== 'super_admin') {
      return <SuperAdminLoginPage />;
    }
    return <>{children}</>;
  }

  // Org-admin / employee: redirect to the access-key login when not allowed.
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (userRole !== role) return <Navigate to={rolePaths[userRole ?? ''] || '/'} replace />;

  return <>{children}</>;
}
