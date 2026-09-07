import React from 'react';

/**
 * Reusable Card component enforcing Level 0, Level 1, Level 2 depth guidelines from DESIGN.md.
 * 
 * @param {Object} props
 * @param {'flat' | 'outlined' | 'elevated'} [props.variant='outlined']
 * @param {'sm' | 'md' | 'lg' | 'xl'} [props.rounded='xl']
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export default function Card({
  variant = 'outlined',
  rounded = 'xl',
  className = '',
  children,
  ...rest
}) {
  const baseStyles = 'bg-surface-container-lowest transition-all duration-200';

  const roundedStyles = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-2xl', // 24px per DESIGN.md
    full: 'rounded-full',
  };

  const variantStyles = {
    flat: 'bg-surface-container border-none',
    outlined: 'border border-outline-variant/30 shadow-none',
    elevated: 'border border-outline-variant/20 shadow-level-2',
  };

  return (
    <div
      className={`${baseStyles} ${roundedStyles[rounded]} ${variantStyles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
