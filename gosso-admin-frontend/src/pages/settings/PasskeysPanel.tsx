import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, Calendar, Trash2, Plus } from 'lucide-react';
import { apiFetch } from '../../auth';
import {
  ButtonGroup,
  EmptyState,
  Feedback,
  FormField,
  ListRow,
  ListStack,
  Panel,
  PanelBody,
  PanelHeader,
  ConfirmDialog,
} from '../../components/ui';
import { bufferToBase64URL, base64URLToBuffer } from '../../utils/webauthn';
import { logger } from '../../utils/logger';

interface Passkey {
  id: string;
  name: string;
  created_at?: string;
}

export default function PasskeysPanel() {
  const { t } = useTranslation();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  useEffect(() => {
    loadPasskeys();
  }, []);

  const loadPasskeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch('/api/v1/passkeys');
      if (!response.ok) throw new Error('Failed to load passkeys');
      const body = await response.json();
      setPasskeys(body.data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error loading passkeys';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!newPasskeyName.trim()) {
      setError(t('passkeys.passkeyNameRequired'));
      return;
    }

    try {
      setLoading(true);
      const beginRes = await apiFetch('/api/v1/passkey/register/begin', { method: 'POST' });
      const beginBody = await beginRes.json();
      if (!beginRes.ok) throw new Error(beginBody.message || 'Failed to initialize WebAuthn ceremony');
      if (!beginBody.data) throw new Error('Server returned no registration data');

      const { options, request_id } = beginBody.data;
      if (!options || !options.challenge) {
        logger.error('Invalid WebAuthn options from server', beginBody);
        throw new Error('Server returned invalid WebAuthn options (missing challenge)');
      }

      const publicKeyOptions = {
        ...options,
        challenge: base64URLToBuffer(options.challenge),
        user: { ...options.user, id: base64URLToBuffer(options.user?.id) },
        excludeCredentials: (options.excludeCredentials || []).map(
          (cred: { id: string; type: string; transports?: string[] }) => ({
            ...cred,
            id: base64URLToBuffer(cred.id),
          })
        ),
      };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyOptions,
      })) as PublicKeyCredential | null;

      if (!credential?.response) {
        throw new Error('Credential creation cancelled or failed');
      }

      const attestationResponse = credential.response as AuthenticatorAttestationResponse;

      const completeBody = {
        id: credential.id,
        rawId: bufferToBase64URL(credential.rawId),
        type: credential.type,
        name: newPasskeyName.trim(),
        response: {
          clientDataJSON: bufferToBase64URL(attestationResponse.clientDataJSON),
          attestationObject: bufferToBase64URL(attestationResponse.attestationObject),
          transports:
            typeof attestationResponse.getTransports === 'function' ? attestationResponse.getTransports() : [],
        },
      };

      const completeRes = await apiFetch(`/api/v1/passkey/register/complete?request_id=${request_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeBody),
      });
      const completeRespBody = await completeRes.json();
      if (!completeRes.ok) throw new Error(completeRespBody.message || 'Failed to verify attestation on server');

      setSuccess(t('passkeys.passkeyRegisteredSuccess', { name: newPasskeyName }));
      setShowPasskeyModal(false);
      setNewPasskeyName('');
      await loadPasskeys();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'WebAuthn registration failed.';
      logger.error('WebAuthn registration failed', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePasskey = async (id: string, name: string) => {
    setError(null);
    setSuccess(null);
    const confirmed = await new Promise<boolean>((resolve) => {
      setConfirmState({
        title: t('passkeys.removePasskey'),
        message: t('passkeys.removePasskeyConfirmMessage', { name }),
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
      const response = await apiFetch(`/api/v1/passkeys/${id}`, { method: 'DELETE' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to remove passkey');
      setSuccess(t('passkeys.passkeyRemovedSuccess'));
      await loadPasskeys();
    } catch (err: unknown) {
      let message = err instanceof Error ? err.message : 'Error removing passkey';
      if (message === 'credential not found') {
        message = t('passkeys.credentialNotFound');
      } else if (message === 'credential does not belong to account') {
        message = t('passkeys.credentialOwnershipMismatch');
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && passkeys.length === 0) {
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
        <p className="text-muted">{t('passkeys.loadingPasskeys')}</p>
      </div>
    );
  }

  return (
    <>
      <Panel>
        <PanelHeader
          title={t('passkeys.title')}
          description={t('passkeys.description')}
          action={
            <button className="btn btn-primary content-action" onClick={() => setShowPasskeyModal(true)}>
              <Plus />
              {t('passkeys.addPasskey')}
            </button>
          }
        />

        {error && (
          <div style={{ padding: '16px 20px 0 20px' }}>
            <Feedback type="error">{error}</Feedback>
          </div>
        )}
        {success && (
          <div style={{ padding: '16px 20px 0 20px' }}>
            <Feedback type="success">{success}</Feedback>
          </div>
        )}

        {passkeys.length === 0 ? (
          <EmptyState
            icon={<Key />}
            title={t('passkeys.noPasskeysTitle')}
            description={t('passkeys.noPasskeysDescription')}
          />
        ) : (
          <PanelBody>
            <ListStack>
              {passkeys.map((passkey) => (
                <ListRow
                  key={passkey.id}
                  icon={<Key style={{ width: '16px', height: '16px' }} />}
                  title={passkey.name}
                  meta={
                    <>
                      <Calendar style={{ width: '11px', height: '11px' }} />
                      {passkey.created_at
                        ? new Date(passkey.created_at).toLocaleString()
                        : t('passkeys.registeredDevice')}
                    </>
                  }
                  action={
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeletePasskey(passkey.id, passkey.name)}
                      style={{ padding: '6px' }}
                      title={t('passkeys.removePasskey')}
                    >
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                    </button>
                  }
                />
              ))}
            </ListStack>
          </PanelBody>
        )}
      </Panel>

      {/* Register Passkey Modal */}
      {showPasskeyModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{t('passkeys.registerModalTitle')}</h3>
            </div>
            <div className="modal-body">
              <p className="text-muted" style={{ fontSize: '13.5px', lineHeight: '1.5' }}>
                {t('passkeys.registerModalDescription')}
              </p>

              <form onSubmit={handleRegisterPasskey} className="flex-col mt-md" style={{ gap: '14px' }}>
                <FormField label={t('passkeys.passkeyNameLabel')} noMargin>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={newPasskeyName}
                    onChange={(e) => setNewPasskeyName(e.target.value)}
                    placeholder={t('passkeys.passkeyNamePlaceholder')}
                  />
                </FormField>

                <ButtonGroup align="right">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? t('passkeys.registeringLoading') : t('passkeys.registerDeviceButton')}
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => {
                      setShowPasskeyModal(false);
                      setNewPasskeyName('');
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
        confirmLabel={t('common.remove')}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => confirmState?.onCancel()}
      />
    </>
  );
}
