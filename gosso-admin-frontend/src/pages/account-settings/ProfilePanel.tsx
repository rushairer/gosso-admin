import { useState } from 'react';
import { Lock, Eye, EyeOff, Edit2 as EditIcon, X as XIcon, Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProfileManager, useUserProfile } from '@gosso/client/react';
import {
  Feedback,
  FormField,
  Panel,
  PanelHeader,
  PlainSection,
  DefinitionList,
  DefinitionRow,
  Tag,
} from '../../components/ui';
import { EmailChangeModal } from './EmailChangeModal';

export default function ProfilePanel() {
  const { t } = useTranslation();
  const profile = useUserProfile();
  const {
    loading,
    error: profileError,
    updateDisplayName,
    changePassword,
  } = useProfileManager();

  // Password update states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile Edit States
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  // Email Edit States
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleStartEditName = () => {
    setNewName(profile?.name || '');
    setIsEditingName(true);
    setValidationError(null);
    setSuccess(null);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setValidationError(null);
      setSuccess(null);

      await updateDisplayName(newName.trim());

      setSuccess(t('profile.displayNameUpdatedSuccess'));
      setIsEditingName(false);
    } catch {}
  };

  const handleStartEditEmail = () => {
    setShowEmailModal(true);
    setValidationError(null);
    setSuccess(null);
  };

  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setValidationError(t('profile.passwordsDoNotMatch'));
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);

      setSuccess(t('profile.passwordUpdatedSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {}
  };

  return (
    <Panel>
      <PanelHeader title={t('profile.title')} description={t('profile.description')} />
      <PlainSection title={t('profile.accountProfileSection')}>
        {(validationError || profileError) && (
          <div className="mb-md">
            <Feedback type="error">{validationError || profileError}</Feedback>
          </div>
        )}
        {success && (
          <div className="mb-md">
            <Feedback type="success">{success}</Feedback>
          </div>
        )}

        <DefinitionList>
          <DefinitionRow label={t('profile.usernameLabel')}>{profile?.preferred_username || '-'}</DefinitionRow>

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
                  disabled={loading}
                  style={{ padding: '6px 10px' }}
                >
                  <Check style={{ width: '14px', height: '14px' }} />
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  disabled={loading}
                  style={{ padding: '6px 10px' }}
                >
                  <XIcon style={{ width: '14px', height: '14px' }} />
                </button>
              </form>
            ) : (
              <div className="flex-row items-center justify-between" style={{ width: '100%' }}>
                <span>{profile?.name || '-'}</span>
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
              <span>{profile?.email || t('profile.notConfigured')}</span>
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
              {profile?.roles?.map((role) => <Tag key={role}>{role}</Tag>) || (
                <Tag tone="secondary">{t('profile.standardUser')}</Tag>
              )}
            </div>
          </DefinitionRow>

          <DefinitionRow label={t('profile.subjectIdLabel')}>
            <div className="flex-row items-center justify-between" style={{ width: '100%' }}>
              <code
                style={{
                  fontSize: '12px',
                  background: 'var(--color-surface-hover, rgba(0,0,0,0.05))',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                }}
              >
                {profile?.sub || '-'}
              </code>
              {profile?.sub && (
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(profile.sub);
                    setSuccess(t('profile.copiedSubjectId'));
                  }}
                  style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Copy style={{ width: '12px', height: '12px' }} />
                  <span style={{ fontSize: '12px' }}>{t('profile.copyId')}</span>
                </button>
              )}
            </div>
          </DefinitionRow>

          <DefinitionRow label={t('profile.ssoIssuerLabel')}>
            <div className="flex-row items-center justify-between" style={{ width: '100%' }}>
              <code
                style={{
                  fontSize: '12px',
                  background: 'var(--color-surface-hover, rgba(0,0,0,0.05))',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                }}
              >
                {window.location.origin}
              </code>
              <button
                className="btn btn-secondary btn-sm"
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin);
                  setSuccess(t('profile.copiedIssuer'));
                }}
                style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Copy style={{ width: '12px', height: '12px' }} />
                <span style={{ fontSize: '12px' }}>{t('profile.copyIssuer')}</span>
              </button>
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
      {showEmailModal ? (
        <EmailChangeModal
          isOpen
          initialEmail={profile?.email || ''}
          onClose={handleCloseEmailModal}
          onProfileUpdated={() => {
            setSuccess(t('profile.emailUpdatedSuccess'));
          }}
        />
      ) : null}
    </Panel>
  );
}
