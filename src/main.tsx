
  import { createRoot } from "react-dom/client";
  import { QueryClientProvider } from '@tanstack/react-query';
  import { queryClient } from './lib/queryClient';
  import App from "./App.tsx";
  import { AuthProvider, useAuth } from './context/AuthContext';
  import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
  import { AuthPage } from './components/AuthPage';
  import { LandingPage } from './components/LandingPage';
  import { AdminDashboard } from './components/AdminDashboard';
  import { TeacherDashboard } from './components/TeacherDashboard';
  import { ParentDashboard } from './components/ParentDashboard';
  import { Toaster } from 'sonner';

  function Protected({ role, children }: { role?: string; children: JSX.Element }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/auth" replace />;
    if (role && user.role !== role && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
    return children;
  }

  function DashboardRouter() {
    const { user } = useAuth();
    if (!user) return <Navigate to="/auth" replace />;
    switch (user.role) {
      case 'admin':
        return <Navigate to="/dashboard/admin" replace />;
      case 'teacher':
        return <Navigate to="/dashboard/teacher" replace />;
      case 'parent':
        return <Navigate to="/dashboard/parent" replace />;
      default:
        return <App />; // fallback generic app
    }
  }

  const router = createBrowserRouter([
    { path: '/', element: <LandingPage onGetStarted={() => { window.location.href = '/auth'; }} /> },
    { path: '/auth', element: <AuthPage onLogin={() => { window.location.href = '/dashboard'; }} /> },
    { path: '/dashboard', element: <Protected><DashboardRouter /></Protected> },
    { path: '/dashboard/admin', element: <Protected role="admin"><AdminDashboardWrapper /></Protected> },
    { path: '/dashboard/teacher', element: <Protected role="teacher"><TeacherDashboardWrapper /></Protected> },
    { path: '/dashboard/parent', element: <Protected role="parent"><ParentDashboardWrapper /></Protected> },
  ]);

function AdminDashboardWrapper() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return <AdminDashboard userData={user} onLogout={logout} />;
}
function TeacherDashboardWrapper() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return <TeacherDashboard userData={user} onLogout={logout} />;
}
function ParentDashboardWrapper() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return <ParentDashboard userData={user} onLogout={logout} />;
}
  import "./index.css";

  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster richColors position="top-right" />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthProvider>
  );
  