import type { ReactNode } from 'react';
import gossoLogo from '@gouno/ui/brand-icons/gosso.svg';
import { Card, Heading, Text } from '@gouno/ui/core';
import { BrandMark } from '../branding/BrandMark';

export default function AuthPageSurface({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background p-4 sm:p-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_38%),radial-gradient(circle_at_90%_90%,color-mix(in_srgb,var(--muted-foreground)_10%,transparent),transparent_42%)]"
      />
      <div className="relative w-full max-w-md">
        <Card padding="lg" variant="elevated" className="w-full border-border/80 bg-raised/95 backdrop-blur">
          <div className="mb-7 text-center">
            <BrandMark src={gossoLogo} className="mx-auto mb-4 size-14 text-primary" />
            <Heading level={1} className="text-2xl font-bold tracking-tight">
              {title}
            </Heading>
            {description ? (
              <Text tone="muted" size="sm" className="mt-2 leading-relaxed">
                {description}
              </Text>
            ) : null}
          </div>
          {children}
        </Card>
      </div>
    </div>
  );
}
