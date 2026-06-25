import { useEffect, useState } from 'react';
import { Plus as PlusIcon, Edit2 as EditIcon, Trash2 as TrashIcon, Key as KeyIcon, User as UserIcon, Shield as ShieldIcon, X as XIcon, Copy as CopyIcon, Check as CheckIcon, Info as InfoIcon, Lock as LockIcon, Unlock as UnlockIcon } from 'lucide-react';
import { isLoggedIn, isAdmin, getAccessToken, redirectToAuthorize, getUserProfile } from '../auth';

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
}

interface Role {
  id: string;
  name: string;
  description?: string;
}

export default function Admin() {

  const [activeTab, setActiveTab] = useState<'clients' | 'users'>('clients');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data State
  const [clients, setClients] = useState<OAuth2Client[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [discoveredRoles, setDiscoveredRoles] = useState<Role[]>([]); // Dynamic role bank
  
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

  // Password Dialog State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Self Password Dialog State
  const [showSelfPasswordModal, setShowSelfPasswordModal] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newSelfPasswordInput, setNewSelfPasswordInput] = useState('');
  const [selfPasswordError, setSelfPasswordError] = useState<string | null>(null);
  const [selfPasswordSuccess, setSelfPasswordSuccess] = useState<string | null>(null);
  
  const token = getAccessToken();
  const currentAdmin = getUserProfile();

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) {
      redirectToAuthorize('/admin');
      return;
    }
    
    loadDashboardData();
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'clients') {
        await fetchClients();
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

  const fetchClients = async () => {
    const response = await fetch('/api/v1/oauth2/clients', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to load OAuth2 clients');
    const body = await response.json();
    setClients(body.data || []);
  };

  const fetchAccounts = async () => {
    const response = await fetch('/api/v1/admin/accounts?page_size=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to load accounts');
    const body = await response.json();
    const fetchedAccounts: Account[] = body.data?.items || [];
    
    // Fetch roles for each account
    const accountsWithRoles = await Promise.all(
      fetchedAccounts.map(async (acc) => {
        try {
          const rolesRes = await fetch(`/api/v1/admin/accounts/${acc.id}/roles`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (rolesRes.ok) {
            const rolesBody = await rolesRes.json();
            return { ...acc, roles: rolesBody.data || [] };
          }
        } catch (e) {
          console.error(`Failed to fetch roles for user ${acc.username}`, e);
        }
        return { ...acc, roles: [] };
      })
    );

    setAccounts(accountsWithRoles);
    
    // Extract distinct roles for role dropdown choices
    const roleBank: { [id: string]: Role } = {};
    accountsWithRoles.forEach(acc => {
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
        const response = await fetch(`/api/v1/oauth2/clients/${editingClient.client_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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
        const response = await fetch('/api/v1/oauth2/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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
      const response = await fetch(`/api/v1/oauth2/clients/${clientId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete client');
      fetchClients();
    } catch (err: any) {
      alert(err.message || 'Error deleting client');
    }
  };

  // User Management Handlers
  const handleToggleUserStatus = async (account: Account) => {
    if (account.id === currentAdmin?.sub) {
      alert('You cannot enable/disable your own admin account.');
      return;
    }
    
    const action = account.status === 'active' ? 'disable' : 'enable';
    if (!confirm(`Are you sure you want to ${action} user "${account.username}"?`)) return;
    
    try {
      const response = await fetch(`/api/v1/admin/accounts/${account.id}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
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
      const response = await fetch(`/api/v1/admin/accounts/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
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

  // Self Password Management Handlers
  const handleOpenSelfPasswordModal = () => {
    setCurrentPasswordInput('');
    setNewSelfPasswordInput('');
    setSelfPasswordError(null);
    setSelfPasswordSuccess(null);
    setShowSelfPasswordModal(true);
  };

  const handleSelfPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPasswordInput || !newSelfPasswordInput) return;

    if (newSelfPasswordInput.length < 12) {
      setSelfPasswordError('New password must be at least 12 characters long.');
      return;
    }

    try {
      const response = await fetch(`/api/v1/auth/password/change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPasswordInput,
          new_password: newSelfPasswordInput
        })
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || 'Failed to change password');
      }

      setSelfPasswordSuccess('Password updated successfully. You will be redirected to log in again shortly.');
      setSelfPasswordError(null);
      setCurrentPasswordInput('');
      setNewSelfPasswordInput('');
      
      setTimeout(() => {
        setShowSelfPasswordModal(false);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_profile');
        document.cookie = 'access_token=; path=/; max-age=-1; SameSite=Lax';
        window.location.href = '/';
      }, 2500);
    } catch (err: any) {
      setSelfPasswordError(err.message || 'Error updating password');
      setSelfPasswordSuccess(null);
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
      const response = await fetch(`/api/v1/admin/accounts/${selectedAccount.id}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
      const response = await fetch(`/api/v1/admin/accounts/${selectedAccount.id}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role_id: newRoleInput })
      });
      
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || 'Failed to assign role');
      }
      
      // Reload roles for selected user
      const rolesRes = await fetch(`/api/v1/admin/accounts/${selectedAccount.id}/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
      const response = await fetch(`/api/v1/admin/accounts/${selectedAccount.id}/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || 'Failed to remove role');
      }
      
      // Reload roles
      const rolesRes = await fetch(`/api/v1/admin/accounts/${selectedAccount.id}/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
          <button className="btn btn-secondary" onClick={handleOpenSelfPasswordModal}>
            <KeyIcon style={{ width: '16px', height: '16px' }} />
            Change My Password
          </button>
          {activeTab === 'clients' && (
            <button className="btn btn-primary" onClick={() => handleOpenClientModal(null)}>
              <PlusIcon style={{ width: '16px', height: '16px' }} />
              Register Client
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
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Status</th>
                    <th>Assigned Roles</th>
                    <th style={{ width: '180px' }}>Actions</th>
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
                        {acc.status === 'active' ? (
                          <span className="status-pill active">Active</span>
                        ) : (
                          <span className="status-pill disabled">Suspended</span>
                        )}
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

      {/* Self Change Password Modal */}
      {showSelfPasswordModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Change My Password</h3>
              <button className="modal-close-btn" onClick={() => setShowSelfPasswordModal(false)}>
                <XIcon style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <form onSubmit={handleSelfPasswordSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '14px', color: 'var(--color-text-dark)', marginBottom: '16px' }}>
                  Update your administrator account password. For security, you must provide your current password.
                </p>

                {selfPasswordError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--danger-color)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                    {selfPasswordError}
                  </div>
                )}

                {selfPasswordSuccess && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: 'var(--success-color)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                    {selfPasswordSuccess}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Enter current password"
                    value={currentPasswordInput}
                    onChange={e => setCurrentPasswordInput(e.target.value)}
                    required
                    disabled={!!selfPasswordSuccess}
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0px' }}>
                  <label className="form-label">New Password (min 12 chars)</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Enter new password"
                    value={newSelfPasswordInput}
                    onChange={e => setNewSelfPasswordInput(e.target.value)}
                    required
                    disabled={!!selfPasswordSuccess}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSelfPasswordModal(false)} disabled={!!selfPasswordSuccess}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!currentPasswordInput || !newSelfPasswordInput || !!selfPasswordSuccess}>Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
