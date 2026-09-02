import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';

export interface DrawerProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string | number;
  className?: string;
}

export function Drawer({
  isOpen,
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 480,
  className = '',
}: DrawerProps) {
  const visible = open ?? isOpen ?? false;

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`drawer-panel ${className}`}
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <div className="drawer-title-group">
            <h3 className="drawer-title">{title}</h3>
            {description && <p className="drawer-description">{description}</p>}
          </div>
          <IconButton label="Close drawer" icon={<X size={18} />} variant="ghost" size="sm" onClick={onClose} />
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-footer">{footer}</div>}
      </div>
    </div>
  );
}
