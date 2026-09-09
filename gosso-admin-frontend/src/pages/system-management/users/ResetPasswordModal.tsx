import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, FormField, Input, Modal } from '@gouno/ui/core';
import type { Account } from '../../../types/api';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  onSubmit: (password: string) => Promise<void>;
}

export function ResetPasswordModal({ isOpen, onClose, account, onSubmit }: ResetPasswordModalProps) {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !account) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await onSubmit(newPassword);
      setSuccess(t('users.passwordUpdatedSuccess'));
      setTimeout(() => {
        onClose();
        setNewPassword('');
        setSuccess(null);
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('users.passwordUpdateFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('users.changePasswordModalTitle')}
      description={t('users.changePasswordDescription', {
        name: account.display_name || account.username,
      })}
      maxWidth="400px"
      footer={
        <>
          <Button onClick={onClose} disabled={submitting || Boolean(success)}>
            {t('common.cancel')}
          </Button>
          <Button
            form="reset-password-form"
            type="submit"
            variant="solid"
            color="primary"
            loading={submitting}
            disabled={!newPassword || submitting || Boolean(success)}
          >
            {t('users.updatePasswordButton')}
          </Button>
        </>
      }
    >
      <form id="reset-password-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error ? <Alert type="error" showIcon title={error} /> : null}
        {success ? <Alert type="success" showIcon title={success} /> : null}
        <FormField id="new-password" label={t('users.newPasswordLabel')} required>
          <Input
            id="new-password"
            type="password"
            placeholder={t('users.newPasswordPlaceholder')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={submitting || Boolean(success)}
            autoFocus
          />
        </FormField>
      </form>
    </Modal>
  );
}
