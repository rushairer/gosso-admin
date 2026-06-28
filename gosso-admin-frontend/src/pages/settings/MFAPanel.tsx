import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { Shield, QrCode, Clipboard, AlertTriangle, RefreshCw, Unlock, Check, Copy } from 'lucide-react';
import { apiFetch } from '../../auth';
import {
  ButtonGroup,
  ConfirmDialog,
  Feedback,
  FormField,
  Panel,
  PanelBody,
  PanelHeader,
  StatusBadge,
  useToast,
} from '../../components/ui';
import { logger } from '../../utils/logger';

interface MFAStatus {
  enabled: boolean;
  types: string[];
}

export default function MFAPanel() {
  const { t } = useTranslation();
  const { showSuccess } = useToast();
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({ enabled: false, types: [] });
  const [mfaEnrollment, setMfaEnrollment] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [confirmPasswordForMFA, setConfirmPasswordForMFA] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  useEffect(() => {
    loadMFAStatus();
  }, []);

  useEffect(() => {
    if (mfaEnrollment?.otpauth_url) {
      QRCode.toDataURL(mfaEnrollment.otpauth_url, {
        width: 180,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      })
        .then(setQrDataUrl)
        .catch((err) => {
          logger.error('Failed to generate QR code', err);
          setQrDataUrl(null);
        });
    } else {
      setQrDataUrl(null);
    }
  }, [mfaEnrollment]);

  const loadMFAStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch('/api/v1/auth/mfa');
      if (!response.ok) throw new Error('Failed to load multi-factor authentication status');
      const body = await response.json();
      setMfaStatus(body.data || { enabled: false, types: [] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error loading MFA status';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollMFA = async () => {
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      const response = await apiFetch('/api/v1/auth/mfa/enroll', { method: 'POST' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to enroll MFA');
      setMfaEnrollment(body.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error enrolling MFA';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      const response = await apiFetch('/api/v1/auth/mfa/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCode }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to activate TOTP');

      setSuccess(t('mfa.mfaActivatedSuccess'));
      setMfaEnrollment(null);
      setTotpCode('');
      await loadMFAStatus();

      const codesRes = await apiFetch('/api/v1/auth/mfa/backup-codes', { method: 'POST' });
      const codesBody = await codesRes.json();
      if (codesRes.ok && codesBody.data?.backup_codes) {
        setBackupCodes(codesBody.data.backup_codes);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error activating MFA';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      const response = await apiFetch('/api/v1/auth/mfa', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: confirmPasswordForMFA }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to disable MFA');

      setSuccess(t('mfa.mfaDisabled'));
      setShowDisableModal(false);
      setConfirmPasswordForMFA('');
      setBackupCodes([]);
      await loadMFAStatus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error disabling MFA';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    setError(null);
    setSuccess(null);
    const confirmed = await new Promise<boolean>((resolve) => {
      setConfirmState({
        title: t('mfa.regenerateConfirmTitle'),
        message: t('mfa.regenerateConfirmMessage'),
        onConfirm: () => {
          setConfirmState(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(null);
          resolve(false);
        },
      });
    });
    if (!confirmed) return;
    try {
      setLoading(true);
      const response = await apiFetch('/api/v1/auth/mfa/backup-codes', { method: 'POST' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to generate backup codes');
      setBackupCodes(body.data.backup_codes || []);
      setSuccess(t('mfa.backupCodesGenerated'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error generating backup codes';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !mfaStatus.enabled && !mfaEnrollment) {
    return (
      <div className="text-center" style={{ padding: '60px 0' }}>
        <div
          style={{
            margin: '0 auto 16px auto',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.06)',
            borderTopColor: 'var(--color-primary)',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p className="text-muted">{t('mfa.loadingMfa')}</p>
      </div>
    );
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
              <p className="text-muted" style={{ fontSize: '14.5px', lineHeight: '1.6' }}>
                {t('mfa.mfaNotEnrolledDescription')}
              </p>
              <button className="btn btn-primary" onClick={handleEnrollMFA}>
                <QrCode style={{ width: '16px', height: '16px' }} />
                {t('mfa.setupAuthenticatorButton')}
              </button>
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
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt={t('mfa.qrCodeAlt')} style={{ width: '180px', height: '180px' }} />
                  ) : (
                    <div
                      style={{
                        width: '180px',
                        height: '180px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {t('common.loading')}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex-col gap-md" style={{ minWidth: '260px' }}>
                  <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                    {t('mfa.scanQrStep1')}
                  </p>
                  <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                    {t('mfa.manualEntryStep2')}
                  </p>
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
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(mfaEnrollment.secret);
                        showSuccess(t('mfa.secretKeyCopied'));
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      title={t('mfa.copySecret')}
                    >
                      <Copy style={{ width: '14px', height: '14px' }} />
                    </button>
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
                  <input
                    type="text"
                    maxLength={8}
                    className="input-field"
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('mfa.verificationCodePlaceholder')}
                    style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.1em', fontWeight: 'bold' }}
                  />
                </FormField>

                <ButtonGroup>
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    <Check style={{ width: '16px', height: '16px' }} />
                    {t('mfa.verifyAndActivateButton')}
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => setMfaEnrollment(null)}>
                    {t('common.cancel')}
                  </button>
                </ButtonGroup>
              </form>
            </div>
          )}

          {/* MFA Active */}
          {mfaStatus.enabled && (
            <div className="flex-col gap-xl">
              <div className="inline-status-row" style={{ color: '#a7f3d0', paddingTop: 0 }}>
                <Shield style={{ width: '24px', height: '24px', color: 'var(--success-color)' }} />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{t('mfa.accountProtected')}</div>
                  <div className="text-sm text-muted" style={{ marginTop: '2px' }}>
                    {t('mfa.totpRegistered')}
                  </div>
                </div>
              </div>

              <ButtonGroup>
                <button className="btn btn-secondary" onClick={handleGenerateBackupCodes}>
                  <RefreshCw style={{ width: '14px', height: '14px' }} />
                  {t('mfa.regenerateBackupCodes')}
                </button>
                <button className="btn btn-danger" onClick={() => setShowDisableModal(true)}>
                  <Unlock style={{ width: '14px', height: '14px' }} />
                  {t('mfa.disableTwoFactorAuth')}
                </button>
              </ButtonGroup>
            </div>
          )}

          {/* Backup Codes */}
          {backupCodes.length > 0 && (
            <div>
              <div className="flex-row items-center gap-sm" style={{ color: 'var(--warning-color)' }}>
                <AlertTriangle style={{ width: '16px', height: '16px' }} />
                <h4 style={{ fontSize: '14.5px', fontWeight: 'bold' }}>{t('mfa.recoveryBackupCodesTitle')}</h4>
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
                      color: 'var(--color-text-main)',
                      fontWeight: 'bold',
                    }}
                  >
                    {code}
                  </code>
                ))}
              </div>

              <ButtonGroup>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(backupCodes.join('\n'));
                    showSuccess(t('mfa.backupCodesCopied'));
                  }}
                >
                  <Clipboard style={{ width: '13px', height: '13px' }} />
                  {t('mfa.copyCodesButton')}
                </button>
              </ButtonGroup>
            </div>
          )}
        </PanelBody>
      </Panel>

      {/* Disable MFA Modal */}
      {showDisableModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{t('mfa.disableModalTitle')}</h3>
            </div>
            <div className="modal-body">
              <p className="text-muted" style={{ fontSize: '13.5px', lineHeight: '1.5' }}>
                {t('mfa.disableModalDescription')}
              </p>

              <form onSubmit={handleDisableMFA} className="flex-col mt-md" style={{ gap: '14px' }}>
                <FormField label={t('mfa.accountPasswordLabel')} noMargin>
                  <input
                    type="password"
                    className="input-field"
                    required
                    value={confirmPasswordForMFA}
                    onChange={(e) => setConfirmPasswordForMFA(e.target.value)}
                    placeholder={t('mfa.accountPasswordPlaceholder')}
                  />
                </FormField>

                <ButtonGroup align="right">
                  <button className="btn btn-danger" type="submit" disabled={loading}>
                    {loading ? t('mfa.disablingLoading') : t('mfa.confirmDisableButton')}
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => {
                      setShowDisableModal(false);
                      setConfirmPasswordForMFA('');
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                </ButtonGroup>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        confirmLabel={t('common.continue')}
        confirmVariant="primary"
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => confirmState?.onCancel()}
      />
    </>
  );
}
