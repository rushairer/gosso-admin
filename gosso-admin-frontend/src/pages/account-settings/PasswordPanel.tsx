import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProfileManager } from '@gosso/client/react';
import { Button, FormField, IconButton, Input, Text } from '@gouno/ui/core';
import { Section, StatusMessage } from './shared';

export default function PasswordPanel() {
  const { t } = useTranslation();
  const { loading, error: profileError, changePassword } = useProfileManager();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidationError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setValidationError(t('password.passwordsDoNotMatch'));
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(t('password.passwordUpdatedSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {}
  };

  const isDirty = Boolean(currentPassword || newPassword || confirmPassword);

  return (
    <Section description={t('password.description')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex max-w-xl flex-col gap-5">
          {validationError || profileError ? (
            <StatusMessage type="error" message={validationError || profileError} />
          ) : null}
          {success ? <StatusMessage message={success} /> : null}

          <FormField label={t('password.currentPasswordLabel')} required>
            <Input
              type={showCurrentPwd ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              suffix={
                <IconButton
                  label="Toggle current password visibility"
                  icon={showCurrentPwd ? <EyeOff /> : <Eye />}
                  variant="ghost"
                  type="button"
                  onClick={() => setShowCurrentPwd((visible) => !visible)}
                />
              }
            />
          </FormField>

          <FormField label={t('password.newPasswordLabel')} required hint={t('password.newPasswordPlaceholder')}>
            <Input
              type={showNewPwd ? 'text' : 'password'}
              required
              minLength={12}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder={t('password.newPasswordPlaceholder')}
              autoComplete="new-password"
              suffix={
                <IconButton
                  label="Toggle new password visibility"
                  icon={showNewPwd ? <EyeOff /> : <Eye />}
                  variant="ghost"
                  type="button"
                  onClick={() => setShowNewPwd((visible) => !visible)}
                />
              }
            />
          </FormField>

          <FormField label={t('password.confirmPasswordLabel')} required>
            <Input
              type="password"
              required
              minLength={12}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={t('password.confirmPasswordPlaceholder')}
              autoComplete="new-password"
            />
          </FormField>
        </div>

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Text size="sm" tone="muted" aria-live="polite">
            {isDirty ? t('site.unsavedChanges') : ''}
          </Text>
          <Button
            variant="solid"
            color="primary"
            type="submit"
            loading={loading}
            disabled={!currentPassword || !newPassword || !confirmPassword}
            icon={<Lock />}
          >
            {loading ? t('password.changePasswordLoading') : t('password.changePasswordButton')}
          </Button>
        </div>
      </form>
    </Section>
  );
}
