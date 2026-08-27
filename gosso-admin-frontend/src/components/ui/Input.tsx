import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  isError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { prefixIcon, suffixIcon, isError, className = '', ...props },
  ref
) {
  if (prefixIcon || suffixIcon) {
    return (
      <div className={`input-affix-wrapper ${isError ? 'has-error' : ''}`}>
        {prefixIcon && <span className="input-prefix-icon">{prefixIcon}</span>}
        <input
          ref={ref}
          className={`input-field ${prefixIcon ? 'has-prefix' : ''} ${suffixIcon ? 'has-suffix' : ''} ${className}`}
          aria-invalid={isError ? true : undefined}
          {...props}
        />
        {suffixIcon && <span className="input-suffix-icon">{suffixIcon}</span>}
      </div>
    );
  }

  return (
    <input
      ref={ref}
      className={`input-field ${isError ? 'input-error' : ''} ${className}`}
      aria-invalid={isError ? true : undefined}
      {...props}
    />
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { isError, className = '', rows = 4, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`input-field textarea-field ${isError ? 'input-error' : ''} ${className}`}
      aria-invalid={isError ? true : undefined}
      {...props}
    />
  );
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  isError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { isError, className = '', children, ...props },
  ref
) {
  return (
    <div className={`select-control-wrapper ${isError ? 'has-error' : ''}`}>
      <select
        ref={ref}
        className={`input-field select-field ${className}`}
        aria-invalid={isError ? true : undefined}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="select-arrow" aria-hidden="true" />
    </div>
  );
});
