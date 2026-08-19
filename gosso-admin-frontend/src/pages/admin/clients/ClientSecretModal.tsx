import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Info as InfoIcon,
  Copy as CopyIcon,
  Check as CheckIcon,
} from 'lucide-react';
import { ButtonGroup, FormField } from '../../../components/ui';

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

  if (!isOpen || !details) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ border: '1px solid rgba(168, 85, 247, 0.4)' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: 'var(--color-secondary)' }}>
            {t('clients.secretModalTitle')}
          </h3>
        </div>
        <div className="modal-body">
          <div className="notice-card" style={{ flexDirection: 'row', marginBottom: '20px' }}>
            <InfoIcon style={{ width: '20px', height: '20px', stroke: 'var(--color-secondary)', flexShrink: 0 }} />
            <p
              style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', textAlign: 'left', lineHeight: '1.5' }}
            >
              {t('clients.secretWarning')}
            </p>
          </div>

          <FormField label={t('clients.clientIdLabel')}>
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '10px 14px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '14px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {details.client_id}
            </div>
          </FormField>

          <FormField label={t('clients.clientSecretLabel')}>
            <ButtonGroup compact>
              <div
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.03)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {details.client_secret}
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCopySecret}
                style={{ padding: '0 16px' }}
                title={t('clients.copySecret')}
              >
                {copied ? (
                  <CheckIcon style={{ width: '16px', height: '16px', stroke: 'var(--success-color)' }} />
                ) : (
                  <CopyIcon style={{ width: '16px', height: '16px' }} />
                )}
              </button>
            </ButtonGroup>
          </FormField>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            {t('common.done')}
          </button>
        </div>
      </div>
    </div>
  );
};
