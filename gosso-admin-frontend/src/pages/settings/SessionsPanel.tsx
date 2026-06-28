import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Laptop, MapPin } from 'lucide-react';
import { logout, apiFetch } from '../../auth';
import { ConfirmDialog, DataTable, Panel, PanelHeader, Tag } from '../../components/ui';
import { parseUserAgent } from '../../utils/format';

interface Session {
  id: string;
  ip: string;
  user_agent: string;
  created_at: string;
  last_active_at: string;
}

export default function SessionsPanel() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch('/api/v1/auth/sessions');
      if (!response.ok) throw new Error('Failed to load active sessions');
      const body = await response.json();
      const sorted = (body.data || []).sort(
        (a: Session, b: Session) => new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime()
      );
      setSessions(sorted);

      const curResponse = await apiFetch('/api/v1/auth/session');
      if (!curResponse.ok) throw new Error('Failed to validate current session');
      const curBody = await curResponse.json();
      setCurrentSessionId(curBody.data?.id || null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error loading sessions';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setError(null);
    setSuccess(null);
    const confirmed = await new Promise<boolean>((resolve) => {
      setConfirmState({
        title: t('sessions.terminateSessionTitle'),
        message: t('sessions.terminateSessionConfirmMessage'),
        onConfirm: () => { setConfirmState(null); resolve(true); },
        onCancel: () => { setConfirmState(null); resolve(false); },
      });
    });
    if (!confirmed) return;
    try {
      setLoading(true);
      const response = await apiFetch(`/api/v1/auth/sessions/${sessionId}`, { method: 'DELETE' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to revoke session');
      setSuccess(t('sessions.sessionRevoked'));
      await loadSessions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error revoking session';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="text-center" style={{ padding: '60px 0' }}>
        <div
          style={{
            margin: '0 auto 16px auto',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.06)',
            borderTopColor: 'var(--color-primary)',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p className="text-muted">{t('sessions.loadingSessions')}</p>
      </div>
    );
  }

  return (
    <>
    <Panel>
      <PanelHeader
        title={t('sessions.title')}
        description={t('sessions.description')}
      />

      {error && (
        <div style={{ padding: '0 20px 12px' }}>
          <div className="feedback feedback-error" style={{ fontSize: '13px' }}>{error}</div>
        </div>
      )}
      {success && (
        <div style={{ padding: '0 20px 12px' }}>
          <div className="feedback feedback-success" style={{ fontSize: '13px' }}>{success}</div>
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
            const isCurrent = session.id === currentSessionId;
            return (
              <tr
                key={session.id}
                style={{ backgroundColor: isCurrent ? 'rgba(99, 102, 241, 0.03)' : 'transparent' }}
              >
                <td>
                  <div className="flex-row items-center gap-sm">
                    <Laptop
                      style={{
                        width: '16px',
                        height: '16px',
                        color: isCurrent ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      }}
                    />
                    <div className="flex-row items-center gap-sm">
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>
                        {parseUserAgent(session.user_agent)}
                      </span>
                      {isCurrent && <Tag>{t('sessions.currentSession')}</Tag>}
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '13.5px', color: 'var(--color-text-main)' }}>
                  <span className="flex-row items-center gap-xs">
                    <MapPin style={{ width: '12px', height: '12px', color: 'var(--color-text-dark)' }} />
                    {session.ip}
                  </span>
                </td>
                <td className="text-muted" style={{ fontSize: '13.5px' }}>
                  {new Date(session.last_active_at).toLocaleString()}
                </td>
                <td className="text-right">
                  {isCurrent ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={logout}
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                    >
                      {t('sessions.signOutButton')}
                    </button>
                  ) : (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRevokeSession(session.id)}
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                    >
                      {t('sessions.revokeButton')}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </Panel>

    <ConfirmDialog
      open={!!confirmState}
      title={confirmState?.title || ''}
      message={confirmState?.message || ''}
      confirmLabel={t('sessions.terminateButton')}
      onConfirm={() => confirmState?.onConfirm()}
      onCancel={() => confirmState?.onCancel()}
    />
    </>
  );
}
