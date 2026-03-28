import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/MainLayout';
import { useAppStore } from './store/useAppStore';

// Lazy load pages for better performance (and we'll mock them first)
const Login = React.lazy(() => import('./pages/auth/Login'));
const StaffLogin = React.lazy(() => import('./pages/auth/StaffLogin'));

const Landing = React.lazy(() => import('./pages/Landing'));

// Student Pages
const StudentDashboard = React.lazy(() => import('./pages/student/Dashboard'));
const SeatBooking = React.lazy(() => import('./pages/student/SeatBooking'));
const StudentMenu = React.lazy(() => import('./pages/student/Menu'));
const OrderHistory = React.lazy(() => import('./pages/student/OrderHistory'));

// Staff Pages
const StaffDashboard = React.lazy(() => import('./pages/staff/Dashboard'));
const MenuManager = React.lazy(() => import('./pages/staff/MenuManager'));
const OrderManager = React.lazy(() => import('./pages/staff/OrderManager'));
const SeatOversight = React.lazy(() => import('./pages/staff/SeatOversight'));

function App() {
  const { currentUser, theme, initializeAuth } = useAppStore();

  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  React.useEffect(() => {
    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  React.useEffect(() => {
    // Cross-tab synchronization for Zustand
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'foodhub-storage') {
        useAppStore.persist.rehydrate();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <BrowserRouter>
      <React.Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      }>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={
            currentUser ? <Navigate to={currentUser.role === 'staff' ? '/staff' : '/student'} replace /> : <Login />
          } />
          <Route path="/staff-login" element={
            currentUser ? <Navigate to={currentUser.role === 'staff' ? '/staff' : '/student'} replace /> : <StaffLogin />
          } />

          {/* Protected Routes inside MainLayout */}
          <Route element={<MainLayout />}>
            {/* Student Routes */}
            <Route path="/student" element={<ProtectedRoute allowedRole="student" />}>
              <Route index element={<StudentDashboard />} />
              <Route path="booking" element={<SeatBooking />} />
              <Route path="menu" element={<StudentMenu />} />
              <Route path="orders" element={<OrderHistory />} />
            </Route>

            {/* Staff Routes */}
            <Route path="/staff" element={<ProtectedRoute allowedRole="staff" />}>
              <Route index element={<StaffDashboard />} />
              <Route path="menu" element={<MenuManager />} />
              <Route path="orders" element={<OrderManager />} />
              <Route path="bookings" element={<SeatOversight />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}

export default App;
