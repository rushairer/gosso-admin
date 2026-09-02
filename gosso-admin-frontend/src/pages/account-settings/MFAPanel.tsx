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
                <div
                  style={{
                    background: '#ffffff',
                    padding: '12px',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  }}
                >
                  <QRCodeSVG
                    value={mfaEnrollment.otpauth_url}
                    size={180}
                    marginSize={1}
                    fgColor="#000000"
                    bgColor="#ffffff"
                    title={t('mfa.qrCodeAlt')}
                  />
                </div>

                <div className="flex-1 flex-col gap-md" style={{ minWidth: '260px' }}>
                  <p className="text-muted text-sm">{t('mfa.scanQrStep1')}</p>
                  <p className="text-muted text-sm">{t('mfa.manualEntryStep2')}</p>
                  <div
                    className="flex-row items-center gap-sm"
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <code
                      style={{
                        fontSize: '13px',
                        color: 'var(--color-secondary)',
                        letterSpacing: '0.05em',
                        fontWeight: 'bold',
                      }}
                    >
                      {mfaEnrollment.secret}
                    </code>
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

              <form
                onSubmit={handleActivateMFA}
                className="flex-col gap-md"
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingTop: '16px',
                  maxWidth: '320px',
                }}
              >
                <FormField label={t('mfa.verificationCodeLabel')} noMargin>
                  <Input
                    type="text"
                    maxLength={8}
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('mfa.verificationCodePlaceholder')}
                    style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.1em', fontWeight: 'bold' }}
                  />
                </FormField>

                <ButtonGroup>
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
            <div className="flex-col gap-xl">
              <div className="inline-status-row" style={{ color: 'var(--status-success)', paddingTop: 0 }}>
                <Shield size={24} color="var(--status-success)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>{t('mfa.accountProtected')}</div>
                  <div className="text-sm text-muted" style={{ marginTop: '2px' }}>
                    {t('mfa.totpRegistered')}
                  </div>
                </div>
              </div>

              <ButtonGroup>
                <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={handleGenerateBackupCodes}>
                  {t('mfa.regenerateBackupCodes')}
                </Button>
                <Button variant="danger" icon={<Unlock size={14} />} onClick={() => setShowDisableModal(true)}>
                  {t('mfa.disableTwoFactorAuth')}
                </Button>
              </ButtonGroup>
            </div>
          )}

          {/* Backup Codes */}
          {backupCodes.length > 0 && (
            <div>
              <div className="flex-row items-center gap-sm" style={{ color: 'var(--status-warning)' }}>
                <AlertTriangle size={16} />
                <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'bold' }}>
                  {t('mfa.recoveryBackupCodesTitle')}
                </h4>
              </div>

              <p className="text-sm text-muted" style={{ lineHeight: '1.4' }}>
                {t('mfa.recoveryBackupCodesDescription')}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '10px',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  textAlign: 'center',
                }}
              >
                {backupCodes.map((code, idx) => (
                  <code
                    key={idx}
                    style={{
                      fontSize: '13px',
                      letterSpacing: '0.05em',
                      color: 'var(--text-primary)',
                      fontWeight: 'bold',
                    }}
                  >
                    {code}
                  </code>
                ))}
              </div>

              <ButtonGroup>
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
              </ButtonGroup>
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
