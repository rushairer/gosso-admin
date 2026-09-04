import { createContext, useContext, useState, useCallback, useMemo, type ReactNode, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, Shield } from 'lucide-react';
import { useSession } from '@gosso/client/react';
import { gossoClient } from '../../auth';
import { Button, Feedback, FormField, Input, Modal, useToast } from '../ui';
import { logger } from '../../utils/logger';

const SUDO_STORAGE_KEY = 'gosso-admin:sudo_active_until';
const DEFAULT_SUDO_GRACE_PERIOD_MS = 15 * 60 * 1000; // 15 minutes

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
    // Safe fallback for isolated tests without SudoProvider
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
  const { showSuccess } = useToast();
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
      const until = parseInt(untilStr, 10);
      return !isNaN(until) && Date.now() < until;
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
    showSuccess(t('login.sudoVerifiedSuccess'));
  }, [showSuccess, t]);

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

  const handleMfaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError(t('login.mfaCodeRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await gossoClient.stepUpMfa(code.trim());
      recordSudoSuccess();
      const action = pendingAction;
      setPendingAction(null);
      if (action) {
        await action.onSuccess();
      }
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
      const action = pendingAction;
      setPendingAction(null);
      if (action) {
        await action.onSuccess();
      }
    } catch (err: unknown) {
      logger.error('Sudo Passkey verification error', err);
      setError(err instanceof Error ? err.message : t('login.passkeyLoginFailed'));
    } finally {
      setPasskeyLoading(false);
    }
  };

  const accountName = session.profile?.preferred_username || session.profile?.name || session.profile?.sub || '';

  const contextValue = useMemo(
    () => ({
      isSudoActive,
      requireSudo,
      clearSudo,
    }),
    [isSudoActive, requireSudo, clearSudo]
  );

  return (
    <SudoContext.Provider value={contextValue}>
      {children}

      <Modal
        isOpen={Boolean(pendingAction)}
        onClose={handleClose}
        title={t('login.sudoModeTitle')}
        footer={
          <Button variant="secondary" onClick={handleClose} disabled={loading || passkeyLoading}>
            {t('common.cancel')}
          </Button>
        }
      >
        <div className="notice-card notice-card--info mb-md">
          <div className="flex-row items-center gap-sm mb-xs">
            <Shield size={16} />
            <strong>{pendingAction?.actionTitle || t('login.sudoModeTitle')}</strong>
          </div>
          <p className="text-sm m-0">
            {t('login.sudoModeNotice', {
              user: accountName,
              defaultValue: `您正在执行敏感管理操作。当前操作账号：${accountName}。请输入身份验证器动态码或使用通行密钥完成验证。`,
            })}
          </p>
        </div>

        {error && (
          <div className="mb-md">
            <Feedback type="error">{error}</Feedback>
          </div>
        )}

        <form onSubmit={handleMfaSubmit}>
          <FormField label={t('login.verificationCodeLabel')}>
            <Input
              type="text"
              maxLength={8}
              placeholder={t('login.verificationCodePlaceholder')}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              disabled={loading || passkeyLoading}
              autoFocus
            />
          </FormField>

          <Button type="submit" variant="primary" className="w-full mt-md" loading={loading} disabled={passkeyLoading}>
            {loading ? t('login.verifyLoading') : t('login.verifyButton')}
          </Button>
        </form>

        <div className="login-card__separator flex-row items-center gap-md my-md">
          <hr />
          <span className="text-sm text-muted">{t('common.or')}</span>
          <hr />
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full flex-row items-center justify-center gap-sm"
          onClick={() => void handlePasskeyStepUp()}
          loading={passkeyLoading}
          disabled={loading}
          icon={<Key size={16} />}
        >
          {passkeyLoading ? t('login.passkeyLoading') : t('login.passkeyStepUpButton')}
        </Button>
      </Modal>
    </SudoContext.Provider>
  );
}
