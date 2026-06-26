import { useEffect, useState } from 'react';
import { Plus as PlusIcon, Edit2 as EditIcon, Trash2 as TrashIcon, Key as KeyIcon, User as UserIcon, Shield as ShieldIcon, X as XIcon, Copy as CopyIcon, Check as CheckIcon, Info as InfoIcon, Lock as LockIcon, Unlock as UnlockIcon, FileText as AuditIcon, CheckSquare as ConsentIcon, RefreshCw } from 'lucide-react';
import { isLoggedIn, isAdmin, redirectToAuthorize, getUserProfile, apiFetch } from '../auth';

interface OAuth2Client {
  client_id: string;
  name: string;
  description: string;
  redirect_uris: string[];
  post_logout_redirect_uris?: string[];
  grant_types: string[];
  scopes: string[];
  is_confidential: boolean;
}

interface Account {
  id: string;
  username: string;
  display_name: string;
  status: string; // active, suspended, deleted
  created_at?: string;
  roles?: Role[];
  locked_out?: boolean;
  lockout_attempts?: number;
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

type DependencyStatus = 'ok' | 'unavailable' | 'error' | 'unknown';

interface SystemHealth {
  status: string;
  ready: boolean;
  checks: {
    database?: DependencyStatus;
    redis?: DependencyStatus;
  };
  checked_at?: string;
  duration_ms?: number;
  http_status?: number;
  fetched_at?: string;
  fetch_error?: string;
}

export default function Admin() {

  const [activeTab, setActiveTab] = useState<'clients' | 'users' | 'audit-logs' | 'system'>('clients');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  
  // Data State
  const [clients, setClients] = useState<OAuth2Client[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [discoveredRoles, setDiscoveredRoles] = useState<Role[]>([]); // Dynamic role bank

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [filterEventType, setFilterEventType] = useState('');
  const [filterAccountID, setFilterAccountID] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);

  // Consents State
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentsList, setConsentsList] = useState<any[]>([]);
  const [consentsLoading, setConsentsLoading] = useState(false);

  // System Health & OIDC discovery states
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [oidcConfig, setOidcConfig] = useState<any>(null);
  
  
  // Modal / Form State
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<OAuth2Client | null>(null);
  const [clientForm, setClientForm] = useState({
    name: '',
    description: '',
    redirect_uris: '',
    post_logout_redirect_uris: '',
    is_confidential: false,
    grant_types: ['authorization_code'],
    scopes: ['openid', 'profile', 'email']
  });
  
