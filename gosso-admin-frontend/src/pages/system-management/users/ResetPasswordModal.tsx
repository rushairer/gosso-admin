import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Feedback, FormField, Input, Modal } from '../../../components/ui';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      isOpen={isOpen}
      onClose={onClose}
      title={t('users.changePasswordModalTitle')}
      description={t('users.changePasswordDescription', {
        name: account.display_name || account.username,
      })}
      maxWidth="400px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting || !!success}>
            {t('common.cancel')}
          </Button>
          <Button
            form="reset-password-form"
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={!newPassword || submitting || !!success}
          >
            {t('users.updatePasswordButton')}
          </Button>
        </>
      }
    >
      <form id="reset-password-form" onSubmit={handleSubmit}>
        {error && (
          <div className="mb-md">
            <Feedback type="error">{error}</Feedback>
          </div>
        )}
        {success && (
          <div className="mb-md">
            <Feedback type="success">{success}</Feedback>
          </div>
        )}

        <FormField id="new-password" label={t('users.newPasswordLabel')} noMargin required>
          <Input
            id="new-password"
            type="password"
            placeholder={t('users.newPasswordPlaceholder')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={submitting || !!success}
            autoFocus
          />
        </FormField>
      </form>
    </Modal>
  );
}
