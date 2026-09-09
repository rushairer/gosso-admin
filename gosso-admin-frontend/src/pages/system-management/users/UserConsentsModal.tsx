import { useTranslation } from 'react-i18next';
import { CheckSquare as ConsentIcon } from 'lucide-react';
import { Button, Empty, Modal, Spinner, Tag, Text } from '@gouno/ui/core';
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
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('users.consentsModalTitle', { name: account.display_name || account.username })}
      description={t('users.consentsDescription')}
      maxWidth="600px"
      footer={<Button onClick={onClose}>{t('common.close')}</Button>}
    >
      {loading ? (
        <div className="flex min-h-32 items-center justify-center gap-3 text-sm text-muted-foreground" role="status">
          <Spinner aria-label={t('users.loadingConsents')} />
          <span>{t('users.loadingConsents')}</span>
        </div>
      ) : consents.length === 0 ? (
        <Empty title={t('users.noConsentsTitle')} description={t('users.noConsentsDescription')} />
      ) : (
        <ul className="divide-y overflow-hidden rounded-lg border border-border/80 bg-card">
          {consents.map((consent) => (
            <li
              key={consent.client_id}
              className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <ConsentIcon aria-hidden="true" className="size-4" />
                  </span>
                  <Text as="div" className="min-w-0 truncate font-semibold">
                    Client ID: {consent.client_id}
                  </Text>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {consent.scopes?.map((scope: string) => (
                    <Tag key={scope}>{scope}</Tag>
                  ))}
                </div>
                <Text size="xs" tone="muted" className="mt-2">
                  {t('users.authorizedAt')} {consent.granted_at ? new Date(consent.granted_at).toLocaleString() : '-'}
                </Text>
              </div>
              <Button
                size="small"
                variant="solid"
                color="error"
                onClick={() => void onRevokeConsent(consent.client_id)}
                disabled={isSelf}
              >
                {t('users.revokeAccess')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
