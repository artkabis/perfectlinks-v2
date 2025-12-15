import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from '@/hooks/useAuth';

// Layout
import Layout from '@/components/common/Layout';
import ProtectedRoute from '@/components/common/ProtectedRoute';

// Pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
        />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Default redirect */}
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
