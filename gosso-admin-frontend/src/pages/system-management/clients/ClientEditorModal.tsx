import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Checkbox, CheckboxGroup, FormField, Input, Modal } from '@gouno/ui/core';
import type { OAuth2Client } from '../../../types/api';
import type { ClientFormData } from '../../../features/clients/clientForm';

interface ClientEditorModalProps {
  isOpen: boolean;
  editingClient: OAuth2Client | null;
  clientForm: ClientFormData;
  setClientForm: React.Dispatch<React.SetStateAction<ClientFormData>>;
  clientScopeOptions: string[];
  isAdminScope: (scope: string) => boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCheckboxChange: (field: 'grant_types' | 'scopes', value: string) => void;
}

export const ClientEditorModal: React.FC<ClientEditorModalProps> = ({
  isOpen,
  editingClient,
  clientForm,
  setClientForm,
  clientScopeOptions,
  isAdminScope,
  onClose,
  onSubmit,
  onCheckboxChange,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={editingClient ? t('clients.editModalTitle') : t('clients.registerModalTitle')}
      description={
        editingClient
          ? t('clients.editModalDescription', { defaultValue: '配置客户端的重定向 URI、授权类型与访问范围。' })
          : t('clients.registerModalDescription', {
              defaultValue: '向 GOSSO 身份中心注册新的 OAuth 2.0 / OIDC 客户端应用。',
            })
      }
      maxWidth="620px"
      footer={
        <>
          <Button onClick={onClose} type="button">
            {t('common.cancel')}
          </Button>
          <Button form="client-editor-form" type="submit" variant="solid" color="primary">
            {editingClient ? t('clients.saveChangesButton') : t('clients.registerClientButton')}
          </Button>
        </>
      }
    >
      <form id="client-editor-form" onSubmit={onSubmit} className="flex flex-col gap-5">
        <FormField label={t('clients.clientNameLabel')} required>
          <Input
            type="text"
            placeholder={t('clients.clientNamePlaceholder')}
            value={clientForm.name}
            onChange={(e) => setClientForm((p) => ({ ...p, name: e.target.value }))}
          />
        </FormField>
        <FormField label={t('clients.descriptionLabel')}>
          <Input
            type="text"
            placeholder={t('clients.descriptionPlaceholder')}
            value={clientForm.description}
            onChange={(e) => setClientForm((p) => ({ ...p, description: e.target.value }))}
          />
        </FormField>
        <FormField label={t('clients.redirectUrisLabel')} hint={t('clients.redirectUrisHint')} required>
          <Input
            type="text"
            placeholder={t('clients.redirectUrisPlaceholder')}
            value={clientForm.redirect_uris}
            onChange={(e) => setClientForm((p) => ({ ...p, redirect_uris: e.target.value }))}
          />
        </FormField>
        <FormField label={t('clients.postLogoutRedirectUrisLabel')}>
          <Input
            type="text"
            placeholder={t('clients.postLogoutRedirectUrisPlaceholder')}
            value={clientForm.post_logout_redirect_uris}
            onChange={(e) => setClientForm((p) => ({ ...p, post_logout_redirect_uris: e.target.value }))}
          />
        </FormField>
        <FormField
          label={t('clients.allowedResourcesLabel', { defaultValue: 'Allowed Resources (RFC 8707)' })}
          hint={t('clients.allowedResourcesHint', {
            defaultValue: 'Comma-separated target resource URIs, e.g. https://blog.example.com/api',
          })}
        >
          <Input
            type="text"
            placeholder={t('clients.allowedResourcesPlaceholder', { defaultValue: 'https://blog.example.com/api' })}
            value={clientForm.allowed_resources}
            onChange={(e) => setClientForm((p) => ({ ...p, allowed_resources: e.target.value }))}
          />
        </FormField>
        <FormField label={t('clients.clientTypeLabel')}>
          <Checkbox
            id="is_confidential"
            label={t('clients.confidentialClientLabel')}
            checked={clientForm.is_confidential}
            onChange={(event) => setClientForm((p) => ({ ...p, is_confidential: event.target.checked }))}
            disabled={Boolean(editingClient)}
          />
        </FormField>
        <CheckboxGroup label={t('clients.grantTypesLabel')}>
          {['authorization_code', 'client_credentials', 'refresh_token', 'device_code'].map((gt) => (
            <Checkbox
              key={gt}
              id={`grant-type-${gt}`}
              label={gt.replace('_', ' ')}
              checked={clientForm.grant_types.includes(gt)}
              onChange={() => onCheckboxChange('grant_types', gt)}
            />
          ))}
        </CheckboxGroup>
        <CheckboxGroup label={t('clients.scopesLabel')}>
          {clientScopeOptions.map((sc) => (
            <Checkbox
              key={sc}
              id={`scope-${sc}`}
              label={sc}
              checked={clientForm.scopes.includes(sc)}
              onChange={() => onCheckboxChange('scopes', sc)}
            />
          ))}
        </CheckboxGroup>
        {clientForm.scopes.some(isAdminScope) ? (
          <Alert type="warning" showIcon title={t('clients.adminScopeWarning')} />
        ) : null}
      </form>
    </Modal>
  );
};
