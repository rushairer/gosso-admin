import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './Dialog';

export interface ModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  className?: string;
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
  ariaLabel?: string;
  contentStyle?: React.CSSProperties;
}

export function Modal({
  isOpen,
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = '550px',
  className = '',
  closeOnEsc = true,
  closeOnBackdrop = false,
  showCloseButton = true,
  ariaLabel,
  contentStyle,
}: ModalProps) {
  const visible = open ?? isOpen ?? false;
  const { t } = useTranslation();
  const accessibleLabel = ariaLabel || t('common.dialog');
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  onCloseRef.current = onClose;
  if (visible && previousFocus.current === null) {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !closeOnEsc) return;
      event.preventDefault();
      onCloseRef.current();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus.current?.focus();
      previousFocus.current = null;
    };
  }, [visible, closeOnEsc]);

  if (!visible) return null;

  return (
    <Dialog
      open={visible}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCloseRef.current();
      }}
    >
      <DialogContent
        className={cn('sm:max-w-lg', className)}
        style={{ maxWidth, ...contentStyle }}
        showCloseButton={showCloseButton}
        closeLabel={t('common.close')}
        aria-label={title ? undefined : accessibleLabel}
        onBackdropClick={closeOnBackdrop ? () => onCloseRef.current() : undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          previousFocus.current?.focus();
        }}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        {title ? (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
        ) : (
          <DialogTitle className="sr-only">{accessibleLabel}</DialogTitle>
        )}
        <div className="py-2">{children}</div>
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
