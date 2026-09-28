import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterCompanyPage } from './pages/RegisterCompanyPage';
import { RegisterInvitePage } from './pages/RegisterInvitePage';
import { MessagingPage } from './pages/MessagingPage';
import { LinkedChatsPage } from './pages/LinkedChatsPage';
import { UsersPage } from './pages/UsersPage';
import { CompanyPage } from './pages/CompanyPage';
import { BroadcastsPage } from './pages/BroadcastsPage';
import { AttachmentsPage } from './pages/AttachmentsPage';
import { ProfilePage } from './pages/ProfilePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" /><p className="text-xs font-medium">Authenticating session...</p></div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (isAuthenticated) return <Navigate to="/messaging" replace />;
  return <>{children}</>;
};

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register/company" element={<PublicRoute><RegisterCompanyPage /></PublicRoute>} />
                <Route path="/register/invite" element={<PublicRoute><RegisterInvitePage /></PublicRoute>} />
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/" element={<Navigate to="/messaging" replace />} />
                  <Route path="/messaging" element={<MessagingPage />} />
                  <Route path="/chats" element={<LinkedChatsPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/company" element={<CompanyPage />} />
                  <Route path="/broadcasts" element={<BroadcastsPage />} />
                  <Route path="/attachments" element={<AttachmentsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>
                <Route path="*" element={<Navigate to="/messaging" replace />} />
              </Routes>
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;