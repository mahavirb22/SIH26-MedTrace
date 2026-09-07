import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Patient App Pages
import PatientLanding from './pages/patient/PatientLanding';
import ScanMedicine from './pages/patient/ScanMedicine';
import VerificationResult from './pages/patient/VerificationResult';
import ScanHistory from './pages/patient/ScanHistory';
import PatientLogin from './pages/patient/PatientLogin';

// Pharmacist Portal Pages
import PharmacistLogin from './pages/pharmacist/PharmacistLogin';
import Dashboard from './pages/pharmacist/Dashboard';
import SellPOS from './pages/pharmacist/SellPOS';
import InventoryManagement from './pages/pharmacist/InventoryManagement';

// Admin / Regulator Pages
import RegulatorOverview from './pages/admin/RegulatorOverview';
import StoreAnalytics from './pages/admin/StoreAnalytics';
import AnomalyAlerts from './pages/admin/AnomalyAlerts';
import AuditTrail from './pages/admin/AuditTrail';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root Patient App Routes — public */}
      <Route path="/" element={<PatientLanding />} />
      <Route path="/patient" element={<PatientLanding />} />
      <Route path="/scan" element={<ScanMedicine />} />
      <Route path="/patient/scan" element={<ScanMedicine />} />
      <Route path="/verify" element={<VerificationResult />} />
      <Route path="/verify/:code" element={<VerificationResult />} />
      <Route path="/patient/verify" element={<VerificationResult />} />
      <Route path="/history" element={<ScanHistory />} />
      <Route path="/patient/history" element={<ScanHistory />} />
      <Route path="/login" element={<PatientLogin />} />
      <Route path="/patient/login" element={<PatientLogin />} />

      {/* Pharmacist Portal Routes — protected */}
      <Route path="/pharmacist" element={<Navigate to="/pharmacist/dashboard" replace />} />
      <Route path="/pharmacist/login" element={<PharmacistLogin />} />
      <Route path="/pharmacist/dashboard" element={
        <ProtectedRoute roles={['pharmacist', 'admin']} redirectTo="/pharmacist/login">
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/pharmacist/sell" element={
        <ProtectedRoute roles={['pharmacist', 'admin']} redirectTo="/pharmacist/login">
          <SellPOS />
        </ProtectedRoute>
      } />
      <Route path="/pharmacist/inventory" element={
        <ProtectedRoute roles={['pharmacist', 'admin']} redirectTo="/pharmacist/login">
          <InventoryManagement />
        </ProtectedRoute>
      } />
      <Route path="/pharmacist/analytics" element={
        <ProtectedRoute roles={['pharmacist', 'admin']} redirectTo="/pharmacist/login">
          <StoreAnalytics />
        </ProtectedRoute>
      } />

      {/* Admin / Regulator Portal Routes — protected */}
      <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
      <Route path="/admin/overview" element={
        <ProtectedRoute roles={['admin']} redirectTo="/pharmacist/login">
          <RegulatorOverview />
        </ProtectedRoute>
      } />
      <Route path="/admin/stores" element={
        <ProtectedRoute roles={['admin']} redirectTo="/pharmacist/login">
          <StoreAnalytics />
        </ProtectedRoute>
      } />
      <Route path="/admin/alerts" element={
        <ProtectedRoute roles={['admin']} redirectTo="/pharmacist/login">
          <AnomalyAlerts />
        </ProtectedRoute>
      } />
      <Route path="/admin/audit" element={
        <ProtectedRoute roles={['admin']} redirectTo="/pharmacist/login">
          <AuditTrail />
        </ProtectedRoute>
      } />
      <Route path="/admin/audit/:batchId" element={
        <ProtectedRoute roles={['admin']} redirectTo="/pharmacist/login">
          <AuditTrail />
        </ProtectedRoute>
      } />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
