import { useState } from 'react';
import { Edit2 as EditIcon, X as XIcon, Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProfileManager, useUserProfile } from '@gosso/client/react';
import {
  Button,
  Feedback,
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
  const { loading, error: profileError, updateDisplayName } = useProfileManager();

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
              <form onSubmit={handleSaveName} className="flex items-center gap-2 max-w-md w-full">
                <Input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="max-w-[240px]"
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
              <div className="flex items-center justify-between gap-4 max-w-xl w-full">
                <span className="text-sm font-medium text-[var(--color-text-main)]">{profile?.name || '-'}</span>
                <Button variant="secondary" size="sm" icon={<EditIcon size={12} />} onClick={handleStartEditName}>
                  {t('common.edit')}
                </Button>
              </div>
            )}
          </DefinitionRow>

          <DefinitionRow label={t('profile.emailLabel')}>
            <div className="flex items-center justify-between gap-4 max-w-xl w-full">
              <span
                className={`text-sm ${profile?.email ? 'font-medium text-[var(--color-text-main)]' : 'text-muted'}`}
              >
                {profile?.email || t('profile.notConfigured')}
              </span>
              <Button variant="secondary" size="sm" icon={<EditIcon size={12} />} onClick={handleStartEditEmail}>
                {t('common.edit')}
              </Button>
            </div>
          </DefinitionRow>

          <DefinitionRow label={t('profile.securityRoleLabel')}>
            <div className="flex items-center gap-2">
              {profile?.roles?.map((role) => <Tag key={role}>{role}</Tag>) || (
                <Tag tone="secondary">{t('profile.standardUser')}</Tag>
              )}
            </div>
          </DefinitionRow>

          <DefinitionRow label={t('profile.subjectIdLabel')}>
            <div className="flex items-center justify-between gap-4 max-w-xl w-full">
              <code className="text-mono text-xs inline-code">{profile?.sub || '-'}</code>
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
            <div className="flex items-center justify-between gap-4 max-w-xl w-full">
              <code className="text-mono text-xs inline-code">{window.location.origin}</code>
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
