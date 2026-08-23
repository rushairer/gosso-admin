import { useState } from 'react';
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
import { gossoClient } from '../../auth';
import {
  ButtonGroup,
  AsyncState,
  DataTable,
  EmptyState,
  PanelHeader,
  StatusBadge,
  Tag,
  useConfirm,
  useToast,
} from '../../components/ui';

import { accountService } from '../../services';
import type { Account, Consent } from '../../types/api';
import type { CreateAccountPayload } from '../../services';
import { useAdminUsers } from '../../features/users/useAdminUsers';
import { CreateUserModal } from './users/CreateUserModal';
import { AssignRolesModal } from './users/AssignRolesModal';
import { ResetPasswordModal } from './users/ResetPasswordModal';
import { UserConsentsModal } from './users/UserConsentsModal';

export default function UsersTab() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const {
    accounts,
    roles: discoveredRoles,
    loading,
    error,
    page,
    setPage,
    pageSize,
    totalAccounts,
    refresh: fetchAccounts,
  } = useAdminUsers();
  const { confirm, confirmDialog } = useConfirm();

  const currentAdmin = gossoClient.getUserProfile();

  // Modals state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [consentsList, setConsentsList] = useState<Consent[]>([]);
  const [consentsLoading, setConsentsLoading] = useState(false);

  const handleCreateUser = async (formData: CreateAccountPayload) => {
    await accountService.createAccount(formData);
    showSuccess(t('users.userCreatedSuccess'));
    fetchAccounts();
  };

  const handleToggleUserStatus = async (acc: Account) => {
    const isActivating = acc.status !== 'active';
    const newStatus = isActivating ? 'active' : 'suspended';
    if (
      !(await confirm({
        title: isActivating ? t('users.activateUser') : t('users.suspendUser'),
        message: isActivating
          ? t('users.confirmActivate', { name: acc.display_name || acc.username })
          : t('users.confirmSuspend', { name: acc.display_name || acc.username }),
      }))
    )
      return;
    try {
      await accountService.updateAccountStatus(acc.id, newStatus);
      showSuccess(isActivating ? t('users.userActivatedSuccess') : t('users.userSuspendedSuccess'));
      fetchAccounts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error updating user status';
      showError(message);
    }
  };

  const handleDeleteUser = async (accountId: string) => {
    const targetUser = accounts.find((a) => a.id === accountId);
    if (
      !(await confirm({
        title: t('users.deleteUserTitle'),
        message: t('users.deleteUserConfirm', { name: targetUser?.display_name || targetUser?.username || accountId }),
      }))
    )
      return;
    try {
      await accountService.deleteAccount(accountId);
      showSuccess(t('users.userDeletedSuccess'));
      fetchAccounts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error deleting user';
      showError(message);
    }
  };

  const handleClearLockout = async (accountId: string) => {
    const targetUser = accounts.find((a) => a.id === accountId);
    if (
      !(await confirm({
        title: t('users.unlockAccount'),
        message: t('users.confirmUnlock', { name: targetUser?.display_name || targetUser?.username || accountId }),
      }))
    )
      return;
    try {
      await accountService.clearLockout(accountId);
      showSuccess(t('users.accountUnlockedSuccess'));
      fetchAccounts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error unlocking user';
      showError(message);
    }
  };

  const handleResetUserMFA = async (acc: Account) => {
    if (
      !(await confirm({
        title: t('users.resetMfaTitle'),
        message: t('users.resetMfaConfirm', { name: acc.display_name || acc.username }),
      }))
    )
      return;
    try {
      await accountService.resetMfa(acc.id);
      showSuccess(t('users.mfaResetSuccess'));
      fetchAccounts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error resetting MFA';
      showError(message);
    }
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

  return (
    <AsyncState
      loading={loading}
      loadingMessage={t('users.loadingAccounts')}
      error={error}
      retryLabel={t('common.retry')}
      onRetry={() => void fetchAccounts()}
    >
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

        {confirmDialog}
      </div>
    </AsyncState>
  );
}
