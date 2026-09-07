import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoImg from '../assets/f36fe9f878904277a25160df72df9f1a_verimed_logo.png';

/**
 * Dedicated Sidebar component for Pharmacist and Admin portals.
 * Completely separate views with zero overlapping tabs or portal switches.
 *
 * @param {Object} props
 * @param {'pharmacist' | 'admin'} [props.portal]
 */
export default function Sidebar({ portal }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Determine active portal mode strictly from props, URL path, or user role
  const isAdminPortal =
    portal === 'admin' ||
    location.pathname.startsWith('/admin') ||
    (user?.role === 'admin' && !location.pathname.startsWith('/pharmacist'));

  const pharmacistLinks = [
    { label: 'POS Dashboard', path: '/pharmacist/dashboard', icon: 'dashboard' },
    { label: 'Dispense POS', path: '/pharmacist/sell', icon: 'point_of_sale' },
    { label: 'Inventory', path: '/pharmacist/inventory', icon: 'inventory_2' },
    { label: 'Store Analytics', path: '/pharmacist/analytics', icon: 'analytics' },
  ];

  const adminLinks = [
    { label: 'Regulator Dashboard', path: '/admin/dashboard', icon: 'shield_person' },
    { label: 'Store Analytics', path: '/admin/stores', icon: 'insights' },
    { label: 'Anomaly Alerts', path: '/admin/alerts', icon: 'warning' },
    { label: 'Audit Trail', path: '/admin/audit', icon: 'receipt_long' },
  ];

  const links = isAdminPortal ? adminLinks : pharmacistLinks;
  const portalTitle = isAdminPortal ? 'Regulator Admin' : 'Pharmacist Portal';
  const portalSub = isAdminPortal ? 'NATIONAL INTEGRITY' : 'DISPENSARY SYSTEM';

  const isActive = (path) =>
    location.pathname === path || (path !== '/admin/dashboard' && path !== '/pharmacist/dashboard' && location.pathname.startsWith(path));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Derive user display info
  const userName = user?.name || (isAdminPortal ? 'Inspector Director' : 'Pharmacist Doctor');
  const userSub = user?.email || (isAdminPortal ? 'admin@medtrace.in' : 'pharmacist@medicare.com');
  const userInitials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : isAdminPortal
    ? 'AD'
    : 'RX';

  return (
    <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant/30 min-h-screen flex flex-col justify-between p-6 shrink-0 shadow-sm font-body">
      <div className="flex flex-col gap-8">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="MedTrace Logo" className="h-9 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="font-headline text-xl font-bold text-primary leading-none">
              MedTrace
            </span>
            <span className="font-label-caps text-[9px] text-outline tracking-widest uppercase mt-1 font-bold">
              {portalTitle}
            </span>
          </div>
        </div>

        {/* Dedicated Portal Badge (No tab switcher) */}
        <div className="px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
          <span className="text-[11px] font-label-caps font-bold text-primary uppercase tracking-wider">
            {portalSub}
          </span>
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        </div>

        {/* Portal-Specific Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          {links.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="flex flex-col gap-4 pt-6 border-t border-outline-variant/20">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 text-xs font-label-caps uppercase tracking-wider text-outline hover:text-primary py-2 rounded-lg border border-outline/20 transition-all hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Patient App</span>
        </Link>

        <div className="flex items-center gap-3 bg-surface-container rounded-xl p-3">
          <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
            {userInitials}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-on-surface truncate">
              {userName}
            </span>
            <span className="text-[11px] text-outline truncate font-mono">
              {userSub}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error/20 transition-colors shrink-0"
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
