import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-surface text-on-surface">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
