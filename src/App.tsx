import { Suspense, lazy, FC } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from '@/layouts/MainLayout';
import { User } from '@/types';
import { LanguageProvider } from '@/shared/context/LanguageContext';

// Lazy loading views for production optimization
const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/features/auth/LoginView'));
const Register = lazy(() => import('@/features/auth/RegisterView'));
const AdminDashboard = lazy(() => import('@/features/projects/AdminDashboard'));
const ClientDashboard = lazy(() => import('@/features/projects/ClientDashboard'));
const FreelancerDashboard = lazy(() => import('@/features/projects/FreelancerDashboard'));
const CoordinatorDashboard = lazy(() => import('@/features/projects/CoordinatorDashboard'));
const ArbitratorDashboard = lazy(() => import('@/features/dashboards/ArbitratorDashboard'));
const CreateProject = lazy(() => import('@/features/projects/CreateProjectView'));
const ProjectDetails = lazy(() => import('@/features/projects/ProjectDetailsView'));
const DisputeFlow = lazy(() => import('@/pages/DisputeFlow'));
const ArbitratorCaseView = lazy(() => import('@/pages/ArbitratorCaseView'));
const DisputesPage = lazy(() => import('@/pages/DisputesPage'));
const Settings = lazy(() => import('@/pages/Settings'));
const PaymentMethods = lazy(() => import('@/features/payments/PaymentMethodsView'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const DashboardRedirect: FC = () => {
  const userStr = localStorage.getItem('user');
  const user: User | null = userStr ? JSON.parse(userStr) : null;
  if (!user || !user.role) return <Navigate to="/login" replace />;
  return <Navigate to={`/dashboard/${user.role}`} replace />;
};

const LoadingFallback: FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
  </div>
);

const AnimatedRoutes: FC = () => {
  const location = useLocation();

  return (
    <Routes location={location}>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route
          path="/dashboard/admin"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <AdminDashboard />
            </Suspense>
          }
        />
        <Route
          path="/dashboard/client"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ClientDashboard />
            </Suspense>
          }
        />
        <Route
          path="/dashboard/freelancer"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <FreelancerDashboard />
            </Suspense>
          }
        />
        <Route
          path="/dashboard/coordinator"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CoordinatorDashboard />
            </Suspense>
          }
        />
        <Route
          path="/arbitration"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ArbitratorDashboard />
            </Suspense>
          }
        />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route
          path="/create"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <CreateProject />
            </Suspense>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ProjectDetails />
            </Suspense>
          }
        />
        <Route
          path="/dispute/:taskId"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <DisputeFlow />
            </Suspense>
          }
        />
        <Route
          path="/arbitrate/:caseId"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ArbitratorCaseView />
            </Suspense>
          }
        />
        <Route
          path="/disputes"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <DisputesPage />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Settings />
            </Suspense>
          }
        />
        <Route
          path="/payment-methods"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PaymentMethods />
            </Suspense>
          }
        />
      </Route>
      {/* Catch-all route for 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App: FC = () => {
  return (
    <LanguageProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </LanguageProvider>
  );
};


export default App;
