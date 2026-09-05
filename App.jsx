import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from './query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './PageNotFound';
import { AuthProvider, useAuth } from './AuthContext';
import UserNotRegisteredError from './UserNotRegisteredError';
import ScrollToTop from './ScrollToTop';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import { PaywallProvider } from './paywall';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Home from './Home';
import AppLayout from './AppLayout';
import InvoiceHistory from './InvoiceHistory';
import BusinessProfile from './BusinessProfile';
import ClientDatabase from './ClientDatabase';
import UsageReports from './UsageReports';
import Settings from './Settings';
import QuickTemplates from './QuickTemplates';
import PaymentLogs from './PaymentLogs';
import TaxSummary from './TaxSummary';
import HelpCenter from './HelpCenter';
import AccountActivity from './AccountActivity';
import ServiceCatalog from './ServiceCatalog';
import TeamManagement from './TeamManagement';
import HomeGate from './HomeGate';
import GuestDashboard from './GuestDashboard';
import TrialGate from './TrialGate';
import ContactUs from './ContactUs';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import CancellationRefund from './CancellationRefund';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/terms-and-conditions" element={<TermsOfService />} />
      <Route path="/cancellation-and-refund" element={<CancellationRefund />} />
      <Route path="/refund-and-cancellation" element={<CancellationRefund />} />
      <Route path="/contact-us" element={<ContactUs />} />
      <Route path="/about" element={<GuestDashboard />} />
      <Route path="/pricing" element={<GuestDashboard />} />
      <Route path="/" element={<HomeGate />} />
      <Route path="/dashboard" element={<HomeGate />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/" replace />} />}>
        <Route element={<TrialGate />}>
          <Route element={<RoleGuard />}>
            <Route path="/invoice-builder" element={<Home />} />
            <Route element={<AppLayout />}>
              <Route path="/invoice-history" element={<InvoiceHistory />} />
              <Route path="/business-profile" element={<BusinessProfile />} />
              <Route path="/client-database" element={<ClientDatabase />} />
              <Route path="/usage-reports" element={<UsageReports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/templates" element={<QuickTemplates />} />
              <Route path="/payment-logs" element={<PaymentLogs />} />
              <Route path="/tax-summary" element={<TaxSummary />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/account-activity" element={<AccountActivity />} />
              <Route path="/service-catalog" element={<ServiceCatalog />} />
              <Route path="/team-management" element={<TeamManagement />} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <PaywallProvider>
            <AuthenticatedApp />
            <Toaster />
          </PaywallProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}
