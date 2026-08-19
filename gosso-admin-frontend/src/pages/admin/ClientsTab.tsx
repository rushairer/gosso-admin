import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus as PlusIcon, Edit2 as EditIcon, Trash2 as TrashIcon, Key as KeyIcon } from 'lucide-react';
import { clientService } from '../../services';
import {
  ButtonGroup,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Feedback,
  PanelHeader,
  StatusBadge,
  Tag,
  useToast,
} from '../../components/ui';
import { ClientEditorModal } from './clients/ClientEditorModal';
import { ClientSecretModal } from './clients/ClientSecretModal';
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
      const data = await clientService.fetchClients();
      setClients(data);
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
        await clientService.updateClient(editingClient.client_id, payload);
        setShowClientModal(false);
        fetchClients();
      } else {
        const result = await clientService.createClient(payload);
        setShowClientModal(false);

        if (clientForm.is_confidential && result.client_secret) {
          setNewClientDetails({
            client_id: result.client.client_id,
            client_secret: result.client_secret,
            name: result.client.name,
          });
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
      await clientService.deleteClient(clientId);
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
      <div className="panel-body">
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

      <ClientEditorModal
        isOpen={showClientModal}
        editingClient={editingClient}
        clientForm={clientForm}
        setClientForm={setClientForm}
        clientScopeOptions={clientScopeOptions}
        isAdminScope={isAdminScope}
        onClose={() => setShowClientModal(false)}
        onSubmit={handleClientFormSubmit}
        onCheckboxChange={handleCheckboxChange}
      />

      <ClientSecretModal
        isOpen={showSecretModal}
        details={newClientDetails}
        copied={copied}
        onCopySecret={copySecret}
        onClose={() => {
          setShowSecretModal(false);
          setNewClientDetails(null);
        }}
      />

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
