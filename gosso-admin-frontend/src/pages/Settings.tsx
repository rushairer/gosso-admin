import React, { useState, useEffect } from 'react';
import { Shield, Key, Laptop, Trash2, QrCode, Clipboard, AlertTriangle, CheckCircle, RefreshCw, Lock, Unlock, Check, Copy, User, Calendar, MapPin, Eye, EyeOff, Plus } from 'lucide-react';
import { getAccessToken, getUserProfile, logout } from '../auth';

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
  const token = getAccessToken();
  const profile = getUserProfile();

  // Loaders
  const [loading, setLoading] = useState(false);
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
    if (activeTab === 'mfa') {
      fetchMFAStatus();
    } else if (activeTab === 'passkeys') {
      fetchPasskeys();
    } else if (activeTab === 'sessions') {
      fetchSessions();
    }
    setError(null);
    setSuccess(null);
  }, [activeTab]);

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
      const response = await fetch('/api/v1/auth/password/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
    try {
      setLoading(true);
      const response = await fetch('/api/v1/auth/mfa', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const body = await response.json();
      if (response.ok) {
        setMfaStatus(body.data || { enabled: false, types: [] });
      }
    } catch (err) {
      console.error('Error fetching MFA status', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollMFA = async () => {
    clearMessages();
    try {
      setLoading(true);
      const response = await fetch('/api/v1/auth/mfa/enroll', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
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
      const response = await fetch('/api/v1/auth/mfa/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: totpCode })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to activate TOTP');

      setSuccess('MFA activated successfully!');
      setMfaEnrollment(null);
      setTotpCode('');
      fetchMFAStatus();

      // Automatically generate backup codes for the user
      const codesRes = await fetch('/api/v1/auth/mfa/backup-codes', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
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
      const response = await fetch('/api/v1/auth/mfa', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: confirmPasswordForMFA })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to disable MFA');

      setSuccess('MFA has been disabled.');
      setShowDisableModal(false);
      setConfirmPasswordForMFA('');
      setBackupCodes([]);
      fetchMFAStatus();
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
      const response = await fetch('/api/v1/auth/mfa/backup-codes', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
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
    try {
      setLoading(true);
      const response = await fetch('/api/v1/passkeys', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const body = await response.json();
      if (response.ok) {
        setPasskeys(body.data || []);
      }
    } catch (err) {
      console.error('Error fetching passkeys', err);
    } finally {
      setLoading(false);
    }
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
      const beginRes = await fetch('/api/v1/passkey/register/begin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const beginBody = await beginRes.json();
      if (!beginRes.ok) throw new Error(beginBody.message || 'Failed to initialize WebAuthn ceremony');

      const { options, request_id } = beginBody.data;

      // Format options for navigator.credentials.create
      const publicKeyOptions = {
        ...options,
        challenge: base64URLToBuffer(options.challenge),
        user: {
          ...options.user,
          id: base64URLToBuffer(options.user.id)
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

      if (!credential) {
        throw new Error('Credential creation cancelled or failed');
      }

      // Format response body
      const attestationResponse = {
        id: credential.id,
        rawId: bufferToBase64URL(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: bufferToBase64URL(credential.response.clientDataJSON),
          attestationObject: bufferToBase64URL(credential.response.attestationObject),
          transports: typeof credential.response.getTransports === 'function' ? credential.response.getTransports() : []
        }
      };

      // Step 3: Complete registration
      const completeRes = await fetch(`/api/v1/passkey/register/complete?request_id=${request_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(attestationResponse)
      });
      const completeBody = await completeRes.json();
      if (!completeRes.ok) throw new Error(completeBody.message || 'Failed to verify attestation on server');

      setSuccess(`Passkey "${newPasskeyName}" registered successfully.`);
      setShowPasskeyModal(false);
      setNewPasskeyName('');
      fetchPasskeys();
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
      const response = await fetch(`/api/v1/passkeys/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to remove passkey');
      setSuccess('Passkey removed successfully.');
      fetchPasskeys();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Active Sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/auth/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const body = await response.json();
      if (response.ok) {
        setSessions(body.data || []);
      }

      // Check current session ID by calling validate session endpoint
      const curResponse = await fetch('/api/v1/auth/session', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const curBody = await curResponse.json();
      if (curResponse.ok) {
        setCurrentSessionId(curBody.data?.id || null);
      }
    } catch (err) {
      console.error('Error fetching sessions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    clearMessages();
    if (!window.confirm('Are you sure you want to terminate this session? The device will be signed out immediately.')) {
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Failed to revoke session');
      setSuccess('Session revoked.');
      fetchSessions();
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
    <div style={{ maxWidth: '1000px', margin: '20px auto 0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '28px', color: 'var(--color-text-main)' }}>Security & Profile Settings</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14.5px', marginTop: '4px' }}>
          Manage your identity credentials, passwords, multi-factor authentication devices, and active login sessions.
        </p>
      </div>

      {/* Main Panel Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Navigation Sidebar */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('profile')} 
            className="btn" 
            style={{ 
              justifyContent: 'flex-start', 
              width: '100%', 
              backgroundColor: activeTab === 'profile' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'profile' ? 'var(--color-primary)' : 'var(--color-text-main)'
            }}
          >
            <User style={{ width: '16px', height: '16px' }} />
            Profile & Password
          </button>
          
          <button 
            onClick={() => setActiveTab('mfa')} 
            className="btn" 
            style={{ 
              justifyContent: 'flex-start', 
              width: '100%', 
              backgroundColor: activeTab === 'mfa' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'mfa' ? 'var(--color-primary)' : 'var(--color-text-main)'
            }}
          >
            <Shield style={{ width: '16px', height: '16px' }} />
            Multi-Factor (2FA)
          </button>
          
          <button 
            onClick={() => setActiveTab('passkeys')} 
            className="btn" 
            style={{ 
              justifyContent: 'flex-start', 
              width: '100%', 
              backgroundColor: activeTab === 'passkeys' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'passkeys' ? 'var(--color-primary)' : 'var(--color-text-main)'
            }}
          >
            <Key style={{ width: '16px', height: '16px' }} />
            Passkeys (FIDO2)
          </button>
          
          <button 
            onClick={() => setActiveTab('sessions')} 
            className="btn" 
            style={{ 
              justifyContent: 'flex-start', 
              width: '100%', 
              backgroundColor: activeTab === 'sessions' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeTab === 'sessions' ? 'var(--color-primary)' : 'var(--color-text-main)'
            }}
          >
            <Laptop style={{ width: '16px', height: '16px' }} />
            Active Sessions
          </button>
        </div>

        {/* Tab Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Notifications */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: '8px', color: '#fca5a5' }}>
              <AlertTriangle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              <div style={{ fontSize: '14px' }}>{error}</div>
            </div>
          )}

          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 16px', borderRadius: '8px', color: '#a7f3d0' }}>
              <CheckCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              <div style={{ fontSize: '14px' }}>{success}</div>
            </div>
          )}

          {/* TAB 1: Profile & Password */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Profile Details Card */}
              <div className="glass-card">
                <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--color-text-main)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                  Account Profile
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Username</div>
                    <div style={{ fontSize: '15px', fontWeight: '600' }}>{profile?.preferred_username || '-'}</div>
                  </div>
                  
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Display Name</div>
                    <div style={{ fontSize: '15px', fontWeight: '600' }}>{profile?.name || '-'}</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Email Address</div>
                    <div style={{ fontSize: '15px', fontWeight: '600' }}>{profile?.email || 'Not configured'}</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Security Role</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                      {profile?.roles?.map(role => (
                        <span key={role} className="badge" style={{ margin: 0 }}>{role}</span>
                      )) || <span className="badge badge-secondary" style={{ margin: 0 }}>Standard User</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Mutation Card */}
              <div className="glass-card">
                <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--color-text-main)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                  Update Password
                </h3>
                
                <form onSubmit={handleChangePassword} style={{ maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Current Password</label>
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
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">New Password</label>
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
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Confirm New Password</label>
                    <input 
                      type="password" 
                      className="input-field" 
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                    />
                  </div>

                  <button className="btn btn-primary" type="submit" disabled={loading} style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
                    <Lock style={{ width: '16px', height: '16px' }} />
                    {loading ? 'Updating...' : 'Change Password'}
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 2: Multi-Factor (MFA) */}
          {activeTab === 'mfa' && (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Header */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)' }}>Two-Factor Authentication (2FA)</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px', marginTop: '2px' }}>
                    Protect your account with an authenticator app generating one-time passcode verification.
                  </p>
                </div>
                <div>
                  {mfaStatus.enabled ? (
                    <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-color)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Active</span>
                  ) : (
                    <span className="badge badge-secondary">Disabled</span>
                  )}
                </div>
              </div>

              {/* Status Section */}
              {!mfaStatus.enabled && !mfaEnrollment && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px' }}>
                  <p style={{ fontSize: '14.5px', lineHeight: '1.6', color: 'var(--color-text-muted)' }}>
                    Two-Factor Authentication adds an extra layer of security. Once activated, logging in will require your password and a verification code from your mobile authenticator app.
                  </p>
                  <button className="btn btn-primary" onClick={handleEnrollMFA} style={{ alignSelf: 'flex-start' }}>
                    <QrCode style={{ width: '16px', height: '16px' }} />
                    Set Up Authenticator App
                  </button>
                </div>
              )}

              {/* Enrollment setup view */}
              {mfaEnrollment && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h4 style={{ fontSize: '15.5px', color: 'var(--color-text-main)' }}>Step-up Authenticator Application</h4>
                  
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
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Verification Code</label>
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
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn btn-primary" type="submit" disabled={loading}>
                        <Check style={{ width: '16px', height: '16px' }} />
                        Verify and Activate
                      </button>
                      <button className="btn btn-secondary" type="button" onClick={() => setMfaEnrollment(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* MFA Active state view */}
              {mfaStatus.enabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '10px', color: '#a7f3d0' }}>
                    <Shield style={{ width: '24px', height: '24px', color: 'var(--success-color)' }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px' }}>Your account is protected by 2FA</div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        TOTP (Time-based One-time Password) application is registered.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={handleGenerateBackupCodes}>
                      <RefreshCw style={{ width: '14px', height: '14px' }} />
                      Regenerate Backup Codes
                    </button>
                    <button className="btn btn-danger" onClick={() => setShowDisableModal(true)}>
                      <Unlock style={{ width: '14px', height: '14px' }} />
                      Disable Two-Factor Auth
                    </button>
                  </div>
                </div>
              )}

              {/* Backup Codes Display */}
              {backupCodes.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
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

                  <div style={{ display: 'flex', gap: '12px' }}>
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
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: Passkeys */}
          {activeTab === 'passkeys' && (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Header */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)' }}>Passkeys</h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px', marginTop: '2px' }}>
                    Register biometrics or hardware security keys (WebAuthn / FIDO2) to log in instantly.
                  </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowPasskeyModal(true)}>
                  <Plus style={{ width: '13px', height: '13px' }} />
                  Add a Passkey
                </button>
              </div>

              {/* Passkeys List */}
              {passkeys.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px' }}>
                  <Key style={{ width: '36px', height: '36px', stroke: 'var(--color-text-dark)', marginBottom: '12px', display: 'inline-block' }} />
                  <div style={{ fontSize: '14.5px', fontWeight: '500' }}>No passkeys registered yet</div>
                  <p style={{ fontSize: '13px', marginTop: '4px', maxWidth: '320px', margin: '4px auto 0 auto' }}>
                    Add your computer's built-in Touch ID/Face ID or an external FIDO2 key.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {passkeys.map(passkey => (
                    <div 
                      key={passkey.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid rgba(255,255,255,0.04)', 
                        padding: '12px 16px', 
                        borderRadius: '8px' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '8px', borderRadius: '50%', color: 'var(--color-secondary)' }}>
                          <Key style={{ width: '16px', height: '16px' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14.5px', fontWeight: '600' }}>{passkey.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar style={{ width: '11px', height: '11px' }} />
                            {passkey.created_at ? new Date(passkey.created_at).toLocaleString() : 'Registered device'}
                          </div>
                        </div>
                      </div>

                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDeletePasskey(passkey.id, passkey.name)}
                        style={{ padding: '6px' }}
                        title="Remove Passkey"
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 4: Active Sessions */}
          {activeTab === 'sessions' && (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Header */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)' }}>Active Sessions</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '13.5px', marginTop: '2px' }}>
                  A list of browsers and devices currently signed in to your account.
                </p>
              </div>

              {/* Sessions Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Device / Browser</th>
                      <th style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--color-text-muted)' }}>IP Address</th>
                      <th style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Last Active</th>
                      <th style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(session => {
                      const isCurrent = session.id === currentSessionId;
                      return (
                        <tr 
                          key={session.id} 
                          style={{ 
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            backgroundColor: isCurrent ? 'rgba(99, 102, 241, 0.03)' : 'transparent' 
                          }}
                        >
                          <td style={{ padding: '14px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Laptop style={{ width: '16px', height: '16px', color: isCurrent ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                              <div>
                                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                                  {parseUserAgent(session.user_agent)}
                                </span>
                                {isCurrent && (
                                  <span 
                                    className="badge" 
                                    style={{ 
                                      marginLeft: '8px', 
                                      padding: '1px 6px', 
                                      fontSize: '9px',
                                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                      color: 'var(--color-primary)',
                                      border: '1px solid rgba(99, 102, 241, 0.3)',
                                      margin: 0
                                    }}
                                  >
                                    Current
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 8px', fontSize: '13.5px', color: 'var(--color-text-main)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin style={{ width: '12px', height: '12px', color: 'var(--color-text-dark)' }} />
                              {session.ip}
                            </span>
                          </td>
                          <td style={{ padding: '14px 8px', fontSize: '13.5px', color: 'var(--color-text-muted)' }}>
                            {new Date(session.last_active_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'right' }}>
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
                </table>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* MODAL 1: Disable MFA Confirmation */}
      {showDisableModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
              Confirm Disabling 2FA
            </h3>
            
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
              For security, you must enter your current account password to confirm disabling Two-Factor Authentication.
            </p>

            <form onSubmit={handleDisableMFA} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Account Password</label>
                <input 
                  type="password"
                  className="input-field" 
                  required
                  value={confirmPasswordForMFA}
                  onChange={e => setConfirmPasswordForMFA(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button className="btn btn-danger" type="submit" disabled={loading}>
                  {loading ? 'Disabling...' : 'Confirm Disable'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => { setShowDisableModal(false); setConfirmPasswordForMFA(''); }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Register Passkey Name Dialog */}
      {showPasskeyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
              Register Passkey
            </h3>
            
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
              Choose a friendly name for this passkey device so you can identify it later.
            </p>

            <form onSubmit={handleRegisterPasskey} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Passkey Name</label>
                <input 
                  type="text"
                  className="input-field" 
                  required
                  value={newPasskeyName}
                  onChange={e => setNewPasskeyName(e.target.value)}
                  placeholder="e.g. My YubiKey, Work Macbook TouchID"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Registering...' : 'Register Device'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => { setShowPasskeyModal(false); setNewPasskeyName(''); }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
