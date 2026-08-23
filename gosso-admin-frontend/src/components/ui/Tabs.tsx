import type { ReactNode } from 'react';

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  value: T;
  items: readonly TabItem<T>[];
  onValueChange: (value: T) => void;
  ariaLabel: string;
}

/**
 * A controlled tab trigger group. Routing remains the responsibility of the
 * page until tabs are migrated to URL-backed subroutes.
 */
export function Tabs<T extends string>({ value, items, onValueChange, ariaLabel }: TabsProps<T>) {
  return (
    <div className="tabs-header" role="tablist" aria-label={ariaLabel}>
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={`tab-btn ${selected ? 'active' : ''}`}
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
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
