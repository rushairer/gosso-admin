import type { CSSProperties } from 'react';
import { cn } from '@gouno/ui';

export function BrandMark({ src, className }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block shrink-0 bg-current', className)}
      style={
        {
          WebkitMask: `url("${src}") center / contain no-repeat`,
          mask: `url("${src}") center / contain no-repeat`,
        } as CSSProperties
      }
    />
  );
}
