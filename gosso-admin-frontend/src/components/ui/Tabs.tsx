import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';

const TabsRoot = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export interface TabItem<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface TabsProps<T extends string> {
  value: T;
  items: readonly TabItem<T>[];
  onValueChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function Tabs<T extends string>({ value, items, onValueChange, ariaLabel, className = '' }: TabsProps<T>) {
  return (
    <div
      className={cn('inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/80 p-1', className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all select-none cursor-pointer',
              selected
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(event) => {
              const lastIndex = items.length - 1;
              const nextIndex =
                event.key === 'ArrowRight' || event.key === 'ArrowDown'
                  ? index === lastIndex
                    ? 0
                    : index + 1
                  : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
                    ? index === 0
                      ? lastIndex
                      : index - 1
                    : event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? lastIndex
                        : null;
              if (nextIndex === null) return;

              event.preventDefault();
              onValueChange(items[nextIndex].value);
              event.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="tab"]')[nextIndex]?.focus();
            }}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { TabsRoot, TabsList, TabsTrigger, TabsContent };
