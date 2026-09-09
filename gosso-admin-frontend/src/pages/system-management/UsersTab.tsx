import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus as PlusIcon,
  Trash2 as TrashIcon,
  KeyRound as KeyIcon,
  User as UserIcon,
  UserRoundCog as RoleIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  CheckSquare as ConsentIcon,
  RotateCcw as ResetMfaIcon,
  MoreHorizontal,
} from 'lucide-react';
import { useUserProfile } from '@gosso/client/react';
import {
  Alert,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  IconButton,
  Modal,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Text,
  useMessage,
} from '@gouno/ui/core';

import { accountService } from '../../services';
import type { Account, Consent } from '../../types/api';
import type { CreateAccountPayload } from '../../services';
import { useAdminUsers } from '../../features/users/useAdminUsers';
import { CreateUserModal } from './users/CreateUserModal';
import { AssignRolesModal } from './users/AssignRolesModal';
import { ResetPasswordModal } from './users/ResetPasswordModal';
import { UserConsentsModal } from './users/UserConsentsModal';
import { useSudo } from '../../components/auth/SudoContext';
import { ManagementPanelLead } from './shared';

type PendingAction =
  | { type: 'status'; account: Account }
  | { type: 'unlock'; account: Account }
  | { type: 'reset-mfa'; account: Account }
  | { type: 'delete'; account: Account }
  | null;

