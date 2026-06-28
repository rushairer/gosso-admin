import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus as PlusIcon,
  Edit2 as EditIcon,
  Trash2 as TrashIcon,
  Key as KeyIcon,
  X as XIcon,
  Copy as CopyIcon,
  Check as CheckIcon,
  Info as InfoIcon,
} from 'lucide-react';
import { apiFetch } from '../../auth';
import {
  ButtonGroup,
  CheckboxField,
  CheckboxGroup,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Feedback,
  FormField,
  PanelHeader,
  StatusBadge,
  Tag,
  useToast,
} from '../../components/ui';
import { logger } from '../../utils/logger';

interface OAuth2Client {
  client_id: string;
  name: string;
  description: string;
  redirect_uris: string[];
  post_logout_redirect_uris?: string[];
  grant_types: string[];
  scopes: string[];
  is_confidential: boolean;
  metadata?: Record<string, unknown>;
}

const clientScopeOptions = ['openid', 'profile', 'email', 'admin'];

function isAdminScope(scope: string) {
  return scope === 'admin' || scope.startsWith('admin:');
}

export default function ClientsTab() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [clients, setClients] = useState<OAuth2Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  // Client Modal State
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<OAuth2Client | null>(null);
  const [clientForm, setClientForm] = useState({
    name: '',
    description: '',
    redirect_uris: '',
    post_logout_redirect_uris: '',
    is_confidential: false,
    grant_types: ['authorization_code'],
    scopes: ['openid', 'profile', 'email'],
  });

  // Client Secret Modal State
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [newClientDetails, setNewClientDetails] = useState<{
    client_id: string;
    client_secret?: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch('/api/v1/oauth2/clients');
      if (!response.ok) throw new Error(t('clients.failedToLoadClients'));
      const body = await response.json();
      setClients(body.data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('clients.errorLoadingClients');
      logger.error('Failed to load clients', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenClientModal = (client: OAuth2Client | null = null) => {
    if (client) {
      setEditingClient(client);
      setClientForm({
        name: client.name,
        description: client.description,
        redirect_uris: client.redirect_uris.join(', '),
        post_logout_redirect_uris: client.post_logout_redirect_uris?.join(', ') || '',
        is_confidential: client.is_confidential,
        grant_types: client.grant_types,
        scopes: client.scopes,
      });
    } else {
      setEditingClient(null);
      setClientForm({
        name: '',
        description: '',
        redirect_uris: '',
        post_logout_redirect_uris: '',
        is_confidential: false,
        grant_types: ['authorization_code'],
        scopes: ['openid', 'profile', 'email'],
      });
    }
    setShowClientModal(true);
  };

  const handleClientFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.redirect_uris) {
      showError(t('clients.nameRedirectRequired'));
      return;
    }

    const payload = {
      name: clientForm.name,
      description: clientForm.description,
      redirect_uris: clientForm.redirect_uris
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean),
      post_logout_redirect_uris: clientForm.post_logout_redirect_uris
        ? clientForm.post_logout_redirect_uris
            .split(',')
            .map((u) => u.trim())
            .filter(Boolean)
        : [],
      grant_types: clientForm.grant_types,
      scopes: clientForm.scopes,
      is_confidential: clientForm.is_confidential,
    };

    try {
      if (editingClient) {
        const response = await apiFetch(`/api/v1/oauth2/clients/${editingClient.client_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errBody = await response.json();
          throw new Error(errBody.message || t('clients.failedToUpdateClient'));
        }
        setShowClientModal(false);
        fetchClients();
      } else {
        const response = await apiFetch('/api/v1/oauth2/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.message || t('clients.failedToRegisterClient'));
        }

        setShowClientModal(false);

        if (clientForm.is_confidential && body.data?.client_secret) {
          setNewClientDetails(body.data);
          setShowSecretModal(true);
        } else {
          showSuccess(t('clients.clientRegisteredSuccess'));
        }
        fetchClients();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('clients.errorSavingClient');
      showError(message);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      setConfirmState({
        title: t('clients.deleteConfirmTitle'),
        message: t('clients.deleteConfirmMessage'),
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
      const response = await apiFetch(`/api/v1/oauth2/clients/${clientId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(t('clients.failedToDeleteClient'));
      fetchClients();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('clients.errorDeletingClient');
      showError(message);
    }
  };

  const copySecret = () => {
    if (!newClientDetails?.client_secret) return;
    navigator.clipboard.writeText(newClientDetails.client_secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckboxChange = (field: 'grant_types' | 'scopes', value: string) => {
    setClientForm((prev) => {
      const list = prev[field];
      const newList = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
      return { ...prev, [field]: newList };
    });
  };

  if (loading) {
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
        <p className="text-muted">{t('clients.loadingClients')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Feedback type="error">{error}</Feedback>
        <button className="btn btn-secondary btn-sm mt-md" onClick={fetchClients}>
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <PanelHeader
        title={t('clients.title')}
        description={t('clients.description')}
        action={
          <button className="btn btn-primary content-action" onClick={() => handleOpenClientModal(null)}>
            <PlusIcon />
            {t('clients.registerClient')}
          </button>
        }
      />
      {clients.length === 0 ? (
        <EmptyState
          icon={<KeyIcon />}
          title={t('clients.noClientsTitle')}
          description={t('clients.noClientsDescription')}
        />
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>{t('clients.colNameId')}</th>
              <th>{t('clients.colType')}</th>
              <th>{t('clients.colRedirectUris')}</th>
              <th>{t('clients.colGrantTypes')}</th>
              <th>{t('clients.colScopes')}</th>
              <th style={{ width: '120px' }}>{t('clients.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.client_id}>
                <td>
                  <div className="text-sm text-dark">{client.name}</div>
                  <div className="text-xs text-dark text-mono">{client.client_id}</div>
                  {client.description && (
                    <div className="text-sm text-muted" style={{ marginTop: '4px' }}>
                      {client.description}
                    </div>
                  )}
                </td>
                <td>
                  {client.is_confidential ? (
                    <StatusBadge tone="danger" compact>
                      {t('clients.statusConfidential')}
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="success" compact>
                      {t('clients.statusPublic')}
                    </StatusBadge>
                  )}
                </td>
                <td>
                  <div className="flex-col gap-xs" style={{ maxWidth: '300px' }}>
                    {client.redirect_uris.map((uri, idx) => (
                      <span
                        key={idx}
                        className="text-sm text-mono"
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={uri}
                      >
                        {uri}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="flex-row flex-wrap gap-xs">
                    {client.grant_types.map((g) => (
                      <Tag key={g} tone="secondary">
                        {g.replace('_', ' ')}
                      </Tag>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="flex-row flex-wrap gap-xs">
                    {client.scopes.map((s) =>
                      isAdminScope(s) ? (
                        <StatusBadge key={s} tone="warning" compact>
                          {s}
                        </StatusBadge>
                      ) : (
                        <Tag key={s}>{s}</Tag>
                      )
                    )}
                  </div>
                </td>
                <td>
                  <ButtonGroup compact>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenClientModal(client)}
                      title={t('clients.editClient')}
                    >
                      <EditIcon style={{ width: '13px', height: '13px' }} />
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteClient(client.client_id)}
                      title={t('clients.deleteClient')}
                    >
                      <TrashIcon style={{ width: '13px', height: '13px' }} />
                    </button>
                  </ButtonGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      {/* Client Register/Edit Modal */}
      {showClientModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingClient ? t('clients.editModalTitle') : t('clients.registerModalTitle')}
              </h3>
              <button className="modal-close-btn" onClick={() => setShowClientModal(false)}>
                <XIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <form onSubmit={handleClientFormSubmit}>
              <div className="modal-body">
                <FormField label={t('clients.clientNameLabel')}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={t('clients.clientNamePlaceholder')}
                    value={clientForm.name}
                    onChange={(e) => setClientForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </FormField>
                <FormField label={t('clients.descriptionLabel')}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={t('clients.descriptionPlaceholder')}
                    value={clientForm.description}
                    onChange={(e) => setClientForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </FormField>
                <FormField label={t('clients.redirectUrisLabel')} hint={t('clients.redirectUrisHint')}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={t('clients.redirectUrisPlaceholder')}
                    value={clientForm.redirect_uris}
                    onChange={(e) => setClientForm((p) => ({ ...p, redirect_uris: e.target.value }))}
                  />
                </FormField>

                <FormField label={t('clients.postLogoutRedirectUrisLabel')}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={t('clients.postLogoutRedirectUrisPlaceholder')}
                    value={clientForm.post_logout_redirect_uris}
                    onChange={(e) => setClientForm((p) => ({ ...p, post_logout_redirect_uris: e.target.value }))}
                  />
                </FormField>

                <FormField label={t('clients.clientTypeLabel')}>
                  <CheckboxField
                    id="is_confidential"
                    label={t('clients.confidentialClientLabel')}
                    checked={clientForm.is_confidential}
                    onChange={(checked) => setClientForm((p) => ({ ...p, is_confidential: checked }))}
                    disabled={!!editingClient}
                  />
                </FormField>

                <CheckboxGroup label={t('clients.grantTypesLabel')}>
                  {['authorization_code', 'client_credentials', 'refresh_token', 'device_code'].map((gt) => (
                    <CheckboxField
                      key={gt}
                      id={`grant-type-${gt}`}
                      label={gt.replace('_', ' ')}
                      checked={clientForm.grant_types.includes(gt)}
                      onChange={() => handleCheckboxChange('grant_types', gt)}
                    />
                  ))}
                </CheckboxGroup>

                <CheckboxGroup label={t('clients.scopesLabel')}>
                  {clientScopeOptions.map((sc) => (
                    <CheckboxField
                      key={sc}
                      id={`scope-${sc}`}
                      label={sc === 'admin' ? t('clients.adminScopeLabel') : sc}
                      checked={clientForm.scopes.includes(sc)}
                      onChange={() => handleCheckboxChange('scopes', sc)}
                    />
                  ))}
                </CheckboxGroup>
                {clientForm.scopes.some(isAdminScope) && (
                  <div className="notice-card" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
                    <InfoIcon style={{ width: '18px', height: '18px', stroke: 'var(--warning-color)' }} />
                    <p className="text-sm text-muted">{t('clients.adminScopeWarning')}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowClientModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('clients.saveClient')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confidential Client Secret Display Modal */}
      {showSecretModal && newClientDetails && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ border: '1px solid rgba(168, 85, 247, 0.4)' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--color-secondary)' }}>
                {t('clients.secretModalTitle')}
              </h3>
            </div>
            <div className="modal-body">
              <div className="notice-card" style={{ flexDirection: 'row', marginBottom: '20px' }}>
                <InfoIcon style={{ width: '20px', height: '20px', stroke: 'var(--color-secondary)', flexShrink: 0 }} />
                <p
                  style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', textAlign: 'left', lineHeight: '1.5' }}
                >
                  {t('clients.secretWarning')}
                </p>
              </div>

              <FormField label={t('clients.clientIdLabel')}>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {newClientDetails.client_id}
                </div>
              </FormField>

              <FormField label={t('clients.clientSecretLabel')}>
                <ButtonGroup compact>
                  <div
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.03)',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      border: '1px solid rgba(255,255,255,0.05)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {newClientDetails.client_secret}
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={copySecret}
                    style={{ padding: '0 16px' }}
                    title={t('clients.copySecret')}
                  >
                    {copied ? (
                      <CheckIcon style={{ width: '16px', height: '16px', stroke: 'var(--success-color)' }} />
                    ) : (
                      <CopyIcon style={{ width: '16px', height: '16px' }} />
                    )}
                  </button>
                </ButtonGroup>
              </FormField>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowSecretModal(false);
                  setNewClientDetails(null);
                }}
              >
                {t('common.done')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title ?? ''}
        message={confirmState?.message ?? ''}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => confirmState?.onCancel()}
      />
    </div>
  );
}
