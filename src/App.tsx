import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import LoginPage from "./pages/LoginPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import OrgAdminDashboard from "./pages/OrgAdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Level1Route from "./pages/Level1/Level1Route";
import { SceneErrorBoundary } from "./pages/Level1/components/SceneErrorBoundary";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { PageTransition } from "./components/layout/PageTransition";

const queryClient = new QueryClient();
const EditorApp = import.meta.env.DEV ? lazy(() => import(/* @vite-ignore */ "./editor/EditorApp")) : null;

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {EditorApp && <Route path="/editor" element={<Suspense fallback={null}><EditorApp /></Suspense>} />}
        <Route path="/" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/super-admin/login" element={<Navigate to="/super-admin" replace />} />
        <Route path="/super-admin" element={<ProtectedRoute role="super_admin"><PageTransition><SuperAdminDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/org-admin" element={<ProtectedRoute role="org_admin"><PageTransition><OrgAdminDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute role="employee"><PageTransition><EmployeeDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/simulation/level-1" element={<ProtectedRoute role="employee"><SceneErrorBoundary><Level1Route /></SceneErrorBoundary></ProtectedRoute>} />
        <Route path="/simulation/play" element={<ProtectedRoute role="employee"><Navigate to="/simulation/level-1" replace /></ProtectedRoute>} />
        <Route path="/simulation/*" element={<ProtectedRoute role="employee"><Navigate to="/dashboard" replace /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => {
  useEffect(() => {
    void useAuthStore.getState().restoreSession();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
