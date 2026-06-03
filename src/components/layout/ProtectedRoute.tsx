import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const rolePaths: Record<string, string> = {
  super_admin: '/super-admin',
  org_admin: '/org-admin',
  employee: '/dashboard',
};

export function ProtectedRoute({ role, children }: { role: string; children: React.ReactNode }) {
  const { isHydrated, isAuthenticated, role: userRole } = useAuthStore();

  if (!isHydrated) {
    return <div className="min-h-screen" />;
  }

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (userRole !== role) return <Navigate to={rolePaths[userRole!] || '/'} replace />;

  return <>{children}</>;
}
