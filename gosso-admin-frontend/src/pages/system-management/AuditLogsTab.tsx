import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText as AuditIcon, Search, X } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  Empty,
  FormField,
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
} from '@gouno/ui/core';
import { AuditLogDetailModal } from './audit/AuditLogDetailModal';
import type { AuditLog } from '../../types/api';
import { useAuditLogs } from '../../features/audit/useAuditLogs';
import { ManagementPanelLead } from './shared';
import { SystemCollectionLoading } from './loading';

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
    <div className="flex flex-col gap-5">
      <ManagementPanelLead description={t('audit.description')} />

      <Card padding="sm">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            search();
          }}
          className="flex flex-col gap-3 md:flex-row md:items-end"
        >
          <FormField label={t('audit.eventTypeLabel')} className="min-w-0 flex-1">
            <Input
              type="text"
              placeholder={t('audit.eventTypePlaceholder')}
              value={filterEventType}
              onChange={(event) => setFilterEventType(event.target.value)}
            />
          </FormField>
          <FormField label={t('audit.accountIdLabel')} className="min-w-0 flex-1">
            <Input
              type="text"
              placeholder={t('audit.accountIdPlaceholder')}
              value={filterAccountID}
              onChange={(event) => setFilterAccountID(event.target.value)}
            />
          </FormField>
          <div className="flex gap-2 pb-0.5">
            <Button type="submit" variant="solid" color="primary" icon={<Search />} loading={auditLoading}>
              {t('common.search')}
            </Button>
            <Button type="button" icon={<X />} onClick={clearFilters} disabled={auditLoading}>
              {t('common.clear')}
            </Button>
          </div>
        </form>
      </Card>

      {error ? (
        <Alert
          type="error"
          showIcon
          title={error}
          action={
            <Button size="small" onClick={search} loading={auditLoading}>
              {t('common.retry')}
            </Button>
          }
        />
      ) : null}

      {auditLoading ? (
        <SystemCollectionLoading
          label={t('audit.loadingLogs', { defaultValue: 'Loading audit logs' })}
          density="compact"
          rows={5}
          showPagination
          columns={[
            { header: t('audit.colTime'), skeletonClassName: 'h-4 w-36' },
            { header: t('audit.colAction'), skeletonClassName: 'h-6 w-28' },
            { header: t('audit.colActor'), skeletonClassName: 'h-4 w-28' },
            { header: t('audit.colTargetUser'), skeletonClassName: 'h-4 w-36' },
            { header: t('audit.colDetails'), skeletonClassName: 'h-8 w-16', align: 'right' },
          ]}
        />
      ) : auditLogs.length === 0 && !error ? (
        <Empty
          icon={<AuditIcon aria-hidden="true" className="size-6 text-muted-foreground" />}
          title={t('audit.noLogsTitle')}
          description={t('audit.noLogsDescription')}
          action={
            <Button size="small" icon={<X />} onClick={clearFilters}>
              {t('common.clear')}
            </Button>
          }
        />
      ) : (
        <>
          <Table bordered density="compact">
            <TableHeader>
              <TableRow>
                <TableHead>{t('audit.colTime')}</TableHead>
                <TableHead>{t('audit.colAction')}</TableHead>
                <TableHead>{t('audit.colActor')}</TableHead>
                <TableHead>{t('audit.colTargetUser')}</TableHead>
                <TableHead className="text-right">{t('audit.colDetails')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>
                    <Tag>{log.action}</Tag>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.actor}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.account_id || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button size="small" onClick={() => setSelectedAuditLog(log)}>
                      {t('common.view')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={auditPage}
            total={auditTotal}
            pageSize={pageSize}
            onChange={(nextPage) => goToPage(nextPage)}
            showTotal={(total) => t('audit.totalLogs', { count: total })}
            prevText={t('common.previous')}
            nextText={t('common.next')}
          />
        </>
      )}

      <AuditLogDetailModal
        isOpen={Boolean(selectedAuditLog)}
        auditLog={selectedAuditLog}
        onClose={() => setSelectedAuditLog(null)}
      />
    </div>
  );
}
