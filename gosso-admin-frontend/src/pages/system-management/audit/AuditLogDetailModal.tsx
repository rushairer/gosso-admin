import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText as AuditIcon } from 'lucide-react';
import { Button, DefinitionList, DefinitionRow, Modal } from '../../../components/ui';
import type { AuditLog } from '../../../types/api';

interface AuditLogDetailModalProps {
  isOpen: boolean;
  auditLog: AuditLog | null;
  onClose: () => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({ isOpen, auditLog, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen || !auditLog) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <>
          <AuditIcon aria-hidden="true" size={18} /> {t('audit.detailModalTitle')}
        </>
      }
      maxWidth="640px"
      footer={
        <Button variant="secondary" onClick={onClose}>
          {t('common.close')}
        </Button>
      }
    >
      <DefinitionList>
        <DefinitionRow label={t('audit.detailLogId')} mono>
          {auditLog.id}
        </DefinitionRow>
        <DefinitionRow label={t('audit.detailAction')} mono>
          {auditLog.action}
        </DefinitionRow>
        <DefinitionRow label={t('audit.detailActor')} mono>
          {auditLog.actor}
        </DefinitionRow>
        <DefinitionRow label={t('audit.detailTargetUser')} mono>
          {auditLog.account_id || '-'}
        </DefinitionRow>
        <DefinitionRow label={t('audit.detailCreatedAt')}>
          {auditLog.created_at ? new Date(auditLog.created_at).toLocaleString() : '-'}
        </DefinitionRow>
        {auditLog.resource && (
          <DefinitionRow label={t('audit.detailResourceData')}>
            <pre className="code-block-viewer">{JSON.stringify(auditLog.resource, null, 2)}</pre>
          </DefinitionRow>
        )}
        {auditLog.meta && (
          <DefinitionRow label={t('audit.detailMetaContext')}>
            <pre className="code-block-viewer">{JSON.stringify(auditLog.meta, null, 2)}</pre>
          </DefinitionRow>
        )}
      </DefinitionList>
    </Modal>
  );
};
