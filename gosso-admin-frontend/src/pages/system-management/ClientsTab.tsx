import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus as PlusIcon,
  Edit2 as EditIcon,
  Trash2 as TrashIcon,
  Key as KeyIcon,
  Copy as CopyIcon,
  RotateCcw,
} from 'lucide-react';
import { clientService } from '../../services';
import type { OAuth2Client } from '../../types/api';
import {
  Alert,
  Button,
  Empty,
  IconButton,
  Modal,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Text,
  useMessage,
} from '@gouno/ui/core';

import { ClientEditorModal } from './clients/ClientEditorModal';
import { ClientSecretModal } from './clients/ClientSecretModal';
import {
  clientPayloadFromForm,
  defaultClientForm,
  formFromClient,
  toggleClientFormSelection,
} from '../../features/clients/clientForm';
import { useClients } from '../../features/clients/useClients';
import { useSudo } from '../../components/auth/SudoContext';
import { ManagementPanelLead } from './shared';

const clientScopeOptions = ['openid', 'profile', 'email', 'admin'];

type PendingAction =
  | { type: 'delete'; client: OAuth2Client }
  | { type: 'rotate'; client: OAuth2Client }
  | null;

function isAdminScope(scope: string) {
  return scope === 'admin' || scope.startsWith('admin:');
}

