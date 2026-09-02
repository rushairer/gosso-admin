import React, { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X as XIcon } from 'lucide-react';
import { IconButton } from './Button';

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  onCloseRef.current = onClose;
  if (visible && previousFocus.current === null) {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  useEffect(() => {
    if (!visible) return;

    const dialog = dialogRef.current;
    const autofocusTarget = dialog?.querySelector<HTMLElement>('[autofocus]');
    const firstFocusable = dialog?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!dialog?.contains(document.activeElement)) {
      (autofocusTarget || firstFocusable || dialog)?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc) {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
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
    <div
      className="modal-backdrop"
      onClick={
        closeOnBackdrop
          ? (event) => {
              if (event.target === event.currentTarget) onClose();
            }
          : undefined
      }
    >
      <div
        ref={dialogRef}
        className={`modal-content ${className}`}
        style={{ maxWidth, ...contentStyle }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel || t('common.dialog')}
        tabIndex={-1}
      >
        {title && (
          <div className="modal-header">
            <h3 className="modal-title" id={titleId}>
              {title}
            </h3>
            {showCloseButton && (
              <IconButton
                label={t('common.close')}
                icon={<XIcon size={18} />}
                variant="ghost"
                size="sm"
                className="modal-close-btn"
                onClick={onClose}
              />
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
