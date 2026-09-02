import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText as AuditIcon } from 'lucide-react';
import { Button, Modal } from '../../../components/ui';
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
      <div className="flex-col gap-sm">
        <div>
          <strong className="text-sm text-muted">{t('audit.detailLogId')}</strong>
          <div style={{ fontSize: '14px', marginTop: '2px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {auditLog.id}
          </div>
        </div>
        <div>
          <strong className="text-sm text-muted">{t('audit.detailAction')}</strong>
          <div style={{ fontSize: '14px', marginTop: '2px', fontFamily: 'monospace' }}>{auditLog.action}</div>
        </div>
        <div>
          <strong className="text-sm text-muted">{t('audit.detailActor')}</strong>
          <div style={{ fontSize: '14px', marginTop: '2px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {auditLog.actor}
          </div>
        </div>
        <div>
          <strong className="text-sm text-muted">{t('audit.detailTargetUser')}</strong>
          <div style={{ fontSize: '14px', marginTop: '2px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {auditLog.account_id || '-'}
          </div>
        </div>
        <div>
          <strong className="text-sm text-muted">{t('audit.detailCreatedAt')}</strong>
          <div style={{ fontSize: '14px', marginTop: '2px' }}>
            {auditLog.created_at ? new Date(auditLog.created_at).toLocaleString() : '-'}
          </div>
        </div>
        {auditLog.resource && (
          <div>
            <strong className="text-sm text-muted">{t('audit.detailResourceData')}</strong>
            <pre
              style={{
                margin: '6px 0 0 0',
                padding: '12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#818cf8',
                overflowX: 'auto',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {JSON.stringify(auditLog.resource, null, 2)}
            </pre>
          </div>
        )}
        {auditLog.meta && (
          <div>
            <strong className="text-sm text-muted">{t('audit.detailMetaContext')}</strong>
            <pre
              style={{
                margin: '6px 0 0 0',
                padding: '12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#c084fc',
                overflowX: 'auto',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {JSON.stringify(auditLog.meta, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};
