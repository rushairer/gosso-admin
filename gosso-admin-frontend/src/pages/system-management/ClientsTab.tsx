import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus as PlusIcon, Edit2 as EditIcon, Trash2 as TrashIcon, Key as KeyIcon } from 'lucide-react';
import { clientService } from '../../services';
import type { OAuth2Client } from '../../types/api';
import {
  ButtonGroup,
  AsyncState,
  DataTable,
  EmptyState,
  PanelHeader,
  StatusBadge,
  Tag,
  useConfirm,
  useToast,
} from '../../components/ui';

import { ClientEditorModal } from './clients/ClientEditorModal';
import { ClientSecretModal } from './clients/ClientSecretModal';
import {
  clientPayloadFromForm,
  defaultClientForm,
  formFromClient,
  toggleClientFormSelection,
} from '../../features/clients/clientForm';
import { useClients } from '../../features/clients/useClients';

const clientScopeOptions = ['openid', 'profile', 'email', 'admin'];

function isAdminScope(scope: string) {
  return scope === 'admin' || scope.startsWith('admin:');
}

export default function ClientsTab() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const { clients, loading, error, refresh: fetchClients } = useClients(t('clients.errorLoadingClients'));
  const { confirm, confirmDialog } = useConfirm();

  // Client Modal State
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<OAuth2Client | null>(null);
  const [clientForm, setClientForm] = useState(defaultClientForm);

  // Client Secret Modal State
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [newClientDetails, setNewClientDetails] = useState<{
    client_id: string;
    client_secret?: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOpenClientModal = (client: OAuth2Client | null = null) => {
    if (client) {
      setEditingClient(client);
      setClientForm(formFromClient(client));
    } else {
      setEditingClient(null);
      setClientForm(defaultClientForm);
    }
    setShowClientModal(true);
  };

  const handleClientFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = clientPayloadFromForm(clientForm);
    if (!payload.name || payload.redirect_uris.length === 0) {
      showError(t('clients.nameRedirectRequired'));
      return;
    }

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
    if (!(await confirm({ title: t('clients.deleteConfirmTitle'), message: t('clients.deleteConfirmMessage') })))
      return;
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
    setClientForm((prev) => toggleClientFormSelection(prev, field, value));
  };

  return (
    <AsyncState
      loading={loading}
      loadingMessage={t('clients.loadingClients')}
      error={error}
      retryLabel={t('common.retry')}
      onRetry={() => void fetchClients()}
    >
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

        {confirmDialog}
      </div>
    </AsyncState>
  );
}
