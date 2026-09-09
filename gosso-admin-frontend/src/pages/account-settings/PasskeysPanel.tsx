import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, Calendar, Trash2, Plus } from 'lucide-react';
import { usePasskeys } from '@gosso/client/react';
import { Alert, Button, Empty, FormField, IconButton, Input, Modal, Text } from '@gouno/ui/core';
import { useSudo } from '../../components/auth/SudoContext';
import { logger } from '../../utils/logger';
import { PasskeysLoading } from './loading';
import { Section, StatusMessage } from './shared';

interface PendingRemoval {
  id: string;
  name: string;
}

export default function PasskeysPanel() {
  const { t } = useTranslation();
  const { passkeys, loading, error, reload, register, remove } = usePasskeys();
  const { requireSudo, clearSudo } = useSudo();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null);
  const [hasResolvedInitialLoad, setHasResolvedInitialLoad] = useState(false);

  useEffect(() => {
    if (!loading && !error) setHasResolvedInitialLoad(true);
  }, [error, loading]);

  const initialLoading = loading && !hasResolvedInitialLoad;
  const fatalLoadError = Boolean(error) && !hasResolvedInitialLoad;

  const handleOpenAddPasskey = async () => {
    setValidationError(null);
    setSuccess(null);
    await requireSudo({
      actionTitle: t('passkeys.addPasskey'),
      onSuccess: () => setShowPasskeyModal(true),
    });
  };

  const handleRegisterPasskey = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidationError(null);
    setSuccess(null);
    const trimmedName = newPasskeyName.trim();
    if (!trimmedName) {
      setValidationError(t('passkeys.passkeyNameRequired'));
      return;
    }

    const doRegister = async () => {
      try {
        await register(trimmedName);
        setSuccess(t('passkeys.passkeyRegisteredSuccess', { name: trimmedName }));
        setShowPasskeyModal(false);
        setNewPasskeyName('');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('recent strong authentication required')) {
          clearSudo();
          await requireSudo({
            actionTitle: t('passkeys.addPasskey'),
            onSuccess: doRegister,
          });
          return;
        }
        logger.error('WebAuthn registration failed', err);
      }
    };

    await requireSudo({
      actionTitle: t('passkeys.addPasskey'),
      onSuccess: doRegister,
    });
  };

  const handleDeletePasskey = async () => {
    if (!pendingRemoval) return;
    const { id } = pendingRemoval;
    setPendingRemoval(null);
    setValidationError(null);
    setSuccess(null);

    await requireSudo({
      actionTitle: t('passkeys.removePasskey'),
      onSuccess: async () => {
        try {
          await remove(id);
          setSuccess(t('passkeys.passkeyRemovedSuccess'));
        } catch (err: unknown) {
          logger.error('Failed to remove passkey', err);
        }
      },
    });
  };

  return (
    <>
      <Section
        description={t('passkeys.description')}
        surface="direct"
        actions={
          <Button
            variant="solid"
            color="primary"
            icon={<Plus />}
            disabled={loading || fatalLoadError}
            onClick={() => void handleOpenAddPasskey()}
          >
            {t('passkeys.addPasskey')}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          {validationError || error ? (
            <Alert
              type="error"
              showIcon
              title={
                validationError ||
                (error === 'credential not found'
                  ? t('passkeys.credentialNotFound')
                  : error === 'credential does not belong to account'
                    ? t('passkeys.credentialOwnershipMismatch')
                    : error)
              }
              action={
                fatalLoadError ? (
                  <Button size="small" loading={loading} onClick={() => void reload().catch(() => {})}>
                    {t('common.retry')}
                  </Button>
                ) : undefined
              }
            />
          ) : null}
          {success ? <StatusMessage message={success} /> : null}

          {initialLoading ? (
            <PasskeysLoading label={t('passkeys.loadingPasskeys')} />
          ) : fatalLoadError ? null : passkeys.length === 0 ? (
            <Empty
              icon={<Key aria-hidden="true" className="size-6 text-muted-foreground" />}
              title={t('passkeys.noPasskeysTitle')}
              description={t('passkeys.noPasskeysDescription')}
              action={
                <Button icon={<Plus />} disabled={loading} onClick={() => void handleOpenAddPasskey()}>
                  {t('passkeys.addPasskey')}
                </Button>
              }
            />
          ) : (
            <ul
              className="divide-y overflow-hidden rounded-lg border border-border/80 bg-card"
              aria-label={t('passkeys.title')}
              aria-busy={loading}
            >
              {passkeys.map((passkey) => (
                <li
                  key={passkey.id}
                  className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Key aria-hidden="true" className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <Text as="div" className="truncate font-semibold">
                        {passkey.name}
                      </Text>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{t('passkeys.registeredDevice')}</span>
                        {passkey.created_at ? (
                          <span className="flex items-center gap-1">
                            <Calendar aria-hidden="true" className="size-3" />
                            {new Date(passkey.created_at).toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <IconButton
                    variant="ghost"
                    color="error"
                    icon={<Trash2 />}
                    label={t('passkeys.removePasskey')}
                    onClick={() => setPendingRemoval({ id: passkey.id, name: passkey.name })}
                    disabled={loading}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      <Modal
        open={showPasskeyModal}
        title={t('passkeys.registerModalTitle')}
        description={t('passkeys.registerModalDescription')}
        maxWidth="400px"
        onOpenChange={(next) => {
          setShowPasskeyModal(next);
          if (!next) setNewPasskeyName('');
        }}
        footer={
          <>
            <Button
              type="button"
              onClick={() => {
                setShowPasskeyModal(false);
                setNewPasskeyName('');
              }}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              form="register-passkey-form"
              variant="solid"
              color="primary"
              type="submit"
              loading={loading}
              disabled={!newPasskeyName.trim()}
            >
              {t('passkeys.registerDeviceButton')}
            </Button>
          </>
        }
      >
        <form id="register-passkey-form" onSubmit={handleRegisterPasskey} className="flex flex-col gap-4">
          <FormField label={t('passkeys.passkeyNameLabel')} required>
            <Input
              type="text"
              required
              value={newPasskeyName}
              onChange={(event) => setNewPasskeyName(event.target.value)}
              placeholder={t('passkeys.passkeyNamePlaceholder')}
            />
          </FormField>
        </form>
      </Modal>

      <Modal
        open={Boolean(pendingRemoval)}
        title={t('passkeys.removePasskey')}
        description={
          pendingRemoval ? t('passkeys.removePasskeyConfirmMessage', { name: pendingRemoval.name }) : undefined
        }
        onOpenChange={(next) => {
          if (!next) setPendingRemoval(null);
        }}
        onOk={() => void handleDeletePasskey()}
        okText={t('common.remove')}
        cancelText={t('common.cancel')}
        okButtonProps={{ variant: 'solid', color: 'error' }}
      />
    </>
  );
}
