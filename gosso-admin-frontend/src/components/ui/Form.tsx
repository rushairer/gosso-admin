import React from 'react';

export function FormField({
  label,
  children,
  hint,
  noMargin = false,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
  noMargin?: boolean;
}) {
  return (
    <div className="form-group" style={noMargin ? { margin: 0 } : undefined}>
      <label className="form-label">{label}</label>
      {children}
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
}

export function CheckboxField({
  id,
  label,
  checked,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="checkbox-field" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
      />
      <span>{label}</span>
    </label>
  );
}

export function CheckboxGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="checkbox-group">{children}</div>
    </div>
  );
}
