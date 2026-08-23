import React from 'react';

export function FormField({
  label,
  children,
  hint,
  error,
  id,
  required = false,
  noMargin = false,
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  id?: string;
  required?: boolean;
  noMargin?: boolean;
}) {
  const descriptionId = id && (hint || error) ? `${id}-description` : undefined;
  return (
    <div className="form-group" style={noMargin ? { margin: 0 } : undefined}>
      <label className="form-label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {error ? (
        <div className="form-error" id={descriptionId} role="alert">
          {error}
        </div>
      ) : (
        hint && (
          <div className="form-hint" id={descriptionId}>
            {hint}
          </div>
        )
      )}
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

export function CheckboxGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="checkbox-group">{children}</div>
    </div>
  );
}
