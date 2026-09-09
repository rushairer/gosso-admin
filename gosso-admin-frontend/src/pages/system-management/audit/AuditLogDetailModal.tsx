import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from '@gouno/ui/core';
import type { AuditLog } from '../../../types/api';

interface AuditLogDetailModalProps {
  isOpen: boolean;
  auditLog: AuditLog | null;
  onClose: () => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({ isOpen, auditLog, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen || !auditLog) return null;

  const rows = [
    [t('audit.detailLogId'), auditLog.id, true],
    [t('audit.detailAction'), auditLog.action, true],
    [t('audit.detailActor'), auditLog.actor, true],
    [t('audit.detailTargetUser'), auditLog.account_id || '-', true],
    [t('audit.detailCreatedAt'), auditLog.created_at ? new Date(auditLog.created_at).toLocaleString() : '-', false],
  ] as const;

  return (
    <Modal
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={t('audit.detailModalTitle')}
      maxWidth="640px"
      footer={<Button onClick={onClose}>{t('common.close')}</Button>}
    >
      <dl className="grid gap-3 text-sm sm:grid-cols-[140px_minmax(0,1fr)]">
        {rows.map(([label, value, mono]) => (
          <React.Fragment key={String(label)}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className={mono ? 'm-0 min-w-0 break-all font-mono text-xs' : 'm-0'}>{value}</dd>
          </React.Fragment>
        ))}
        {auditLog.resource ? (
          <>
            <dt className="text-muted-foreground">{t('audit.detailResourceData')}</dt>
            <dd className="m-0 min-w-0">
              <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 font-mono text-xs">
                {JSON.stringify(auditLog.resource, null, 2)}
              </pre>
            </dd>
          </>
        ) : null}
        {auditLog.meta ? (
          <>
            <dt className="text-muted-foreground">{t('audit.detailMetaContext')}</dt>
            <dd className="m-0 min-w-0">
              <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 font-mono text-xs">
                {JSON.stringify(auditLog.meta, null, 2)}
              </pre>
            </dd>
          </>
        ) : null}
      </dl>
    </Modal>
  );
};
