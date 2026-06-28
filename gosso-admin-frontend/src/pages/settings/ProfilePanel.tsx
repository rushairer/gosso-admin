import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Edit2 as EditIcon, Mail, X as XIcon, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiFetch, getAccessToken, fetchUserProfile } from '../../auth';
import {
  Feedback,
  FormField,
  Panel,
  PanelHeader,
  PlainSection,
  DefinitionList,
  DefinitionRow,
  Tag,
  ButtonGroup,
} from '../../components/ui';
import type { UserProfile } from '../../auth';

export default function ProfilePanel({ profile: initialProfile }: { profile: UserProfile | null }) {
  const { t } = useTranslation();
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(initialProfile);

  // Password update states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile Edit States
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [editNameLoading, setEditNameLoading] = useState(false);

  // Email Edit States
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [emailStep, setEmailStep] = useState<'input' | 'verify'>('input');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Keep localProfile in sync if initialProfile changes from props
  useEffect(() => {
    setLocalProfile(initialProfile);
  }, [initialProfile]);

  const reloadProfile = async () => {
    try {
      const token = getAccessToken();
      if (token) {
        const updated = await fetchUserProfile(token);
        setLocalProfile(updated);
      }
    } catch (err) {
      console.error('Failed to reload profile:', err);
    }
  };

  const handleStartEditName = () => {
    setNewName(localProfile?.name || '');
    setIsEditingName(true);
    setError(null);
    setSuccess(null);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setEditNameLoading(true);
      setError(null);
      setSuccess(null);

      const response = await apiFetch('/api/v1/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: newName.trim() }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to update display name');

      setSuccess(t('profile.displayNameUpdatedSuccess'));
      setIsEditingName(false);
      await reloadProfile();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error updating display name';
      setError(message);
    } finally {
      setEditNameLoading(false);
    }
  };

  const handleStartEditEmail = () => {
    setNewEmail(localProfile?.email || '');
    setEmailPassword('');
    setEmailCode('');
    setEmailStep('input');
    setEmailError(null);
    setShowEmailModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setNewEmail('');
    setEmailPassword('');
    setEmailCode('');
    setEmailStep('input');
    setEmailError(null);
  };

  const handleRequestEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !emailPassword) return;

    try {
      setEmailLoading(true);
      setEmailError(null);

      const response = await apiFetch('/api/v1/auth/profile/email/change/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_email: newEmail.trim(),
          password: emailPassword,
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to request email verification code');

      setEmailStep('verify');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error requesting email verification code';
      setEmailError(message);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleConfirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailCode.trim()) return;

    try {
      setEmailLoading(true);
      setEmailError(null);

      const response = await apiFetch('/api/v1/auth/profile/email/change/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_email: newEmail.trim(),
          code: emailCode.trim(),
        }),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to verify code and update email');

      setSuccess(t('profile.emailUpdatedSuccess'));
      handleCloseEmailModal();
      await reloadProfile();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error verifying email code';
      setEmailError(message);
    } finally {
      setEmailLoading(false);
    }
  };

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
      <PanelHeader title={t('profile.title')} description={t('profile.description')} />
      <PlainSection title={t('profile.accountProfileSection')}>
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

        <DefinitionList>
          <DefinitionRow label={t('profile.usernameLabel')}>{localProfile?.preferred_username || '-'}</DefinitionRow>

          <DefinitionRow label={t('profile.displayNameLabel')}>
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex-row items-center gap-sm" style={{ width: '100%' }}>
                <input
                  type="text"
                  className="input-field"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ padding: '6px 12px', fontSize: '13px', width: '220px' }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  type="submit"
                  disabled={editNameLoading}
                  style={{ padding: '6px 10px' }}
                >
                  <Check style={{ width: '14px', height: '14px' }} />
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  disabled={editNameLoading}
                  style={{ padding: '6px 10px' }}
                >
                  <XIcon style={{ width: '14px', height: '14px' }} />
                </button>
              </form>
            ) : (
              <div className="flex-row items-center justify-between" style={{ width: '100%' }}>
                <span>{localProfile?.name || '-'}</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleStartEditName}
                  style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <EditIcon style={{ width: '12px', height: '12px' }} />
                  <span style={{ fontSize: '12px' }}>{t('common.edit')}</span>
                </button>
              </div>
            )}
          </DefinitionRow>

          <DefinitionRow label={t('profile.emailLabel')}>
            <div className="flex-row items-center justify-between" style={{ width: '100%' }}>
              <span>{localProfile?.email || t('profile.notConfigured')}</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleStartEditEmail}
                style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <EditIcon style={{ width: '12px', height: '12px' }} />
                <span style={{ fontSize: '12px' }}>{t('common.edit')}</span>
              </button>
            </div>
          </DefinitionRow>

          <DefinitionRow label={t('profile.securityRoleLabel')}>
            <div className="flex-row flex-wrap gap-xs">
              {localProfile?.roles?.map((role) => <Tag key={role}>{role}</Tag>) || (
                <Tag tone="secondary">{t('profile.standardUser')}</Tag>
              )}
            </div>
          </DefinitionRow>
        </DefinitionList>
      </PlainSection>

      <PlainSection title={t('profile.updatePasswordSection')}>
        <form onSubmit={handleChangePassword} className="flex-col gap-lg" style={{ maxWidth: '500px' }}>
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

          <button className="btn btn-primary self-start mt-sm" type="submit" disabled={loading}>
            <Lock style={{ width: '16px', height: '16px' }} />
            {loading ? t('profile.changePasswordLoading') : t('profile.changePasswordButton')}
          </button>
        </form>
      </PlainSection>

      {/* Edit Email Modal */}
      {showEmailModal && (
        <div className="modal-backdrop" onClick={handleCloseEmailModal}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{t('profile.editEmailTitle')}</h3>
              <button className="modal-close-btn" onClick={handleCloseEmailModal}>
                <XIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <div className="modal-body">
              <p className="text-muted mb-md" style={{ fontSize: '13.5px', lineHeight: '1.5' }}>
                {t('profile.editEmailDescription')}
              </p>

              {emailError && (
                <div className="mb-md">
                  <Feedback type="error">{emailError}</Feedback>
                </div>
              )}

              {emailStep === 'input' ? (
                <form onSubmit={handleRequestEmailCode} className="flex-col gap-lg">
                  <FormField label={t('profile.newEmailLabel')} noMargin>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        className="input-field"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="user@example.com"
                        style={{ paddingLeft: '38px' }}
                      />
                      <Mail
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '16px',
                          height: '16px',
                          color: 'var(--color-text-muted)',
                        }}
                      />
                    </div>
                  </FormField>

                  <FormField label={t('profile.currentPasswordLabel')} noMargin>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showEmailPassword ? 'text' : 'password'}
                        className="input-field"
                        required
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmailPassword(!showEmailPassword)}
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
                        {showEmailPassword ? (
                          <EyeOff style={{ width: '16px', height: '16px' }} />
                        ) : (
                          <Eye style={{ width: '16px', height: '16px' }} />
                        )}
                      </button>
                    </div>
                  </FormField>

                  <ButtonGroup align="right">
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={handleCloseEmailModal}
                      disabled={emailLoading}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={emailLoading || !newEmail.trim() || !emailPassword}
                    >
                      {emailLoading ? t('common.loading') : t('profile.sendCodeButton')}
                    </button>
                  </ButtonGroup>
                </form>
              ) : (
                <form onSubmit={handleConfirmEmailChange} className="flex-col gap-lg">
                  <FormField label={t('profile.verificationCodeLabel')} noMargin>
                    <input
                      type="text"
                      className="input-field"
                      required
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value)}
                      placeholder="123456"
                    />
                  </FormField>

                  <ButtonGroup align="right">
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => setEmailStep('input')}
                      disabled={emailLoading}
                    >
                      {t('common.previous') || 'Back'}
                    </button>
                    <button className="btn btn-primary" type="submit" disabled={emailLoading || !emailCode.trim()}>
                      {emailLoading ? t('common.loading') : t('profile.confirmEmailButton')}
                    </button>
                  </ButtonGroup>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
