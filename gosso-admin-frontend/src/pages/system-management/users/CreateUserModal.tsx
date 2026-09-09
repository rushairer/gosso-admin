import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, FormField, Input, Modal } from '@gouno/ui/core';
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('users.createModalTitle')}
      description={t('users.createModalDescription')}
      maxWidth="520px"
      footer={
        <>
          <Button onClick={onClose} disabled={submitting || Boolean(success)}>
            {t('common.cancel')}
          </Button>
          <Button
            form="create-user-form"
            type="submit"
            variant="solid"
            color="primary"
            loading={submitting}
            disabled={submitting || Boolean(success)}
          >
            {t('users.createUserButton')}
          </Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error ? <Alert type="error" showIcon title={error} /> : null}
        {success ? <Alert type="success" showIcon title={success} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="new-username" label={t('users.usernameLabel')} required>
            <Input
              id="new-username"
              type="text"
              placeholder={t('users.usernamePlaceholder')}
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
              required
              disabled={submitting || Boolean(success)}
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
              disabled={submitting || Boolean(success)}
            />
          </FormField>
          <FormField id="new-email" label={t('users.emailLabel')}>
            <Input
              id="new-email"
              type="email"
              placeholder={t('users.emailPlaceholder')}
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              disabled={submitting || Boolean(success)}
            />
          </FormField>
          <FormField id="new-phone" label={t('users.phoneLabel')} hint={t('users.contactHint')}>
            <Input
              id="new-phone"
              type="text"
              placeholder={t('users.phonePlaceholder')}
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              disabled={submitting || Boolean(success)}
            />
          </FormField>
        </div>

        <FormField id="new-password" label={t('users.initialPasswordLabel')} required>
          <Input
            id="new-password"
            type="password"
            placeholder={t('users.initialPasswordPlaceholder')}
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
            disabled={submitting || Boolean(success)}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="new-locale" label={t('users.localeLabel')}>
            <Input id="new-locale" value={form.locale} onChange={(e) => setForm((p) => ({ ...p, locale: e.target.value }))} disabled={submitting || Boolean(success)} />
          </FormField>
          <FormField id="new-timezone" label={t('users.timezoneLabel')}>
            <Input id="new-timezone" value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))} disabled={submitting || Boolean(success)} />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
