import React from 'react';
import { useTranslation } from 'react-i18next';
import { Info as InfoIcon, Copy as CopyIcon, Check as CheckIcon } from 'lucide-react';
import { Button, ButtonGroup, FormField, Modal } from '@gouno/ui';

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
      onClose={onClose}
      title={t('clients.secretModalTitle')}
      closeOnBackdrop={false}
      footer={
        <Button variant="primary" onClick={onClose}>
          {t('common.done')}
        </Button>
      }
    >
      <div className="notice-card notice-card--info">
        <InfoIcon className="notice-card__icon" />
        <p className="notice-card__text">{t('clients.secretWarning')}</p>
      </div>

      <FormField label={t('clients.clientIdLabel')}>
        <div className="code-block-preview">{details.client_id}</div>
      </FormField>

      <FormField label={t('clients.clientSecretLabel')}>
        <ButtonGroup compact>
          <div className="code-block-preview code-block-preview--flex">{details.client_secret}</div>
          <Button
            variant="secondary"
            onClick={onCopySecret}
            title={t('clients.copySecret')}
            icon={copied ? <CheckIcon size={16} className="text-success" /> : <CopyIcon size={16} />}
          />
        </ButtonGroup>
      </FormField>
    </Modal>
  );
};
