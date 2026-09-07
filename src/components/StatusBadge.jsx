import React from 'react';

/**
 * StatusBadge for verification states (Verified Authentic, Pending, Warning, Expired).
 * 
 * @param {Object} props
 * @param {'verified' | 'pending' | 'warning' | 'error' | 'info'} [props.status='verified']
 * @param {string} [props.label]
 * @param {React.ReactNode} [props.icon]
 * @param {string} [props.className]
 */
export default function StatusBadge({
  status = 'verified',
  label,
  icon,
  className = '',
}) {
  const styles = {
    verified: 'bg-secondary-container/20 text-primary border-secondary-container/40',
    pending: 'bg-surface-container-high text-on-surface-variant border-outline-variant/40',
    warning: 'bg-amber-500/10 text-amber-800 border-amber-500/30',
    error: 'bg-error-container/40 text-error border-error/30',
    info: 'bg-primary-fixed/30 text-primary border-primary-fixed/50',
  };

  const defaultLabels = {
    verified: 'Verified Authentic',
    pending: 'Pending Verification',
    warning: 'Caution / Flagged',
    error: 'Counterfeit / Unverified',
    info: 'In Transit',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-body text-xs font-bold ${styles[status]} ${className}`}>
      {icon ? icon : (
        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
      )}
      <span>{label || defaultLabels[status]}</span>
    </span>
  );
}
