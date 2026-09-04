import { useTranslation } from 'react-i18next';
import { CheckSquare as ConsentIcon } from 'lucide-react';
import { Button, EmptyState, ListRow, ListStack, LoadingSpinner, Modal, Tag } from '../../../components/ui';
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
        <Button variant="secondary" onClick={onClose}>
          {t('common.close')}
        </Button>
      }
    >
      <p className="text-muted text-sm mb-md">{t('users.consentsDescription')}</p>

      {loading ? (
        <div className="text-center py-xl">
          <LoadingSpinner size="sm" className="mx-auto mb-sm" />
          <p className="text-muted text-sm">{t('users.loadingConsents')}</p>
        </div>
      ) : consents.length === 0 ? (
        <EmptyState title={t('users.noConsentsTitle')} description={t('users.noConsentsDescription')} />
      ) : (
        <ListStack>
          {consents.map((consent) => (
            <ListRow
              key={consent.client_id}
              action={
                <Button variant="danger" size="sm" onClick={() => onRevokeConsent(consent.client_id)} disabled={isSelf}>
                  {t('users.revokeAccess')}
                </Button>
              }
            >
              <div className="flex-1 mr-md">
                <div className="flex-row items-center gap-sm">
                  <span className="list-icon">
                    <ConsentIcon size={16} />
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
                <div className="text-xs text-muted mt-sm">
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
