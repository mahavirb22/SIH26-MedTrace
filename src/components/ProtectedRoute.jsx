import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Protects routes that require authentication and/or specific roles.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.roles] - Allowed roles (e.g. ['pharmacist', 'admin'])
 * @param {string} [props.redirectTo='/patient/login'] - Where to redirect unauthenticated users
 */
export default function ProtectedRoute({ children, roles, redirectTo = '/patient/login' }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    // Authenticated but wrong role — redirect to their portal
    const roleRedirects = {
      patient: '/patient',
      pharmacist: '/pharmacist/dashboard',
      admin: '/admin/overview',
      manufacturer: '/pharmacist/dashboard',
    };
    return <Navigate to={roleRedirects[user?.role] || '/patient'} replace />;
  }

  return children;
}
