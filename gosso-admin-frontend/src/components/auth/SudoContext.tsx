import { createContext, useContext, useState, useCallback, useMemo, type ReactNode, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, Shield } from 'lucide-react';
import { useSession } from '@gosso/client/react';
import { gossoClient } from '../../auth';
import { Alert, Button, FormField, Input, Modal, Tag, useMessage } from '@gouno/ui/core';
import { logger } from '../../utils/logger';

const SUDO_STORAGE_KEY = 'gosso-admin:sudo_active_until';
const DEFAULT_SUDO_GRACE_PERIOD_MS = 5 * 60 * 1000;

export interface RequireSudoOptions {
  actionTitle?: string;
  description?: string;
  onSuccess: () => Promise<void> | void;
}

export interface SudoContextValue {
  isSudoActive: () => boolean;
  requireSudo: (options: RequireSudoOptions) => Promise<void>;
  clearSudo: () => void;
}

const SudoContext = createContext<SudoContextValue | null>(null);

export function useSudo(): SudoContextValue {
  const ctx = useContext(SudoContext);
  if (!ctx) {
    return {
      isSudoActive: () => true,
      requireSudo: async (options) => {
        await options.onSuccess();
      },
      clearSudo: () => undefined,
    };
  }
  return ctx;
}

export function SudoProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const message = useMessage();
  const session = useSession();
  const [pendingAction, setPendingAction] = useState<RequireSudoOptions | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSudoActive = useCallback(() => {
    try {
      const untilStr = sessionStorage.getItem(SUDO_STORAGE_KEY);
      if (!untilStr) return false;
      const until = Number.parseInt(untilStr, 10);
      return !Number.isNaN(until) && Date.now() < until;
    } catch {
      return false;
    }
  }, []);

  const clearSudo = useCallback(() => {
    try {
      sessionStorage.removeItem(SUDO_STORAGE_KEY);
    } catch {}
  }, []);

  const recordSudoSuccess = useCallback(() => {
    try {
      sessionStorage.setItem(SUDO_STORAGE_KEY, String(Date.now() + DEFAULT_SUDO_GRACE_PERIOD_MS));
    } catch {}
    message.success(t('login.sudoVerifiedSuccess'));
  }, [message, t]);

  const requireSudo = useCallback(
    async (options: RequireSudoOptions) => {
      if (isSudoActive()) {
        await options.onSuccess();
        return;
      }
      setError(null);
      setCode('');
      setPendingAction(options);
    },
    [isSudoActive]
  );

  const handleClose = () => {
    setPendingAction(null);
    setError(null);
    setCode('');
  };

  const completePendingAction = async () => {
    const action = pendingAction;
    setPendingAction(null);
    if (action) await action.onSuccess();
  };

  const handleMfaSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      setError(t('login.mfaCodeRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await gossoClient.stepUpMfa(code.trim());
      recordSudoSuccess();
      await completePendingAction();
    } catch (err: unknown) {
      logger.error('Sudo TOTP verification error', err);
      setError(err instanceof Error ? err.message : t('login.mfaVerificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyStepUp = async () => {
    setPasskeyLoading(true);
    setError(null);
    try {
      await gossoClient.loginWithPasskey();
      recordSudoSuccess();
      await completePendingAction();
    } catch (err: unknown) {
      logger.error('Sudo Passkey verification error', err);
      setError(err instanceof Error ? err.message : t('login.passkeyLoginFailed'));
    } finally {
      setPasskeyLoading(false);
    }
  };

  const accountName = session.profile?.preferred_username || session.profile?.name || session.profile?.sub || '';
  const contextValue = useMemo(
    () => ({ isSudoActive, requireSudo, clearSudo }),
    [isSudoActive, requireSudo, clearSudo]
  );

  return (
    <SudoContext.Provider value={contextValue}>
      {children}
      <Modal
        open={Boolean(pendingAction)}
        onOpenChange={(next) => {
          if (!next) handleClose();
        }}
        title={t('login.sudoModeTitle')}
        footer={
          <Button onClick={handleClose} disabled={loading || passkeyLoading}>
            {t('common.cancel')}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Shield aria-hidden="true" className="size-4 shrink-0 text-primary" />
                <strong className="text-sm font-semibold">
                  {pendingAction?.actionTitle || t('login.sudoModeTitle')}
                </strong>
              </div>
              {accountName ? (
                <Tag className="max-w-40 truncate" title={accountName}>
                  {accountName}
                </Tag>
              ) : null}
            </div>
            <p className="mb-0 mt-2 text-sm leading-relaxed text-muted-foreground">
              {pendingAction?.description ||
                (pendingAction?.actionTitle
                  ? t('login.sudoModeNoticeWithAction', {
                      action: pendingAction.actionTitle,
                      user: accountName,
                      defaultValue: `您正在执行敏感操作「${pendingAction.actionTitle}」，请输入身份验证器动态码或使用通行密钥完成验证。`,
                    })
                  : t('login.sudoModeNotice', {
                      user: accountName,
                      defaultValue: '您正在执行敏感管理操作，请输入身份验证器动态码或使用通行密钥完成验证。',
                    }))}
            </p>
          </div>

          {error ? <Alert type="error" showIcon title={error} /> : null}

          <form onSubmit={handleMfaSubmit} className="flex flex-col gap-4">
            <FormField label={t('login.verificationCodeLabel')} required>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={8}
                placeholder={t('login.verificationCodePlaceholder')}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                disabled={loading || passkeyLoading}
                autoFocus
              />
            </FormField>
            <Button
              type="submit"
              variant="solid"
              color="primary"
              className="w-full"
              loading={loading}
              disabled={passkeyLoading}
            >
              {loading ? t('login.verifyLoading') : t('login.verifyButton')}
            </Button>
          </form>

          <div className="relative flex items-center justify-center py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative bg-background px-2 text-xs font-medium uppercase text-muted-foreground">
              {t('common.or')}
            </div>
          </div>

          <Button
            type="button"
            className="w-full"
            onClick={() => void handlePasskeyStepUp()}
            loading={passkeyLoading}
            disabled={loading}
            icon={<Key />}
          >
            {passkeyLoading ? t('login.passkeyLoading') : t('login.passkeyStepUpButton')}
          </Button>
        </div>
      </Modal>
    </SudoContext.Provider>
  );
}
