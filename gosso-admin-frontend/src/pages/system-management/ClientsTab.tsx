import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus as PlusIcon,
  Edit2 as EditIcon,
  Trash2 as TrashIcon,
  Key as KeyIcon,
  Copy as CopyIcon,
} from 'lucide-react';
import { clientService } from '../../services';
import type { OAuth2Client } from '../../types/api';
import {
  Button,
  ButtonGroup,
  AsyncState,
  DataTable,
  EmptyState,
  IconButton,
  PanelHeader,
  StatusBadge,
  TableSkeleton,
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

  const handleCopyUri = async (uri: string) => {
    try {
      await navigator.clipboard.writeText(uri);
      showSuccess(t('common.copied', { defaultValue: '已复制到剪贴板' }));
    } catch {
      showError(t('common.copyFailed', { defaultValue: '复制失败' }));
    }
  };

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

  const handleRotateSecret = async (client: OAuth2Client) => {
    if (!client.is_confidential) return;
    if (!(await confirm({ title: t('clients.rotateSecretTitle'), message: t('clients.rotateSecretMessage') }))) return;
    try {
      const result = await clientService.rotateSecret(client.client_id);
      setNewClientDetails({ client_id: result.client_id, client_secret: result.client_secret, name: client.name });
      setShowSecretModal(true);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : t('clients.errorSavingClient'));
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
    <div>
      <PanelHeader
        title={t('clients.title')}
        description={t('clients.description')}
        action={
          <Button
            variant="primary"
            icon={<PlusIcon size={16} />}
            disabled={loading}
            onClick={() => handleOpenClientModal(null)}
          >
            {t('clients.registerClient')}
          </Button>
        }
      />
      <AsyncState
        loading={loading}
        loadingMessage={t('clients.loadingClients')}
        skeleton={<TableSkeleton rows={5} columns={6} />}
        error={error}
        retryLabel={t('common.retry')}
        onRetry={() => void fetchClients()}
        empty={clients.length === 0}
        emptyState={
          <EmptyState
            icon={<KeyIcon />}
            title={t('clients.noClientsTitle')}
            description={t('clients.noClientsDescription')}
          />
        }
      >
        <DataTable>
          <thead>
            <tr>
              <th>{t('clients.colNameId')}</th>
              <th>{t('clients.colType')}</th>
              <th>{t('clients.colRedirectUris')}</th>
              <th>{t('clients.colGrantTypes')}</th>
              <th>{t('clients.colScopes')}</th>
              <th className="col-w-actions">{t('clients.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.client_id}>
                <td>
                  <div className="client-name">{client.name}</div>
                  <code className="client-id-code">{client.client_id}</code>
                  {client.description && <div className="client-desc">{client.description}</div>}
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
                  <div className="flex flex-col gap-1.5 max-w-[300px]">
                    {client.redirect_uris.map((uri, idx) => (
                      <div key={idx} className="uri-copy-chip" title={uri}>
                        <span className="uri-copy-text">{uri}</span>
                        <IconButton
                          label={t('common.copy', { defaultValue: '复制' })}
                          icon={<CopyIcon size={12} />}
                          variant="secondary"
                          size="sm"
                          className="uri-copy-btn"
                          onClick={() => void handleCopyUri(uri)}
                        />
                      </div>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="flex flex-row flex-wrap gap-1.5">
                    {client.grant_types.map((g) => (
                      <Tag key={g} tone="secondary">
                        {g.replace('_', ' ')}
                      </Tag>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="flex flex-row flex-wrap gap-1.5">
                    {client.scopes.map((s) => (
                      <Tag key={s} tone={isAdminScope(s) ? 'warning' : 'primary'}>
                        {s.toLowerCase()}
                      </Tag>
                    ))}
                  </div>
                </td>
                <td>
                  <ButtonGroup compact>
                    <IconButton
                      label={t('clients.editClient')}
                      variant="secondary"
                      size="sm"
                      icon={<EditIcon size={14} />}
                      onClick={() => handleOpenClientModal(client)}
                    />
                    {client.is_confidential && (
                      <IconButton
                        label={t('clients.rotateSecret')}
                        variant="secondary"
                        size="sm"
                        icon={<KeyIcon size={14} />}
                        onClick={() => void handleRotateSecret(client)}
                      />
                    )}
                    <IconButton
                      label={t('clients.deleteClient')}
                      variant="danger"
                      size="sm"
                      icon={<TrashIcon size={14} />}
                      onClick={() => handleDeleteClient(client.client_id)}
                    />
                  </ButtonGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </AsyncState>

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
  );
}
