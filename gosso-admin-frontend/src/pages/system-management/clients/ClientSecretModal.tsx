import React from 'react';
import { useTranslation } from 'react-i18next';
import { Info as InfoIcon, Copy as CopyIcon, Check as CheckIcon } from 'lucide-react';
import { Alert, Button, FormField, Modal } from '@gouno/ui/core';

interface ClientSecretModalProps {
  isOpen: boolean;
  details: {
    client_id: string;
    client_secret?: string;
    name: string;
  } | null;
  copied: boolean;
  onCopySecret: () => void;
  onClose: () => void;
}

export const ClientSecretModal: React.FC<ClientSecretModalProps> = ({
  isOpen,
  details,
  copied,
  onCopySecret,
  onClose,
}) => {
  const { t } = useTranslation();
  if (!details) return null;

  return (
    <Modal
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('clients.secretModalTitle')}
      closeOnBackdrop={false}
      footer={
        <Button variant="solid" color="primary" onClick={onClose}>
          {t('common.done')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Alert
          type="warning"
          showIcon
          icon={<InfoIcon />}
          title={t('clients.secretWarning')}
        />
        <FormField label={t('clients.clientIdLabel')}>
          <code className="block rounded-md bg-muted p-3 text-xs">{details.client_id}</code>
        </FormField>
        <FormField label={t('clients.clientSecretLabel')}>
          <div className="flex items-center gap-2 rounded-md bg-muted p-3">
            <code className="min-w-0 flex-1 break-all text-xs">{details.client_secret}</code>
            <Button
              size="small"
              onClick={onCopySecret}
              title={t('clients.copySecret')}
              icon={copied ? <CheckIcon className="text-success" /> : <CopyIcon />}
            >
              {t('common.copy', { defaultValue: '复制' })}
            </Button>
          </div>
        </FormField>
      </div>
    </Modal>
  );
};
