import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Laptop, MapPin } from 'lucide-react';
import { useSessions } from '@gosso/client/react';
import { logout } from '../../auth';
import {
  AsyncState,
  Badge,
  Button,
  DataTable,
  Feedback,
  Panel,
  PanelHeader,
  TableSkeleton,
  useConfirm,
} from '../../components/ui';
import { parseUserAgent } from '../../utils/format';

export default function SessionsPanel() {
  const { t } = useTranslation();
  const { sessions, currentSession, loading, error, revoke } = useSessions();
  const [success, setSuccess] = useState<string | null>(null);
  const { confirm, confirmDialog } = useConfirm();

  const handleRevokeSession = async (sessionId: string) => {
    setSuccess(null);
    const confirmed = await confirm({
      title: t('sessions.terminateSessionTitle'),
      message: t('sessions.terminateSessionConfirmMessage'),
      confirmLabel: t('sessions.terminateButton'),
    });
    if (!confirmed) return;
    try {
      await revoke(sessionId);
      setSuccess(t('sessions.sessionRevoked'));
    } catch {}
  };

  return (
    <>
      <Panel>
        <PanelHeader title={t('sessions.title')} description={t('sessions.description')} />

        {success && (
          <div className="panel-body">
            <Feedback type="success">{success}</Feedback>
          </div>
        )}

        <AsyncState
          loading={loading}
          skeleton={<TableSkeleton rows={3} columns={4} />}
          error={error}
          empty={!loading && sessions.length === 0 && !error}
          emptyTitle={t('sessions.noSessionsTitle', { defaultValue: '暂无活跃会话' })}
        >
          <DataTable>
            <thead>
              <tr>
                <th>{t('sessions.colDeviceBrowser')}</th>
                <th>{t('sessions.colIpAddress')}</th>
                <th>{t('sessions.colLastActive')}</th>
                <th className="text-right">{t('sessions.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const isCurrent = session.id === currentSession?.id;
                return (
                  <tr key={session.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Laptop
                          size={16}
                          className="shrink-0"
                          color={isCurrent ? 'var(--action-primary)' : 'var(--text-secondary)'}
                        />
                        <span className="text-sm font-semibold">{parseUserAgent(session.user_agent)}</span>
                        {isCurrent && <Badge tone="primary">{t('sessions.currentSession')}</Badge>}
                      </div>
                    </td>
                    <td className="text-sm text-dark">
                      <div className="flex items-center gap-1.5 font-mono">
                        <MapPin size={13} className="shrink-0" color="var(--text-tertiary)" />
                        <span>{session.ip}</span>
                      </div>
                    </td>
                    <td className="text-muted text-sm">{new Date(session.last_active_at).toLocaleString()}</td>
                    <td className="text-right">
                      {isCurrent ? (
                        <Button variant="secondary" size="sm" onClick={() => void logout()}>
                          {t('sessions.signOutButton')}
                        </Button>
                      ) : (
                        <Button variant="danger" size="sm" onClick={() => handleRevokeSession(session.id)}>
                          {t('sessions.revokeButton')}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        </AsyncState>
      </Panel>

      {confirmDialog}
    </>
  );
}
