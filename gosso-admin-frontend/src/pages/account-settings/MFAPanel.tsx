import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, QrCode, Clipboard, AlertTriangle, RefreshCw, Unlock, Check, Copy } from 'lucide-react';
import { useMfa } from '@gosso/client/react';
import {
  Button,
  ButtonGroup,
  Feedback,
  FormField,
  IconButton,
  Input,
  Modal,
  PageLoader,
  Panel,
  PanelBody,
  PanelHeader,
  StatusBadge,
  useConfirm,
  useToast,
} from '../../components/ui';

export default function MFAPanel() {
  const { t } = useTranslation();
  const { showSuccess } = useToast();
  const {
    status: mfaStatus,
    enrollment: mfaEnrollment,
    backupCodes,
    loading,
    error,
    startEnroll,
    activate,
    disable,
    regenerateBackupCodes,
    cancelEnroll,
  } = useMfa();
  const [totpCode, setTotpCode] = useState('');
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [confirmPasswordForMFA, setConfirmPasswordForMFA] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const { confirm, confirmDialog } = useConfirm();

  const handleEnrollMFA = async () => {
    setSuccess(null);
    try {
      await startEnroll();
    } catch {}
  };

  const handleActivateMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    try {
      await activate(totpCode);
      setSuccess(t('mfa.mfaActivatedSuccess'));
      setTotpCode('');
    } catch {}
  };

  const handleDisableMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    try {
      await disable(confirmPasswordForMFA);
      setSuccess(t('mfa.mfaDisabled'));
      setShowDisableModal(false);
      setConfirmPasswordForMFA('');
    } catch {}
  };

  const handleGenerateBackupCodes = async () => {
    setSuccess(null);
    const confirmed = await confirm({
      title: t('mfa.regenerateConfirmTitle'),
      message: t('mfa.regenerateConfirmMessage'),
      confirmLabel: t('common.continue'),
      confirmVariant: 'primary',
    });
    if (!confirmed) return;
    try {
      await regenerateBackupCodes();
      setSuccess(t('mfa.backupCodesGenerated'));
    } catch {}
  };

  if (loading && !mfaStatus.enabled && !mfaEnrollment) {
    return <PageLoader message={t('mfa.loadingMfa')} />;
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title={t('mfa.title')}
          description={t('mfa.description')}
          action={
            mfaStatus.enabled ? (
              <StatusBadge tone="success">{t('mfa.statusActive')}</StatusBadge>
            ) : (
              <StatusBadge tone="neutral">{t('mfa.statusDisabled')}</StatusBadge>
            )
          }
        />
        <PanelBody stack>
          {error && (
            <div className="mb-sm">
              <Feedback type="error">{error}</Feedback>
            </div>
          )}
          {success && (
            <div className="mb-sm">
              <Feedback type="success">{success}</Feedback>
            </div>
          )}

          {/* Not enrolled */}
          {!mfaStatus.enabled && !mfaEnrollment && (
            <div className="flex-col items-start gap-lg">
              <p className="text-muted text-sm">{t('mfa.mfaNotEnrolledDescription')}</p>
              <Button variant="primary" icon={<QrCode size={16} />} onClick={handleEnrollMFA}>
                {t('mfa.setupAuthenticatorButton')}
              </Button>
            </div>
          )}

          {/* Enrollment in progress */}
          {mfaEnrollment && (
            <div>
              <h4 className="setup-title">{t('mfa.setupTitle')}</h4>

              <div className="flex-row flex-wrap gap-2xl items-center">
                <div className="mfa-qr-card">
                  <QRCodeSVG
                    value={mfaEnrollment.otpauth_url}
                    size={180}
                    marginSize={1}
                    fgColor="#000000"
                    bgColor="#ffffff"
                    title={t('mfa.qrCodeAlt')}
                  />
                </div>

                <div className="flex-1 flex-col gap-md">
                  <p className="text-muted text-sm">{t('mfa.scanQrStep1')}</p>
                  <p className="text-muted text-sm">{t('mfa.manualEntryStep2')}</p>
                  <div className="flex-row items-center gap-sm mfa-secret-box">
                    <code className="mfa-secret-code">{mfaEnrollment.secret}</code>
                    <IconButton
                      label={t('mfa.copySecret')}
                      icon={<Copy size={14} />}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(mfaEnrollment.secret);
                        showSuccess(t('mfa.secretKeyCopied'));
                      }}
                    />
                  </div>
                </div>
              </div>

              <form onSubmit={handleActivateMFA} className="flex-col gap-md mfa-activation-form">
                <FormField label={t('mfa.verificationCodeLabel')} noMargin>
                  <Input
                    type="text"
                    maxLength={8}
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('mfa.verificationCodePlaceholder')}
                    className="mfa-code-input"
                  />
                </FormField>

                <ButtonGroup align="right">
                  <Button variant="primary" type="submit" disabled={loading} icon={<Check size={16} />}>
                    {t('mfa.verifyAndActivateButton')}
                  </Button>
                  <Button variant="secondary" type="button" onClick={cancelEnroll}>
                    {t('common.cancel')}
                  </Button>
                </ButtonGroup>
              </form>
            </div>
          )}

          {/* MFA Active */}
          {mfaStatus.enabled && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Shield size={20} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="font-semibold text-base text-[var(--color-text-main)]">
                    {t('mfa.accountProtected')}
                  </div>
                  <div className="text-sm text-[var(--color-text-muted)]">{t('mfa.totpRegistered')}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={handleGenerateBackupCodes}>
                  {t('mfa.regenerateBackupCodes')}
                </Button>
                <Button variant="danger" icon={<Unlock size={14} />} onClick={() => setShowDisableModal(true)}>
                  {t('mfa.disableTwoFactorAuth')}
                </Button>
              </div>
            </div>
          )}

          {/* Backup Codes */}
          {backupCodes.length > 0 && (
            <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-[var(--border-default)]">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle size={16} />
                <h4 className="font-bold text-base m-0">{t('mfa.recoveryBackupCodesTitle')}</h4>
              </div>

              <p className="text-sm text-muted m-0">{t('mfa.recoveryBackupCodesDescription')}</p>

              <div className="mfa-backup-codes-grid">
                {backupCodes.map((code, idx) => (
                  <code key={idx} className="mfa-backup-code">
                    {code}
                  </code>
                ))}
              </div>

              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Clipboard size={13} />}
                  onClick={() => {
                    navigator.clipboard.writeText(backupCodes.join('\n'));
                    showSuccess(t('mfa.backupCodesCopied'));
                  }}
                >
                  {t('mfa.copyCodesButton')}
                </Button>
              </div>
            </div>
          )}
        </PanelBody>
      </Panel>

      {/* Disable MFA Modal */}
      <Modal
        isOpen={showDisableModal}
        title={t('mfa.disableModalTitle')}
        maxWidth="400px"
        onClose={() => {
          setShowDisableModal(false);
          setConfirmPasswordForMFA('');
        }}
      >
        <p className="text-muted text-sm">{t('mfa.disableModalDescription')}</p>

        <form onSubmit={handleDisableMFA} className="flex-col mt-md gap-md">
          <FormField label={t('mfa.accountPasswordLabel')} noMargin>
            <Input
              type="password"
              required
              value={confirmPasswordForMFA}
              onChange={(e) => setConfirmPasswordForMFA(e.target.value)}
              placeholder={t('mfa.accountPasswordPlaceholder')}
            />
          </FormField>

          <ButtonGroup align="right">
            <Button variant="danger" type="submit" loading={loading}>
              {t('mfa.confirmDisableButton')}
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setShowDisableModal(false);
                setConfirmPasswordForMFA('');
              }}
            >
              {t('common.cancel')}
            </Button>
          </ButtonGroup>
        </form>
      </Modal>

      {confirmDialog}
    </>
  );
}
