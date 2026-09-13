import type { CSSProperties } from 'react';

export function BrandMark({ src, className = '' }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`.trim()}
      style={
        {
          WebkitMask: `url("${src}") center / contain no-repeat`,
          mask: `url("${src}") center / contain no-repeat`,
        } as CSSProperties
      }
    />
  );
}
