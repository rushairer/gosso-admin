import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Edit2 as EditIcon, X as XIcon, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { gossoClient } from '../../auth';
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
import type { UserProfile } from '../../auth';
import { EmailChangeModal } from './EmailChangeModal';

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

  // Keep localProfile in sync if initialProfile changes from props
  useEffect(() => {
    setLocalProfile(initialProfile);
  }, [initialProfile]);

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

      const updated = await gossoClient.updateProfile(newName.trim());

      setSuccess(t('profile.displayNameUpdatedSuccess'));
      setIsEditingName(false);
      setLocalProfile(updated);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('profile.displayNameUpdateFailed');
      setError(message);
    } finally {
      setEditNameLoading(false);
    }
  };

  const handleStartEditEmail = () => {
    setShowEmailModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
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
      await gossoClient.changePassword(currentPassword, newPassword);

      setSuccess(t('profile.passwordUpdatedSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('profile.passwordUpdateFailed');
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
      <EmailChangeModal
        isOpen={showEmailModal}
        initialEmail={localProfile?.email || ''}
        onClose={handleCloseEmailModal}
        onProfileUpdated={(updatedProfile) => {
          setLocalProfile(updatedProfile);
          setSuccess(t('profile.emailUpdatedSuccess'));
        }}
      />
    </Panel>
  );
}
