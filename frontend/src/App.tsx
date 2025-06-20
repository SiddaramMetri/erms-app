import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/toast';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import ManagerDashboard from '@/pages/ManagerDashboard';
import EngineerDashboard from '@/pages/EngineerDashboard';
import Engineers from '@/pages/Engineers';
import Projects from '@/pages/Projects';
import Assignments from '@/pages/Assignments';
import ErrorBoundary from '@/components/ErrorBoundary';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  
  if (user?.role === 'manager') {
    return <ManagerDashboard />;
  } else {
    return <EngineerDashboard />;
  }
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<DashboardRouter />} />
                <Route path="engineers" element={<Engineers />} />
                <Route path="projects" element={<Projects />} />
                <Route path="assignments" element={<Assignments />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
