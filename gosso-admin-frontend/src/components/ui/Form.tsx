import React, { useId, isValidElement, cloneElement } from 'react';
import { cn } from '../../lib/utils';

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
    <div className={cn('space-y-1.5', !noMargin && 'mb-4', className)}>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider" htmlFor={id}>
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {content}
      {error ? (
        <div className="text-xs text-destructive font-medium" id={descriptionId} role="alert">
          {error}
        </div>
      ) : (
        hint && (
          <div className="text-xs text-muted-foreground" id={descriptionId}>
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
    return (
      <input
        ref={ref}
        type="checkbox"
        id={id}
        className={cn(
          'h-4 w-4 rounded-[4px] border border-border bg-input text-primary accent-primary focus:ring-2 focus:ring-ring focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
  return (
    <label
      className={cn('inline-flex items-center gap-2 text-sm text-foreground cursor-pointer select-none', className)}
      htmlFor={id}
    >
      <input
        ref={ref}
        type="checkbox"
        id={id}
        className="h-4 w-4 rounded-[4px] border border-border bg-input text-primary accent-primary focus:ring-2 focus:ring-ring focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
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
    return (
      <input
        ref={ref}
        type="radio"
        id={id}
        className={cn(
          'h-4 w-4 rounded-full border border-border bg-input text-primary accent-primary focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
  return (
    <label
      className={cn('inline-flex items-center gap-2 text-sm text-foreground cursor-pointer select-none', className)}
      htmlFor={id}
    >
      <input
        ref={ref}
        type="radio"
        id={id}
        className="h-4 w-4 rounded-full border border-border bg-input text-primary accent-primary focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
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
    <label className={cn('inline-flex items-center gap-2 cursor-pointer select-none', className)} htmlFor={id}>
      <input ref={ref} type="checkbox" id={id} role="switch" className="sr-only peer" {...props} />
      <div className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-zinc-700 transition-colors duration-200 ease-in-out peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
        <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out translate-x-0 peer-checked:translate-x-4" />
      </div>
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}
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
    <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer select-none" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded-[4px] border border-border bg-input text-primary accent-primary focus:ring-2 focus:ring-ring focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
      />
      <span>{label}</span>
    </label>
  );
}

export function CheckboxGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 mb-4">
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-4 pt-1">{children}</div>
    </div>
  );
}