export default function UsersTab() {
  const { t } = useTranslation();
  const message = useMessage();
  const { requireSudo } = useSudo();
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
  const currentAdmin = useUserProfile();

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [consentsList, setConsentsList] = useState<Consent[]>([]);
  const [consentsLoading, setConsentsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const handleCreateUser = async (formData: CreateAccountPayload) => {
    await accountService.createAccount(formData);
    message.success(t('users.userCreatedSuccess'));
    void fetchAccounts();
  };

  const performStatusToggle = async (account: Account) => {
    const isActivating = account.status !== 'active';
    try {
      await accountService.updateAccountStatus(account.id, isActivating ? 'active' : 'suspended');
      message.success(isActivating ? t('users.userActivatedSuccess') : t('users.userSuspendedSuccess'));
      void fetchAccounts();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : t('users.statusUpdateFailed'));
    }
  };

  const performDeleteUser = async (account: Account) => {
    await requireSudo({
      actionTitle: t('users.deleteUserConfirmTitle'),
      onSuccess: async () => {
        try {
          await accountService.deleteAccount(account.id);
          message.success(t('users.userDeletedSuccess'));
          void fetchAccounts();
        } catch (err: unknown) {
          message.error(err instanceof Error ? err.message : t('users.deleteUserFailed'));
        }
      },
    });
  };

  const performClearLockout = async (account: Account) => {
    try {
      await accountService.clearLockout(account.id);
      message.success(t('users.lockoutClearedSuccess'));
      void fetchAccounts();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : t('users.unlockAccountFailed'));
    }
  };

  const performResetMfa = async (account: Account) => {
    await requireSudo({
      actionTitle: t('users.resetMfaButton'),
      onSuccess: async () => {
        try {
          await accountService.resetMfa(account.id);
          message.success(t('users.mfaResetSuccess', { username: account.display_name || account.username }));
          void fetchAccounts();
        } catch (err: unknown) {
          message.error(err instanceof Error ? err.message : t('users.resetMfaFailed'));
        }
      },
    });
  };

  const confirmPendingAction = async () => {
    const action = pendingAction;
    if (!action) return;
    setPendingAction(null);
    if (action.type === 'status') return performStatusToggle(action.account);
    if (action.type === 'unlock') return performClearLockout(action.account);
    if (action.type === 'reset-mfa') return performResetMfa(action.account);
    return performDeleteUser(action.account);
  };

  const handleOpenRoleModal = (account: Account) => {
    setSelectedAccount(account);
    setShowRoleModal(true);
  };

  const handleAssignRole = async (roleId: string) => {
    if (!selectedAccount) return;
    await requireSudo({
      actionTitle: t('users.rolesModalTitle', { name: selectedAccount.display_name || selectedAccount.username }),
      onSuccess: async () => {
        try {
          await accountService.assignRole(selectedAccount.id, roleId);
          message.success(t('users.roleAssignedSuccess'));
          const updatedRoles = await accountService.fetchAccountRoles(selectedAccount.id);
          setSelectedAccount((prev) => (prev ? { ...prev, roles: updatedRoles } : null));
          void fetchAccounts();
        } catch (err: unknown) {
          message.error(err instanceof Error ? err.message : t('users.assignRoleFailed'));
          throw err;
        }
      },
    });
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!selectedAccount) return;
    await requireSudo({
      actionTitle: t('users.rolesModalTitle', { name: selectedAccount.display_name || selectedAccount.username }),
      onSuccess: async () => {
        try {
          await accountService.removeRole(selectedAccount.id, roleId);
          message.success(t('users.roleRemovedSuccess'));
          const updatedRoles = await accountService.fetchAccountRoles(selectedAccount.id);
          setSelectedAccount((prev) => (prev ? { ...prev, roles: updatedRoles } : null));
          void fetchAccounts();
        } catch (err: unknown) {
          message.error(err instanceof Error ? err.message : t('users.removeRoleFailed'));
        }
      },
    });
  };

  const handleOpenPasswordModal = (account: Account) => {
    setSelectedAccount(account);
    setShowPasswordModal(true);
  };

  const handleResetPassword = async (password: string) => {
    if (!selectedAccount) return;
    await requireSudo({
      actionTitle: t('users.resetPasswordTitle', { defaultValue: '重置成员密码' }),
      onSuccess: async () => {
        await accountService.resetPassword(selectedAccount.id, password);
        message.success(t('users.passwordUpdatedSuccess'));
      },
    });
  };

  const handleOpenConsentModal = async (account: Account) => {
    setSelectedAccount(account);
    setShowConsentModal(true);
    setConsentsLoading(true);
    try {
      setConsentsList(await accountService.fetchAccountConsents(account.id));
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : t('users.loadConsentsFailed'));
    } finally {
      setConsentsLoading(false);
    }
  };

  const handleRevokeConsent = async (clientId: string) => {
    if (!selectedAccount) return;
    try {
      await accountService.revokeConsent(selectedAccount.id, clientId);
      message.success(t('users.consentRevokedSuccess'));
      setConsentsList(await accountService.fetchAccountConsents(selectedAccount.id));
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : t('users.revokeConsentFailed'));
    }
  };

  const actionTitle = pendingAction
    ? pendingAction.type === 'status'
      ? pendingAction.account.status === 'active'
        ? t('users.suspendUser')
        : t('users.activateUser')
      : pendingAction.type === 'unlock'
        ? t('users.unlockAccount')
        : pendingAction.type === 'reset-mfa'
          ? t('users.resetMfaButton')
          : t('users.deleteUserConfirmTitle')
    : '';

  const actionDescription = pendingAction
    ? pendingAction.type === 'status'
      ? pendingAction.account.status === 'active'
        ? t('users.disableConfirmMessage', {
            username: pendingAction.account.display_name || pendingAction.account.username,
          })
        : t('users.enableConfirmMessage', {
            username: pendingAction.account.display_name || pendingAction.account.username,
          })
      : pendingAction.type === 'unlock'
        ? t('users.clearLockoutConfirmMessage', {
            username: pendingAction.account.display_name || pendingAction.account.username,
          })
        : pendingAction.type === 'reset-mfa'
          ? t('users.resetMfaConfirmMessage', {
              username: pendingAction.account.display_name || pendingAction.account.username,
            })
          : t('users.deleteUserConfirmMessage', {
              username: pendingAction.account.display_name || pendingAction.account.username,
            })
    : '';

  return (
    <div className="flex flex-col gap-5">
      <ManagementPanelLead
        description={t('users.description')}
        actions={
          <Button
            variant="solid"
            color="primary"
            icon={<PlusIcon />}
            disabled={loading}
            onClick={() => setShowCreateUserModal(true)}
          >
            {t('users.addUser')}
          </Button>
        }
      />

      {error ? (
        <Alert
          type="error"
          showIcon
          title={error}
          action={
            <Button size="small" onClick={() => void fetchAccounts()}>
              {t('common.retry')}
            </Button>
          }
        />
      ) : null}

      {loading ? (
        <div
          className="flex min-h-48 items-center justify-center gap-3 rounded-lg border bg-card text-sm text-muted-foreground"
          role="status"
        >
          <Spinner aria-label={t('users.loadingAccounts')} />
          <span>{t('users.loadingAccounts')}</span>
        </div>
      ) : accounts.length === 0 ? (
        <Empty
          icon={<UserIcon aria-hidden="true" className="size-6 text-muted-foreground" />}
          title={t('users.noUsersTitle')}
          description={t('users.noUsersDescription')}
          action={
            <Button icon={<PlusIcon />} onClick={() => setShowCreateUserModal(true)}>
              {t('users.addUser')}
            </Button>
          }
        />
      ) : (
        <>
          <Table bordered>
            <TableHeader>
              <TableRow>
                <TableHead>{t('users.colUser')}</TableHead>
                <TableHead>{t('users.colStatus')}</TableHead>
                <TableHead>{t('users.colRoles')}</TableHead>
                <TableHead className="text-right">{t('users.colActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => {
                const isSelf = account.id === currentAdmin?.sub;
                return (
                  <TableRow key={account.id}>
                    <TableCell className="min-w-64 whitespace-normal">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{account.display_name || account.username}</span>
                        {isSelf ? <Tag color="primary">{t('nav.administrator')}</Tag> : null}
                      </div>
                      <Text size="xs" tone="muted" className="mt-1 font-mono">
                        {account.username} · {account.id}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Tag color={account.status === 'active' ? 'success' : 'error'}>
                        {account.status === 'active' ? t('users.statusActive') : t('users.statusSuspended')}
                      </Tag>
                    </TableCell>
                    <TableCell className="min-w-48 whitespace-normal">
                      <div className="flex flex-wrap gap-1.5">
                        {account.roles?.length ? (
                          account.roles.map((role) => (
                            <Tag
                              key={role.id}
                              color={role.name === 'admin' ? 'warning' : 'default'}
                              title={role.description}
                            >
                              {role.name}
                            </Tag>
                          ))
                        ) : (
                          <Text size="sm" tone="muted">
                            {t('users.noRolesAssigned')}
                          </Text>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-max flex-nowrap items-center justify-end gap-1">
                        <IconButton
                          label={t('users.manageRoles')}
                          variant="ghost"
                          icon={<RoleIcon />}
                          onClick={() => handleOpenRoleModal(account)}
                        />
                        <IconButton
                          label={t('users.changePassword')}
                          variant="ghost"
                          icon={<KeyIcon />}
                          onClick={() => handleOpenPasswordModal(account)}
                          disabled={isSelf}
                        />
                        <IconButton
                          label={account.status === 'active' ? t('users.suspendUser') : t('users.activateUser')}
                          variant="ghost"
                          color={account.status === 'active' ? 'error' : 'primary'}
                          icon={account.status === 'active' ? <LockIcon /> : <UnlockIcon />}
                          onClick={() => setPendingAction({ type: 'status', account })}
                          disabled={isSelf}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <IconButton label={t('users.colActions')} variant="ghost" icon={<MoreHorizontal />} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => void handleOpenConsentModal(account)}>
                              <ConsentIcon />
                              {t('users.manageConsents')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={isSelf}
                              onSelect={() => setPendingAction({ type: 'unlock', account })}
                            >
                              <UnlockIcon />
                              {t('users.unlockAccount')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={isSelf}
                              onSelect={() => setPendingAction({ type: 'reset-mfa', account })}
                            >
                              <ResetMfaIcon />
                              {t('users.resetMfaButton')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={isSelf}
                              onSelect={() => setPendingAction({ type: 'delete', account })}
                            >
                              <TrashIcon />
                              {t('users.deleteUser')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            total={totalAccounts}
            pageSize={pageSize}
            onChange={(nextPage) => setPage(nextPage)}
            showTotal={(total) => t('users.paginationSummary', { page, total })}
            prevText={t('common.previous')}
            nextText={t('common.next')}
          />
        </>
      )}

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

      <Modal
        open={Boolean(pendingAction)}
        title={actionTitle}
        description={actionDescription}
        onOpenChange={(next) => {
          if (!next) setPendingAction(null);
        }}
        onOk={() => void confirmPendingAction()}
        okText={t('common.continue')}
        cancelText={t('common.cancel')}
        okButtonProps={{
          variant: 'solid',
          color: pendingAction?.type === 'unlock' ? 'primary' : 'error',
        }}
      />
    </div>
  );
}
