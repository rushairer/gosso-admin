import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText as AuditIcon, X as XIcon } from 'lucide-react';
import { apiFetch } from '../../auth';
import {
  ButtonGroup,
  DataTable,
  EmptyState,
  Feedback,
  FormField,
  PanelHeader,
  Tag,
} from '../../components/ui';
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
      let url = `/api/v1/admin/audit-logs?page=${page}&page_size=20`;
      if (filterEventType) {
        url += `&event_type=${encodeURIComponent(filterEventType)}`;
      }
      if (filterAccountID) {
        url += `&account_id=${encodeURIComponent(filterAccountID)}`;
      }
      const response = await apiFetch(url);
      if (!response.ok) throw new Error('Failed to load audit logs');
      const body = await response.json();
      setAuditLogs(body.data?.items || []);
      setAuditTotal(body.data?.total || 0);
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
      <PanelHeader
        title={t('audit.title')}
        description={t('audit.description')}
      />
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
        <div className="mt-md">
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
          <p className="text-muted" style={{ fontSize: '14px' }}>{t('audit.loadingLogs')}</p>
        </div>
      ) : auditLogs.length === 0 ? (
        <EmptyState
          icon={<AuditIcon />}
          title={t('audit.noLogsTitle')}
          description={t('audit.noLogsDescription')}
        />
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
                  <td className="text-sm text-mono text-muted">
                    {log.account_id || '-'}
                  </td>
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
            }}
          >
            <div className="text-muted" style={{ fontSize: '14px' }}>{t('audit.totalLogs', { count: auditTotal })}</div>
            <ButtonGroup compact>
              <button
                className="btn btn-secondary btn-sm"
                disabled={auditPage <= 1}
                onClick={() => fetchAuditLogs(auditPage - 1)}
              >
                {t('common.previous')}
              </button>
              <span style={{ fontSize: '14px', color: 'var(--color-text-main)' }}>{t('audit.pageLabel', { page: auditPage })}</span>
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

      {/* Audit Log Detail Modal */}
      {selectedAuditLog && (
        <div className="modal-backdrop" onClick={() => setSelectedAuditLog(null)}>
          <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{t('audit.detailModalTitle')}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedAuditLog(null)}>
                <XIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <div className="modal-body">
                <div className="flex-col" style={{ gap: '14px' }}>
                <div>
                  <strong className="text-sm text-muted">{t('audit.detailLogId')}</strong>
                  <div style={{ fontSize: '14px', marginTop: '2px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {selectedAuditLog.id}
                  </div>
                </div>
                <div>
                  <strong className="text-sm text-muted">{t('audit.detailAction')}</strong>
                  <div style={{ fontSize: '14px', marginTop: '2px', fontFamily: 'monospace' }}>
                    {selectedAuditLog.action}
                  </div>
                </div>
                <div>
                  <strong className="text-sm text-muted">{t('audit.detailActor')}</strong>
                  <div style={{ fontSize: '14px', marginTop: '2px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {selectedAuditLog.actor}
                  </div>
                </div>
                <div>
                  <strong className="text-sm text-muted">{t('audit.detailTargetUser')}</strong>
                  <div style={{ fontSize: '14px', marginTop: '2px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {selectedAuditLog.account_id || '-'}
                  </div>
                </div>
                <div>
                  <strong className="text-sm text-muted">{t('audit.detailCreatedAt')}</strong>
                  <div style={{ fontSize: '14px', marginTop: '2px' }}>
                    {selectedAuditLog.created_at ? new Date(selectedAuditLog.created_at).toLocaleString() : '-'}
                  </div>
                </div>
                {selectedAuditLog.resource && (
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
                      {JSON.stringify(selectedAuditLog.resource, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedAuditLog.meta && (
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
                      {JSON.stringify(selectedAuditLog.meta, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedAuditLog(null)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
