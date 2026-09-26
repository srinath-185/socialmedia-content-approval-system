import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { X, XCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PostEditorPage } from './pages/PostEditorPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { ClientsPage } from './pages/ClientsPage';
import { UsersPage } from './pages/UsersPage';
import { Role } from './types';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Workspace */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard / Kanban board for all authenticated roles */}
            <Route index element={<DashboardPage />} />

            {/* Post Creation (CREATOR role only) */}
            <Route
              path="posts/new"
              element={
                <ProtectedRoute allowedRoles={[Role.CREATOR]}>
                  <PostEditorPage />
                </ProtectedRoute>
              }
            />

            {/* Post Detail & Timeline (All roles, scoped) */}
            <Route path="posts/:id" element={<PostDetailPage />} />

            {/* Post Edit (CREATOR role only) */}
            <Route
              path="posts/:id/edit"
              element={
                <ProtectedRoute allowedRoles={[Role.CREATOR]}>
                  <PostEditorPage />
                </ProtectedRoute>
              }
            />

            {/* Client Brand Management (ADMIN only) */}
            <Route
              path="clients"
              element={
                <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                  <ClientsPage />
                </ProtectedRoute>
              }
            />

            {/* Users & Team Management (ADMIN only) */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        closeButton
        duration={4000}
        icons={{
          error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          info: <Info className="w-5 h-5 text-[#4f39f6] shrink-0" />,
          close: <X className="w-3.5 h-3.5 stroke-[2.2]" />,
        }}
      />
    </AuthProvider>
  );
}
