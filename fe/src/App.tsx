import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
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
        richColors
        duration={4000}
        toastOptions={{
          classNames: {
            toast:
              'group !rounded-xl !border !border-slate-200 !bg-white !font-sans !text-[13px] !font-medium !text-slate-800 !shadow-lg !shadow-slate-900/10',
            title: '!text-[13px] !font-semibold',
            description: '!text-xs !text-slate-500',
            closeButton:
              '!border-slate-200 !bg-white !text-slate-400 hover:!bg-slate-100 hover:!text-slate-700',
            actionButton: '!rounded-lg !bg-slate-900 !text-xs !font-semibold',
            cancelButton: '!rounded-lg !bg-slate-100 !text-xs !font-medium !text-slate-600',
          },
        }}
      />
    </AuthProvider>
  );
}
