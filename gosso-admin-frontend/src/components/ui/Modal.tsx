import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './Dialog';

export interface ModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title?: React.ReactNode;
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

  if (!visible) return null;

  return (
    <Dialog
      open={visible}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        className={cn('modal-content', className)}
        style={{ maxWidth, ...contentStyle }}
        showCloseButton={showCloseButton}
        closeLabel={t('common.close')}
        aria-label={title ? undefined : accessibleLabel}
        onEscapeKeyDown={(event) => {
          if (!closeOnEsc) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (!closeOnBackdrop) event.preventDefault();
        }}
      >
        {title ? (
          <DialogHeader className="modal-header">
            <DialogTitle className="modal-title">{title}</DialogTitle>
          </DialogHeader>
        ) : (
          <DialogTitle className="sr-only">{accessibleLabel}</DialogTitle>
        )}
        <div className="modal-body">{children}</div>
        {footer ? <DialogFooter className="modal-footer">{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
