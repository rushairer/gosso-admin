import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText as AuditIcon } from 'lucide-react';
import {
  AsyncState,
  Badge,
  Button,
  ButtonGroup,
  DataTable,
  FormField,
  Input,
  PanelHeader,
  TableSkeleton,
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
      <div className="panel-body panel-filter-bar">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
          className="table-filter-bar"
        >
          <div className="table-filter-field">
            <FormField label={t('audit.eventTypeLabel')} noMargin>
              <Input
                type="text"
                placeholder={t('audit.eventTypePlaceholder')}
                value={filterEventType}
                onChange={(e) => setFilterEventType(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>
          <div className="table-filter-field table-filter-field--wide">
            <FormField label={t('audit.accountIdLabel')} noMargin>
              <Input
                type="text"
                placeholder={t('audit.accountIdPlaceholder')}
                value={filterAccountID}
                onChange={(e) => setFilterAccountID(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>
          <div className="table-filter-actions">
            <Button variant="primary" type="submit">
              {t('common.search')}
            </Button>
            <Button variant="secondary" type="button" onClick={clearFilters}>
              {t('common.clear')}
            </Button>
          </div>
        </form>
      </div>

      <AsyncState
        loading={auditLoading}
        skeleton={
          <div className="table-skeleton-container">
            <TableSkeleton rows={5} columns={5} />
          </div>
        }
        error={error}
        retryLabel={t('common.retry')}
        onRetry={search}
        empty={!auditLoading && auditLogs.length === 0 && !error}
        emptyIcon={<AuditIcon />}
        emptyTitle={t('audit.noLogsTitle')}
        emptyDescription={t('audit.noLogsDescription')}
      >
        <div>
          <DataTable>
            <thead>
              <tr>
                <th>{t('audit.colTime')}</th>
                <th>{t('audit.colAction')}</th>
                <th>{t('audit.colActor')}</th>
                <th>{t('audit.colTargetUser')}</th>
                <th className="col-w-actions">{t('audit.colDetails')}</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="text-sm text-[var(--color-text-muted)]">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                  </td>
                  <td>
                    <Badge tone="neutral">{log.action}</Badge>
                  </td>
                  <td className="text-sm font-mono text-[var(--color-text-main)]">{log.actor}</td>
                  <td className="text-sm font-mono text-[var(--color-text-muted)]">{log.account_id || '-'}</td>
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
          <div className="table-pagination">
            <div className="table-pagination-info">
              {t('audit.totalLogs', { count: auditTotal })}
              <span>·</span>
              <span>{t('audit.pageLabel', { page: auditPage })}</span>
            </div>
            <ButtonGroup compact>
              <Button variant="secondary" size="sm" disabled={auditPage <= 1} onClick={() => goToPage(auditPage - 1)}>
                {t('common.previous')}
              </Button>
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
      </AsyncState>

      <AuditLogDetailModal
        isOpen={Boolean(selectedAuditLog)}
        auditLog={selectedAuditLog}
        onClose={() => setSelectedAuditLog(null)}
      />
    </div>
  );
}
