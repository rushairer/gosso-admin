import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus as PlusIcon,
  Trash2 as TrashIcon,
  Key as KeyIcon,
  User as UserIcon,
  Shield as ShieldIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  CheckSquare as ConsentIcon,
} from 'lucide-react';
import { getUserProfile } from '../../auth';
import {
  ButtonGroup,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Feedback,
  PanelHeader,
  StatusBadge,
  Tag,
  useToast,
} from '../../components/ui';
import { accountService } from '../../services';
import type { Account, Role, Consent } from '../../types/api';
import type { CreateAccountPayload } from '../../services';
import { logger } from '../../utils/logger';
import { CreateUserModal } from './users/CreateUserModal';
import { AssignRolesModal } from './users/AssignRolesModal';
import { ResetPasswordModal } from './users/ResetPasswordModal';
import { UserConsentsModal } from './users/UserConsentsModal';

export default function UsersTab() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [discoveredRoles, setDiscoveredRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const pageSize = 20;
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  const currentAdmin = getUserProfile();

  // Modals state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [consentsList, setConsentsList] = useState<Consent[]>([]);
  const [consentsLoading, setConsentsLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountService.fetchAccounts(page, pageSize, true);
      setAccounts(data.accounts);
      setTotalAccounts(data.total);

      // Collect all unique roles
      const allRoles: Role[] = [];
      data.accounts.forEach((acc) => {
        if (acc.roles) {
          acc.roles.forEach((r) => {
            if (!allRoles.some((existing) => existing.id === r.id)) {
              allRoles.push(r);
            }
          });
        }
      });
      setDiscoveredRoles(allRoles);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error loading accounts';
      logger.error('Failed to load accounts', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleCreateUser = async (formData: CreateAccountPayload) => {
    await accountService.createAccount(formData);
    showSuccess(t('users.userCreatedSuccess'));
    fetchAccounts();
  };

  const handleToggleUserStatus = (acc: Account) => {
    const isActivating = acc.status !== 'active';
    const newStatus = isActivating ? 'active' : 'suspended';
    setConfirmState({
      title: isActivating ? t('users.activateUser') : t('users.suspendUser'),
      message: isActivating
        ? t('users.confirmActivate', { name: acc.display_name || acc.username })
        : t('users.confirmSuspend', { name: acc.display_name || acc.username }),
      onConfirm: async () => {
        try {
          await accountService.updateAccountStatus(acc.id, newStatus);
          showSuccess(isActivating ? t('users.userActivatedSuccess') : t('users.userSuspendedSuccess'));
          fetchAccounts();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Error updating user status';
          showError(message);
        } finally {
          setConfirmState(null);
        }
      },
      onCancel: () => setConfirmState(null),
    });
  };

  const handleDeleteUser = (accountId: string) => {
    const targetUser = accounts.find((a) => a.id === accountId);
    setConfirmState({
      title: t('users.deleteUserTitle'),
      message: t('users.deleteUserConfirm', { name: targetUser?.display_name || targetUser?.username || accountId }),
      onConfirm: async () => {
        try {
          await accountService.deleteAccount(accountId);
          showSuccess(t('users.userDeletedSuccess'));
          fetchAccounts();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Error deleting user';
          showError(message);
        } finally {
          setConfirmState(null);
        }
      },
      onCancel: () => setConfirmState(null),
    });
  };

  const handleClearLockout = (accountId: string) => {
    const targetUser = accounts.find((a) => a.id === accountId);
    setConfirmState({
      title: t('users.unlockAccount'),
      message: t('users.confirmUnlock', { name: targetUser?.display_name || targetUser?.username || accountId }),
      onConfirm: async () => {
        try {
          await accountService.clearLockout(accountId);
          showSuccess(t('users.accountUnlockedSuccess'));
          fetchAccounts();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Error unlocking user';
          showError(message);
        } finally {
          setConfirmState(null);
        }
      },
      onCancel: () => setConfirmState(null),
    });
  };

  const handleResetUserMFA = (acc: Account) => {
    setConfirmState({
      title: t('users.resetMfaTitle'),
      message: t('users.resetMfaConfirm', { name: acc.display_name || acc.username }),
      onConfirm: async () => {
        try {
          await accountService.resetMfa(acc.id);
          showSuccess(t('users.mfaResetSuccess'));
          fetchAccounts();
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Error resetting MFA';
          showError(message);
        } finally {
          setConfirmState(null);
        }
      },
      onCancel: () => setConfirmState(null),
    });
  };

  const handleOpenRoleModal = (acc: Account) => {
    setSelectedAccount(acc);
    setShowRoleModal(true);
  };

  const handleAssignRole = async (roleId: string) => {
    if (!selectedAccount) return;
    try {
      await accountService.assignRole(selectedAccount.id, roleId);
      showSuccess(t('users.roleAssignedSuccess'));
      const updatedRoles = await accountService.fetchAccountRoles(selectedAccount.id);
      setSelectedAccount((prev) => (prev ? { ...prev, roles: updatedRoles } : null));
      fetchAccounts();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error assigning role');
      throw err;
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!selectedAccount) return;
    try {
      await accountService.removeRole(selectedAccount.id, roleId);
      showSuccess(t('users.roleRemovedSuccess'));
      const updatedRoles = await accountService.fetchAccountRoles(selectedAccount.id);
      setSelectedAccount((prev) => (prev ? { ...prev, roles: updatedRoles } : null));
      fetchAccounts();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error removing role');
    }
  };

  const handleOpenPasswordModal = (acc: Account) => {
    setSelectedAccount(acc);
    setShowPasswordModal(true);
  };

  const handleResetPassword = async (password: string) => {
    if (!selectedAccount) return;
    await accountService.resetPassword(selectedAccount.id, password);
    showSuccess(t('users.passwordUpdatedSuccess'));
  };

  const handleOpenConsentModal = async (acc: Account) => {
    setSelectedAccount(acc);
    setShowConsentModal(true);
    setConsentsLoading(true);
    try {
      const list = await accountService.fetchAccountConsents(acc.id);
      setConsentsList(list);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error loading consents');
    } finally {
      setConsentsLoading(false);
    }
  };

  const handleRevokeConsent = async (clientId: string) => {
    if (!selectedAccount) return;
    try {
      await accountService.revokeConsent(selectedAccount.id, clientId);
      showSuccess(t('users.consentRevokedSuccess'));
      const updated = await accountService.fetchAccountConsents(selectedAccount.id);
      setConsentsList(updated);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Error revoking consent');
    }
  };

  if (loading) {
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
        <p className="text-muted">{t('users.loadingAccounts')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-body">
        <Feedback type="error">{error}</Feedback>
        <button className="btn btn-secondary btn-sm mt-md" onClick={fetchAccounts}>
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <PanelHeader
        title={t('users.title')}
        description={t('users.description')}
        action={
          <button className="btn btn-primary content-action" onClick={() => setShowCreateUserModal(true)}>
            <PlusIcon />
            {t('users.addUser')}
          </button>
        }
      />
      {accounts.length === 0 ? (
        <EmptyState icon={<UserIcon />} title={t('users.noUsersTitle')} description={t('users.noUsersDescription')} />
      ) : (
        <>
          <DataTable>
            <thead>
              <tr>
                <th>{t('users.colUser')}</th>
                <th>{t('users.colStatus')}</th>
                <th>{t('users.colRoles')}</th>
                <th style={{ width: '230px' }}>{t('users.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.id}>
                  <td>
                    <div className="font-bold">{acc.display_name || acc.username}</div>
                    <div className="text-xs text-dark text-mono">
                      {acc.username} ({acc.id})
                    </div>
                  </td>
                  <td>
                    <div className="flex-col gap-xs" style={{ alignItems: 'flex-start' }}>
                      {acc.status === 'active' ? (
                        <StatusBadge tone="success">{t('users.statusActive')}</StatusBadge>
                      ) : (
                        <StatusBadge tone="danger">{t('users.statusSuspended')}</StatusBadge>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex-row flex-wrap gap-xs">
                      {acc.roles && acc.roles.length > 0 ? (
                        acc.roles.map((role) => (
                          <Tag key={role.id} title={role.description}>
                            <ShieldIcon
                              style={{ width: '10px', height: '10px', marginRight: '4px', display: 'inline' }}
                            />
                            {role.name}
                          </Tag>
                        ))
                      ) : (
                        <span className="text-sm text-dark" style={{ fontStyle: 'italic' }}>
                          {t('users.noRolesAssigned')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <ButtonGroup compact>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenRoleModal(acc)}
                        title={t('users.manageRoles')}
                      >
                        <ShieldIcon style={{ width: '13px', height: '13px' }} />
                        {t('users.rolesButton')}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenConsentModal(acc)}
                        title={t('users.manageConsents')}
                      >
                        <ConsentIcon style={{ width: '13px', height: '13px' }} />
                        {t('users.consentsButton')}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ opacity: acc.id === currentAdmin?.sub ? 0.4 : 1 }}
                        onClick={() => handleOpenPasswordModal(acc)}
                        title={t('users.changePassword')}
                        disabled={acc.id === currentAdmin?.sub}
                      >
                        <KeyIcon style={{ width: '13px', height: '13px' }} />
                        {t('users.passwordButton')}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ opacity: acc.id === currentAdmin?.sub ? 0.4 : 1 }}
                        onClick={() => handleToggleUserStatus(acc)}
                        title={acc.status === 'active' ? t('users.suspendUser') : t('users.activateUser')}
                        disabled={acc.id === currentAdmin?.sub}
                      >
                        {acc.status === 'active' ? (
                          <LockIcon style={{ width: '13px', height: '13px', stroke: 'var(--danger-color)' }} />
                        ) : (
                          <UnlockIcon style={{ width: '13px', height: '13px', stroke: 'var(--success-color)' }} />
                        )}
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ opacity: acc.id === currentAdmin?.sub ? 0.4 : 1 }}
                        onClick={() => handleClearLockout(acc.id)}
                        title={t('users.unlockAccount')}
                        disabled={acc.id === currentAdmin?.sub}
                      >
                        <UnlockIcon style={{ width: '13px', height: '13px', stroke: 'var(--warning-color)' }} />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ opacity: acc.id === currentAdmin?.sub ? 0.4 : 1 }}
                        onClick={() => handleResetUserMFA(acc)}
                        title={t('users.resetMfaButton')}
                        disabled={acc.id === currentAdmin?.sub}
                      >
                        <ShieldIcon style={{ width: '13px', height: '13px', stroke: 'var(--warning-color)' }} />
                        {t('users.resetMfaButton')}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ opacity: acc.id === currentAdmin?.sub ? 0.4 : 1 }}
                        onClick={() => handleDeleteUser(acc.id)}
                        title={t('users.deleteUser')}
                        disabled={acc.id === currentAdmin?.sub}
                      >
                        <TrashIcon style={{ width: '13px', height: '13px' }} />
                      </button>
                    </ButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          <div className="flex-row items-center gap-sm" style={{ justifyContent: 'flex-end', padding: '16px 20px' }}>
            <span className="text-sm text-dark">{t('users.paginationSummary', { page, total: totalAccounts })}</span>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {t('common.previous')}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page * pageSize >= totalAccounts}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('common.next')}
            </button>
          </div>
        </>
      )}

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onSubmit={handleCreateUser}
      />

      <AssignRolesModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        account={selectedAccount}
        discoveredRoles={discoveredRoles}
        currentAdminId={currentAdmin?.sub}
        onAssignRole={handleAssignRole}
        onRemoveRole={handleRemoveRole}
      />

      <ResetPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        account={selectedAccount}
        onSubmit={handleResetPassword}
      />

      <UserConsentsModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        account={selectedAccount}
        consents={consentsList}
        loading={consentsLoading}
        currentAdminId={currentAdmin?.sub}
        onRevokeConsent={handleRevokeConsent}
      />

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title ?? ''}
        message={confirmState?.message ?? ''}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => confirmState?.onCancel()}
      />
    </div>
  );
}
