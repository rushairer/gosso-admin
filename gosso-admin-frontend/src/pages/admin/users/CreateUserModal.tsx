import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X as XIcon } from 'lucide-react';
import { Feedback, FormField } from '../../../components/ui';
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
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{t('users.createModalTitle')}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <XIcon style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="mb-md text-dark" style={{ fontSize: '14px' }}>
              {t('users.createModalDescription')}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <FormField label={t('users.usernameLabel')}>
                <input
                  type="text"
                  className="input-field"
                  placeholder={t('users.usernamePlaceholder')}
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  required
                  disabled={submitting || !!success}
                  autoFocus
                />
              </FormField>
              <FormField label={t('users.displayNameLabel')}>
                <input
                  type="text"
                  className="input-field"
                  placeholder={t('users.displayNamePlaceholder')}
                  value={form.display_name}
                  onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
                  required
                  disabled={submitting || !!success}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <FormField label={t('users.emailLabel')}>
                <input
                  type="email"
                  className="input-field"
                  placeholder={t('users.emailPlaceholder')}
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  disabled={submitting || !!success}
                />
              </FormField>
              <FormField label={t('users.phoneLabel')}>
                <input
                  type="text"
                  className="input-field"
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

            <FormField label={t('users.initialPasswordLabel')}>
              <input
                type="password"
                className="input-field"
                placeholder={t('users.initialPasswordPlaceholder')}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                disabled={submitting || !!success}
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <FormField label={t('users.localeLabel')} noMargin>
                <input
                  type="text"
                  className="input-field"
                  value={form.locale}
                  onChange={(e) => setForm((p) => ({ ...p, locale: e.target.value }))}
                  disabled={submitting || !!success}
                />
              </FormField>
              <FormField label={t('users.timezoneLabel')} noMargin>
                <input
                  type="text"
                  className="input-field"
                  value={form.timezone}
                  onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                  disabled={submitting || !!success}
                />
              </FormField>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting || !!success}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !!success}>
              {t('users.createUserButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
