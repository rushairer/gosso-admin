import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText as AuditIcon } from 'lucide-react';
import { ButtonGroup, DataTable, EmptyState, Feedback, FormField, PanelHeader, Tag } from '../../components/ui';
import { auditService } from '../../services';
import { AuditLogDetailModal } from './audit/AuditLogDetailModal';
import type { AuditLog } from '../../types/api';
import { logger } from '../../utils/logger';

export default function AuditLogsTab() {
  const { t } = useTranslation();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(true);
  const [filterEventType, setFilterEventType] = useState('');
  const [filterAccountID, setFilterAccountID] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs(1);
  }, []);

  const fetchAuditLogs = async (page: number) => {
    try {
      setAuditLoading(true);
      setError(null);
      const data = await auditService.fetchAuditLogs({
        page,
        pageSize: 20,
        eventType: filterEventType || undefined,
        accountId: filterAccountID || undefined,
      });
      setAuditLogs(data.logs);
      setAuditTotal(data.total);
      setAuditPage(page);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error loading audit logs';
      logger.error('Failed to load audit logs', err);
      setError(message);
    } finally {
      setAuditLoading(false);
    }
  };

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
            <button className="btn btn-primary" onClick={() => fetchAuditLogs(1)}>
              {t('common.search')}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setFilterEventType('');
                setFilterAccountID('');
                setTimeout(() => {
                  fetchAuditLogs(1);
                }, 0);
              }}
            >
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
        <div className="text-center" style={{ padding: '40px 0' }}>
          <div
            style={{
              margin: '0 auto 12px auto',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.06)',
              borderTopColor: 'var(--color-primary)',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p className="text-muted" style={{ fontSize: '14px' }}>
            {t('audit.loadingLogs')}
          </p>
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
                onClick={() => fetchAuditLogs(auditPage - 1)}
              >
                {t('common.previous')}
              </button>
              <span style={{ fontSize: '14px', color: 'var(--color-text-main)' }}>
                {t('audit.pageLabel', { page: auditPage })}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={auditLogs.length < 20 || auditPage * 20 >= auditTotal}
                onClick={() => fetchAuditLogs(auditPage + 1)}
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
