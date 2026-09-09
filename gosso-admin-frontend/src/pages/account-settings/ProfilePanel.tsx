import { useState } from 'react';
import { Edit2 as EditIcon, X as XIcon, Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProfileManager, useUserProfile } from '@gosso/client/react';
import { Button, IconButton, Input, Tag } from '@gouno/ui/core';
import { EmailChangeModal } from './EmailChangeModal';
import { Section, SettingRow, StatusMessage } from './shared';

export default function ProfilePanel() {
  const { t } = useTranslation();
  const profile = useUserProfile();
  const { loading, error: profileError, updateDisplayName } = useProfileManager();

  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleStartEditName = () => {
    setNewName(profile?.name || '');
    setIsEditingName(true);
    setValidationError(null);
    setSuccess(null);
  };

  const handleSaveName = async (event: React.FormEvent) => {
    event.preventDefault();
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

  return (
    <Section description={t('profile.description')}>
      <div className="flex flex-col gap-4">
        {validationError || profileError ? (
          <StatusMessage type="error" message={validationError || profileError} />
        ) : null}
        {success ? <StatusMessage message={success} /> : null}

        <dl>
          <SettingRow label={t('profile.usernameLabel')}>
            <span className="font-medium">{profile?.preferred_username || '-'}</span>
          </SettingRow>

          <SettingRow label={t('profile.displayNameLabel')}>
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex max-w-xl flex-wrap items-center gap-2">
                <Input
                  aria-label={t('profile.displayNameLabel')}
                  type="text"
                  required
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  className="min-w-52 flex-1"
                  autoFocus
                />
                <IconButton
                  label="Save display name"
                  icon={<Check />}
                  variant="solid"
                  color="primary"
                  type="submit"
                  disabled={loading}
                />
                <IconButton
                  label="Cancel"
                  icon={<XIcon />}
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  disabled={loading}
                />
              </form>
            ) : (
              <div className="flex max-w-xl items-center justify-between gap-4">
                <span className="min-w-0 truncate font-medium">{profile?.name || '-'}</span>
                <Button size="small" icon={<EditIcon />} onClick={handleStartEditName}>
                  {t('common.edit')}
                </Button>
              </div>
            )}
          </SettingRow>

          <SettingRow label={t('profile.emailLabel')}>
            <div className="flex max-w-xl items-center justify-between gap-4">
              <span className={profile?.email ? 'min-w-0 truncate font-medium' : 'text-muted-foreground'}>
                {profile?.email || t('profile.notConfigured')}
              </span>
              <Button size="small" icon={<EditIcon />} onClick={handleStartEditEmail}>
                {t('common.edit')}
              </Button>
            </div>
          </SettingRow>

          <SettingRow label={t('profile.securityRoleLabel')}>
            <div className="flex flex-wrap gap-2">
              {profile?.roles?.length ? (
                profile.roles.map((role) => <Tag key={role}>{role}</Tag>)
              ) : (
                <Tag>{t('profile.standardUser')}</Tag>
              )}
            </div>
          </SettingRow>

          <SettingRow label={t('profile.subjectIdLabel')}>
            <div className="flex max-w-xl items-center justify-between gap-4">
              <code className="min-w-0 truncate rounded bg-muted px-2 py-1 font-mono text-xs">
                {profile?.sub || '-'}
              </code>
              {profile?.sub ? (
                <Button
                  size="small"
                  icon={<Copy />}
                  onClick={() => {
                    void navigator.clipboard.writeText(profile.sub);
                    setSuccess(t('profile.copiedSubjectId'));
                  }}
                >
                  {t('profile.copyId')}
                </Button>
              ) : null}
            </div>
          </SettingRow>

          <SettingRow label={t('profile.ssoIssuerLabel')}>
            <div className="flex max-w-xl items-center justify-between gap-4">
              <code className="min-w-0 truncate rounded bg-muted px-2 py-1 font-mono text-xs">
                {window.location.origin}
              </code>
              <Button
                size="small"
                icon={<Copy />}
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.origin);
                  setSuccess(t('profile.copiedIssuer'));
                }}
              >
                {t('profile.copyIssuer')}
              </Button>
            </div>
          </SettingRow>
        </dl>
      </div>

      {showEmailModal ? (
        <EmailChangeModal
          isOpen
          initialEmail={profile?.email || ''}
          onClose={() => setShowEmailModal(false)}
          onProfileUpdated={() => setSuccess(t('profile.emailUpdatedSuccess'))}
        />
      ) : null}
    </Section>
  );
}
