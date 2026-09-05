import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, Calendar, Trash2, Plus } from 'lucide-react';
import { usePasskeys } from '@gosso/client/react';
import {
  Button,
  EmptyState,
  Feedback,
  FormField,
  IconButton,
  Input,
  ListRow,
  ListStack,
  Modal,
  PageLoader,
  Panel,
  PanelBody,
  PanelHeader,
  useConfirm,
} from '@gouno/ui';
import { useSudo } from '../../components/auth/SudoContext';
import { logger } from '../../utils/logger';

export default function PasskeysPanel() {
  const { t } = useTranslation();
  const { passkeys, loading, error, register, remove } = usePasskeys();
  const { requireSudo, clearSudo } = useSudo();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const { confirm, confirmDialog } = useConfirm();

  const handleOpenAddPasskey = async () => {
    setValidationError(null);
    setSuccess(null);
    await requireSudo({
      actionTitle: t('passkeys.addPasskey'),
      onSuccess: () => {
        setShowPasskeyModal(true);
      },
    });
  };

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
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
            onSuccess: async () => {
              await doRegister();
            },
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

  const handleDeletePasskey = async (id: string, name: string) => {
    setValidationError(null);
    setSuccess(null);
    const confirmed = await confirm({
      title: t('passkeys.removePasskey'),
      message: t('passkeys.removePasskeyConfirmMessage', { name }),
      confirmLabel: t('common.remove'),
    });
    if (!confirmed) return;

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

  if (loading) {
    return <PageLoader message={t('passkeys.loadingPasskeys')} />;
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title={t('passkeys.title')}
          description={t('passkeys.description')}
          action={
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => void handleOpenAddPasskey()}>
              {t('passkeys.addPasskey')}
            </Button>
          }
        />

        {(validationError || error) && (
          <div className="panel-feedback-wrapper">
            <Feedback type="error">
              {validationError ||
                (error === 'credential not found'
                  ? t('passkeys.credentialNotFound')
                  : error === 'credential does not belong to account'
                    ? t('passkeys.credentialOwnershipMismatch')
                    : error)}
            </Feedback>
          </div>
        )}
        {success && (
          <div className="panel-feedback-wrapper">
            <Feedback type="success">{success}</Feedback>
          </div>
        )}

        {loading ? (
          <PanelBody>
            <div className="py-xl">
              <PageLoader message={t('common.loading')} />
            </div>
          </PanelBody>
        ) : passkeys.length === 0 ? (
          <PanelBody>
            <EmptyState
              icon={<Key />}
              title={t('passkeys.noPasskeysTitle')}
              description={t('passkeys.noPasskeysDescription')}
            />
          </PanelBody>
        ) : (
          <PanelBody>
            <ListStack>
              {passkeys.map((passkey) => (
                <ListRow
                  key={passkey.id}
                  icon={<Key size={16} />}
                  title={passkey.name}
                  meta={
                    <>
                      <Calendar size={12} />
                      {passkey.created_at
                        ? new Date(passkey.created_at).toLocaleString()
                        : t('passkeys.registeredDevice')}
                    </>
                  }
                  action={
                    <IconButton
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={14} />}
                      label={t('passkeys.removePasskey')}
                      onClick={() => handleDeletePasskey(passkey.id, passkey.name)}
                    />
                  }
                />
              ))}
            </ListStack>
          </PanelBody>
        )}
      </Panel>

      {/* Register Passkey Modal */}
      <Modal
        isOpen={showPasskeyModal}
        title={t('passkeys.registerModalTitle')}
        description={t('passkeys.registerModalDescription')}
        maxWidth="400px"
        onClose={() => {
          setShowPasskeyModal(false);
          setNewPasskeyName('');
        }}
        footer={
          <>
            <Button
              variant="secondary"
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
              variant="primary"
              type="submit"
              loading={loading}
              disabled={!newPasskeyName.trim()}
            >
              {t('passkeys.registerDeviceButton')}
            </Button>
          </>
        }
      >
        <form id="register-passkey-form" onSubmit={handleRegisterPasskey} className="flex-col gap-md">
          <FormField label={t('passkeys.passkeyNameLabel')} noMargin>
            <Input
              type="text"
              required
              value={newPasskeyName}
              onChange={(e) => setNewPasskeyName(e.target.value)}
              placeholder={t('passkeys.passkeyNamePlaceholder')}
            />
          </FormField>
        </form>
      </Modal>

      {confirmDialog}
    </>
  );
}
