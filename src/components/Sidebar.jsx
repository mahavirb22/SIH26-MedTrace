import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoImg from '../assets/f36fe9f878904277a25160df72df9f1a_verimed_logo.png';

/**
 * Reusable Sidebar navigation component for Pharmacist Portal and Admin Dashboard.
 * 
 * @param {Object} props
 * @param {'pharmacist' | 'admin'} [props.portal='pharmacist']
 */
export default function Sidebar({ portal = 'pharmacist' }) {
  const location = useLocation();

  const pharmacistLinks = [
    { label: 'Dashboard', path: '/pharmacist/dashboard', icon: 'dashboard' },
    { label: 'Sell / POS', path: '/pharmacist/sell', icon: 'point_of_sale' },
    { label: 'Inventory', path: '/pharmacist/inventory', icon: 'inventory_2' },
    { label: 'Store Analytics', path: '/pharmacist/analytics', icon: 'analytics' },
  ];

  const adminLinks = [
    { label: 'Regulator Overview', path: '/admin/overview', icon: 'shield_person' },
    { label: 'Store Analytics', path: '/admin/analytics', icon: 'insights' },
    { label: 'Anomaly Alerts', path: '/admin/alerts', icon: 'warning' },
    { label: 'Audit Trail', path: '/admin/audit', icon: 'receipt_long' },
  ];

  const links = portal === 'pharmacist' ? pharmacistLinks : adminLinks;
  const portalTitle = portal === 'pharmacist' ? 'Pharmacist Portal' : 'Regulator Admin';

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant/30 min-h-screen flex flex-col justify-between p-6 shrink-0">
      <div className="flex flex-col gap-8">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="MedTrace Logo" className="h-8 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="font-headline text-xl font-bold text-primary leading-none">
              MedTrace
            </span>
            <span className="font-label-caps text-[10px] text-outline tracking-wider uppercase mt-1 font-bold">
              {portalTitle}
            </span>
          </div>
        </div>

        {/* Portal Switcher Badge */}
        <div className="flex bg-surface-container rounded-lg p-1 text-xs">
          <Link
            to="/pharmacist/dashboard"
            className={`flex-1 text-center py-1.5 rounded-md font-semibold transition-all ${
              portal === 'pharmacist'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Pharmacist
          </Link>
          <Link
            to="/admin/overview"
            className={`flex-1 text-center py-1.5 rounded-md font-semibold transition-all ${
              portal === 'admin'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Admin
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          {links.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm'
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

      {/* Footer Profile & Patient App Switcher */}
      <div className="flex flex-col gap-4 pt-6 border-t border-outline-variant/20">
        <Link
          to="/patient"
          className="flex items-center justify-center gap-2 text-xs font-label-caps uppercase tracking-wider text-outline hover:text-primary py-2 rounded-lg border border-outline/20 transition-all hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Patient App</span>
        </Link>

        <div className="flex items-center gap-3 bg-surface-container rounded-xl p-3">
          <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shrink-0">
            {portal === 'pharmacist' ? 'RX' : 'AD'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-on-surface truncate">
              {portal === 'pharmacist' ? 'Dr. Sarah Jenkins' : 'Inspector Director'}
            </span>
            <span className="text-[11px] text-outline truncate font-mono">
              {portal === 'pharmacist' ? 'Lic #RX-884920' : 'FDA Reg #88392'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
