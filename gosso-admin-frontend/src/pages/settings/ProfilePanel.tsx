import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../auth';
import { Feedback, FormField, Panel, PanelHeader, PlainSection, DefinitionList, DefinitionRow, Tag } from '../../components/ui';
import type { UserProfile } from '../../auth';

export default function ProfilePanel({ profile }: { profile: UserProfile | null }) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError(t('profile.passwordsDoNotMatch'));
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetch('/api/v1/auth/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to change password');

      setSuccess(t('profile.passwordUpdatedSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error changing password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel>
      <PanelHeader
        title={t('profile.title')}
        description={t('profile.description')}
      />
      <PlainSection title={t('profile.accountProfileSection')}>
        <DefinitionList>
          <DefinitionRow label={t('profile.usernameLabel')}>{profile?.preferred_username || '-'}</DefinitionRow>
          <DefinitionRow label={t('profile.displayNameLabel')}>{profile?.name || '-'}</DefinitionRow>
          <DefinitionRow label={t('profile.emailLabel')}>{profile?.email || t('profile.notConfigured')}</DefinitionRow>
          <DefinitionRow label={t('profile.securityRoleLabel')}>
            <div className="flex-row flex-wrap gap-xs">
              {profile?.roles?.map((role) => <Tag key={role}>{role}</Tag>) || (
                <Tag tone="secondary">{t('profile.standardUser')}</Tag>
              )}
            </div>
          </DefinitionRow>
        </DefinitionList>
      </PlainSection>

      <PlainSection title={t('profile.updatePasswordSection')}>
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
        <form
          onSubmit={handleChangePassword}
          className="flex-col gap-lg"
          style={{ maxWidth: '500px' }}
        >
          <FormField label={t('profile.currentPasswordLabel')} noMargin>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrentPwd ? 'text' : 'password'}
                className="input-field"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                }}
              >
                {showCurrentPwd ? (
                  <EyeOff style={{ width: '16px', height: '16px' }} />
                ) : (
                  <Eye style={{ width: '16px', height: '16px' }} />
                )}
              </button>
            </div>
          </FormField>

          <FormField label={t('profile.newPasswordLabel')} noMargin>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPwd ? 'text' : 'password'}
                className="input-field"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('profile.newPasswordPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowNewPwd(!showNewPwd)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                }}
              >
                {showNewPwd ? (
                  <EyeOff style={{ width: '16px', height: '16px' }} />
                ) : (
                  <Eye style={{ width: '16px', height: '16px' }} />
                )}
              </button>
            </div>
          </FormField>

          <FormField label={t('profile.confirmPasswordLabel')} noMargin>
            <input
              type="password"
              className="input-field"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('profile.confirmPasswordPlaceholder')}
            />
          </FormField>

          <button
            className="btn btn-primary self-start mt-sm"
            type="submit"
            disabled={loading}
          >
            <Lock style={{ width: '16px', height: '16px' }} />
            {loading ? t('profile.changePasswordLoading') : t('profile.changePasswordButton')}
          </button>
        </form>
      </PlainSection>
    </Panel>
  );
}
