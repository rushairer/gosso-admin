import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  danger?: boolean;
  busy?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onClose?: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  description,
  confirmLabel,
  confirmVariant,
  danger,
  busy = false,
  loading = false,
  onConfirm,
  onCancel,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const handleCancel = onCancel || onClose || (() => {});
  const isDanger = danger !== undefined ? danger : confirmVariant !== 'primary';
  const resolvedVariant = isDanger ? 'danger' : 'primary';
  const resolvedConfirmLabel = confirmLabel ?? t('common.confirm');
  const text = message || description || '';
  const isBusy = busy || loading;

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title={
        <span className="confirm-dialog-title">
          <AlertTriangle
            className={`confirm-dialog-icon ${isDanger ? 'confirm-dialog-icon--danger' : 'confirm-dialog-icon--primary'}`}
          />
          {title}
        </span>
      }
      maxWidth="420px"
      closeOnBackdrop
      showCloseButton={false}
      footer={
        <>
          <Button variant="secondary" onClick={handleCancel} disabled={isBusy}>
            {t('common.cancel')}
          </Button>
          <Button variant={resolvedVariant} onClick={onConfirm} loading={isBusy}>
            {resolvedConfirmLabel}
          </Button>
        </>
      }
    >
      <p className="confirm-dialog-message">{text}</p>
    </Modal>
  );
}
