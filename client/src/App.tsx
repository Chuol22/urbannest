import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from 'react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';

import { GoogleTranslateScript } from './components/GoogleTranslateScript';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

import { DarkModeProvider } from './context/DarkModeContext';
import { PropertyProvider } from './context/PropertyContext';
import { AuthProvider } from './context/AuthContext';

// Lazy load pages for better performance
const Home = React.lazy(() => import('./pages/Home'));
const About = React.lazy(() => import('./pages/About'));
const Properties = React.lazy(() => import('./pages/Properties'));
const PropertyDetail = React.lazy(() => import('./pages/PropertyDetail'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Contact = React.lazy(() => import('./pages/Contact'));
const MyNest = React.lazy(() => import('./pages/MyPlace'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Favorites = React.lazy(() => import('./pages/Favorites'));
const Settings = React.lazy(() => import('./pages/Settings'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const Terms = React.lazy(() => import('./pages/Terms'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const CreateListing = React.lazy(() => import('./pages/CreateListing'));
const PaymentSuccess = React.lazy(() => import('./pages/PaymentSuccess'));

// Super Admin Layout & Pages
const AdminLayout = React.lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminManagement = React.lazy(() => import('./pages/admin/AdminManagement'));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));
const ListingManagement = React.lazy(() => import('./pages/admin/ListingManagement'));
const PaymentManagement = React.lazy(() => import('./pages/admin/PaymentManagement'));
const AuditLogs = React.lazy(() => import('./pages/admin/AuditLogs'));

// Loading component for lazy-loaded routes
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
      <p className="mt-4 text-slate-400 text-sm">Loading UrbanNEST...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <GoogleTranslateScript />
        <QueryClientProvider client={queryClient}>
          <DarkModeProvider>
            <AuthProvider>
              <PropertyProvider>
                <Router>
                  <Layout>
                    <Suspense fallback={<LoadingFallback />}>
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/properties" element={<Properties />} />
                        <Route path="/properties/:id" element={<PropertyDetail />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/payment/success" element={<PaymentSuccess />} />

                        {/* Protected Standard User Routes */}
                        <Route path="/create-listing" element={
                          <ProtectedRoute>
                            <CreateListing />
                          </ProtectedRoute>
                        } />
                        <Route path="/dashboard" element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        } />
                        <Route path="/mynest" element={
                          <ProtectedRoute>
                            <MyNest />
                          </ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        } />
                        <Route path="/favorites" element={
                          <ProtectedRoute>
                            <Favorites />
                          </ProtectedRoute>
                        } />
                        <Route path="/settings" element={
                          <ProtectedRoute>
                            <Settings />
                          </ProtectedRoute>
                        } />

                        {/* Super Admin Dashboard Nested Routes */}
                        <Route path="/admin" element={
                          <ProtectedRoute requiredRole="admin">
                            <AdminLayout />
                          </ProtectedRoute>
                        }>
                          <Route index element={<AdminDashboard />} />
                          <Route path="users" element={<AdminManagement />} />
                          <Route path="all-users" element={<UserManagement />} />
                          <Route path="listings" element={<ListingManagement />} />
                          <Route path="payments" element={<PaymentManagement />} />
                          <Route path="audit-logs" element={<AuditLogs />} />
                        </Route>

                        {/* 404 Route */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </Layout>
                </Router>
              </PropertyProvider>
            </AuthProvider>
          </DarkModeProvider>
        </QueryClientProvider>
        <Toaster position="top-center" richColors />
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;