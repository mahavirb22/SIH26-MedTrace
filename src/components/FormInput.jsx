import React from 'react';

/**
 * Reusable FormInput component supporting standard, search, and monospaced serial number inputs.
 * 
 * @param {Object} props
 * @param {string} [props.label]
 * @param {string} [props.error]
 * @param {React.ReactNode} [props.icon]
 * @param {boolean} [props.mono=false]
 * @param {string} [props.className]
 */
export default function FormInput({
  label,
  error,
  icon,
  mono = false,
  className = '',
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  ...rest
}) {
  const fontStyle = mono ? 'font-mono tracking-wider' : 'font-body';

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="font-label-caps text-xs text-on-surface-variant font-bold uppercase tracking-wider">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3.5 text-outline pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full bg-surface-container-lowest border border-outline-variant/50 text-on-surface placeholder:text-outline/70 text-sm rounded-md transition-all duration-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary ${
            icon ? 'pl-10' : 'px-4'
          } py-3 ${fontStyle} ${error ? 'border-error ring-1 ring-error' : ''}`}
          {...rest}
        />
      </div>
      {error && (
        <span className="text-xs text-error font-body mt-0.5">{error}</span>
      )}
    </div>
  );
}
