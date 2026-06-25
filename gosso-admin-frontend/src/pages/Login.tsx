import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { setCookie, fetchUserProfile } from '../auth';

export default function Login() {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  // Capture where we should redirect back to (e.g. GOSSO authorize URL)
  const redirectUri = searchParams.get('redirect_uri') || '/admin';

  const doRedirect = () => {
    if (redirectUri.startsWith('/')) {
      window.location.href = `${window.location.origin}${redirectUri}`;
    } else {
      window.location.href = redirectUri;
    }
  };

  const storeTokensAndRedirect = async (data: { access_token: string; refresh_token: string; expires_in: number }) => {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    setCookie('access_token', data.access_token, data.expires_in || 900);

    try {
      await fetchUserProfile(data.access_token);
    } catch (profileErr) {
      console.warn('Failed to fetch user profile after login:', profileErr);
    }

    doRedirect();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || 'Login failed. Please check your credentials.');
      }

      // Check if MFA is required
      if (body.data?.requires_mfa) {
        setMfaRequired(true);
        setMfaToken(body.data.mfa_token);
        setMfaCode('');
        setLoading(false);
        return;
      }

      await storeTokensAndRedirect(body.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfa_token: mfaToken,
          code: mfaCode.trim(),
          type: 'totp',
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || 'Verification failed. Please try again.');
      }

      await storeTokensAndRedirect(body.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '32px', marginBottom: '8px' }}>GOSSO</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14.5px' }}>Identity & Access Provider Console</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--danger-color)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {!mfaRequired ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Username / Email</label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaVerify}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', color: 'var(--color-primary)' }}>
              Two-factor authentication required. Enter the code from your authenticator app.
            </div>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label">Verification Code</label>
              <input
                type="text"
                maxLength={8}
                className="input-field"
                placeholder="Enter 6-digit code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                autoFocus
                style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '0.15em', fontWeight: 'bold' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '10px' }}
              onClick={() => { setMfaRequired(false); setError(null); setMfaCode(''); }}
              disabled={loading}
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
