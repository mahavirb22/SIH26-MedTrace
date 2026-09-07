import React from 'react';

/**
 * BlisterDivider component rendering the tactile "blister-pack" motif defined in DESIGN.md.
 * Repeating 8px x 8px circles with 4px spacing in secondary text color at low opacity.
 * 
 * @param {Object} props
 * @param {number} [props.count=12]
 * @param {string} [props.className]
 */
export default function BlisterDivider({ count = 16, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`w-full flex items-center justify-center py-6 overflow-hidden opacity-30 select-none ${className}`}
    >
      <div className="flex items-center gap-1.5">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-full bg-outline/60"
          />
        ))}
      </div>
    </div>
  );
}
