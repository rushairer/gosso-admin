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
        <div className="flex items-center gap-2.5">
          <AlertTriangle className={`h-5 w-5 shrink-0 ${isDanger ? 'text-red-400' : 'text-primary'}`} />
          <span>{title}</span>
        </div>
      }
      maxWidth="440px"
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
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </Modal>
  );
}
