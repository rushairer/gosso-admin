import { useEffect, useState } from 'react';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProfileManager } from '@gosso/client/react';
import { Alert, Button, FormField, IconButton, Input, Modal } from '@gouno/ui/core';
import type { UserProfile } from '../../auth';

interface EmailChangeModalProps {
  isOpen: boolean;
  initialEmail: string;
  onClose: () => void;
  onProfileUpdated: (profile: UserProfile) => void;
}

/** Two-step email change flow, kept separate from the profile overview. */
export function EmailChangeModal({ isOpen, initialEmail, onClose, onProfileUpdated }: EmailChangeModalProps) {
  const { t } = useTranslation();
  const { loading, error, requestEmailChange, confirmEmailChange } = useProfileManager();
  const [newEmail, setNewEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');

  useEffect(() => {
    if (!isOpen) return;
    setNewEmail(initialEmail);
    setPassword('');
    setShowPassword(false);
    setCode('');
    setStep('input');
  }, [initialEmail, isOpen]);

  const requestVerificationCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newEmail.trim() || !password) return;
    try {
      await requestEmailChange(newEmail.trim(), password);
      setStep('verify');
    } catch {}
  };

  const handleConfirmEmailChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;
    try {
      const updatedProfile = await confirmEmailChange(newEmail.trim(), code.trim());
      onProfileUpdated(updatedProfile);
      onClose();
    } catch {}
  };

  return (
    <Modal
      open={isOpen}
      title={t('profile.editEmailTitle')}
      description={t('profile.editEmailDescription')}
      maxWidth="460px"
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      footer={
        step === 'input' ? (
          <>
            <Button type="button" onClick={onClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button
              form="email-change-request-form"
              variant="solid"
              color="primary"
              type="submit"
              loading={loading}
              disabled={loading || !newEmail.trim() || !password}
            >
              {t('profile.sendCodeButton')}
            </Button>
          </>
        ) : (
          <>
            <Button type="button" onClick={() => setStep('input')} disabled={loading}>
              {t('common.previous') || 'Back'}
            </Button>
            <Button
              form="email-change-confirm-form"
              variant="solid"
              color="primary"
              type="submit"
              loading={loading}
              disabled={loading || !code.trim()}
            >
              {t('profile.confirmEmailButton')}
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {error ? <Alert type="error" showIcon title={error} /> : null}

        {step === 'input' ? (
          <form id="email-change-request-form" onSubmit={requestVerificationCode} className="flex flex-col gap-4">
            <FormField label={t('profile.newEmailLabel')} required>
              <Input
                type="email"
                prefix={<Mail />}
                required
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="user@example.com"
              />
            </FormField>

            <FormField label={t('profile.currentPasswordLabel')} required>
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••••••"
                suffix={
                  <IconButton
                    label={showPassword ? t('passwordReset.hidePassword') : t('passwordReset.showPassword')}
                    icon={showPassword ? <EyeOff /> : <Eye />}
                    variant="ghost"
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                  />
                }
              />
            </FormField>
          </form>
        ) : (
          <form id="email-change-confirm-form" onSubmit={handleConfirmEmailChange} className="flex flex-col gap-4">
            <FormField label={t('profile.verificationCodeLabel')} required>
              <Input
                type="text"
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
              />
            </FormField>
          </form>
        )}
      </div>
    </Modal>
  );
}
