import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const resolvedConfirmLabel = confirmLabel ?? t('common.confirm');

  return (
    <Modal
      isOpen={open}
      onClose={onCancel}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle
            style={{
              width: '20px',
              height: '20px',
              color: confirmVariant === 'danger' ? 'var(--status-danger)' : 'var(--action-primary)',
            }}
          />
          {title}
        </span>
      }
      maxWidth="420px"
      closeOnBackdrop
      showCloseButton={false}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button className={`btn btn-${confirmVariant}`} onClick={onConfirm}>
            {resolvedConfirmLabel}
          </button>
        </>
      }
    >
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>{message}</p>
    </Modal>
  );
}