  // Client Secret Modal State (New Client registration success)
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [newClientDetails, setNewClientDetails] = useState<{ client_id: string; client_secret?: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Role Dialog State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [newRoleInput, setNewRoleInput] = useState('');

  // User Create Dialog State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    username: '',
    display_name: '',
    email: '',
    phone: '',
    password: '',
    locale: 'en',
    timezone: 'UTC'
  });
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserSuccess, setCreateUserSuccess] = useState<string | null>(null);

  // Password Dialog State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const currentAdmin = getUserProfile();

  useEffect(() => {
    if (!isLoggedIn()) {
      redirectToAuthorize('/admin');
      return;
    }

    if (!isAdmin()) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }
    
    setAccessDenied(false);
    loadDashboardData();
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'clients') {
        await fetchClients();
      } else if (activeTab === 'audit-logs') {
        await fetchAuditLogs(1);
      } else if (activeTab === 'system') {
        await fetchSystemStatus();
      } else {
        await fetchAccounts();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const readRes = await apiFetch('/readiness');
      const contentType = readRes.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await readRes.text();
        throw new Error(`Readiness returned ${readRes.status} ${contentType || 'unknown content-type'}: ${text.slice(0, 120)}`);
      }
      const readBody = await readRes.json() as SystemHealth;
      setSystemHealth({
        ...readBody,
        http_status: readBody.http_status ?? readRes.status,
        fetched_at: new Date().toISOString(),
      });
    } catch (e: any) {
      console.error('Error fetching readiness health status', e);
      setSystemHealth({
        status: 'unavailable',
        ready: false,
        checks: { database: 'error', redis: 'error' },
        http_status: 0,
        fetched_at: new Date().toISOString(),
        fetch_error: e?.message || 'Failed to reach readiness endpoint',
      });
    }

    try {
      const oidcRes = await apiFetch('/.well-known/openid-configuration');
      const oidcBody = await oidcRes.json();
      setOidcConfig(oidcBody);
    } catch (e) {
      console.error('Error fetching OIDC configuration metadata', e);
    }
  };

  const dependencyLabel = (status?: DependencyStatus) => {
    if (status === 'ok') return 'HEALTHY';
    if (status === 'unavailable') return 'UNAVAILABLE';
    if (status === 'error') return 'CHECK FAILED';
    return 'UNKNOWN';
  };

  const dependencyIsHealthy = (status?: DependencyStatus) => status === 'ok';

  const formatHealthTimestamp = (value?: string) => {
    if (!value) return 'Not checked yet';
    return new Date(value).toLocaleString();
  };

  const fetchClients = async () => {
    const response = await apiFetch('/api/v1/oauth2/clients');
    if (!response.ok) throw new Error('Failed to load OAuth2 clients');
    const body = await response.json();
    setClients(body.data || []);
  };

  const fetchAccounts = async () => {
    const response = await apiFetch('/api/v1/admin/accounts?page_size=100');
    if (!response.ok) throw new Error('Failed to load accounts');
    const body = await response.json();
    const fetchedAccounts: Account[] = body.data?.items || [];
    
    // Fetch roles and lockout status for each account
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
          console.error(`Failed to fetch roles for user ${acc.username}`, e);
        }

        try {
          const lockoutRes = await apiFetch(`/api/v1/admin/accounts/${acc.id}/lockout`);
          if (lockoutRes.ok) {
            const lockoutBody = await lockoutRes.json();
            lockedOut = lockoutBody.data?.locked_out || false;
            const counters = lockoutBody.data?.counters || [];
            if (counters.length > 0) {
              lockoutAttempts = Math.max(...counters.map((c: any) => c.attempts || 0));
            }
          }
        } catch (e) {
          console.error(`Failed to fetch lockout status for user ${acc.username}`, e);
        }

        return { 
          ...acc, 
          roles, 
          locked_out: lockedOut, 
          lockout_attempts: lockoutAttempts 
        };
      })
    );

    setAccounts(accountsWithRolesAndLockout);
    
    // Extract distinct roles for role dropdown choices
    const roleBank: { [id: string]: Role } = {};
    accountsWithRolesAndLockout.forEach(acc => {
      acc.roles?.forEach((role: Role) => {
        roleBank[role.id] = role;
      });
    });
    setDiscoveredRoles(Object.values(roleBank));
  };

  // Client Management Handlers
  const handleOpenClientModal = (client: OAuth2Client | null = null) => {
    if (client) {
      setEditingClient(client);
      setClientForm({
        name: client.name,
        description: client.description,
        redirect_uris: client.redirect_uris.join(', '),
        post_logout_redirect_uris: client.post_logout_redirect_uris?.join(', ') || '',
        is_confidential: client.is_confidential,
        grant_types: client.grant_types,
        scopes: client.scopes
      });
    } else {
      setEditingClient(null);
      setClientForm({
        name: '',
        description: '',
        redirect_uris: '',
        post_logout_redirect_uris: '',
        is_confidential: false,
        grant_types: ['authorization_code'],
        scopes: ['openid', 'profile', 'email']
      });
    }
    setShowClientModal(true);
  };

  const handleClientFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.redirect_uris) {
      alert('Name and Redirect URIs are required.');
      return;
    }

    const payload = {
      name: clientForm.name,
      description: clientForm.description,
      redirect_uris: clientForm.redirect_uris.split(',').map(u => u.trim()).filter(Boolean),
      post_logout_redirect_uris: clientForm.post_logout_redirect_uris ? clientForm.post_logout_redirect_uris.split(',').map(u => u.trim()).filter(Boolean) : [],
      grant_types: clientForm.grant_types,
      scopes: clientForm.scopes,
      is_confidential: clientForm.is_confidential
    };

    try {
      if (editingClient) {
        // Edit Client
        const response = await apiFetch(`/api/v1/oauth2/clients/${editingClient.client_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const errBody = await response.json();
          throw new Error(errBody.message || 'Failed to update client');
        }
        setShowClientModal(false);
        fetchClients();
      } else {
        // Register New Client
        const response = await apiFetch('/api/v1/oauth2/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.message || 'Failed to register client');
        }
        
        setShowClientModal(false);
        
        // If client is confidential, show the generated secret
        if (clientForm.is_confidential && body.data?.client_secret) {
          setNewClientDetails(body.data);
          setShowSecretModal(true);
        } else {
          alert('OAuth2 Client registered successfully!');
        }
        fetchClients();
      }
    } catch (err: any) {
      alert(err.message || 'Error processing client save');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this OAuth2 client? This action is permanent.')) return;
    try {
      const response = await apiFetch(`/api/v1/oauth2/clients/${clientId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete client');
      fetchClients();
    } catch (err: any) {
      alert(err.message || 'Error deleting client');
    }
  };

  // User Management Handlers
  const handleOpenCreateUserModal = () => {
    setCreateUserForm({
      username: '',
      display_name: '',
      email: '',
      phone: '',
      password: '',
      locale: 'en',
      timezone: 'UTC'
    });
    setCreateUserError(null);
    setCreateUserSuccess(null);
    setShowCreateUserModal(true);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUserForm.username || !createUserForm.display_name || !createUserForm.password) {
      setCreateUserError('Username, display name, and password are required.');
      return;
    }
    if (!createUserForm.email && !createUserForm.phone) {
      setCreateUserError('Email or phone is required.');
      return;
    }
    if (createUserForm.password.length < 12) {
      setCreateUserError('Password must be at least 12 characters long.');
      return;
    }

    try {
      const response = await apiFetch('/api/v1/admin/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: createUserForm.username.trim(),
          display_name: createUserForm.display_name.trim(),
          email: createUserForm.email.trim() || undefined,
          phone: createUserForm.phone.trim() || undefined,
          password: createUserForm.password,
          locale: createUserForm.locale.trim() || undefined,
          timezone: createUserForm.timezone.trim() || undefined
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || 'Failed to create user');
      }

      setCreateUserSuccess('User account created successfully.');
      setCreateUserError(null);
      await fetchAccounts();
      setTimeout(() => {
        setShowCreateUserModal(false);
      }, 1200);
    } catch (err: any) {
      setCreateUserError(err.message || 'Error creating user');
      setCreateUserSuccess(null);
    }
  };

  const handleToggleUserStatus = async (account: Account) => {
    if (account.id === currentAdmin?.sub) {
      alert('You cannot enable/disable your own admin account.');
      return;
    }
    
    const action = account.status === 'active' ? 'disable' : 'enable';
    if (!confirm(`Are you sure you want to ${action} user "${account.username}"?`)) return;
    
    try {
      const response = await apiFetch(`/api/v1/admin/accounts/${account.id}/${action}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || `Failed to ${action} user`);
      }
      
      fetchAccounts();
    } catch (err: any) {
      alert(err.message || 'Error updating user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentAdmin?.sub) {
      alert('You cannot delete your own admin account.');
      return;
    }
    if (!confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      const response = await apiFetch(`/api/v1/admin/accounts/${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Failed to delete user');
      }
      fetchAccounts();
    } catch (err: any) {
      alert(err.message || 'Error deleting user');
    }
  };

  // Password Management Handlers
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
      setPasswordError('Password must be at least 12 characters long.');
      return;
    }

    try {
      const response = await apiFetch(`/api/v1/admin/accounts/${selectedAccount.id}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ new_password: newPassword })
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || 'Failed to change password');
      }

      setPasswordSuccess('Password updated successfully. All user sessions have been revoked.');
      setPasswordError(null);
      setNewPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
      }, 2500);
    } catch (err: any) {
      setPasswordError(err.message || 'Error updating password');
      setPasswordSuccess(null);
    }
  };

  const handleResetUserMFA = async (account: Account) => {
    if (account.id === currentAdmin?.sub) {
      alert('You cannot reset MFA on your own admin account. Please use Security Settings page instead.');
      return;
    }

    if (!window.confirm(`Are you sure you want to reset MFA for user "${account.username}"? This will disable TOTP, Backup Codes, and WebAuthn Passkeys for their account.`)) {
      return;
    }

    try {
      const response = await apiFetch(`/api/v1/admin/accounts/${account.id}/mfa/reset`, {
        method: 'POST'
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || 'Failed to reset MFA');
      }
      alert(`MFA successfully reset for user "${account.username}".`);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Error resetting MFA');
    }
  };

  // Role Management Handlers
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role_id: newRoleInput })
      });
      
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || 'Failed to assign role');
      }
      
      // Reload roles for selected user
      const rolesRes = await apiFetch(`/api/v1/admin/accounts/${selectedAccount.id}/roles`);
      if (rolesRes.ok) {
        const rolesBody = await rolesRes.json();
        const updatedRoles = rolesBody.data || [];
        
        // Update local state
        setAccounts(prev => prev.map(a => a.id === selectedAccount.id ? { ...a, roles: updatedRoles } : a));
        setSelectedAccount(prev => prev ? { ...prev, roles: updatedRoles } : null);
      }
      setNewRoleInput('');
    } catch (err: any) {
      alert(err.message || 'Error assigning role');
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!selectedAccount) return;
    if (selectedAccount.id === currentAdmin?.sub) {
      alert('You cannot remove roles from your own admin account.');
      return;
    }
    if (!confirm('Are you sure you want to remove this role from the user?')) return;
    
    try {
      const response = await apiFetch(`/api/v1/admin/accounts/${selectedAccount.id}/roles/${roleId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Failed to remove role');
      }
      
      // Reload roles
      const rolesRes = await apiFetch(`/api/v1/admin/accounts/${selectedAccount.id}/roles`);
      if (rolesRes.ok) {
        const rolesBody = await rolesRes.json();
        const updatedRoles = rolesBody.data || [];
        
        setAccounts(prev => prev.map(a => a.id === selectedAccount.id ? { ...a, roles: updatedRoles } : a));
        setSelectedAccount(prev => prev ? { ...prev, roles: updatedRoles } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Error removing role');
    }
  };

  // Audit Logs Handlers
  const fetchAuditLogs = async (page: number) => {
    try {
      setAuditLoading(true);
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
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error loading audit logs');
    } finally {
      setAuditLoading(false);
    }
  };

  // Lockout Management Handlers
  const handleClearLockout = async (accountID: string) => {
    if (accountID === currentAdmin?.sub) {
      alert('You cannot clear lockout on your own admin account.');
      return;
    }
    if (!confirm('Are you sure you want to clear the lockout for this account?')) return;
    
    try {
      const response = await apiFetch(`/api/v1/admin/accounts/${accountID}/lockout/clear`, {
        method: 'POST'
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Failed to clear lockout');
      }
      
      alert('Lockout successfully cleared.');
      await fetchAccounts();
    } catch (err: any) {
      alert(err.message || 'Error clearing lockout');
    }
  };

  // User Consents Handlers
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
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error loading consents');
    } finally {
      setConsentsLoading(false);
    }
  };

  const handleRevokeConsent = async (clientID: string) => {
    if (!selectedAccount) return;
    if (selectedAccount.id === currentAdmin?.sub) {
      alert('You cannot revoke consents for your own admin account.');
      return;
    }
    if (!confirm('Are you sure you want to revoke authorization for this application?')) return;
    
    try {
      const response = await apiFetch(`/api/v1/admin/accounts/${selectedAccount.id}/consents/${clientID}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Failed to revoke consent');
      }
      
      alert('Consent successfully revoked.');
      const consentsRes = await apiFetch(`/api/v1/admin/accounts/${selectedAccount.id}/consents`);
      if (consentsRes.ok) {
        const consentsBody = await consentsRes.json();
        setConsentsList(consentsBody.data || []);
      }
    } catch (err: any) {
      alert(err.message || 'Error revoking consent');
    }
  };

  const copySecret = () => {
    if (!newClientDetails?.client_secret) return;
    navigator.clipboard.writeText(newClientDetails.client_secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckboxChange = (field: 'grant_types' | 'scopes', value: string) => {
    setClientForm(prev => {
      const list = prev[field];
      const newList = list.includes(value) ? list.filter(item => item !== value) : [...list, value];
      return { ...prev, [field]: newList };
    });
  };

  if (accessDenied) {
    return (
      <div className="glass-card" style={{ maxWidth: '560px', margin: '80px auto', textAlign: 'center', padding: '48px 32px', borderLeft: '4px solid var(--warning-color)' }}>
        <ShieldIcon style={{ width: '48px', height: '48px', color: 'var(--warning-color)', marginBottom: '20px', display: 'inline-block' }} />
        <h3 style={{ color: 'var(--color-text-main)', marginBottom: '12px', fontSize: '20px' }}>Access Denied</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
          Your account is signed in, but it does not have administrator permissions to access this console.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/'}>
            Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '28px', color: 'var(--color-text-main)' }}>GOSSO Administration Console</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '4px' }}>
            System configuration console. Manage authentication clients and system credentials.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {activeTab === 'clients' && (
            <button className="btn btn-primary" onClick={() => handleOpenClientModal(null)}>
              <PlusIcon style={{ width: '16px', height: '16px' }} />
              Register Client
            </button>
          )}
          {activeTab === 'users' && (
            <button className="btn btn-primary" onClick={handleOpenCreateUserModal}>
              <PlusIcon style={{ width: '16px', height: '16px' }} />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTab('clients')}>
          <KeyIcon style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline', verticalAlign: 'middle' }} />
          OAuth2 Clients
        </button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <UserIcon style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline', verticalAlign: 'middle' }} />
          User Accounts
        </button>
        <button className={`tab-btn ${activeTab === 'audit-logs' ? 'active' : ''}`} onClick={() => setActiveTab('audit-logs')}>
          <AuditIcon style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline', verticalAlign: 'middle' }} />
          Audit Logs
        </button>
        <button className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
          <ShieldIcon style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline', verticalAlign: 'middle' }} />
          System Status
        </button>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <div style={{ margin: '0 auto 16px auto', width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Loading console data...</p>
        </div>
      ) : error ? (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--danger-color)', padding: '20px' }}>
          <h3 style={{ color: 'var(--danger-color)', marginBottom: '8px' }}>Console Load Error</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>{error}</p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }} onClick={loadDashboardData}>Retry Load</button>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0 }}>
          
          {/* Tab Content: Clients */}
          {activeTab === 'clients' && (
            clients.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <KeyIcon style={{ width: '48px', height: '48px', color: 'var(--color-text-dark)', marginBottom: '16px' }} />
                <h3>No Clients Registered</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '6px' }}>
                  Begin by registering your first application client to integrate OIDC authentication.
                </p>
                <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => handleOpenClientModal(null)}>
                  Register Client
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name / ID</th>
                      <th>Type</th>
                      <th>Redirect URIs</th>
                      <th>Grant Types</th>
                      <th>Scopes</th>
                      <th style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(client => (
                      <tr key={client.client_id}>
                        <td>
                          <div style={{ fontWeight: '600' }}>{client.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-dark)', fontFamily: 'monospace' }}>{client.client_id}</div>
                          {client.description && (
                            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{client.description}</div>
                          )}
                        </td>
                        <td>
                          {client.is_confidential ? (
                            <span className="status-pill disabled" style={{ textTransform: 'uppercase', fontSize: '11px' }}>Confidential</span>
                          ) : (
                            <span className="status-pill active" style={{ textTransform: 'uppercase', fontSize: '11px' }}>Public</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '300px' }}>
                            {client.redirect_uris.map((uri, idx) => (
                              <span key={idx} style={{ fontSize: '13px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={uri}>
                                {uri}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {client.grant_types.map(g => (
                              <span key={g} className="badge badge-secondary" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                                {g.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {client.scopes.map(s => (
                              <span key={s} className="badge" style={{ fontSize: '11px' }}>{s}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleOpenClientModal(client)} title="Edit Client">
                              <EditIcon style={{ width: '13px', height: '13px' }} />
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClient(client.client_id)} title="Delete Client">
                              <TrashIcon style={{ width: '13px', height: '13px' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Tab Content: Users */}
          {activeTab === 'users' && (
            accounts.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <UserIcon style={{ width: '48px', height: '48px', color: 'var(--color-text-dark)', marginBottom: '16px' }} />
                <h3>No User Accounts</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '6px' }}>
                  Create the first managed user account, then assign roles if needed.
                </p>
                <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={handleOpenCreateUserModal}>
                  Add User
                </button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Status</th>
                      <th>Assigned Roles</th>
                      <th style={{ width: '230px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map(acc => (
                      <tr key={acc.id}>
                        <td>
                          <div style={{ fontWeight: '600' }}>{acc.display_name || acc.username}</div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-dark)', fontFamily: 'monospace' }}>{acc.username} ({acc.id})</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                            {acc.status === 'active' ? (
                              <span className="status-pill active">Active</span>
                            ) : (
                              <span className="status-pill disabled">Suspended</span>
                            )}
                            {acc.locked_out && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="status-pill disabled" style={{ textTransform: 'none', background: 'rgba(245, 158, 11, 0.12)', color: '#fde68a', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                                  Locked ({acc.lockout_attempts} attempts)
                                </span>
                                <button 
                                  className="btn btn-secondary btn-sm" 
                                  style={{ padding: '2px 6px', fontSize: '11px', height: '20px' }}
                                  onClick={() => handleClearLockout(acc.id)}
                                  title="Unlock Account"
                                >
                                  <UnlockIcon style={{ width: '10px', height: '10px', stroke: 'var(--warning-color)' }} />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {acc.roles && acc.roles.length > 0 ? (
                              acc.roles.map(role => (
                                <span key={role.id} className="badge" title={role.description}>
                                  <ShieldIcon style={{ width: '10px', height: '10px', marginRight: '4px', display: 'inline' }} />
                                  {role.name}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '13px', color: 'var(--color-text-dark)', fontStyle: 'italic' }}>No roles assigned</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleOpenRoleModal(acc)} title="Manage Roles">
                              <ShieldIcon style={{ width: '13px', height: '13px' }} />
                              Roles
                            </button>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              onClick={() => handleOpenConsentModal(acc)} 
                              title="Manage Consents"
                            >
                              <ConsentIcon style={{ width: '13px', height: '13px' }} />
                              Consents
                            </button>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              style={{ opacity: acc.id === currentAdmin?.sub ? 0.4 : 1 }}
                              onClick={() => handleOpenPasswordModal(acc)} 
                              title="Change Password"
                              disabled={acc.id === currentAdmin?.sub}
                            >
                              <KeyIcon style={{ width: '13px', height: '13px' }} />
                              Password
                            </button>
                             <button 
                              className={`btn btn-secondary btn-sm`} 
                              style={{ opacity: acc.id === currentAdmin?.sub ? 0.4 : 1 }}
                              onClick={() => handleToggleUserStatus(acc)}
                              title={acc.status === 'active' ? 'Suspend User' : 'Activate User'}
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
                              title="Reset User MFA"
                              disabled={acc.id === currentAdmin?.sub}
                            >
                              <ShieldIcon style={{ width: '13px', height: '13px', stroke: 'var(--warning-color)' }} />
                              Reset MFA
                            </button>
                            <button 
                              className="btn btn-danger btn-sm" 
                              style={{ opacity: acc.id === currentAdmin?.sub ? 0.4 : 1 }}
                              onClick={() => handleDeleteUser(acc.id)}
                              title="Delete User"
                              disabled={acc.id === currentAdmin?.sub}
                            >
                              <TrashIcon style={{ width: '13px', height: '13px' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Tab Content: Audit Logs */}
          {activeTab === 'audit-logs' && (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Event Type</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. auth.login.success" 
                    value={filterEventType}
                    onChange={(e) => setFilterEventType(e.target.value)}
                    style={{ width: '220px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>User Account ID</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="UUID or Username" 
                    value={filterAccountID}
                    onChange={(e) => setFilterAccountID(e.target.value)}
                    style={{ width: '300px' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary" onClick={() => fetchAuditLogs(1)}>
                    Search
                  </button>
                  <button className="btn btn-secondary" onClick={() => {
                    setFilterEventType('');
                    setFilterAccountID('');
                    setTimeout(() => {
                      fetchAuditLogs(1);
                    }, 0);
                  }}>
                    Clear
                  </button>
                </div>
              </div>

              {auditLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <div style={{ margin: '0 auto 12px auto', width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Loading audit logs...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <AuditIcon style={{ width: '48px', height: '48px', color: 'var(--color-text-dark)', marginBottom: '16px' }} />
                  <h3>No Audit Logs Found</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '6px' }}>
                    No system audit logs match the query criteria.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="table-wrapper" style={{ margin: '0 -24px' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Action</th>
                          <th>Actor</th>
                          <th>Target User</th>
                          <th style={{ width: '120px' }}>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => (
                          <tr key={log.id}>
                            <td style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                              {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                            </td>
                            <td>
                              <span className="badge" style={{ fontFamily: 'monospace', textTransform: 'none', background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                {log.action}
                              </span>
                            </td>
                            <td style={{ fontSize: '13px', fontFamily: 'monospace' }}>{log.actor}</td>
                            <td style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{log.account_id || '-'}</td>
                            <td>
                              <button 
                                className="btn btn-secondary btn-sm" 
                                onClick={() => setSelectedAuditLog(log)}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                      Total: {auditTotal} logs
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        disabled={auditPage <= 1} 
                        onClick={() => fetchAuditLogs(auditPage - 1)}
                      >
                        Previous
                      </button>
                      <span style={{ fontSize: '14px', color: 'var(--color-text-main)' }}>Page {auditPage}</span>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        disabled={auditLogs.length < 20 || auditPage * 20 >= auditTotal} 
                        onClick={() => fetchAuditLogs(auditPage + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: System Status */}
          {activeTab === 'system' && (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Health checks card */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                  <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--color-text-main)' }}>
                    Infrastructure Health Status
                  </h3>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={fetchSystemStatus}
                    disabled={loading}
                    title="Refresh system status"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <RefreshCw style={{ width: '16px', height: '16px' }} />
                    Refresh
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Checked at
                    <div style={{ marginTop: '4px', color: 'var(--color-text-main)', fontSize: '14px' }}>
                      {formatHealthTimestamp(systemHealth?.checked_at || systemHealth?.fetched_at)}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    HTTP status
                    <div style={{ marginTop: '4px', color: 'var(--color-text-main)', fontSize: '14px' }}>
                      {systemHealth?.http_status || 'n/a'}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Probe duration
                    <div style={{ marginTop: '4px', color: 'var(--color-text-main)', fontSize: '14px' }}>
                      {typeof systemHealth?.duration_ms === 'number' ? `${systemHealth.duration_ms} ms` : 'n/a'}
                    </div>
                  </div>
                </div>

                {systemHealth?.fetch_error && (
                  <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.10)', border: '1px solid rgba(239, 68, 68, 0.16)', color: '#fecaca', fontSize: '13px' }}>
                    {systemHealth.fetch_error}
                  </div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  
                  {/* Database Health */}
                  <div style={{ 
                    background: 'rgba(255,255,255,0.01)', 
                    padding: '16px', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}>
                    <div style={{ 
                      background: systemHealth?.checks?.database === 'ok' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                      padding: '10px', 
                      borderRadius: '50%',
                      color: systemHealth?.checks?.database === 'ok' ? 'var(--success-color)' : 'var(--danger-color)'
                    }}>
                      <ShieldIcon style={{ width: '22px', height: '22px' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Database Connection</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '2px', color: dependencyIsHealthy(systemHealth?.checks?.database) ? 'var(--success-color)' : 'var(--danger-color)' }}>
                        {dependencyLabel(systemHealth?.checks?.database)}
                      </div>
                    </div>
                  </div>

                  {/* Redis Health */}
                  <div style={{ 
                    background: 'rgba(255,255,255,0.01)', 
                    padding: '16px', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}>
                    <div style={{ 
                      background: systemHealth?.checks?.redis === 'ok' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                      padding: '10px', 
                      borderRadius: '50%',
                      color: systemHealth?.checks?.redis === 'ok' ? 'var(--success-color)' : 'var(--danger-color)'
                    }}>
                      <RefreshCw style={{ width: '22px', height: '22px' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Redis Cache & Lock Manager</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '2px', color: dependencyIsHealthy(systemHealth?.checks?.redis) ? 'var(--success-color)' : 'var(--danger-color)' }}>
                        {dependencyLabel(systemHealth?.checks?.redis)}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* OIDC configuration info card */}
              {oidcConfig && (
                <div className="glass-card">
                  <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--color-text-main)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                    OpenID Connect Identity Provider Profile
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    
                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                      <div style={{ width: '180px', color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: '600' }}>Issuer Identifier</div>
                      <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '13.5px', wordBreak: 'break-all' }}>{oidcConfig.issuer}</div>
                    </div>

                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                      <div style={{ width: '180px', color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: '600' }}>Authorization Endpoint</div>
                      <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '13.5px', wordBreak: 'break-all' }}>{oidcConfig.authorization_endpoint}</div>
                    </div>

                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                      <div style={{ width: '180px', color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: '600' }}>Token Endpoint</div>
                      <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '13.5px', wordBreak: 'break-all' }}>{oidcConfig.token_endpoint}</div>
                    </div>

                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                      <div style={{ width: '180px', color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: '600' }}>Userinfo Endpoint</div>
                      <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '13.5px', wordBreak: 'break-all' }}>{oidcConfig.userinfo_endpoint}</div>
                    </div>

                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                      <div style={{ width: '180px', color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: '600' }}>JWKS URI</div>
                      <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '13.5px', wordBreak: 'break-all' }}>
                        <a href={oidcConfig.jwks_uri} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                          {oidcConfig.jwks_uri}
                        </a>
                      </div>
                    </div>

                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                      <div style={{ width: '180px', color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: '600' }}>Supported Scopes</div>
                      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {oidcConfig.scopes_supported?.map((scope: string) => (
                          <span key={scope} className="badge badge-secondary" style={{ margin: 0 }}>{scope}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex' }}>
                      <div style={{ width: '180px', color: 'var(--color-text-muted)', fontSize: '14px', fontWeight: '600' }}>Grant Types Supported</div>
                      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {oidcConfig.grant_types_supported?.map((gt: string) => (
                          <span key={gt} className="badge badge-secondary" style={{ margin: 0 }}>{gt}</span>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* Client Register/Edit Modal */}
      {showClientModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingClient ? 'Edit OAuth2 Client' : 'Register OAuth2 Client'}</h3>
              <button className="modal-close-btn" onClick={() => setShowClientModal(false)}>
                <XIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <form onSubmit={handleClientFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Client Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="E.g., Developer SPA"
                    value={clientForm.name}
                    onChange={e => setClientForm(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Short description of the client app"
                    value={clientForm.description}
                    onChange={e => setClientForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Redirect URIs (comma-separated)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="E.g., http://localhost:8080/callback"
                    value={clientForm.redirect_uris}
                    onChange={e => setClientForm(p => ({ ...p, redirect_uris: e.target.value }))}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--color-text-dark)', marginTop: '4px', display: 'block' }}>
                    Absolute URLs allowed to receive auth codes. Multiple URLs separated by commas.
                  </span>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Post-Logout Redirect URIs (comma-separated)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="E.g., http://localhost:8080/"
                    value={clientForm.post_logout_redirect_uris}
                    onChange={e => setClientForm(p => ({ ...p, post_logout_redirect_uris: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    id="is_confidential"
                    checked={clientForm.is_confidential}
                    onChange={e => setClientForm(p => ({ ...p, is_confidential: e.target.checked }))}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    disabled={!!editingClient}
                  />
                  <label htmlFor="is_confidential" style={{ color: 'var(--color-text-main)', fontSize: '14.5px', cursor: 'pointer' }}>
                    Confidential Client (Requires Server-Side Secret)
                  </label>
                </div>
                
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">Grant Types</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
                    {['authorization_code', 'client_credentials', 'refresh_token', 'device_code'].map(gt => (
                      <label key={gt} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={clientForm.grant_types.includes(gt)}
                          onChange={() => handleCheckboxChange('grant_types', gt)}
                        />
                        {gt.replace('_', ' ')}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">Authorized Scopes</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
                    {['openid', 'profile', 'email'].map(sc => (
                      <label key={sc} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={clientForm.scopes.includes(sc)}
                          onChange={() => handleCheckboxChange('scopes', sc)}
                        />
                        {sc}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowClientModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confidential Client Secret Display Modal */}
      {showSecretModal && newClientDetails && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ border: '1px solid rgba(168, 85, 247, 0.4)' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--color-secondary)' }}>Client Secret Issued</h3>
            </div>
            <div className="modal-body">
              <div className="glass-card" style={{ background: 'rgba(168, 85, 247, 0.05)', display: 'flex', gap: '12px', padding: '16px', marginBottom: '20px', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
                <InfoIcon style={{ width: '20px', height: '20px', stroke: 'var(--color-secondary)', flexShrink: 0 }} />
                <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', textAlign: 'left', lineHeight: '1.5' }}>
                  Please copy the client secret credential. It will <strong>NOT</strong> be displayed again for security reasons.
                </p>
              </div>
              
              <div className="form-group">
                <label className="form-label">Client ID</label>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {newClientDetails.client_id}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Client Secret</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '14px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {newClientDetails.client_secret}
                  </div>
                  <button className="btn btn-secondary" onClick={copySecret} style={{ padding: '0 16px' }} title="Copy Secret">
                    {copied ? <CheckIcon style={{ width: '16px', height: '16px', stroke: 'var(--success-color)' }} /> : <CopyIcon style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => { setShowSecretModal(false); setNewClientDetails(null); }}>
                Done, I Saved It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Create Modal */}
      {showCreateUserModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add User Account</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateUserModal(false)}>
                <XIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <form onSubmit={handleCreateUserSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '14px', color: 'var(--color-text-dark)', marginBottom: '16px' }}>
                  Create a standard active account. Assign administrator access separately through Roles.
                </p>

                {createUserError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--danger-color)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                    {createUserError}
                  </div>
                )}

                {createUserSuccess && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--success-color)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                    {createUserSuccess}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. jane.doe"
                      value={createUserForm.username}
                      onChange={e => setCreateUserForm(p => ({ ...p, username: e.target.value }))}
                      required
                      disabled={!!createUserSuccess}
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Display Name</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Jane Doe"
                      value={createUserForm.display_name}
                      onChange={e => setCreateUserForm(p => ({ ...p, display_name: e.target.value }))}
                      required
                      disabled={!!createUserSuccess}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="jane@example.com"
                      value={createUserForm.email}
                      onChange={e => setCreateUserForm(p => ({ ...p, email: e.target.value }))}
                      disabled={!!createUserSuccess}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="+8613800138000"
                      value={createUserForm.phone}
                      onChange={e => setCreateUserForm(p => ({ ...p, phone: e.target.value }))}
                      disabled={!!createUserSuccess}
                    />
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-dark)', marginTop: '-10px', marginBottom: '16px', display: 'block' }}>
                  Provide at least one contact method. Email and phone must be unique.
                </span>

                <div className="form-group">
                  <label className="form-label">Initial Password (min 12 chars)</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Set an initial password"
                    value={createUserForm.password}
                    onChange={e => setCreateUserForm(p => ({ ...p, password: e.target.value }))}
                    required
                    disabled={!!createUserSuccess}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Locale</label>
                    <input
                      type="text"
                      className="input-field"
                      value={createUserForm.locale}
                      onChange={e => setCreateUserForm(p => ({ ...p, locale: e.target.value }))}
                      disabled={!!createUserSuccess}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Timezone</label>
                    <input
                      type="text"
                      className="input-field"
                      value={createUserForm.timezone}
                      onChange={e => setCreateUserForm(p => ({ ...p, timezone: e.target.value }))}
                      disabled={!!createUserSuccess}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateUserModal(false)} disabled={!!createUserSuccess}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!!createUserSuccess}>
                  Create User
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
              <h3 className="modal-title">Manage Roles - {selectedAccount.display_name || selectedAccount.username}</h3>
              <button className="modal-close-btn" onClick={() => setShowRoleModal(false)}>
                <XIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <div className="modal-body">
              {/* Existing roles list */}
              <label className="form-label">Active Roles</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0 24px 0' }}>
                {selectedAccount.roles && selectedAccount.roles.length > 0 ? (
                  selectedAccount.roles.map(role => (
                    <div key={role.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldIcon style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
                        <div>
                          <div style={{ fontSize: '14.5px', fontWeight: '600' }}>{role.name}</div>
                          {role.description && <div style={{ fontSize: '12px', color: 'var(--color-text-dark)' }}>{role.description}</div>}
                        </div>
                      </div>
                      <button 
                        className="btn btn-danger btn-sm" 
                        style={{ padding: '4px 8px', fontSize: '11px', opacity: selectedAccount.id === currentAdmin?.sub ? 0.4 : 1 }} 
                        onClick={() => handleRemoveRole(role.id)}
                        disabled={selectedAccount.id === currentAdmin?.sub}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px', color: 'var(--color-text-dark)', fontStyle: 'italic' }}>
                    No roles assigned to this account.
                  </div>
                )}
              </div>

              {/* Add role form */}
              {selectedAccount.id !== currentAdmin?.sub && (
                <form onSubmit={handleAddRoleSubmit} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                  <label className="form-label">Assign New Role</label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <div style={{ flex: 1 }}>
                      {discoveredRoles.length > 0 ? (
                        <select 
                          className="input-field"
                          value={newRoleInput}
                          onChange={e => setNewRoleInput(e.target.value)}
                        >
                          <option value="">-- Select Discovered Role --</option>
                          {discoveredRoles
                            .filter(role => !selectedAccount.roles?.some(ur => ur.id === role.id))
                            .map(role => (
                              <option key={role.id} value={role.id}>{role.name} ({role.id.substring(0, 8)})</option>
                            ))
                          }
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Enter Role UUID"
                          value={newRoleInput}
                          onChange={e => setNewRoleInput(e.target.value)}
                        />
                      )}
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={!newRoleInput}>
                      Assign
                    </button>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-dark)', marginTop: '6px', display: 'block' }}>
                    Select a previously loaded role from user databases, or input a specific Role UUID.
                  </span>
                </form>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* User Change Password Modal */}
      {showPasswordModal && selectedAccount && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Change Password</h3>
              <button className="modal-close-btn" onClick={() => setShowPasswordModal(false)}>
                <XIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '14px', color: 'var(--color-text-dark)', marginBottom: '16px' }}>
                  Set a new password for user <strong>{selectedAccount.display_name || selectedAccount.username}</strong>.
                </p>

                {passwordError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--danger-color)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--success-color)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                    {passwordSuccess}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '0px' }}>
                  <label className="form-label">New Password (min 12 chars)</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    disabled={!!passwordSuccess}
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)} disabled={!!passwordSuccess}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!newPassword || !!passwordSuccess}>Update Password</button>
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
              <h3 className="modal-title">Authorized Applications - {selectedAccount.display_name || selectedAccount.username}</h3>
              <button className="modal-close-btn" onClick={() => setShowConsentModal(false)}>
                <XIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: 'var(--color-text-dark)', marginBottom: '16px' }}>
                View and revoke applications authorized by this user to access their account profile.
              </p>

              {consentsLoading ? (
                <div style={{ padding: '30px 0', textAlign: 'center' }}>
                  <div style={{ margin: '0 auto 12px auto', width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Loading authorized applications...</p>
                </div>
              ) : consentsList.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px', color: 'var(--color-text-dark)', fontStyle: 'italic' }}>
                  This user has not authorized any OIDC applications yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {consentsList.map(consent => (
                    <div key={consent.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '8px' }}>
                      <div style={{ flex: 1, marginRight: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ConsentIcon style={{ width: '16px', height: '16px', color: 'var(--color-secondary)' }} />
                          <div style={{ fontSize: '15px', fontWeight: '600' }}>Client ID: {consent.client_id}</div>
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {consent.scopes?.map((scope: string) => (
                            <span key={scope} className="badge" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text-muted)' }}>
                              {scope}
                            </span>
                          ))}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-dark)', marginTop: '8px' }}>
                          Authorized At: {consent.granted_at ? new Date(consent.granted_at).toLocaleString() : '-'}
                        </div>
                      </div>
                      <button 
                        className="btn btn-danger btn-sm" 
                        style={{ padding: '6px 12px', opacity: selectedAccount.id === currentAdmin?.sub ? 0.4 : 1 }}
                        onClick={() => handleRevokeConsent(consent.client_id)}
                        disabled={selectedAccount.id === currentAdmin?.sub}
                      >
                        Revoke Access
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConsentModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Detail Modal */}
      {selectedAuditLog && (
        <div className="modal-backdrop" onClick={() => setSelectedAuditLog(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '720px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Audit Log Details</h3>
              <button className="modal-close-btn" onClick={() => setSelectedAuditLog(null)}>
                <XIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Log Entry ID:</strong>
                  <div style={{ fontSize: '14px', marginTop: '2px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedAuditLog.id}</div>
                </div>
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Action:</strong>
                  <div style={{ fontSize: '14px', marginTop: '2px', fontFamily: 'monospace' }}>{selectedAuditLog.action}</div>
                </div>
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Actor:</strong>
                  <div style={{ fontSize: '14px', marginTop: '2px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedAuditLog.actor}</div>
                </div>
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Target User:</strong>
                  <div style={{ fontSize: '14px', marginTop: '2px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedAuditLog.account_id || '-'}</div>
                </div>
                <div>
                  <strong style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Created At:</strong>
                  <div style={{ fontSize: '14px', marginTop: '2px' }}>
                    {selectedAuditLog.created_at ? new Date(selectedAuditLog.created_at).toLocaleString() : '-'}
                  </div>
                </div>
                {selectedAuditLog.resource && (
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Resource Data:</strong>
                    <pre style={{ margin: '6px 0 0 0', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '12px', color: '#818cf8', overflowX: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {JSON.stringify(selectedAuditLog.resource, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedAuditLog.meta && (
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Meta Context:</strong>
                    <pre style={{ margin: '6px 0 0 0', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', fontSize: '12px', color: '#c084fc', overflowX: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {JSON.stringify(selectedAuditLog.meta, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedAuditLog(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
