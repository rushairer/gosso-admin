import { useState } from 'react';
import { Lock, Eye, EyeOff, Edit2 as EditIcon, X as XIcon, Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProfileManager, useUserProfile } from '@gosso/client/react';
import {
  Button,
  Feedback,
  FormField,
  IconButton,
  Input,
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
  const { loading, error: profileError, updateDisplayName, changePassword } = useProfileManager();

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
              <form onSubmit={handleSaveName} className="flex-row items-center gap-sm flex-1 min-w-0">
                <Input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="max-w-240"
                />
                <IconButton
                  label="Save display name"
                  icon={<Check size={14} />}
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={loading}
                />
                <IconButton
                  label="Cancel"
                  icon={<XIcon size={14} />}
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  disabled={loading}
                />
              </form>
            ) : (
              <div className="flex-row items-center justify-between flex-1 min-w-0">
                <span>{profile?.name || '-'}</span>
                <Button variant="secondary" size="sm" icon={<EditIcon size={12} />} onClick={handleStartEditName}>
                  {t('common.edit')}
                </Button>
              </div>
            )}
          </DefinitionRow>

          <DefinitionRow label={t('profile.emailLabel')}>
            <div className="flex-row items-center justify-between flex-1 min-w-0">
              <span>{profile?.email || t('profile.notConfigured')}</span>
              <Button variant="secondary" size="sm" icon={<EditIcon size={12} />} onClick={handleStartEditEmail}>
                {t('common.edit')}
              </Button>
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
            <div className="flex-row items-center justify-between flex-1 min-w-0">
              <code className="text-mono text-sm inline-code">{profile?.sub || '-'}</code>
              {profile?.sub && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Copy size={12} />}
                  onClick={() => {
                    navigator.clipboard.writeText(profile.sub);
                    setSuccess(t('profile.copiedSubjectId'));
                  }}
                >
                  {t('profile.copyId')}
                </Button>
              )}
            </div>
          </DefinitionRow>

          <DefinitionRow label={t('profile.ssoIssuerLabel')}>
            <div className="flex-row items-center justify-between flex-1 min-w-0">
              <code className="text-mono text-sm inline-code">{window.location.origin}</code>
              <Button
                variant="secondary"
                size="sm"
                icon={<Copy size={12} />}
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin);
                  setSuccess(t('profile.copiedIssuer'));
                }}
              >
                {t('profile.copyIssuer')}
              </Button>
            </div>
          </DefinitionRow>
        </DefinitionList>
      </PlainSection>

      <PlainSection title={t('profile.updatePasswordSection')}>
        <form onSubmit={handleChangePassword} className="flex-col gap-lg max-w-500">
          <FormField label={t('profile.currentPasswordLabel')} noMargin>
            <Input
              type={showCurrentPwd ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              suffixIcon={
                <IconButton
                  label="Toggle current password visibility"
                  icon={showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                />
              }
            />
          </FormField>

          <FormField label={t('profile.newPasswordLabel')} noMargin>
            <Input
              type={showNewPwd ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('profile.newPasswordPlaceholder')}
              suffixIcon={
                <IconButton
                  label="Toggle new password visibility"
                  icon={showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                />
              }
            />
          </FormField>

          <FormField label={t('profile.confirmPasswordLabel')} noMargin>
            <Input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('profile.confirmPasswordPlaceholder')}
            />
          </FormField>

          <Button
            variant="primary"
            className="self-start mt-sm"
            type="submit"
            loading={loading}
            icon={<Lock size={16} />}
          >
            {t('profile.changePasswordButton')}
          </Button>
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
