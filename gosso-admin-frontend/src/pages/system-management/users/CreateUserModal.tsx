import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Feedback, FormField, Input, Modal } from '../../../components/ui';
import type { CreateAccountPayload } from '../../../services';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAccountPayload) => Promise<void>;
}

export function CreateUserModal({ isOpen, onClose, onSubmit }: CreateUserModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CreateAccountPayload>({
    username: '',
    display_name: '',
    email: '',
    phone: '',
    password: '',
    locale: 'en',
    timezone: 'UTC',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await onSubmit(form);
      setSuccess(t('users.userCreatedSuccess'));
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('users.createFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('users.createModalTitle')}
      maxWidth="520px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting || !!success}>
            {t('common.cancel')}
          </Button>
          <Button
            form="create-user-form"
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={submitting || !!success}
          >
            {t('users.createUserButton')}
          </Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={handleSubmit}>
        <p className="mb-md text-dark text-sm">{t('users.createModalDescription')}</p>

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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <FormField id="new-username" label={t('users.usernameLabel')} required>
            <Input
              id="new-username"
              type="text"
              placeholder={t('users.usernamePlaceholder')}
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              required
              disabled={submitting || !!success}
              autoFocus
            />
          </FormField>
          <FormField id="new-display-name" label={t('users.displayNameLabel')} required>
            <Input
              id="new-display-name"
              type="text"
              placeholder={t('users.displayNamePlaceholder')}
              value={form.display_name}
              onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
              required
              disabled={submitting || !!success}
            />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <FormField id="new-email" label={t('users.emailLabel')}>
            <Input
              id="new-email"
              type="email"
              placeholder={t('users.emailPlaceholder')}
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              disabled={submitting || !!success}
            />
          </FormField>
          <FormField id="new-phone" label={t('users.phoneLabel')}>
            <Input
              id="new-phone"
              type="text"
              placeholder={t('users.phonePlaceholder')}
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              disabled={submitting || !!success}
            />
          </FormField>
        </div>
        <div className="form-hint mb-md" style={{ marginTop: '-10px' }}>
          {t('users.contactHint')}
        </div>

        <FormField id="new-password" label={t('users.initialPasswordLabel')} required>
          <Input
            id="new-password"
            type="password"
            placeholder={t('users.initialPasswordPlaceholder')}
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
            disabled={submitting || !!success}
          />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <FormField id="new-locale" label={t('users.localeLabel')} noMargin>
            <Input
              id="new-locale"
              type="text"
              value={form.locale}
              onChange={(e) => setForm((p) => ({ ...p, locale: e.target.value }))}
              disabled={submitting || !!success}
            />
          </FormField>
          <FormField id="new-timezone" label={t('users.timezoneLabel')} noMargin>
            <Input
              id="new-timezone"
              type="text"
              value={form.timezone}
              onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
              disabled={submitting || !!success}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
