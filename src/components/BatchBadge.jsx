import React from 'react';

/**
 * BatchBadge for displaying monospaced Serial Numbers, Batch IDs, and Hash values.
 * Per DESIGN.md: ID Display is contained within a light gray code block using Monospace font, slightly inset with a 4px radius.
 * 
 * @param {Object} props
 * @param {string} props.id
 * @param {string} [props.prefix='Batch ID']
 * @param {string} [props.className]
 */
export default function BatchBadge({ id, prefix = 'Batch ID', className = '' }) {
  return (
    <div className={`inline-flex items-center gap-1.5 bg-surface-container-highest/80 border border-outline-variant/30 px-2.5 py-1 rounded font-code text-xs text-on-surface-variant tracking-wider ${className}`}>
      {prefix && <span className="opacity-70">{prefix}:</span>}
      <span className="font-semibold text-on-surface font-mono">{id}</span>
    </div>
  );
}
