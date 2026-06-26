import React, { useState, useEffect } from 'react';
import { Shield, Key, Laptop, Trash2, QrCode, Clipboard, AlertTriangle, RefreshCw, Lock, Unlock, Check, Copy, User, Calendar, MapPin, Eye, EyeOff, Plus } from 'lucide-react';
import { getUserProfile, logout, apiFetch, isLoggedIn, redirectToAuthorize } from '../auth';
import { ButtonGroup, DataTable, DefinitionList, DefinitionRow, EmptyState, Feedback, FormField, ListRow, ListStack, Panel, PanelBody, PanelHeader, PlainSection, StatusBadge, Tag } from '../components/ui';

interface Session {
  id: string;
  ip: string;
  user_agent: string;
  created_at: string;
  last_active_at: string;
}

interface Passkey {
  id: string;
  name: string;
  created_at?: string;
}

interface MFAStatus {
  enabled: boolean;
  types: string[];
}

// WebAuthn array buffer utilities
function bufferToBase64URL(buffer: ArrayBuffer): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64URLToBuffer(base64url: string): Uint8Array {
  if (!base64url) return new Uint8Array(0);
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'mfa' | 'passkeys' | 'sessions'>('profile');
  const profile = getUserProfile();

  // Loaders
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile / Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  // MFA State
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({ enabled: false, types: [] });
  const [mfaEnrollment, setMfaEnrollment] = useState<{ secret: string; otpauth_url: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [confirmPasswordForMFA, setConfirmPasswordForMFA] = useState('');

  // Passkeys State
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);

  // Sessions State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Load data on tab active
  useEffect(() => {
    if (!isLoggedIn()) {
      redirectToAuthorize('/settings');
      return;
    }
    loadTabContent();
  }, [activeTab]);

  const loadTabContent = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      setError(null);
      setSuccess(null);
      if (activeTab === 'mfa') {
        await fetchMFAStatus();
      } else if (activeTab === 'passkeys') {
        await fetchPasskeys();
      } else if (activeTab === 'sessions') {
        await fetchSessions();
      }
    } catch (err: any) {
      console.error(err);
      setLoadError(err.message || 'Error loading settings data');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // --- API Handlers ---

  // 1. Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetch('/api/v1/auth/password/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || 'Failed to change password');
      }

      setSuccess('Password updated successfully. Please use your new password next time.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. MFA Status and Operations
  const fetchMFAStatus = async () => {
    const response = await apiFetch('/api/v1/auth/mfa');
    if (!response.ok) {
      throw new Error('Failed to load multi-factor authentication status');
    }
    const body = await response.json();
    setMfaStatus(body.data || { enabled: false, types: [] });
  };

  const handleEnrollMFA = async () => {
    clearMessages();
    try {
      setLoading(true);
      const response = await apiFetch('/api/v1/auth/mfa/enroll', {
        method: 'POST'
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to enroll MFA');
      setMfaEnrollment(body.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      setLoading(true);
      const response = await apiFetch('/api/v1/auth/mfa/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: totpCode })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to activate TOTP');

      setSuccess('MFA activated successfully!');
      setMfaEnrollment(null);
      setTotpCode('');
      await fetchMFAStatus();

      // Automatically generate backup codes for the user
      const codesRes = await apiFetch('/api/v1/auth/mfa/backup-codes', {
        method: 'POST'
      });
      const codesBody = await codesRes.json();
      if (codesRes.ok && codesBody.data?.backup_codes) {
        setBackupCodes(codesBody.data.backup_codes);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      setLoading(true);
      const response = await apiFetch('/api/v1/auth/mfa', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ current_password: confirmPasswordForMFA })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to disable MFA');

      setSuccess('MFA has been disabled.');
      setShowDisableModal(false);
      setConfirmPasswordForMFA('');
      setBackupCodes([]);
      await fetchMFAStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    clearMessages();
    if (!window.confirm('Generating new backup codes will invalidate any existing recovery codes. Continue?')) {
      return;
    }
    try {
      setLoading(true);
      const response = await apiFetch('/api/v1/auth/mfa/backup-codes', {
        method: 'POST'
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to generate backup codes');
      setBackupCodes(body.data.backup_codes || []);
      setSuccess('New backup codes generated.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Passkeys (WebAuthn)
  const fetchPasskeys = async () => {
    const response = await apiFetch('/api/v1/passkeys');
    if (!response.ok) {
      throw new Error('Failed to load passkeys');
    }
    const body = await response.json();
    setPasskeys(body.data || []);
  };

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!newPasskeyName.trim()) {
      setError('Please provide a name for this device/passkey.');
      return;
    }

    try {
      setLoading(true);
      // Step 1: Begin registration
      const beginRes = await apiFetch('/api/v1/passkey/register/begin', {
        method: 'POST'
      });
      const beginBody = await beginRes.json();
      if (!beginRes.ok) throw new Error(beginBody.message || 'Failed to initialize WebAuthn ceremony');
      if (!beginBody.data) throw new Error('Server returned no registration data');

      const { options, request_id } = beginBody.data;
      if (!options || !options.challenge) {
        console.error('Invalid WebAuthn options from server:', beginBody);
        throw new Error('Server returned invalid WebAuthn options (missing challenge)');
      }

      // Format options for navigator.credentials.create
      const publicKeyOptions = {
        ...options,
        challenge: base64URLToBuffer(options.challenge),
        user: {
          ...options.user,
          id: base64URLToBuffer(options.user?.id)
        },
        excludeCredentials: (options.excludeCredentials || []).map((cred: any) => ({
          ...cred,
          id: base64URLToBuffer(cred.id)
        }))
      };

      // Step 2: Invoke browser WebAuthn API
      const credential = (await navigator.credentials.create({
        publicKey: publicKeyOptions
      })) as any;

      if (!credential || !credential.response) {
        throw new Error('Credential creation cancelled or failed');
      }

      // Format response body
      const attestationResponse = {
        id: credential.id,
        rawId: bufferToBase64URL(credential.rawId),
        type: credential.type,
        name: newPasskeyName.trim(),
        response: {
          clientDataJSON: bufferToBase64URL(credential.response.clientDataJSON),
          attestationObject: bufferToBase64URL((credential.response as AuthenticatorAttestationResponse).attestationObject),
          transports: typeof credential.response.getTransports === 'function' ? credential.response.getTransports() : []
        }
      };

      // Step 3: Complete registration
      const completeRes = await apiFetch(`/api/v1/passkey/register/complete?request_id=${request_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(attestationResponse)
      });
      const completeBody = await completeRes.json();
      if (!completeRes.ok) throw new Error(completeBody.message || 'Failed to verify attestation on server');

      setSuccess(`Passkey "${newPasskeyName}" registered successfully.`);
      setShowPasskeyModal(false);
      setNewPasskeyName('');
      await fetchPasskeys();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'WebAuthn registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePasskey = async (id: string, name: string) => {
    clearMessages();
    if (!window.confirm(`Are you sure you want to remove the passkey "${name}"?`)) {
      return;
    }
    try {
      setLoading(true);
      const response = await apiFetch(`/api/v1/passkeys/${id}`, {
        method: 'DELETE'
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to remove passkey');
      setSuccess('Passkey removed successfully.');
      await fetchPasskeys();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Active Sessions
  const fetchSessions = async () => {
    const response = await apiFetch('/api/v1/auth/sessions');
    if (!response.ok) {
      throw new Error('Failed to load active sessions');
    }
    const body = await response.json();
    const sorted = (body.data || []).sort(
      (a: Session, b: Session) => new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime()
    );
    setSessions(sorted);

    // Check current session ID by calling validate session endpoint
    const curResponse = await apiFetch('/api/v1/auth/session');
    if (!curResponse.ok) {
      throw new Error('Failed to validate current session');
    }
    const curBody = await curResponse.json();
    setCurrentSessionId(curBody.data?.id || null);
  };

  const handleRevokeSession = async (sessionId: string) => {
    clearMessages();
    if (!window.confirm('Are you sure you want to terminate this session? The device will be signed out immediately.')) {
      return;
    }
    try {
      setLoading(true);
      const response = await apiFetch(`/api/v1/auth/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to revoke session');
      setSuccess('Session revoked.');
      await fetchSessions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse simple user agent description
  const parseUserAgent = (ua: string) => {
    if (!ua) return 'Unknown Device';
    if (ua.includes('iPhone')) return 'Apple iPhone';
    if (ua.includes('iPad')) return 'Apple iPad';
    if (ua.includes('Android')) return 'Android Mobile';
    if (ua.includes('Macintosh')) return 'Mac Computer';
    if (ua.includes('Windows')) return 'Windows Computer';
    if (ua.includes('Linux')) return 'Linux Computer';
    return ua.split(' ')[0] || 'Web Browser';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Tabs */}
      <div className="tabs-header">
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline', verticalAlign: 'middle' }} />
          Profile & Password
        </button>
        <button className={`tab-btn ${activeTab === 'mfa' ? 'active' : ''}`} onClick={() => setActiveTab('mfa')}>
          <Shield style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline', verticalAlign: 'middle' }} />
          Multi-Factor (2FA)
        </button>
        <button className={`tab-btn ${activeTab === 'passkeys' ? 'active' : ''}`} onClick={() => setActiveTab('passkeys')}>
          <Key style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline', verticalAlign: 'middle' }} />
          Passkeys (FIDO2)
        </button>
        <button className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
          <Laptop style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline', verticalAlign: 'middle' }} />
          Active Sessions
        </button>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <div style={{ margin: '0 auto 16px auto', width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Loading settings data...</p>
        </div>
      ) : loadError ? (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--danger-color)', padding: '20px' }}>
          <h3 style={{ color: 'var(--danger-color)', marginBottom: '8px' }}>Settings Load Error</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>{loadError}</p>
          <button className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }} onClick={loadTabContent}>Retry Load</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Notifications */}
          {error && (
            <Feedback type="error">{error}</Feedback>
          )}

          {success && (
            <Feedback type="success">{success}</Feedback>
          )}

          {/* TAB 1: Profile & Password */}
          {activeTab === 'profile' && (
            <Panel>
              <PanelHeader
                title="Profile & Password"
                description="Review account attributes and update the password used for username and password sign-in."
              />
              <PlainSection title="Account Profile">
                <DefinitionList>
                  <DefinitionRow label="Username">{profile?.preferred_username || '-'}</DefinitionRow>
                  <DefinitionRow label="Display Name">{profile?.name || '-'}</DefinitionRow>
                  <DefinitionRow label="Email Address">{profile?.email || 'Not configured'}</DefinitionRow>
                  <DefinitionRow label="Security Role">
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {profile?.roles?.map(role => (
                        <Tag key={role}>{role}</Tag>
                      )) || <Tag tone="secondary">Standard User</Tag>}
                    </div>
                  </DefinitionRow>
                </DefinitionList>
              </PlainSection>

              <PlainSection title="Update Password">
                <form onSubmit={handleChangePassword} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <FormField label="Current Password" noMargin>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showCurrentPwd ? 'text' : 'password'}
                        className="input-field" 
                        required
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowCurrentPwd(!showCurrentPwd)} 
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                      >
                        {showCurrentPwd ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                      </button>
                    </div>
                  </FormField>

                  <FormField label="New Password" noMargin>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showNewPwd ? 'text' : 'password'}
                        className="input-field" 
                        required
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="At least 12 characters"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowNewPwd(!showNewPwd)} 
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                      >
                        {showNewPwd ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                      </button>
                    </div>
                  </FormField>

                  <FormField label="Confirm New Password" noMargin>
                    <input 
                      type="password" 
                      className="input-field" 
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                    />
                  </FormField>

                  <button className="btn btn-primary" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
                    <Lock style={{ width: '16px', height: '16px' }} />
                    {loading ? 'Updating...' : 'Change Password'}
                  </button>
                </form>
              </PlainSection>
            </Panel>
          )}

          {/* TAB 2: Multi-Factor (MFA) */}
          {activeTab === 'mfa' && (
            <Panel>
              <PanelHeader
                title="Two-Factor Authentication (2FA)"
                description="Protect your account with an authenticator app generating one-time passcode verification."
                action={
                  mfaStatus.enabled ? (
                    <StatusBadge tone="success">Active</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Disabled</StatusBadge>
                  )
                }
              />
              <PanelBody stack>

              {/* Status Section */}
              {!mfaStatus.enabled && !mfaEnrollment && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                  <p style={{ fontSize: '14.5px', lineHeight: '1.6', color: 'var(--color-text-muted)' }}>
                    Two-Factor Authentication adds an extra layer of security. Once activated, logging in will require your password and a verification code from your mobile authenticator app.
                  </p>
                  <button className="btn btn-primary" onClick={handleEnrollMFA}>
                    <QrCode style={{ width: '16px', height: '16px' }} />
                    Set Up Authenticator App
                  </button>
                </div>
              )}

              {/* Enrollment setup view */}
              {mfaEnrollment && (
                <div>
                  <h4 className="setup-title">Step-up Authenticator Application</h4>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
                    {/* QR Code Container */}
                    <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(mfaEnrollment.otpauth_url)}`}
                        alt="TOTP Setup QR Code"
                        style={{ width: '180px', height: '180px' }}
                      />
                    </div>

                    {/* Manual Info */}
                    <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                        1. Scan this QR Code with your Google Authenticator, Microsoft Authenticator, or generic TOTP app.
                      </p>
                      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                        2. If you cannot scan the code, enter the following secret key manually in your app:
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <code style={{ fontSize: '13px', color: 'var(--color-secondary)', letterSpacing: '0.05em', fontWeight: 'bold' }}>{mfaEnrollment.secret}</code>
                        <button 
                          type="button" 
                          onClick={() => { navigator.clipboard.writeText(mfaEnrollment.secret); alert('Secret key copied!'); }}
                          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0 }}
                          title="Copy Secret"
                        >
                          <Copy style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Verification Form */}
                  <form onSubmit={handleActivateMFA} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '320px' }}>
                    <FormField label="Verification Code" noMargin>
                      <input 
                        type="text"
                        maxLength={8}
                        className="input-field" 
                        required
                        value={totpCode}
                        onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit code"
                        style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '0.1em', fontWeight: 'bold' }}
                      />
                    </FormField>
                    
                    <ButtonGroup>
                      <button className="btn btn-primary" type="submit" disabled={loading}>
                        <Check style={{ width: '16px', height: '16px' }} />
                        Verify and Activate
                      </button>
                      <button className="btn btn-secondary" type="button" onClick={() => setMfaEnrollment(null)}>
                        Cancel
                      </button>
                    </ButtonGroup>
                  </form>
                </div>
              )}

              {/* MFA Active state view */}
              {mfaStatus.enabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="inline-status-row" style={{ color: '#a7f3d0', paddingTop: 0 }}>
                    <Shield style={{ width: '24px', height: '24px', color: 'var(--success-color)' }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px' }}>Your account is protected by 2FA</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        TOTP (Time-based One-time Password) application is registered.
                      </div>
                    </div>
                  </div>

                  <ButtonGroup>
                    <button className="btn btn-secondary" onClick={handleGenerateBackupCodes}>
                      <RefreshCw style={{ width: '14px', height: '14px' }} />
                      Regenerate Backup Codes
                    </button>
                    <button className="btn btn-danger" onClick={() => setShowDisableModal(true)}>
                      <Unlock style={{ width: '14px', height: '14px' }} />
                      Disable Two-Factor Auth
                    </button>
                  </ButtonGroup>
                </div>
              )}

              {/* Backup Codes Display */}
              {backupCodes.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning-color)' }}>
                    <AlertTriangle style={{ width: '16px', height: '16px' }} />
                    <h4 style={{ fontSize: '14.5px', fontWeight: 'bold' }}>Recovery Backup Codes</h4>
                  </div>
                  
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                    Store these recovery backup codes in a safe place. Each code can only be used once if you lose your phone.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    {backupCodes.map((code, idx) => (
                      <code key={idx} style={{ fontSize: '13px', letterSpacing: '0.05em', color: 'var(--color-text-main)', fontWeight: 'bold' }}>{code}</code>
                    ))}
                  </div>

                  <ButtonGroup>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => { 
                        navigator.clipboard.writeText(backupCodes.join('\n')); 
                        alert('Backup codes copied!'); 
                      }}
                    >
                      <Clipboard style={{ width: '13px', height: '13px' }} />
                      Copy Codes
                    </button>
                  </ButtonGroup>
                </div>
              )}

              </PanelBody>
            </Panel>
          )}

          {/* TAB 3: Passkeys */}
          {activeTab === 'passkeys' && (
            <Panel>
              <PanelHeader
                title="Passkeys"
                description="Register biometrics or hardware security keys for passwordless FIDO2 sign-in."
                action={
                  <button className="btn btn-primary content-action" onClick={() => setShowPasskeyModal(true)}>
                    <Plus />
                    Add a Passkey
                  </button>
                }
              />

              {/* Passkeys List */}
              {passkeys.length === 0 ? (
                <EmptyState icon={<Key />} title="No passkeys registered yet" description="Add your computer's built-in Touch ID/Face ID or an external FIDO2 key." />
              ) : (
                <PanelBody>
                <ListStack>
                  {passkeys.map(passkey => (
                    <ListRow
                      key={passkey.id} 
                      icon={<Key style={{ width: '16px', height: '16px' }} />}
                      title={passkey.name}
                      meta={<><Calendar style={{ width: '11px', height: '11px' }} />{passkey.created_at ? new Date(passkey.created_at).toLocaleString() : 'Registered device'}</>}
                      action={
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleDeletePasskey(passkey.id, passkey.name)}
                          style={{ padding: '6px' }}
                          title="Remove Passkey"
                        >
                          <Trash2 style={{ width: '14px', height: '14px' }} />
                        </button>
                      }
                    />
                  ))}
                </ListStack>
                </PanelBody>
              )}

            </Panel>
          )}

          {/* TAB 4: Active Sessions */}
          {activeTab === 'sessions' && (
            <Panel>
              <PanelHeader title="Active Sessions" description="A list of browsers and devices currently signed in to your account." />

              {/* Sessions Table */}
              <DataTable>
                  <thead>
                    <tr>
                      <th>Device / Browser</th>
                      <th>IP Address</th>
                      <th>Last Active</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(session => {
                      const isCurrent = session.id === currentSessionId;
                      return (
                        <tr 
                          key={session.id} 
                          style={{ 
                            backgroundColor: isCurrent ? 'rgba(99, 102, 241, 0.03)' : 'transparent' 
                          }}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Laptop style={{ width: '16px', height: '16px', color: isCurrent ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                              <div>
                                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                                  {parseUserAgent(session.user_agent)}
                                </span>
                                {isCurrent && (
                                  <Tag>Current</Tag>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: '13.5px', color: 'var(--color-text-main)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin style={{ width: '12px', height: '12px', color: 'var(--color-text-dark)' }} />
                              {session.ip}
                            </span>
                          </td>
                          <td style={{ fontSize: '13.5px', color: 'var(--color-text-muted)' }}>
                            {new Date(session.last_active_at).toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isCurrent ? (
                              <button className="btn btn-secondary btn-sm" onClick={logout} style={{ fontSize: '11px', padding: '4px 10px' }}>
                                Sign Out
                              </button>
                            ) : (
                              <button 
                                className="btn btn-danger btn-sm" 
                                onClick={() => handleRevokeSession(session.id)}
                                style={{ fontSize: '11px', padding: '4px 10px' }}
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
              </DataTable>

            </Panel>
          )}

        </div>
      )}

      {/* MODAL 1: Disable MFA Confirmation */}
      {showDisableModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Disabling 2FA</h3>
            </div>
            <div className="modal-body">
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
              For security, you must enter your current account password to confirm disabling Two-Factor Authentication.
            </p>

            <form onSubmit={handleDisableMFA} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <FormField label="Account Password" noMargin>
                <input 
                  type="password"
                  className="input-field" 
                  required
                  value={confirmPasswordForMFA}
                  onChange={e => setConfirmPasswordForMFA(e.target.value)}
                  placeholder="Enter current password"
                />
              </FormField>

              <ButtonGroup align="right">
                <button className="btn btn-danger" type="submit" disabled={loading}>
                  {loading ? 'Disabling...' : 'Confirm Disable'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => { setShowDisableModal(false); setConfirmPasswordForMFA(''); }}>
                  Cancel
                </button>
              </ButtonGroup>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Register Passkey Name Dialog */}
      {showPasskeyModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Register Passkey</h3>
            </div>
            <div className="modal-body">
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
              Choose a friendly name for this passkey device so you can identify it later.
            </p>

            <form onSubmit={handleRegisterPasskey} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <FormField label="Passkey Name" noMargin>
                <input 
                  type="text"
                  className="input-field" 
                  required
                  value={newPasskeyName}
                  onChange={e => setNewPasskeyName(e.target.value)}
                  placeholder="e.g. My YubiKey, Work Macbook TouchID"
                />
              </FormField>

              <ButtonGroup align="right">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Registering...' : 'Register Device'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => { setShowPasskeyModal(false); setNewPasskeyName(''); }}>
                  Cancel
                </button>
              </ButtonGroup>
            </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
