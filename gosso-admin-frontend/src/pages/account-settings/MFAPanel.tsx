import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode, Clipboard, AlertTriangle, RefreshCw, Unlock, Check, Copy } from 'lucide-react';
import { useMfa } from '@gosso/client/react';
import {
  Alert,
  Button,
  FormField,
  Heading,
  IconButton,
  Input,
  Modal,
  QRCode,
  Spinner,
  Tag,
  Text,
  useMessage,
} from '@gouno/ui/core';
import { useSudo } from '../../components/auth/SudoContext';
import { Section, StatusMessage } from './shared';

export default function MFAPanel() {
  const { t } = useTranslation();
  const message = useMessage();
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
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [confirmPasswordForMFA, setConfirmPasswordForMFA] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const handleEnrollMFA = async () => {
    setSuccess(null);
    try {
      await startEnroll();
    } catch {}
  };

  const handleActivateMFA = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccess(null);
    try {
      await activate(totpCode);
      setSuccess(t('mfa.mfaActivatedSuccess'));
      setTotpCode('');
    } catch {}
  };

  const handleDisableMFA = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccess(null);
    try {
      await disable(confirmPasswordForMFA);
      setSuccess(t('mfa.mfaDisabled'));
      setShowDisableModal(false);
      setConfirmPasswordForMFA('');
    } catch {}
  };

  const handleRegenerateBackupCodes = async () => {
    setShowRegenerateModal(false);
    setSuccess(null);
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
    return (
      <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-muted-foreground" role="status">
        <Spinner aria-label={t('mfa.loadingMfa')} />
        <span>{t('mfa.loadingMfa')}</span>
      </div>
    );
  }

  return (
    <>
      <Section
        description={t('mfa.description')}
        actions={mfaStatus.enabled ? <Tag color="success">{t('mfa.statusActive')}</Tag> : <Tag>{t('mfa.statusDisabled')}</Tag>}
      >
        <div className="flex flex-col gap-5">
          {error ? <StatusMessage type="error" message={error} /> : null}
          {success ? <StatusMessage message={success} /> : null}

          {!mfaStatus.enabled && !mfaEnrollment ? (
            <div className="flex flex-col items-start gap-4 py-2">
              <Text tone="muted" size="sm" className="max-w-2xl leading-relaxed">
                {t('mfa.mfaNotEnrolledDescription')}
              </Text>
              <Button variant="solid" color="primary" icon={<QrCode />} onClick={() => void handleEnrollMFA()}>
                {t('mfa.setupAuthenticatorButton')}
              </Button>
            </div>
          ) : null}

          {mfaEnrollment ? (
            <div className="flex flex-col gap-6">
              <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
                <div className="mx-auto rounded-lg border bg-white p-4">
                  <QRCode value={mfaEnrollment.otpauth_url} size={180} ariaLabel={t('mfa.qrCodeAlt')} />
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <Heading level={2} className="text-base">
                      {t('mfa.setupTitle')}
                    </Heading>
                    <Text size="sm" tone="muted" className="mt-1 leading-relaxed">
                      {t('mfa.scanQrStep1')} {t('mfa.manualEntryStep2')}
                    </Text>
                  </div>
                  <div className="flex max-w-lg items-center justify-between gap-3 rounded-md border bg-muted/30 p-3">
                    <code className="min-w-0 truncate font-mono text-xs">{mfaEnrollment.secret}</code>
                    <IconButton
                      label={t('mfa.copySecret')}
                      icon={<Copy />}
                      onClick={() => {
                        void navigator.clipboard.writeText(mfaEnrollment.secret);
                        message.success(t('mfa.secretKeyCopied'));
                      }}
                    />
                  </div>
                </div>
              </div>

              <form onSubmit={handleActivateMFA} className="flex max-w-xl flex-col gap-4 border-t pt-5">
                <FormField label={t('mfa.verificationCodeLabel')} required hint={t('mfa.verificationCodePlaceholder')}>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    required
                    value={totpCode}
                    onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, ''))}
                    placeholder={t('mfa.verificationCodePlaceholder')}
                  />
                </FormField>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" onClick={() => void cancelEnroll()}>
                    {t('common.cancel')}
                  </Button>
                  <Button variant="solid" color="primary" type="submit" disabled={loading} icon={<Check />}>
                    {t('mfa.verifyAndActivateButton')}
                  </Button>
                </div>
              </form>
            </div>
          ) : null}

          {mfaStatus.enabled ? (
            <div className="flex flex-col gap-5">
              <Alert
                type="success"
                showIcon
                title={t('mfa.accountProtected')}
                description={t('mfa.totpRegistered')}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="small" icon={<RefreshCw />} onClick={() => setShowRegenerateModal(true)}>
                  {t('mfa.regenerateBackupCodes')}
                </Button>
                <Button
                  size="small"
                  variant="solid"
                  color="error"
                  icon={<Unlock />}
                  onClick={() => setShowDisableModal(true)}
                >
                  {t('mfa.disableTwoFactorAuth')}
                </Button>
              </div>
            </div>
          ) : null}

          {backupCodes.length > 0 && mfaStatus.enabled ? (
            <section className="flex flex-col gap-4 border-t pt-5" aria-labelledby="backup-codes-heading">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle aria-hidden="true" className="size-4" />
                <Heading id="backup-codes-heading" level={2} className="text-base">
                  {t('mfa.recoveryBackupCodesTitle')}
                </Heading>
              </div>
              <Text size="sm" tone="muted">
                {t('mfa.recoveryBackupCodesDescription')}
              </Text>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {backupCodes.map((code) => (
                  <code key={code} className="rounded-md border bg-muted/30 px-3 py-2 text-center font-mono text-sm">
                    {code}
                  </code>
                ))}
              </div>
              <div>
                <Button
                  size="small"
                  icon={<Clipboard />}
                  onClick={() => {
                    void navigator.clipboard.writeText(backupCodes.join('\n'));
                    message.success(t('mfa.backupCodesCopied'));
                  }}
                >
                  {t('mfa.copyCodesButton')}
                </Button>
              </div>
            </section>
          ) : null}
        </div>
      </Section>

      <Modal
        open={showRegenerateModal}
        title={t('mfa.regenerateConfirmTitle')}
        description={t('mfa.regenerateConfirmMessage')}
        onOpenChange={setShowRegenerateModal}
        onOk={() => void handleRegenerateBackupCodes()}
        okText={t('common.continue')}
        cancelText={t('common.cancel')}
        okButtonProps={{ variant: 'solid', color: 'primary' }}
      />

      <Modal
        open={showDisableModal}
        title={t('mfa.disableModalTitle')}
        description={t('mfa.disableModalDescription')}
        maxWidth="400px"
        onOpenChange={(next) => {
          setShowDisableModal(next);
          if (!next) setConfirmPasswordForMFA('');
        }}
        footer={
          <>
            <Button
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
              variant="solid"
              color="error"
              type="submit"
              loading={loading}
              disabled={!confirmPasswordForMFA}
            >
              {t('mfa.confirmDisableButton')}
            </Button>
          </>
        }
      >
        <form id="disable-mfa-form" onSubmit={handleDisableMFA} className="flex flex-col gap-4">
          <FormField label={t('mfa.accountPasswordLabel')} required>
            <Input
              type="password"
              required
              value={confirmPasswordForMFA}
              onChange={(event) => setConfirmPasswordForMFA(event.target.value)}
              placeholder={t('mfa.accountPasswordPlaceholder')}
            />
          </FormField>
        </form>
      </Modal>
    </>
  );
}
