import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';
import logoImg from '../assets/f36fe9f878904277a25160df72df9f1a_verimed_logo.png';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalMenuOpen, setPortalMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userRole = user?.role || null;

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/15 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 max-w-content mx-auto px-4 sm:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logoImg}
              alt="MedTrace Logo"
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <span className="font-headline text-2xl font-bold text-primary tracking-tight">
              MedTrace
            </span>
          </Link>
        </div>

        {/* Dynamic Desktop Navigation Links based on logged-in Role */}
        <nav className="hidden md:flex items-center gap-6">
          {/* 1. Patient or Unauthenticated User Navigation */}
          {(!isAuthenticated || userRole === 'patient') && (
            <>
              <Link
                to="/patient"
                className={`font-body text-sm transition-colors ${
                  isActive('/patient') || isActive('/')
                    ? 'text-primary font-bold border-b-2 border-primary py-1'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Patient Home
              </Link>
              <Link
                to="/patient/scan"
                className={`font-body text-sm transition-colors ${
                  isActive('/patient/scan')
                    ? 'text-primary font-bold border-b-2 border-primary py-1'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Scan Medicine
              </Link>
              <Link
                to="/patient/history"
                className={`font-body text-sm transition-colors ${
                  isActive('/patient/history')
                    ? 'text-primary font-bold border-b-2 border-primary py-1'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                My History
              </Link>
            </>
          )}

          {/* 2. Pharmacist Navigation */}
          {isAuthenticated && userRole === 'pharmacist' && (
            <>
              <Link
                to="/pharmacist/dashboard"
                className={`font-body text-sm transition-colors ${
                  isActive('/pharmacist/dashboard')
                    ? 'text-primary font-bold border-b-2 border-primary py-1'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                POS Dashboard
              </Link>
              <Link
                to="/pharmacist/sell"
                className={`font-body text-sm transition-colors ${
                  isActive('/pharmacist/sell')
                    ? 'text-primary font-bold border-b-2 border-primary py-1'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Dispense POS
              </Link>
              <Link
                to="/pharmacist/inventory"
                className={`font-body text-sm transition-colors ${
                  isActive('/pharmacist/inventory')
                    ? 'text-primary font-bold border-b-2 border-primary py-1'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Inventory
              </Link>
            </>
          )}

          {/* 3. Admin / Regulator Navigation */}
          {isAuthenticated && userRole === 'admin' && (
            <>
              <Link
                to="/admin/dashboard"
                className={`font-body text-sm transition-colors ${
                  isActive('/admin/dashboard') || isActive('/admin/overview')
                    ? 'text-primary font-bold border-b-2 border-primary py-1'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Regulator Dashboard
              </Link>
              <Link
                to="/admin/stores"
                className={`font-body text-sm transition-colors ${
                  isActive('/admin/stores')
                    ? 'text-primary font-bold border-b-2 border-primary py-1'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Store Analytics
              </Link>
              <Link
                to="/admin/alerts"
                className={`font-body text-sm transition-colors ${
                  isActive('/admin/alerts')
                    ? 'text-primary font-bold border-b-2 border-primary py-1'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Anomaly Alerts
              </Link>
              <Link
                to="/admin/audit"
                className={`font-body text-sm transition-colors ${
                  isActive('/admin/audit')
                    ? 'text-primary font-bold border-b-2 border-primary py-1'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Audit Trail
              </Link>
            </>
          )}
        </nav>

        {/* Action Buttons & Auth User Badge */}
        <div className="flex items-center gap-3">
          {(!isAuthenticated || userRole === 'patient') && (
            <Link to="/patient/scan" className="hidden sm:block">
              <Button variant="secondary" size="sm">
                SCAN MEDICINE
              </Button>
            </Link>
          )}

          {/* Authenticated User Badge & Logout */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-surface-container rounded-full pl-3 pr-1.5 py-1 border border-outline-variant/30">
                <span className="font-body text-xs text-on-surface font-semibold truncate max-w-[140px]">{user?.name}</span>
                <span className="text-[10px] font-label-caps bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-bold">
                  {userRole}
                </span>
                <button
                  onClick={handleLogout}
                  className="w-7 h-7 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error/20 transition-colors ml-1"
                  title="Sign Out"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="sm:hidden w-9 h-9 rounded-full bg-error/10 text-error flex items-center justify-center"
                title="Sign Out"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/patient/login"
                className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-base">login</span>
                <span>Sign In</span>
              </Link>

              {/* Discreet Portal Access Dropdown for Staff/Regulators */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setPortalMenuOpen(!portalMenuOpen)}
                  className="p-2 text-outline hover:text-primary transition-colors rounded-full hover:bg-surface-container"
                  title="Portal Access (Staff & Regulators)"
                >
                  <span className="material-symbols-outlined text-xl">tune</span>
                </button>

                {portalMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-level-3 py-2 z-50"
                    onMouseLeave={() => setPortalMenuOpen(false)}
                  >
                    <div className="px-3 py-1 text-[10px] font-label-caps text-outline uppercase font-bold">Staff & Regulators</div>
                    <Link
                      to="/pharmacist/login"
                      onClick={() => setPortalMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-surface-container-low transition-colors text-xs font-medium text-on-surface"
                    >
                      <span className="material-symbols-outlined text-primary text-base">local_pharmacy</span>
                      <span>Pharmacist Portal</span>
                    </Link>
                    <Link
                      to="/admin/login"
                      onClick={() => setPortalMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-surface-container-low transition-colors text-xs font-medium text-primary font-bold"
                    >
                      <span className="material-symbols-outlined text-primary text-base">admin_panel_settings</span>
                      <span>Regulator Admin</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-on-surface hover:text-primary focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-container-lowest border-b border-outline-variant/20 px-6 py-4 flex flex-col gap-3 shadow-lg">
          {(!isAuthenticated || userRole === 'patient') && (
            <>
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="font-body text-sm py-1.5 text-on-surface hover:text-primary font-medium">
                Patient Home
              </Link>
              <Link to="/patient/scan" onClick={() => setMobileMenuOpen(false)} className="font-body text-sm py-1.5 text-on-surface hover:text-primary font-medium">
                Scan Medicine
              </Link>
              <Link to="/patient/history" onClick={() => setMobileMenuOpen(false)} className="font-body text-sm py-1.5 text-on-surface hover:text-primary font-medium">
                My Scan History
              </Link>
            </>
          )}

          {isAuthenticated && userRole === 'pharmacist' && (
            <>
              <Link to="/pharmacist/dashboard" onClick={() => setMobileMenuOpen(false)} className="font-body text-sm py-1.5 text-on-surface hover:text-primary font-medium">
                POS Dashboard
              </Link>
              <Link to="/pharmacist/sell" onClick={() => setMobileMenuOpen(false)} className="font-body text-sm py-1.5 text-on-surface hover:text-primary font-medium">
                Dispense POS
              </Link>
              <Link to="/pharmacist/inventory" onClick={() => setMobileMenuOpen(false)} className="font-body text-sm py-1.5 text-on-surface hover:text-primary font-medium">
                Inventory Management
              </Link>
            </>
          )}

          {isAuthenticated && userRole === 'admin' && (
            <>
              <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="font-body text-sm py-1.5 text-primary font-bold">
                Regulator Dashboard
              </Link>
              <Link to="/admin/stores" onClick={() => setMobileMenuOpen(false)} className="font-body text-sm py-1.5 text-on-surface hover:text-primary font-medium">
                Store Analytics
              </Link>
              <Link to="/admin/alerts" onClick={() => setMobileMenuOpen(false)} className="font-body text-sm py-1.5 text-on-surface hover:text-primary font-medium">
                Anomaly Alerts
              </Link>
              <Link to="/admin/audit" onClick={() => setMobileMenuOpen(false)} className="font-body text-sm py-1.5 text-on-surface hover:text-primary font-medium">
                Audit Trail
              </Link>
            </>
          )}

          {!isAuthenticated && (
            <>
              <hr className="border-outline-variant/20 my-1" />
              <Link to="/patient/login" onClick={() => setMobileMenuOpen(false)} className="font-body text-xs font-semibold text-primary py-1">
                Patient Sign In
              </Link>
              <Link to="/pharmacist/login" onClick={() => setMobileMenuOpen(false)} className="font-body text-xs font-medium text-outline py-1">
                Pharmacist Portal Login
              </Link>
              <Link to="/admin/login" onClick={() => setMobileMenuOpen(false)} className="font-body text-xs font-medium text-outline py-1">
                Regulator Admin Login
              </Link>
            </>
          )}

          {isAuthenticated && (
            <>
              <hr className="border-outline-variant/20 my-1" />
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="font-body text-xs font-semibold text-error py-1.5 text-left flex items-center gap-2">
                <span className="material-symbols-outlined text-base">logout</span>
                <span>Sign Out ({user?.name})</span>
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
