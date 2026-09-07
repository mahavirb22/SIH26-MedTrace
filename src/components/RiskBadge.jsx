import React from 'react';

/**
 * RiskBadge for Anomaly Alerts and Regulator Audit Risk Levels.
 * 
 * @param {Object} props
 * @param {'high' | 'medium' | 'low'} [props.level='low']
 * @param {string} [props.className]
 */
export default function RiskBadge({ level = 'low', className = '' }) {
  const levelStyles = {
    high: 'bg-error text-on-error font-bold',
    medium: 'bg-secondary-container text-on-secondary-container font-semibold',
    low: 'bg-surface-container-highest text-on-surface-variant font-medium',
  };

  const levelLabels = {
    high: 'High Risk',
    medium: 'Medium Risk',
    low: 'Low Risk',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono tracking-wide uppercase ${levelStyles[level]} ${className}`}>
      {levelLabels[level]}
    </span>
  );
}
