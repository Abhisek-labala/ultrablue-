import React from 'react';

export const Input = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  error,
  hint,
  disabled = false,
  readOnly = false,
  icon: Icon,
  suffix,
  className = '',
  ...props
}) => {
  return (
    <div className={`ub-form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="ub-label">
          <span>{label}</span>
          {required && <span className="ub-label-required">*</span>}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <Icon 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }} 
          />
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          className={`ub-input ${error ? 'ub-input-error' : ''}`}
          style={{
            paddingLeft: Icon ? '36px' : '12px',
            paddingRight: suffix ? '50px' : '12px'
          }}
          {...props}
        />
        {suffix && (
          <span 
            style={{ 
              position: 'absolute', 
              right: '12px', 
              fontSize: 'var(--font-size-xs)', 
              fontWeight: 600, 
              color: 'var(--text-secondary)' 
            }}
          >
            {suffix}
          </span>
        )}
      </div>
      {error && <span className="ub-form-error-msg">{error}</span>}
      {!error && hint && <span className="ub-form-hint">{hint}</span>}
    </div>
  );
};

export const Select = ({
  label,
  id,
  options = [],
  value,
  onChange,
  required = false,
  error,
  hint,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`ub-form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="ub-label">
          <span>{label}</span>
          {required && <span className="ub-label-required">*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`ub-select ${error ? 'ub-input-error' : ''}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="ub-form-error-msg">{error}</span>}
      {!error && hint && <span className="ub-form-hint">{hint}</span>}
    </div>
  );
};
