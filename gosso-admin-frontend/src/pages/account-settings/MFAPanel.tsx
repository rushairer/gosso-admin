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
import { useSudo } from '../../components/auth/SudoContext';

export default function MFAPanel() {
  const { t } = useTranslation();
  const { showSuccess } = useToast();
  const { requireSudo } = useSudo();
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
    await requireSudo({
      actionTitle: t('mfa.regenerateConfirmTitle'),
      onSuccess: async () => {
        try {
          await regenerateBackupCodes();
          setSuccess(t('mfa.backupCodesGenerated'));
        } catch {}
      },
    });
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
            <div className="flex-col gap-lg">
              <div className="inline-status-row">
                <div className="inline-icon inline-icon--success">
                  <Shield size={20} />
                </div>
                <div>
                  <div className="inline-status-title">{t('mfa.accountProtected')}</div>
                  <div className="inline-status-value inline-status-value--success">{t('mfa.totpRegistered')}</div>
                </div>
              </div>

              <div className="flex-row flex-wrap items-center gap-md">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw size={14} />}
                  onClick={handleGenerateBackupCodes}
                >
                  {t('mfa.regenerateBackupCodes')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Unlock size={14} />}
                  onClick={() => setShowDisableModal(true)}
                >
                  {t('mfa.disableTwoFactorAuth')}
                </Button>
              </div>
            </div>
          )}

          {/* Backup Codes */}
          {backupCodes.length > 0 && (
            <div className="flex-col gap-md mt-lg pt-lg border-t border-[var(--border-default)]">
              <div className="flex-row items-center gap-xs text-warning">
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
        description={t('mfa.disableModalDescription')}
        maxWidth="400px"
        onClose={() => {
          setShowDisableModal(false);
          setConfirmPasswordForMFA('');
        }}
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setShowDisableModal(false);
                setConfirmPasswordForMFA('');
              }}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              form="disable-mfa-form"
              variant="danger"
              type="submit"
              loading={loading}
              disabled={!confirmPasswordForMFA}
            >
              {t('mfa.confirmDisableButton')}
            </Button>
          </>
        }
      >
        <form id="disable-mfa-form" onSubmit={handleDisableMFA} className="flex-col gap-md">
          <FormField label={t('mfa.accountPasswordLabel')} noMargin>
            <Input
              type="password"
              required
              value={confirmPasswordForMFA}
              onChange={(e) => setConfirmPasswordForMFA(e.target.value)}
              placeholder={t('mfa.accountPasswordPlaceholder')}
            />
          </FormField>
        </form>
      </Modal>

      {confirmDialog}
    </>
  );
}
