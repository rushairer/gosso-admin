import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus as PlusIcon,
  Trash2 as TrashIcon,
  Key as KeyIcon,
  User as UserIcon,
  Shield as ShieldIcon,
  X as XIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  CheckSquare as ConsentIcon,
} from 'lucide-react';
import { getUserProfile, apiFetch } from '../../auth';
import {
  ButtonGroup,
  ConfirmDialog,
  DataTable,
  EmptyState,
  Feedback,
  FormField,
  ListRow,
  ListStack,
  PanelHeader,
  StatusBadge,
  Tag,
  useToast,
} from '../../components/ui';
import { logger } from '../../utils/logger';

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface Account {
  id: string;
  username: string;
  display_name: string;
  status: string;
  created_at?: string;
  roles?: Role[];
  locked_out?: boolean;
  lockout_attempts?: number;
}

interface Consent {
  client_id: string;
  scopes?: string[];
  granted_at?: string;
}

export default function UsersTab() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [discoveredRoles, setDiscoveredRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  const currentAdmin = getUserProfile();

  // Create User Modal
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    username: '',
    display_name: '',
    email: '',
    phone: '',
    password: '',
    locale: 'en',
    timezone: 'UTC',
  });
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserSuccess, setCreateUserSuccess] = useState<string | null>(null);

  // Role Modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [newRoleInput, setNewRoleInput] = useState('');

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Consent Modal
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentsList, setConsentsList] = useState<Consent[]>([]);
  const [consentsLoading, setConsentsLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch('/api/v1/admin/accounts?page_size=100');
      if (!response.ok) throw new Error('Failed to load accounts');
      const body = await response.json();
      const fetchedAccounts: Account[] = body.data?.items || [];

      const accountsWithRolesAndLockout = await Promise.all(
        fetchedAccounts.map(async (acc) => {
          let roles: Role[] = [];
          let lockedOut = false;
          let lockoutAttempts = 0;

          try {
            const rolesRes = await apiFetch(`/api/v1/admin/accounts/${acc.id}/roles`);
            if (rolesRes.ok) {
              const rolesBody = await rolesRes.json();
              roles = rolesBody.data || [];
            }
          } catch (e) {
            logger.error(`Failed to fetch roles for user ${acc.username}`, e);
          }

          try {
            const lockoutRes = await apiFetch(`/api/v1/admin/accounts/${acc.id}/lockout`);
            if (lockoutRes.ok) {
              const lockoutBody = await lockoutRes.json();
              lockedOut = lockoutBody.data?.locked_out || false;
              const counters = lockoutBody.data?.counters || [];
              if (counters.length > 0) {
                lockoutAttempts = Math.max(...counters.map((c: { attempts?: number }) => c.attempts || 0));
              }
            }
          } catch (e) {
            logger.error(`Failed to fetch lockout status for user ${acc.username}`, e);
          }

          return { ...acc, roles, locked_out: lockedOut, lockout_attempts: lockoutAttempts };
        })
      );

      setAccounts(accountsWithRolesAndLockout);

      const roleBank: { [id: string]: Role } = {};
      accountsWithRolesAndLockout.forEach((acc) => {
        acc.roles?.forEach((role) => {
          roleBank[role.id] = role;
        });
      });
      setDiscoveredRoles(Object.values(roleBank));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error loading user accounts';
      logger.error('Failed to load accounts', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // --- Create User ---
  const handleOpenCreateUserModal = () => {
    setCreateUserForm({ username: '', display_name: '', email: '', phone: '', password: '', locale: 'en', timezone: 'UTC' });
    setCreateUserError(null);
    setCreateUserSuccess(null);
    setShowCreateUserModal(true);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUserForm.username || !createUserForm.display_name || !createUserForm.password) {
      setCreateUserError(t('users.createUserValidation'));
      return;
    }
    if (!createUserForm.email && !createUserForm.phone) {
      setCreateUserError(t('users.emailOrPhoneRequired'));
      return;
    }
    if (createUserForm.password.length < 12) {
      setCreateUserError(t('users.passwordTooShort'));
      return;
    }

    try {
      const response = await apiFetch('/api/v1/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: createUserForm.username.trim(),
          display_name: createUserForm.display_name.trim(),
          email: createUserForm.email.trim() || undefined,
          phone: createUserForm.phone.trim() || undefined,
          password: createUserForm.password,
          locale: createUserForm.locale.trim() || undefined,
          timezone: createUserForm.timezone.trim() || undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to create user');

      setCreateUserSuccess(t('users.userCreatedSuccess'));
      setCreateUserError(null);
      await fetchAccounts();
      setTimeout(() => setShowCreateUserModal(false), 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creating user';
      setCreateUserError(message);
      setCreateUserSuccess(null);
    }
  };

  // --- Toggle User Status ---
  const handleToggleUserStatus = async (account: Account) => {
    if (account.id === currentAdmin?.sub) {
      showError(t('users.cannotToggleOwnAccount'));
      return;
    }

    const action = account.status === 'active' ? 'disable' : 'enable';
    const confirmed = await new Promise<boolean>((resolve) => {
      setConfirmState({
        title: action === 'disable' ? t('users.suspendUser') : t('users.activateUser'),
        message: `Are you sure you want to ${action} user "${account.username}"?`,
        onConfirm: () => { setConfirmState(null); resolve(true); },
        onCancel: () => { setConfirmState(null); resolve(false); },
      });
    });
    if (!confirmed) return;

    try {
      const response = await apiFetch(`/api/v1/admin/accounts/${account.id}/${action}`, { method: 'POST' });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || `Failed to ${action} user`);
      }
      fetchAccounts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error updating user status';
      showError(message);
    }
  };

  // --- Delete User ---
  const handleDeleteUser = async (userId: string) => {
    if (userId === currentAdmin?.sub) {
      showError(t('users.cannotDeleteOwnAccount'));
      return;
    }
    const confirmed = await new Promise<boolean>((resolve) => {
      setConfirmState({
        title: t('users.deleteUserConfirmTitle'),
        message: t('users.deleteUserConfirmMessage'),
        onConfirm: () => { setConfirmState(null); resolve(true); },
        onCancel: () => { setConfirmState(null); resolve(false); },
      });
    });
    if (!confirmed) return;
    try {
      const response = await apiFetch(`/api/v1/admin/accounts/${userId}`, { method: 'DELETE' });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Failed to delete user');
      }
      fetchAccounts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error deleting user';
      showError(message);
    }
  };

  // --- Password ---
  const handleOpenPasswordModal = (account: Account) => {
    setSelectedAccount(account);
    setNewPassword('');
    setPasswordError(null);
    setPasswordSuccess(null);
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !newPassword) return;
    if (newPassword.length < 12) {
      setPasswordError(t('users.passwordTooShort'));
      return;
    }

    try {
      const response = await apiFetch(`/api/v1/admin/accounts/${selectedAccount.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to change password');

      setPasswordSuccess(t('users.passwordUpdatedSuccess'));
      setPasswordError(null);
      setNewPassword('');
      setTimeout(() => setShowPasswordModal(false), 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error updating password';
      setPasswordError(message);
      setPasswordSuccess(null);
    }
  };

  // --- MFA Reset ---
  const handleResetUserMFA = async (account: Account) => {
    if (account.id === currentAdmin?.sub) {
      showError(t('users.cannotResetOwnMfa'));
      return;
    }
    const confirmed = await new Promise<boolean>((resolve) => {
      setConfirmState({
        title: t('users.resetMfaButton'),
        message: t('users.resetMfaConfirmMessage', { username: account.username }),
        onConfirm: () => { setConfirmState(null); resolve(true); },
        onCancel: () => { setConfirmState(null); resolve(false); },
      });
    });
    if (!confirmed) return;

    try {
      const response = await apiFetch(`/api/v1/admin/accounts/${account.id}/mfa/reset`, { method: 'POST' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to reset MFA');
      showSuccess(t('users.mfaResetSuccess', { username: account.username }));
      fetchAccounts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error resetting MFA';
      showError(message);
    }
  };

  // --- Roles ---
  const handleOpenRoleModal = (account: Account) => {
    setSelectedAccount(account);
    setNewRoleInput('');
    setShowRoleModal(true);
  };

  const handleAddRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !newRoleInput) return;

    try {
      const response = await apiFetch(`/api/v1/admin/accounts/${selectedAccount.id}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: newRoleInput }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to assign role');

      const rolesRes = await apiFetch(`/api/v1/admin/accounts/${selectedAccount.id}/roles`);
      if (rolesRes.ok) {
        const rolesBody = await rolesRes.json();
        const updatedRoles = rolesBody.data || [];
        setAccounts((prev) => prev.map((a) => (a.id === selectedAccount.id ? { ...a, roles: updatedRoles } : a)));
        setSelectedAccount((prev) => (prev ? { ...prev, roles: updatedRoles } : null));
      }
      setNewRoleInput('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error assigning role';
      showError(message);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!selectedAccount) return;
    if (selectedAccount.id === currentAdmin?.sub) {
      showError(t('users.cannotRemoveOwnRoles'));
      return;
    }
    const confirmed = await new Promise<boolean>((resolve) => {
      setConfirmState({
        title: 'Remove Role',
        message: t('users.removeRoleConfirmMessage'),
        onConfirm: () => { setConfirmState(null); resolve(true); },
        onCancel: () => { setConfirmState(null); resolve(false); },
      });
    });
    if (!confirmed) return;

    try {
      const response = await apiFetch(`/api/v1/admin/accounts/${selectedAccount.id}/roles/${roleId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Failed to remove role');
      }

      const rolesRes = await apiFetch(`/api/v1/admin/accounts/${selectedAccount.id}/roles`);
      if (rolesRes.ok) {
        const rolesBody = await rolesRes.json();
        const updatedRoles = rolesBody.data || [];
        setAccounts((prev) => prev.map((a) => (a.id === selectedAccount.id ? { ...a, roles: updatedRoles } : a)));
        setSelectedAccount((prev) => (prev ? { ...prev, roles: updatedRoles } : null));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error removing role';
      showError(message);
    }
  };

  // --- Lockout ---
  const handleClearLockout = async (accountID: string) => {
    if (accountID === currentAdmin?.sub) {
      showError(t('users.cannotClearOwnLockout'));
      return;
    }
    const confirmed = await new Promise<boolean>((resolve) => {
      setConfirmState({
        title: 'Clear Lockout',
        message: t('users.clearLockoutConfirmMessage'),
        onConfirm: () => { setConfirmState(null); resolve(true); },
        onCancel: () => { setConfirmState(null); resolve(false); },
      });
    });
    if (!confirmed) return;

    try {
      const response = await apiFetch(`/api/v1/admin/accounts/${accountID}/lockout/clear`, { method: 'POST' });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Failed to clear lockout');
      }
      showSuccess(t('users.lockoutClearedSuccess'));
      await fetchAccounts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error clearing lockout';
      showError(message);
    }
  };

  // --- Consents ---
  const handleOpenConsentModal = async (account: Account) => {
    setSelectedAccount(account);
    setConsentsList([]);
    setShowConsentModal(true);
    setConsentsLoading(true);

    try {
      const response = await apiFetch(`/api/v1/admin/accounts/${account.id}/consents`);
      if (response.ok) {
        const body = await response.json();
        setConsentsList(body.data || []);
      } else {
        const body = await response.json();
        throw new Error(body.message || 'Failed to load user consents');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error loading consents';
      logger.error('Failed to load consents', err);
      showError(message);
    } finally {
      setConsentsLoading(false);
    }
  };

  const handleRevokeConsent = async (clientID: string) => {
    if (!selectedAccount) return;
    if (selectedAccount.id === currentAdmin?.sub) {
      showError(t('users.cannotRevokeOwnConsent'));
      return;
    }
    const confirmed = await new Promise<boolean>((resolve) => {
      setConfirmState({
        title: 'Revoke Consent',
        message: t('users.revokeConsentConfirmMessage'),
        onConfirm: () => { setConfirmState(null); resolve(true); },
        onCancel: () => { setConfirmState(null); resolve(false); },
      });
    });
    if (!confirmed) return;

    try {
      const response = await apiFetch(`/api/v1/admin/accounts/${selectedAccount.id}/consents/${clientID}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Failed to revoke consent');
      }
      showSuccess(t('users.consentRevokedSuccess'));
      const consentsRes = await apiFetch(`/api/v1/admin/accounts/${selectedAccount.id}/consents`);
      if (consentsRes.ok) {
        const consentsBody = await consentsRes.json();
        setConsentsList(consentsBody.data || []);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error revoking consent';
      showError(message);
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
      <div>
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
          <button className="btn btn-primary content-action" onClick={handleOpenCreateUserModal}>
            <PlusIcon />
            {t('users.addUser')}
          </button>
        }
      />
      {accounts.length === 0 ? (
        <EmptyState
          icon={<UserIcon />}
          title={t('users.noUsersTitle')}
          description={t('users.noUsersDescription')}
        />
      ) : (
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
                    {acc.locked_out && (
                      <div className="flex-row items-center gap-xs">
                        <StatusBadge tone="warning">{t('users.statusLocked', { attempts: acc.lockout_attempts })}</StatusBadge>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 6px', fontSize: '11px', height: '20px' }}
                          onClick={() => handleClearLockout(acc.id)}
                          title={t('users.unlockAccount')}
                        >
                          <UnlockIcon style={{ width: '10px', height: '10px', stroke: 'var(--warning-color)' }} />
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex-row flex-wrap gap-xs">
                    {acc.roles && acc.roles.length > 0 ? (
                      acc.roles.map((role) => (
                        <Tag key={role.id} title={role.description}>
                          <ShieldIcon style={{ width: '10px', height: '10px', marginRight: '4px', display: 'inline' }} />
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
                      className={`btn btn-secondary btn-sm`}
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
      )}

      {/* User Create Modal */}
      {showCreateUserModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{t('users.createModalTitle')}</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateUserModal(false)}>
                <XIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <form onSubmit={handleCreateUserSubmit}>
              <div className="modal-body">
                <p className="mb-md text-dark" style={{ fontSize: '14px' }}>
                  {t('users.createModalDescription')}
                </p>

                {createUserError && (
                  <div className="mb-md">
                    <Feedback type="error">{createUserError}</Feedback>
                  </div>
                )}
                {createUserSuccess && (
                  <div className="mb-md">
                    <Feedback type="success">{createUserSuccess}</Feedback>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <FormField label={t('users.usernameLabel')}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder={t('users.usernamePlaceholder')}
                      value={createUserForm.username}
                      onChange={(e) => setCreateUserForm((p) => ({ ...p, username: e.target.value }))}
                      required
                      disabled={!!createUserSuccess}
                      autoFocus
                    />
                  </FormField>
                  <FormField label={t('users.displayNameLabel')}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder={t('users.displayNamePlaceholder')}
                      value={createUserForm.display_name}
                      onChange={(e) => setCreateUserForm((p) => ({ ...p, display_name: e.target.value }))}
                      required
                      disabled={!!createUserSuccess}
                    />
                  </FormField>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <FormField label={t('users.emailLabel')}>
                    <input
                      type="email"
                      className="input-field"
                      placeholder={t('users.emailPlaceholder')}
                      value={createUserForm.email}
                      onChange={(e) => setCreateUserForm((p) => ({ ...p, email: e.target.value }))}
                      disabled={!!createUserSuccess}
                    />
                  </FormField>
                  <FormField label={t('users.phoneLabel')}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder={t('users.phonePlaceholder')}
                      value={createUserForm.phone}
                      onChange={(e) => setCreateUserForm((p) => ({ ...p, phone: e.target.value }))}
                      disabled={!!createUserSuccess}
                    />
                  </FormField>
                </div>
                <div className="form-hint mb-md" style={{ marginTop: '-10px' }}>
                  {t('users.contactHint')}
                </div>

                <FormField label={t('users.initialPasswordLabel')}>
                  <input
                    type="password"
                    className="input-field"
                    placeholder={t('users.initialPasswordPlaceholder')}
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm((p) => ({ ...p, password: e.target.value }))}
                    required
                    disabled={!!createUserSuccess}
                  />
                </FormField>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <FormField label={t('users.localeLabel')} noMargin>
                    <input
                      type="text"
                      className="input-field"
                      value={createUserForm.locale}
                      onChange={(e) => setCreateUserForm((p) => ({ ...p, locale: e.target.value }))}
                      disabled={!!createUserSuccess}
                    />
                  </FormField>
                  <FormField label={t('users.timezoneLabel')} noMargin>
                    <input
                      type="text"
                      className="input-field"
                      value={createUserForm.timezone}
                      onChange={(e) => setCreateUserForm((p) => ({ ...p, timezone: e.target.value }))}
                      disabled={!!createUserSuccess}
                    />
                  </FormField>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateUserModal(false)}
                  disabled={!!createUserSuccess}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={!!createUserSuccess}>
                  {t('users.createUserButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Manage Roles Modal */}
      {showRoleModal && selectedAccount && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{t('users.rolesModalTitle', { name: selectedAccount.display_name || selectedAccount.username })}</h3>
              <button className="modal-close-btn" onClick={() => setShowRoleModal(false)}>
                <XIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <div className="modal-body">
              <div className="plain-section-title">{t('users.activeRolesSection')}</div>
              <div style={{ margin: '8px 0 24px 0' }}>
                {selectedAccount.roles && selectedAccount.roles.length > 0 ? (
                  <ListStack>
                    {selectedAccount.roles.map((role) => (
                      <ListRow
                        key={role.id}
                        icon={<ShieldIcon style={{ width: '16px', height: '16px' }} />}
                        title={role.name}
                        meta={role.description}
                        action={
                          <button
                            className="btn btn-danger btn-sm"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              opacity: selectedAccount.id === currentAdmin?.sub ? 0.4 : 1,
                            }}
                            onClick={() => handleRemoveRole(role.id)}
                            disabled={selectedAccount.id === currentAdmin?.sub}
                          >
                            {t('common.remove')}
                          </button>
                        }
                      />
                    ))}
                  </ListStack>
                ) : (
                  <EmptyState title={t('users.noRolesAssigned')} description={t('users.noRolesAssignedDescription')} />
                )}
              </div>

              {selectedAccount.id !== currentAdmin?.sub && (
                <form
                  onSubmit={handleAddRoleSubmit}
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}
                >
                  <FormField label={t('users.assignNewRoleLabel')} noMargin>
                    <ButtonGroup>
                      <div className="flex-1">
                        {discoveredRoles.length > 0 ? (
                          <select
                            className="input-field"
                            value={newRoleInput}
                            onChange={(e) => setNewRoleInput(e.target.value)}
                          >
                            <option value="">{t('users.selectDiscoveredRole')}</option>
                            {discoveredRoles
                              .filter((role) => !selectedAccount.roles?.some((ur) => ur.id === role.id))
                              .map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.name} ({role.id.substring(0, 8)})
                                </option>
                              ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="input-field"
                            placeholder={t('users.enterRoleUuid')}
                            value={newRoleInput}
                            onChange={(e) => setNewRoleInput(e.target.value)}
                          />
                        )}
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={!newRoleInput}>
                        {t('common.assign')}
                      </button>
                    </ButtonGroup>
                    <div className="form-hint">
                      {t('users.assignRoleHint')}
                    </div>
                  </FormField>
                </form>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Change Password Modal */}
      {showPasswordModal && selectedAccount && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{t('users.changePasswordModalTitle')}</h3>
              <button className="modal-close-btn" onClick={() => setShowPasswordModal(false)}>
                <XIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="modal-body">
                <p className="mb-md text-dark" style={{ fontSize: '14px' }}>
                  {t('users.changePasswordDescription', { name: selectedAccount.display_name || selectedAccount.username })}
                </p>

                {passwordError && (
                  <div className="mb-md">
                    <Feedback type="error">{passwordError}</Feedback>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="mb-md">
                    <Feedback type="success">{passwordSuccess}</Feedback>
                  </div>
                )}

                <FormField label={t('users.newPasswordLabel')} noMargin>
                  <input
                    type="password"
                    className="input-field"
                    placeholder={t('users.newPasswordPlaceholder')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={!!passwordSuccess}
                    autoFocus
                  />
                </FormField>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={!!passwordSuccess}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={!newPassword || !!passwordSuccess}>
                  {t('users.updatePasswordButton')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Consents Modal */}
      {showConsentModal && selectedAccount && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {t('users.consentsModalTitle', { name: selectedAccount.display_name || selectedAccount.username })}
              </h3>
              <button className="modal-close-btn" onClick={() => setShowConsentModal(false)}>
                <XIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <div className="modal-body">
              <p className="mb-md text-dark" style={{ fontSize: '14px' }}>
                {t('users.consentsDescription')}
              </p>

              {consentsLoading ? (
                <div className="text-center" style={{ padding: '30px 0' }}>
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
                    {t('users.loadingConsents')}
                  </p>
                </div>
              ) : consentsList.length === 0 ? (
                <EmptyState
                  title={t('users.noConsentsTitle')}
                  description={t('users.noConsentsDescription')}
                />
              ) : (
                <ListStack>
                  {consentsList.map((consent) => (
                    <ListRow
                      key={consent.client_id}
                      action={
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '6px 12px', opacity: selectedAccount.id === currentAdmin?.sub ? 0.4 : 1 }}
                          onClick={() => handleRevokeConsent(consent.client_id)}
                          disabled={selectedAccount.id === currentAdmin?.sub}
                        >
                          {t('users.revokeAccess')}
                        </button>
                      }
                    >
                      <div className="flex-1" style={{ marginRight: '16px' }}>
                        <div className="flex-row items-center gap-sm">
                          <span className="list-icon">
                            <ConsentIcon style={{ width: '16px', height: '16px' }} />
                          </span>
                          <div className="list-title">Client ID: {consent.client_id}</div>
                        </div>
                        <div className="flex-row flex-wrap gap-xs mt-sm">
                          {consent.scopes?.map((scope: string) => (
                            <Tag key={scope} tone="secondary">
                              {scope}
                            </Tag>
                          ))}
                        </div>
                        <div className="text-xs text-dark mt-sm">
                          {t('users.authorizedAt')} {consent.granted_at ? new Date(consent.granted_at).toLocaleString() : '-'}
                        </div>
                      </div>
                    </ListRow>
                  ))}
                </ListStack>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConsentModal(false)}>
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

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
