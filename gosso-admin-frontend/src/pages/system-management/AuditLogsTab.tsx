import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText as AuditIcon } from 'lucide-react';
import {
  Button,
  ButtonGroup,
  DataTable,
  EmptyState,
  Feedback,
  FormField,
  Input,
  PanelHeader,
  TableSkeleton,
  Tag,
} from '../../components/ui';
import { AuditLogDetailModal } from './audit/AuditLogDetailModal';
import type { AuditLog } from '../../types/api';
import { useAuditLogs } from '../../features/audit/useAuditLogs';

export default function AuditLogsTab() {
  const { t } = useTranslation();
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const {
    logs: auditLogs,
    total: auditTotal,
    page: auditPage,
    pageSize,
    loading: auditLoading,
    error,
    eventType: filterEventType,
    setEventType: setFilterEventType,
    accountId: filterAccountID,
    setAccountId: setFilterAccountID,
    search,
    clearFilters,
    goToPage,
  } = useAuditLogs();

  return (
    <div>
      <PanelHeader title={t('audit.title')} description={t('audit.description')} />
      <div className="panel-body" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex-row flex-wrap gap-lg" style={{ alignItems: 'flex-end' }}>
          <div className="flex-col gap-xs">
            <FormField label={t('audit.eventTypeLabel')} noMargin>
              <Input
                type="text"
                placeholder={t('audit.eventTypePlaceholder')}
                value={filterEventType}
                onChange={(e) => setFilterEventType(e.target.value)}
                style={{ width: '220px' }}
              />
            </FormField>
          </div>
          <div className="flex-col gap-xs">
            <FormField label={t('audit.accountIdLabel')} noMargin>
              <Input
                type="text"
                placeholder={t('audit.accountIdPlaceholder')}
                value={filterAccountID}
                onChange={(e) => setFilterAccountID(e.target.value)}
                style={{ width: '300px' }}
              />
            </FormField>
          </div>
          <ButtonGroup compact>
            <Button variant="primary" onClick={search}>
              {t('common.search')}
            </Button>
            <Button variant="secondary" onClick={clearFilters}>
              {t('common.clear')}
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0 20px', marginTop: '16px' }}>
          <Feedback type="error">{error}</Feedback>
        </div>
      )}

      {auditLoading ? (
        <div style={{ padding: '0 20px 20px 20px' }}>
          <TableSkeleton rows={5} columns={5} />
        </div>
      ) : auditLogs.length === 0 ? (
        <EmptyState icon={<AuditIcon />} title={t('audit.noLogsTitle')} description={t('audit.noLogsDescription')} />
      ) : (
        <div>
          <DataTable>
            <thead>
              <tr>
                <th>{t('audit.colTime')}</th>
                <th>{t('audit.colAction')}</th>
                <th>{t('audit.colActor')}</th>
                <th>{t('audit.colTargetUser')}</th>
                <th style={{ width: '120px' }}>{t('audit.colDetails')}</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="text-sm text-muted">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                  </td>
                  <td>
                    <Tag>{log.action}</Tag>
                  </td>
                  <td className="text-sm text-mono">{log.actor}</td>
                  <td className="text-sm text-mono text-muted">{log.account_id || '-'}</td>
                  <td>
                    <Button variant="secondary" size="sm" onClick={() => setSelectedAuditLog(log)}>
                      {t('common.view')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>

          {/* Pagination */}
          <div
            className="flex-row items-center justify-between"
            style={{
              marginTop: '20px',
              padding: '0 20px 20px 20px',
            }}
          >
            <div className="text-muted text-sm">{t('audit.totalLogs', { count: auditTotal })}</div>
            <ButtonGroup compact>
              <Button variant="secondary" size="sm" disabled={auditPage <= 1} onClick={() => goToPage(auditPage - 1)}>
                {t('common.previous')}
              </Button>
              <span className="text-sm text-dark">{t('audit.pageLabel', { page: auditPage })}</span>
              <Button
                variant="secondary"
                size="sm"
                disabled={auditLogs.length < pageSize || auditPage * pageSize >= auditTotal}
                onClick={() => goToPage(auditPage + 1)}
              >
                {t('common.next')}
              </Button>
            </ButtonGroup>
          </div>
        </div>
      )}

      <AuditLogDetailModal
        isOpen={Boolean(selectedAuditLog)}
        auditLog={selectedAuditLog}
        onClose={() => setSelectedAuditLog(null)}
      />
    </div>
  );
}