export default function ClientsTab() {
  const { t } = useTranslation();
  const message = useMessage();
  const { requireSudo } = useSudo();
  const { clients, loading, error, refresh: fetchClients } = useClients(t('clients.errorLoadingClients'));

  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<OAuth2Client | null>(null);
  const [clientForm, setClientForm] = useState(defaultClientForm);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [newClientDetails, setNewClientDetails] = useState<{
    client_id: string;
    client_secret?: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const handleCopyUri = async (uri: string) => {
    try {
      await navigator.clipboard.writeText(uri);
      message.success(t('common.copied', { defaultValue: '已复制到剪贴板' }));
    } catch {
      message.error(t('common.copyFailed', { defaultValue: '复制失败' }));
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

  const handleClientFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = clientPayloadFromForm(clientForm);
    if (!payload.name || payload.redirect_uris.length === 0) {
      message.error(t('clients.nameRedirectRequired'));
      return;
    }

    try {
      if (editingClient) {
        await clientService.updateClient(editingClient.client_id, payload);
        setShowClientModal(false);
        void fetchClients();
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
          message.success(t('clients.clientRegisteredSuccess'));
        }
        void fetchClients();
      }
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : t('clients.errorSavingClient'));
    }
  };

  const confirmPendingAction = async () => {
    const action = pendingAction;
    if (!action) return;
    setPendingAction(null);

    if (action.type === 'delete') {
      await requireSudo({
        actionTitle: t('clients.deleteConfirmTitle'),
        onSuccess: async () => {
          try {
            await clientService.deleteClient(action.client.client_id);
            void fetchClients();
          } catch (err: unknown) {
            message.error(err instanceof Error ? err.message : t('clients.errorDeletingClient'));
          }
        },
      });
      return;
    }

    if (!action.client.is_confidential) return;
    await requireSudo({
      actionTitle: t('clients.rotateSecretTitle'),
      onSuccess: async () => {
        try {
          const result = await clientService.rotateSecret(action.client.client_id);
          setNewClientDetails({
            client_id: result.client_id,
            client_secret: result.client_secret,
            name: action.client.name,
          });
          setShowSecretModal(true);
          message.success(t('clients.secretRotatedSuccess'));
          void fetchClients();
        } catch (err: unknown) {
          message.error(err instanceof Error ? err.message : t('clients.errorRotatingSecret'));
        }
      },
    });
  };

  const copySecret = () => {
    if (!newClientDetails?.client_secret) return;
    void navigator.clipboard.writeText(newClientDetails.client_secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckboxChange = (field: 'grant_types' | 'scopes', value: string) => {
    setClientForm((prev) => toggleClientFormSelection(prev, field, value));
  };

  return (
    <div className="flex flex-col gap-5">
      <ManagementPanelLead
        description={t('clients.description')}
        actions={
          <Button
            variant="solid"
            color="primary"
            icon={<PlusIcon />}
            disabled={loading}
            onClick={() => handleOpenClientModal(null)}
          >
            {t('clients.registerClient')}
          </Button>
        }
      />

      {error ? (
        <Alert
          type="error"
          showIcon
          title={error}
          action={<Button size="small" onClick={() => void fetchClients()}>{t('common.retry')}</Button>}
        />
      ) : null}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center gap-3 rounded-lg border bg-card text-sm text-muted-foreground" role="status">
          <Spinner aria-label={t('clients.loadingClients')} />
          <span>{t('clients.loadingClients')}</span>
        </div>
      ) : clients.length === 0 ? (
        <Empty
          icon={<KeyIcon aria-hidden="true" className="size-6 text-muted-foreground" />}
          title={t('clients.noClientsTitle')}
          description={t('clients.noClientsDescription')}
          action={<Button icon={<PlusIcon />} onClick={() => handleOpenClientModal(null)}>{t('clients.registerClient')}</Button>}
        />
      ) : (
        <Table bordered>
          <TableHeader>
            <TableRow>
              <TableHead>{t('clients.colNameId')}</TableHead>
              <TableHead>{t('clients.colType')}</TableHead>
              <TableHead>{t('clients.colRedirectUris')}</TableHead>
              <TableHead>{t('clients.colGrantTypes')}</TableHead>
              <TableHead>{t('clients.colScopes')}</TableHead>
              <TableHead className="text-right">{t('clients.colActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.client_id}>
                <TableCell className="min-w-56 whitespace-normal">
                  <div className="font-semibold">{client.name}</div>
                  <code className="mt-1 block max-w-64 truncate text-xs text-muted-foreground" title={client.client_id}>
                    {client.client_id}
                  </code>
                  {client.description ? <Text size="xs" tone="muted" className="mt-1">{client.description}</Text> : null}
                </TableCell>
                <TableCell>
                  <Tag color={client.is_confidential ? 'warning' : 'success'}>
                    {client.is_confidential ? t('clients.statusConfidential') : t('clients.statusPublic')}
                  </Tag>
                </TableCell>
                <TableCell className="min-w-72 whitespace-normal">
                  <div className="flex flex-col gap-2">
                    {client.redirect_uris.map((uri) => (
                      <div key={uri} className="flex items-center gap-2 rounded-md bg-muted/60 px-2 py-1.5" title={uri}>
                        <code className="min-w-0 flex-1 truncate text-xs">{uri}</code>
                        <IconButton label={t('common.copy', { defaultValue: '复制' })} icon={<CopyIcon />} onClick={() => void handleCopyUri(uri)} />
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="min-w-48 whitespace-normal">
                  <div className="flex flex-wrap gap-1.5">
                    {client.grant_types.map((grant) => <Tag key={grant}>{grant.replace('_', ' ')}</Tag>)}
                  </div>
                </TableCell>
                <TableCell className="min-w-40 whitespace-normal">
                  <div className="flex flex-wrap gap-1.5">
                    {client.scopes.map((scope) => (
                      <Tag key={scope} color={isAdminScope(scope) ? 'warning' : 'primary'}>
                        {scope.toLowerCase()}
                      </Tag>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex min-w-max flex-nowrap items-center justify-end gap-1">
                    <IconButton label={t('clients.editClient')} variant="ghost" icon={<EditIcon />} onClick={() => handleOpenClientModal(client)} />
                    {client.is_confidential ? (
                      <IconButton label={t('clients.rotateSecret')} variant="ghost" icon={<RotateCcw />} onClick={() => setPendingAction({ type: 'rotate', client })} />
                    ) : null}
                    <IconButton label={t('clients.deleteClient')} variant="ghost" color="error" icon={<TrashIcon />} onClick={() => setPendingAction({ type: 'delete', client })} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

      <Modal
        open={Boolean(pendingAction)}
        title={pendingAction?.type === 'rotate' ? t('clients.rotateSecretTitle') : t('clients.deleteConfirmTitle')}
        description={pendingAction?.type === 'rotate' ? t('clients.rotateSecretMessage') : t('clients.deleteConfirmMessage')}
        onOpenChange={(next) => {
          if (!next) setPendingAction(null);
        }}
        onOk={() => void confirmPendingAction()}
        okText={t('common.continue')}
        cancelText={t('common.cancel')}
        okButtonProps={{
          variant: 'solid',
          color: pendingAction?.type === 'delete' ? 'error' : 'primary',
        }}
      />
    </div>
  );
}
