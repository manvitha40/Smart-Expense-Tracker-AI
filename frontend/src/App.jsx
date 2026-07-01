import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Categories from './pages/Categories';
import Budget from './pages/Budget';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import AIAdvisor from './pages/AIAdvisor';
import ReceiptScanner from './pages/ReceiptScanner';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Goals from './pages/Goals';
import Subscriptions from './pages/Subscriptions';
import Forecast from './pages/Forecast';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Private Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Validating session...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Global Layout Wrapper
const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-background dark:bg-background-dark transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Dashboard Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/income" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Income />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/expenses" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Expenses />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/categories" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Categories />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/budget" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Budget />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Reports />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Analytics />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/ai-advisor" element={
        <ProtectedRoute>
          <DashboardLayout>
            <AIAdvisor />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/receipt-scanner" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ReceiptScanner />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Notifications />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/goals" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Goals />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/subscriptions" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Subscriptions />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/forecast" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Forecast />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Redirect wildcards */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </AuthProvider>
    </Router>
  );
}
