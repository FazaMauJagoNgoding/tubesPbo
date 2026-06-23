import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import LandingView from './views/LandingView';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import ProfileCompletionView from './views/ProfileCompletionView';
import DashboardLayout from './layouts/DashboardLayout';
import OverviewSubView from './views/dashboard/OverviewSubView';
import ManageBooksSubView from './views/dashboard/ManageBooksSubView';
import LoanDataSubView from './views/dashboard/LoanDataSubView';
import CatalogSubView from './views/dashboard/CatalogSubView';
import LoanHistorySubView from './views/dashboard/LoanHistorySubView';
import PaymentSubView from './views/dashboard/PaymentSubView';
import { getSession, isProfileCompleted } from './lib/firebaseBackend';

function RequireCompletedProfile({ children }: { children: ReactNode }) {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isProfileCompleted(session)) {
    return <Navigate to="/profile-completion" replace />;
  }

  return children;
}

function RequireRole({ roles, children }: { roles: Array<'admin' | 'member'>; children: ReactNode }) {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(session.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        <Route path="/profile-completion" element={<ProfileCompletionView />} />
        
        <Route path="/dashboard" element={<RequireCompletedProfile><DashboardLayout /></RequireCompletedProfile>}>
          <Route index element={<OverviewSubView />} />
          <Route path="manage-books" element={<RequireRole roles={['admin']}><ManageBooksSubView /></RequireRole>} />
          <Route path="loans" element={<RequireRole roles={['admin']}><LoanDataSubView /></RequireRole>} />
          <Route path="catalog" element={<RequireRole roles={['member']}><CatalogSubView /></RequireRole>} />
          <Route path="history" element={<LoanHistorySubView />} />
          <Route path="payment" element={<PaymentSubView />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
