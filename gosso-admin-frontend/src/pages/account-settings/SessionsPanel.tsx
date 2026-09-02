import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Laptop, MapPin } from 'lucide-react';
import { useSessions } from '@gosso/client/react';
import { logout } from '../../auth';
import { Button, DataTable, Feedback, PageLoader, Panel, PanelHeader, Tag, useConfirm } from '../../components/ui';
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

  if (loading) {
    return <PageLoader message={t('sessions.loadingSessions')} />;
  }

  return (
    <>
      <Panel>
        <PanelHeader title={t('sessions.title')} description={t('sessions.description')} />

        {error && (
          <div style={{ padding: '16px 20px 0 20px' }}>
            <Feedback type="error">{error}</Feedback>
          </div>
        )}
        {success && (
          <div style={{ padding: '16px 20px 0 20px' }}>
            <Feedback type="success">{success}</Feedback>
          </div>
        )}

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
                <tr
                  key={session.id}
                  style={{ backgroundColor: isCurrent ? 'rgba(99, 102, 241, 0.03)' : 'transparent' }}
                >
                  <td>
                    <div className="flex-row items-center gap-sm">
                      <Laptop size={16} color={isCurrent ? 'var(--action-primary)' : 'var(--text-secondary)'} />
                      <div className="flex-row items-center gap-sm">
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>
                          {parseUserAgent(session.user_agent)}
                        </span>
                        {isCurrent && <Tag>{t('sessions.currentSession')}</Tag>}
                      </div>
                    </div>
                  </td>
                  <td className="text-sm text-dark">
                    <span className="flex-row items-center gap-xs">
                      <MapPin size={12} color="var(--text-tertiary)" />
                      {session.ip}
                    </span>
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
      </Panel>

      {confirmDialog}
    </>
  );
}
