import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, Calendar, Trash2, Plus } from 'lucide-react';
import { usePasskeys } from '@gosso/client/react';
import {
  Button,
  ButtonGroup,
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
} from '../../components/ui';

import { logger } from '../../utils/logger';

export default function PasskeysPanel() {
  const { t } = useTranslation();
  const { passkeys, loading, error, register, remove } = usePasskeys();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const { confirm, confirmDialog } = useConfirm();

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccess(null);
    if (!newPasskeyName.trim()) {
      setValidationError(t('passkeys.passkeyNameRequired'));
      return;
    }

    try {
      await register(newPasskeyName.trim());
      setSuccess(t('passkeys.passkeyRegisteredSuccess', { name: newPasskeyName }));
      setShowPasskeyModal(false);
      setNewPasskeyName('');
    } catch (err: unknown) {
      logger.error('WebAuthn registration failed', err);
    }
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
    try {
      await remove(id);
      setSuccess(t('passkeys.passkeyRemovedSuccess'));
    } catch {}
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
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowPasskeyModal(true)}>
              {t('passkeys.addPasskey')}
            </Button>
          }
        />

        {(validationError || error) && (
          <div style={{ padding: '16px 20px 0 20px' }}>
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
          <div style={{ padding: '16px 20px 0 20px' }}>
            <Feedback type="success">{success}</Feedback>
          </div>
        )}

        {passkeys.length === 0 ? (
          <EmptyState
            icon={<Key />}
            title={t('passkeys.noPasskeysTitle')}
            description={t('passkeys.noPasskeysDescription')}
          />
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
        maxWidth="400px"
        onClose={() => {
          setShowPasskeyModal(false);
          setNewPasskeyName('');
        }}
      >
        <p className="text-muted text-sm">{t('passkeys.registerModalDescription')}</p>

        <form onSubmit={handleRegisterPasskey} className="flex-col mt-md gap-md">
          <FormField label={t('passkeys.passkeyNameLabel')} noMargin>
            <Input
              type="text"
              required
              value={newPasskeyName}
              onChange={(e) => setNewPasskeyName(e.target.value)}
              placeholder={t('passkeys.passkeyNamePlaceholder')}
            />
          </FormField>

          <ButtonGroup align="right">
            <Button variant="primary" type="submit" loading={loading}>
              {t('passkeys.registerDeviceButton')}
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setShowPasskeyModal(false);
                setNewPasskeyName('');
              }}
            >
              {t('common.cancel')}
            </Button>
          </ButtonGroup>
        </form>
      </Modal>

      {confirmDialog}
    </>
  );
}
