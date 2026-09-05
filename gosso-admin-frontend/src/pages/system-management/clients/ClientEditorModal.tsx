import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, CheckboxField, CheckboxGroup, Feedback, FormField, Input, Modal } from '../../../components/ui';
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
      isOpen={isOpen}
      onClose={onClose}
      title={editingClient ? t('clients.editModalTitle') : t('clients.registerModalTitle')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            {t('common.cancel')}
          </Button>
          <Button form="client-editor-form" type="submit" variant="primary">
            {editingClient ? t('clients.saveChangesButton') : t('clients.registerClientButton')}
          </Button>
        </>
      }
    >
      <form id="client-editor-form" onSubmit={onSubmit}>
        <FormField label={t('clients.clientNameLabel')}>
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
        <FormField label={t('clients.redirectUrisLabel')} hint={t('clients.redirectUrisHint')}>
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
              onChange={() => onCheckboxChange('grant_types', gt)}
            />
          ))}
        </CheckboxGroup>

        <CheckboxGroup label={t('clients.scopesLabel')}>
          {clientScopeOptions.map((sc) => (
            <CheckboxField
              key={sc}
              id={`scope-${sc}`}
              label={sc}
              checked={clientForm.scopes.includes(sc)}
              onChange={() => onCheckboxChange('scopes', sc)}
            />
          ))}
        </CheckboxGroup>
        {clientForm.scopes.some(isAdminScope) && (
          <div className="mb-md">
            <Feedback type="warning">{t('clients.adminScopeWarning')}</Feedback>
          </div>
        )}
      </form>
    </Modal>
  );
};
