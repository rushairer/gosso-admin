import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

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
      <div className="relative flex items-center w-full">
        {prefixIcon && (
          <span className="absolute left-3 flex items-center justify-center text-muted-foreground pointer-events-none">
            {prefixIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-9 w-full rounded-[var(--radius-control,6px)] border border-border bg-input px-3 py-1.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
            prefixIcon && 'pl-9',
            suffixIcon && 'pr-9',
            hasError && 'border-destructive focus-visible:ring-destructive/30',
            className
          )}
          aria-invalid={hasError ? true : undefined}
          {...props}
        />
        {suffixIcon && (
          <span className="absolute right-3 flex items-center justify-center text-muted-foreground">{suffixIcon}</span>
        )}
      </div>
    );
  }

  return (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-[var(--radius-control,6px)] border border-border bg-input px-3 py-1.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
        hasError && 'border-destructive focus-visible:ring-destructive/30',
        className
      )}
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
      className={cn(
        'flex min-h-[80px] w-full rounded-[var(--radius-control,6px)] border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
        hasError && 'border-destructive focus-visible:ring-destructive/30',
        className
      )}
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
    <div className="relative flex items-center w-full">
      <select
        ref={ref}
        className={cn(
          'flex h-9 w-full appearance-none rounded-[var(--radius-control,6px)] border border-border bg-input px-3 py-1.5 pr-8 text-sm text-foreground shadow-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
          hasError && 'border-destructive focus-visible:ring-destructive/30',
          className
        )}
        aria-invalid={hasError ? true : undefined}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </div>
  );
});
