import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { PredictPage } from './pages/PredictPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes with Navbar and Footer */}
          <Route
            path="/"
            element={
              <div className="flex flex-col min-h-screen bg-[#F4F6F7] text-[#263238]">
                <Navbar />
                <main className="flex-1">
                  <LandingPage />
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/login"
            element={
              <div className="flex flex-col min-h-screen bg-[#F4F6F7] text-[#263238]">
                <Navbar />
                <main className="flex-1">
                  <LoginPage />
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/register"
            element={
              <div className="flex flex-col min-h-screen bg-[#F4F6F7] text-[#263238]">
                <Navbar />
                <main className="flex-1">
                  <RegisterPage />
                </main>
                <Footer />
              </div>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <div className="flex flex-col min-h-screen bg-[#F4F6F7] text-[#263238]">
                <Navbar />
                <main className="flex-1">
                  <ForgotPasswordPage />
                </main>
                <Footer />
              </div>
            }
          />

          {/* Protected Routes inside Clinical AppLayout (Sidebar + Topbar) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/predict"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <PredictPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <HistoryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
