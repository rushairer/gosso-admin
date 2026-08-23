import { useEffect, useState } from 'react';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { gossoClient } from '../../auth';
import { ButtonGroup, Feedback, FormField, Modal } from '../../components/ui';
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
  const [newEmail, setNewEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setNewEmail(initialEmail);
    setPassword('');
    setShowPassword(false);
    setCode('');
    setStep('input');
    setError(null);
  }, [initialEmail, isOpen]);

  const requestVerificationCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newEmail.trim() || !password) return;

    try {
      setLoading(true);
      setError(null);
      await gossoClient.requestEmailChange(newEmail.trim(), password);
      setStep('verify');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('profile.emailVerificationRequestFailed'));
    } finally {
      setLoading(false);
    }
  };

  const confirmEmailChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const updatedProfile = await gossoClient.confirmEmailChange(newEmail.trim(), code.trim());
      onProfileUpdated(updatedProfile);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('profile.emailVerificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} title={t('profile.editEmailTitle')} maxWidth="460px" onClose={onClose}>
      <p className="text-muted mb-md" style={{ fontSize: '13.5px', lineHeight: '1.5' }}>
        {t('profile.editEmailDescription')}
      </p>

      {error && (
        <div className="mb-md">
          <Feedback type="error">{error}</Feedback>
        </div>
      )}

      {step === 'input' ? (
        <form onSubmit={requestVerificationCode} className="flex-col gap-lg">
          <FormField label={t('profile.newEmailLabel')} noMargin>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input-field"
                required
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
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
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="input-icon-button"
                aria-label={showPassword ? t('passwordReset.hidePassword') : t('passwordReset.showPassword')}
              >
                {showPassword ? (
                  <EyeOff style={{ width: '16px', height: '16px' }} />
                ) : (
                  <Eye style={{ width: '16px', height: '16px' }} />
                )}
              </button>
            </div>
          </FormField>

          <ButtonGroup align="right">
            <button className="btn btn-secondary" type="button" onClick={onClose} disabled={loading}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" type="submit" disabled={loading || !newEmail.trim() || !password}>
              {loading ? t('common.loading') : t('profile.sendCodeButton')}
            </button>
          </ButtonGroup>
        </form>
      ) : (
        <form onSubmit={confirmEmailChange} className="flex-col gap-lg">
          <FormField label={t('profile.verificationCodeLabel')} noMargin>
            <input
              type="text"
              className="input-field"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="123456"
            />
          </FormField>

          <ButtonGroup align="right">
            <button className="btn btn-secondary" type="button" onClick={() => setStep('input')} disabled={loading}>
              {t('common.previous') || 'Back'}
            </button>
            <button className="btn btn-primary" type="submit" disabled={loading || !code.trim()}>
              {loading ? t('common.loading') : t('profile.confirmEmailButton')}
            </button>
          </ButtonGroup>
        </form>
      )}
    </Modal>
  );
}
