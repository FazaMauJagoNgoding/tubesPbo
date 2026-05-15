import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingView from './views/LandingView';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import DashboardLayout from './layouts/DashboardLayout';
import OverviewSubView from './views/dashboard/OverviewSubView';
import ManageBooksSubView from './views/dashboard/ManageBooksSubView';
import LoanDataSubView from './views/dashboard/LoanDataSubView';
import CatalogSubView from './views/dashboard/CatalogSubView';
import LoanHistorySubView from './views/dashboard/LoanHistorySubView';
import PaymentSubView from './views/dashboard/PaymentSubView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<OverviewSubView />} />
          <Route path="manage-books" element={<ManageBooksSubView />} />
          <Route path="loans" element={<LoanDataSubView />} />
          <Route path="catalog" element={<CatalogSubView />} />
          <Route path="history" element={<LoanHistorySubView />} />
          <Route path="payment" element={<PaymentSubView />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
