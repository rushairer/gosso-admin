import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Laptop, MapPin } from 'lucide-react';
import { useSessions } from '@gosso/client/react';
import { logout } from '../../auth';
import {
  Alert,
  Button,
  Empty,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
} from '@gouno/ui/core';
import { parseUserAgent } from '../../utils/format';
import { SessionsLoading } from './loading';
import { Section, StatusMessage } from './shared';

export default function SessionsPanel() {
  const { t } = useTranslation();
  const { sessions, currentSession, loading, error, reload, revoke } = useSessions();
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [hasResolvedInitialLoad, setHasResolvedInitialLoad] = useState(false);

  useEffect(() => {
    if (!loading && !error) setHasResolvedInitialLoad(true);
  }, [error, loading]);

  const initialLoading = loading && !hasResolvedInitialLoad;
  const fatalLoadError = Boolean(error) && !hasResolvedInitialLoad;

  const handleRevokeSession = async () => {
    if (!pendingSessionId) return;
    const sessionId = pendingSessionId;
    setPendingSessionId(null);
    setSuccess(null);
    try {
      await revoke(sessionId);
      setSuccess(t('sessions.sessionRevoked'));
    } catch {}
  };

  return (
    <>
      <Section description={t('sessions.description')} surface="direct">
        <div className="flex flex-col gap-4">
          {success ? <StatusMessage message={success} /> : null}
          {error ? (
            <Alert
              type="error"
              showIcon
              title={error}
              action={
                fatalLoadError ? (
                  <Button size="small" loading={loading} onClick={() => void reload().catch(() => {})}>
                    {t('common.retry')}
                  </Button>
                ) : undefined
              }
            />
          ) : null}

          {initialLoading ? (
            <SessionsLoading
              label={t('common.loading')}
              headers={[
                { label: t('sessions.colDeviceBrowser'), skeletonClassName: 'h-4 w-44' },
                { label: t('sessions.colIpAddress'), skeletonClassName: 'h-4 w-28' },
                { label: t('sessions.colLastActive'), skeletonClassName: 'h-4 w-36' },
                { label: t('sessions.colActions'), skeletonClassName: 'h-8 w-20', align: 'right' },
              ]}
            />
          ) : fatalLoadError ? null : sessions.length === 0 ? (
            <Empty title={t('sessions.noSessionsTitle', { defaultValue: '暂无活跃会话' })} />
          ) : (
            <div aria-busy={loading}>
              <Table bordered>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('sessions.colDeviceBrowser')}</TableHead>
                    <TableHead>{t('sessions.colIpAddress')}</TableHead>
                    <TableHead>{t('sessions.colLastActive')}</TableHead>
                    <TableHead className="text-right">{t('sessions.colActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => {
                    const isCurrent = session.id === currentSession?.id;
                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex min-w-52 items-center gap-2">
                            <Laptop aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                            <span className="font-medium">{parseUserAgent(session.user_agent)}</span>
                            {isCurrent ? <Tag color="success">{t('sessions.currentSession')}</Tag> : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                            <MapPin aria-hidden="true" className="size-3" />
                            {session.ip}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(session.last_active_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {isCurrent ? (
                            <Button size="small" onClick={() => void logout()} disabled={loading}>
                              {t('sessions.signOutButton')}
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="solid"
                              color="error"
                              onClick={() => setPendingSessionId(session.id)}
                              disabled={loading}
                            >
                              {t('sessions.revokeButton')}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Section>

      <Modal
        open={Boolean(pendingSessionId)}
        title={t('sessions.terminateSessionTitle')}
        description={t('sessions.terminateSessionConfirmMessage')}
        onOpenChange={(next) => {
          if (!next) setPendingSessionId(null);
        }}
        onOk={() => void handleRevokeSession()}
        okText={t('sessions.terminateButton')}
        cancelText={t('common.cancel')}
        okButtonProps={{ variant: 'solid', color: 'error' }}
      />
    </>
  );
}
