import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  isError?: boolean;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { prefixIcon, suffixIcon, isError, invalid, className = '', ...props },
  ref
) {
  const hasError = invalid ?? isError;
  if (prefixIcon || suffixIcon) {
    return (
      <div className={`input-affix-wrapper ${hasError ? 'has-error' : ''}`}>
        {prefixIcon && <span className="input-prefix-icon">{prefixIcon}</span>}
        <input
          ref={ref}
          className={`input-field ${prefixIcon ? 'has-prefix' : ''} ${suffixIcon ? 'has-suffix' : ''} ${className}`}
          aria-invalid={hasError ? true : undefined}
          {...props}
        />
        {suffixIcon && <span className="input-suffix-icon">{suffixIcon}</span>}
      </div>
    );
  }

  return (
    <input
      ref={ref}
      className={`input-field ${hasError ? 'input-error' : ''} ${className}`}
      aria-invalid={hasError ? true : undefined}
      {...props}
    />
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isError?: boolean;
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { isError, invalid, className = '', rows = 4, ...props },
  ref
) {
  const hasError = invalid ?? isError;
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`input-field textarea-field ${hasError ? 'input-error' : ''} ${className}`}
      aria-invalid={hasError ? true : undefined}
      {...props}
    />
  );
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  isError?: boolean;
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { isError, invalid, className = '', children, ...props },
  ref
) {
  const hasError = invalid ?? isError;
  return (
    <div className={`select-control-wrapper ${hasError ? 'has-error' : ''}`}>
      <select
        ref={ref}
        className={`input-field select-field ${className}`}
        aria-invalid={hasError ? true : undefined}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="select-arrow" aria-hidden="true" />
    </div>
  );
});
