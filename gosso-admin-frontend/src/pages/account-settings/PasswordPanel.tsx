import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProfileManager } from '@gosso/client/react';
import {
  Button,
  ButtonGroup,
  Feedback,
  FormField,
  IconButton,
  Input,
  Panel,
  PanelBody,
  PanelHeader,
  PlainSection,
} from '@gouno/ui';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch {
      // Handled by profileError from useProfileManager
    }
  };

  const isDirty = Boolean(currentPassword || newPassword || confirmPassword);

  return (
    <Panel>
      <PanelHeader title={t('password.title')} description={t('password.description')} />
      <form onSubmit={handleSubmit}>
        <PlainSection>
          <div className="flex-col gap-lg max-w-xl">
            {(validationError || profileError) && <Feedback type="error">{validationError || profileError}</Feedback>}
            {success && <Feedback type="success">{success}</Feedback>}

            <FormField label={t('password.currentPasswordLabel')} required>
              <Input
                type={showCurrentPwd ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                suffixIcon={
                  <IconButton
                    label="Toggle current password visibility"
                    icon={showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
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
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('password.newPasswordPlaceholder')}
                autoComplete="new-password"
                suffixIcon={
                  <IconButton
                    label="Toggle new password visibility"
                    icon={showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
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
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('password.confirmPasswordPlaceholder')}
                autoComplete="new-password"
              />
            </FormField>
          </div>
        </PlainSection>

        <PanelBody className="form-action-bar">
          <p className="form-action-bar__status m-0" aria-live="polite">
            {isDirty && (
              <>
                <span className="status-dot status-dot--warning" aria-hidden="true" />
                <span>{t('site.unsavedChanges')}</span>
              </>
            )}
          </p>
          <ButtonGroup align="right">
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              icon={<Lock size={16} />}
            >
              {loading ? t('password.changePasswordLoading') : t('password.changePasswordButton')}
            </Button>
          </ButtonGroup>
        </PanelBody>
      </form>
    </Panel>
  );
}
