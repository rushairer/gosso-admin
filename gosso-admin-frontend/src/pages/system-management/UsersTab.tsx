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
  RotateCcw as ResetMfaIcon,
} from 'lucide-react';
import { useUserProfile } from '@gosso/client/react';
import {
  Button,
  ButtonGroup,
  IconButton,
  AsyncState,
  DataTable,
  EmptyState,
  PanelHeader,
  StatusBadge,
  TableSkeleton,
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

  const currentAdmin = useUserProfile();

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
          ? t('users.enableConfirmMessage', { username: acc.display_name || acc.username })
          : t('users.disableConfirmMessage', { username: acc.display_name || acc.username }),
      }))
    )
      return;
    try {
      await accountService.updateAccountStatus(acc.id, newStatus);
      showSuccess(isActivating ? t('users.userActivatedSuccess') : t('users.userSuspendedSuccess'));
      fetchAccounts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('users.statusUpdateFailed');
      showError(message);
    }
  };

  const handleDeleteUser = async (accountId: string) => {
    const targetUser = accounts.find((a) => a.id === accountId);
    if (
      !(await confirm({
        title: t('users.deleteUserConfirmTitle'),
        message: t('users.deleteUserConfirmMessage', {
          username: targetUser?.display_name || targetUser?.username || accountId,
        }),
      }))
    )
      return;
    try {
      await accountService.deleteAccount(accountId);
      showSuccess(t('users.userDeletedSuccess'));
      fetchAccounts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('users.deleteUserFailed');
      showError(message);
    }
  };

  const handleClearLockout = async (accountId: string) => {
    const targetUser = accounts.find((a) => a.id === accountId);
    if (
      !(await confirm({
        title: t('users.unlockAccount'),
        message: t('users.clearLockoutConfirmMessage', {
          username: targetUser?.display_name || targetUser?.username || accountId,
        }),
      }))
    )
      return;
    try {
      await accountService.clearLockout(accountId);
      showSuccess(t('users.lockoutClearedSuccess'));
      fetchAccounts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('users.unlockAccountFailed');
      showError(message);
    }
  };

  const handleResetUserMFA = async (acc: Account) => {
    if (
      !(await confirm({
        title: t('users.resetMfaButton'),
        message: t('users.resetMfaConfirmMessage', { username: acc.display_name || acc.username }),
      }))
    )
      return;
    try {
      await accountService.resetMfa(acc.id);
      showSuccess(t('users.mfaResetSuccess', { username: acc.display_name || acc.username }));
      fetchAccounts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('users.resetMfaFailed');
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
      showError(err instanceof Error ? err.message : t('users.assignRoleFailed'));
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
      showError(err instanceof Error ? err.message : t('users.removeRoleFailed'));
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
      showError(err instanceof Error ? err.message : t('users.loadConsentsFailed'));
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
      showError(err instanceof Error ? err.message : t('users.revokeConsentFailed'));
    }
  };

  return (
    <div>
      <PanelHeader
        title={t('users.title')}
        description={t('users.description')}
        action={
          <Button
            variant="primary"
            icon={<PlusIcon size={16} />}
            disabled={loading}
            onClick={() => setShowCreateUserModal(true)}
          >
            {t('users.addUser')}
          </Button>
        }
      />
      <AsyncState
        loading={loading}
        loadingMessage={t('users.loadingAccounts')}
        skeleton={<TableSkeleton rows={5} columns={4} />}
        error={error}
        retryLabel={t('common.retry')}
        onRetry={() => void fetchAccounts()}
        empty={accounts.length === 0}
        emptyState={
          <EmptyState icon={<UserIcon />} title={t('users.noUsersTitle')} description={t('users.noUsersDescription')} />
        }
      >
        <DataTable>
          <thead>
            <tr>
              <th>{t('users.colUser')}</th>
              <th>{t('users.colStatus')}</th>
              <th>{t('users.colRoles')}</th>
              <th className="col-actions">{t('users.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc.id}>
                <td>
                  <div className="font-bold text-sm text-[var(--color-text-main)]">
                    {acc.display_name || acc.username}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] font-mono">
                    {acc.username} ({acc.id})
                  </div>
                </td>
                <td>
                  <div className="flex flex-col gap-1 items-start">
                    {acc.status === 'active' ? (
                      <StatusBadge tone="success">{t('users.statusActive')}</StatusBadge>
                    ) : (
                      <StatusBadge tone="danger">{t('users.statusSuspended')}</StatusBadge>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex flex-row flex-wrap gap-1.5">
                    {acc.roles && acc.roles.length > 0 ? (
                      acc.roles.map((role) => (
                        <Tag key={role.id} title={role.description}>
                          <ShieldIcon size={10} className="mr-1 inline" />
                          {role.name}
                        </Tag>
                      ))
                    ) : (
                      <span className="text-sm text-[var(--color-text-muted)] italic">
                        {t('users.noRolesAssigned')}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <ButtonGroup compact>
                    <IconButton
                      variant="secondary"
                      size="sm"
                      icon={<ShieldIcon size={14} />}
                      label={t('users.manageRoles')}
                      onClick={() => handleOpenRoleModal(acc)}
                    />
                    <IconButton
                      variant="secondary"
                      size="sm"
                      icon={<ConsentIcon size={14} />}
                      label={t('users.manageConsents')}
                      onClick={() => handleOpenConsentModal(acc)}
                    />
                    <IconButton
                      variant="secondary"
                      size="sm"
                      icon={<KeyIcon size={14} />}
                      label={t('users.changePassword')}
                      onClick={() => handleOpenPasswordModal(acc)}
                      disabled={acc.id === currentAdmin?.sub}
                    />
                    <IconButton
                      variant="secondary"
                      size="sm"
                      icon={
                        acc.status === 'active' ? (
                          <LockIcon size={14} className="text-warning" />
                        ) : (
                          <UnlockIcon size={14} className="text-success" />
                        )
                      }
                      label={acc.status === 'active' ? t('users.suspendUser') : t('users.activateUser')}
                      onClick={() => handleToggleUserStatus(acc)}
                      disabled={acc.id === currentAdmin?.sub}
                    />
                    <IconButton
                      variant="secondary"
                      size="sm"
                      icon={<UnlockIcon size={14} />}
                      label={t('users.unlockAccount')}
                      onClick={() => handleClearLockout(acc.id)}
                      disabled={acc.id === currentAdmin?.sub}
                    />
                    <IconButton
                      variant="secondary"
                      size="sm"
                      icon={<ResetMfaIcon size={14} />}
                      label={t('users.resetMfaButton')}
                      onClick={() => handleResetUserMFA(acc)}
                      disabled={acc.id === currentAdmin?.sub}
                    />
                    <IconButton
                      variant="danger"
                      size="sm"
                      icon={<TrashIcon size={14} />}
                      label={t('users.deleteUser')}
                      onClick={() => handleDeleteUser(acc.id)}
                      disabled={acc.id === currentAdmin?.sub}
                    />
                  </ButtonGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        <div className="table-pagination">
          <div className="table-pagination-info">{t('users.paginationSummary', { page, total: totalAccounts })}</div>
          <ButtonGroup compact>
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {t('common.previous')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page * pageSize >= totalAccounts}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('common.next')}
            </Button>
          </ButtonGroup>
        </div>
      </AsyncState>

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
  );
}
