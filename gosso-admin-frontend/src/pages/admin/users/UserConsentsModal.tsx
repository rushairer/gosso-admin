import { useTranslation } from 'react-i18next';
import { CheckSquare as ConsentIcon } from 'lucide-react';
import { EmptyState, ListRow, ListStack, LoadingSpinner, Modal, Tag } from '../../../components/ui';
import type { Account, Consent } from '../../../types/api';

interface UserConsentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  consents: Consent[];
  loading: boolean;
  currentAdminId?: string;
  onRevokeConsent: (clientId: string) => Promise<void>;
}

export function UserConsentsModal({
  isOpen,
  onClose,
  account,
  consents,
  loading,
  currentAdminId,
  onRevokeConsent,
}: UserConsentsModalProps) {
  const { t } = useTranslation();

  if (!isOpen || !account) return null;

  const isSelf = account.id === currentAdminId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('users.consentsModalTitle', { name: account.display_name || account.username })}
      maxWidth="600px"
      footer={
        <button className="btn btn-secondary" onClick={onClose}>
          {t('common.close')}
        </button>
      }
    >
      <p className="mb-md text-dark" style={{ fontSize: '14px' }}>
        {t('users.consentsDescription')}
      </p>

      {loading ? (
        <div className="text-center" style={{ padding: '30px 0' }}>
          <LoadingSpinner size="sm" style={{ margin: '0 auto 12px auto' }} />
          <p className="text-muted" style={{ fontSize: '14px' }}>
            {t('users.loadingConsents')}
          </p>
        </div>
      ) : consents.length === 0 ? (
        <EmptyState title={t('users.noConsentsTitle')} description={t('users.noConsentsDescription')} />
      ) : (
        <ListStack>
          {consents.map((consent) => (
            <ListRow
              key={consent.client_id}
              action={
                <button
                  className="btn btn-danger btn-sm"
                  style={{ padding: '6px 12px', opacity: isSelf ? 0.4 : 1 }}
                  onClick={() => onRevokeConsent(consent.client_id)}
                  disabled={isSelf}
                >
                  {t('users.revokeAccess')}
                </button>
              }
            >
              <div className="flex-1" style={{ marginRight: '16px' }}>
                <div className="flex-row items-center gap-sm">
                  <span className="list-icon">
                    <ConsentIcon style={{ width: '16px', height: '16px' }} />
                  </span>
                  <div className="list-title">Client ID: {consent.client_id}</div>
                </div>
                <div className="flex-row flex-wrap gap-xs mt-sm">
                  {consent.scopes?.map((scope: string) => (
                    <Tag key={scope} tone="secondary">
                      {scope}
                    </Tag>
                  ))}
                </div>
                <div className="text-xs text-dark mt-sm">
                  {t('users.authorizedAt')} {consent.granted_at ? new Date(consent.granted_at).toLocaleString() : '-'}
                </div>
              </div>
            </ListRow>
          ))}
        </ListStack>
      )}
    </Modal>
  );
}
