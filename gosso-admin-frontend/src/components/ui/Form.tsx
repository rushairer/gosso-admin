import React, { useId, isValidElement, cloneElement } from 'react';

export function FormField({
  label,
  children,
  hint,
  error,
  id: explicitId,
  required = false,
  noMargin = false,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  id?: string;
  required?: boolean;
  noMargin?: boolean;
  className?: string;
}) {
  const generatedId = useId();
  const childId = isValidElement(children) ? (children.props as { id?: string }).id : undefined;
  const id = explicitId || childId || `form-field-${generatedId.replace(/:/g, '')}`;
  const descriptionId = hint || error ? `${id}-description` : undefined;

  const content = isValidElement(children)
    ? cloneElement(
        children as React.ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>,
        {
          id: (children.props as { id?: string }).id || id,
          'aria-describedby': (children.props as { 'aria-describedby'?: string })['aria-describedby'] || descriptionId,
          'aria-invalid':
            (children.props as { 'aria-invalid'?: boolean })['aria-invalid'] ?? (error ? true : undefined),
        }
      )
    : children;

  return (
    <div className={`form-group ${noMargin ? 'no-margin' : ''} ${className}`.trim()}>
      <label className="form-label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {content}
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

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { id, label, className = '', ...props },
  ref
) {
  if (!label) {
    return <input ref={ref} type="checkbox" id={id} className={`ui-checkbox ${className}`} {...props} />;
  }
  return (
    <label className={`checkbox-field ${className}`} htmlFor={id}>
      <input ref={ref} type="checkbox" id={id} className="ui-checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
});

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { id, label, className = '', ...props },
  ref
) {
  if (!label) {
    return <input ref={ref} type="radio" id={id} className={`ui-radio ${className}`} {...props} />;
  }
  return (
    <label className={`radio-field ${className}`} htmlFor={id}>
      <input ref={ref} type="radio" id={id} className="ui-radio" {...props} />
      <span>{label}</span>
    </label>
  );
});

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { id, label, className = '', ...props },
  ref
) {
  return (
    <label className={`switch-field ${className}`} htmlFor={id}>
      <input ref={ref} type="checkbox" id={id} role="switch" className="ui-switch" {...props} />
      <span className="ui-switch__track" aria-hidden="true">
        <span className="ui-switch__thumb" />
      </span>
      {label && <span className="ui-switch__label">{label}</span>}
    </label>
  );
});

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
