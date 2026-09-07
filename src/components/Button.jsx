import React from 'react';

/**
 * Reusable Button component matching Stitch design system & DESIGN.md specifications.
 * 
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.fullWidth=false]
 * @param {React.ReactNode} [props.icon]
 * @param {'left' | 'right'} [props.iconPosition='left']
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  disabled = false,
  className = '',
  children,
  onClick,
  type = 'button',
  ...rest
}) {
  const baseStyles = 'inline-flex items-center justify-center font-label-caps text-label-caps rounded-full transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeStyles = {
    sm: 'px-4 py-2 text-[11px] leading-4 gap-1.5',
    md: 'px-6 py-3 text-[12px] leading-4 gap-2 shadow-sm hover:shadow',
    lg: 'px-8 py-4 text-[13px] leading-4 gap-2.5 shadow-md hover:shadow-lg',
  };

  const variantStyles = {
    primary: 'bg-primary-container text-on-primary hover:bg-primary active:scale-[0.99]',
    secondary: 'bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary active:scale-[0.99]',
    ghost: 'bg-surface-container-highest text-on-surface hover:bg-surface-dim active:scale-[0.99]',
    outline: 'border border-outline/30 text-on-surface bg-transparent hover:bg-surface-container-low active:scale-[0.99]',
    danger: 'bg-error text-on-error hover:bg-error/90 active:scale-[0.99]',
  };

  const widthStyle = fullWidth ? 'w-full' : 'w-auto';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...rest}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0 normal-case flex items-center">{icon}</span>}
      <span className="uppercase tracking-wider">{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0 normal-case flex items-center">{icon}</span>}
    </button>
  );
}
