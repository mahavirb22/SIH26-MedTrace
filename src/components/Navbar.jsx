import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from './Button';
import logoImg from '../assets/f36fe9f878904277a25160df72df9f1a_verimed_logo.png';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/15 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 max-w-content mx-auto px-4 sm:px-8 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <Link to="/patient" className="flex items-center gap-3 group">
          <img
            src={logoImg}
            alt="MedTrace Logo"
            className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-headline text-2xl font-bold text-primary tracking-tight">
            MedTrace
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/patient"
            className={`font-body text-sm transition-colors ${
              isActive('/patient')
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
            My Medicines
          </Link>
          <Link
            to="/pharmacist"
            className="font-body text-xs font-semibold uppercase tracking-wider text-outline hover:text-primary px-3 py-1.5 rounded-full border border-outline/20 transition-all"
          >
            Pharmacist Portal
          </Link>
          <Link
            to="/admin"
            className="font-body text-xs font-semibold uppercase tracking-wider text-outline hover:text-primary px-3 py-1.5 rounded-full border border-outline/20 transition-all"
          >
            Regulator Admin
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Link to="/patient/scan" className="hidden sm:block">
            <Button variant="secondary" size="sm">
              SCAN A MEDICINE
            </Button>
          </Link>

          {/* Profile / Auth Indicator */}
          <Link
            to="/patient/login"
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary hover:bg-primary-container transition-colors"
            title="Sign In / Account"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-on-surface hover:text-primary focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              ) : (
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-container-lowest border-b border-outline-variant/20 px-6 py-4 flex flex-col gap-3 shadow-lg">
          <Link
            to="/patient"
            onClick={() => setMobileMenuOpen(false)}
            className="font-body text-sm py-2 text-on-surface hover:text-primary font-medium"
          >
            Patient Home
          </Link>
          <Link
            to="/patient/scan"
            onClick={() => setMobileMenuOpen(false)}
            className="font-body text-sm py-2 text-on-surface hover:text-primary font-medium"
          >
            Scan Medicine
          </Link>
          <Link
            to="/patient/history"
            onClick={() => setMobileMenuOpen(false)}
            className="font-body text-sm py-2 text-on-surface hover:text-primary font-medium"
          >
            My Medicines
          </Link>
          <hr className="border-outline-variant/20 my-1" />
          <Link
            to="/pharmacist"
            onClick={() => setMobileMenuOpen(false)}
            className="font-body text-xs font-semibold uppercase tracking-wider text-outline py-2 hover:text-primary"
          >
            Pharmacist Portal
          </Link>
          <Link
            to="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="font-body text-xs font-semibold uppercase tracking-wider text-outline py-2 hover:text-primary"
          >
            Regulator Admin Dashboard
          </Link>
        </div>
      )}
    </header>
  );
}
