import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText as AuditIcon } from 'lucide-react';
import {
  ButtonGroup,
  DataTable,
  EmptyState,
  Feedback,
  FormField,
  PageLoader,
  PanelHeader,
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
              <input
                type="text"
                className="input-field"
                placeholder={t('audit.eventTypePlaceholder')}
                value={filterEventType}
                onChange={(e) => setFilterEventType(e.target.value)}
                style={{ width: '220px' }}
              />
            </FormField>
          </div>
          <div className="flex-col gap-xs">
            <FormField label={t('audit.accountIdLabel')} noMargin>
              <input
                type="text"
                className="input-field"
                placeholder={t('audit.accountIdPlaceholder')}
                value={filterAccountID}
                onChange={(e) => setFilterAccountID(e.target.value)}
                style={{ width: '300px' }}
              />
            </FormField>
          </div>
          <ButtonGroup compact>
            <button className="btn btn-primary" onClick={search}>
              {t('common.search')}
            </button>
            <button className="btn btn-secondary" onClick={clearFilters}>
              {t('common.clear')}
            </button>
          </ButtonGroup>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0 20px', marginTop: '16px' }}>
          <Feedback type="error">{error}</Feedback>
        </div>
      )}

      {auditLoading ? (
        <PageLoader message={t('audit.loadingLogs')} padding="40px 0" size="sm" />
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
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedAuditLog(log)}>
                      {t('common.view')}
                    </button>
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
            <div className="text-muted" style={{ fontSize: '14px' }}>
              {t('audit.totalLogs', { count: auditTotal })}
            </div>
            <ButtonGroup compact>
              <button
                className="btn btn-secondary btn-sm"
                disabled={auditPage <= 1}
                onClick={() => goToPage(auditPage - 1)}
              >
                {t('common.previous')}
              </button>
              <span style={{ fontSize: '14px', color: 'var(--color-text-main)' }}>
                {t('audit.pageLabel', { page: auditPage })}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={auditLogs.length < pageSize || auditPage * pageSize >= auditTotal}
                onClick={() => goToPage(auditPage + 1)}
              >
                {t('common.next')}
              </button>
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
