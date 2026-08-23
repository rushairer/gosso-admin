import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Feedback, FormField, Modal } from '../../../components/ui';
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
      maxWidth="400px"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting || !!success}>
            {t('common.cancel')}
          </button>
          <button
            form="reset-password-form"
            type="submit"
            className="btn btn-primary"
            disabled={!newPassword || submitting || !!success}
          >
            {t('users.updatePasswordButton')}
          </button>
        </>
      }
    >
      <form id="reset-password-form" onSubmit={handleSubmit}>
        <p className="mb-md text-dark" style={{ fontSize: '14px' }}>
          {t('users.changePasswordDescription', {
            name: account.display_name || account.username,
          })}
        </p>

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
          <input
            id="new-password"
            type="password"
            className="input-field"
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
