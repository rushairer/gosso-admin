import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, UserCheck, Key, Settings } from 'lucide-react';
import { isLoggedIn, isAdmin, redirectToAuthorize, getUserProfile } from '../auth';
import type { UserProfile } from '../auth';

export default function Home() {
  const navigate = useNavigate();
  const [logged, setLogged] = useState(false);
  const [userAdmin, setUserAdmin] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setLogged(isLoggedIn());
    setUserAdmin(isAdmin());
    setUser(getUserProfile());
  }, []);

  const handleAction = () => {
    if (logged) {
      if (userAdmin) {
        navigate('/admin');
      } else {
        alert('You do not have administrator permissions.');
      }
    } else {
      redirectToAuthorize('/admin');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="glass-card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.12)',
            padding: '12px',
            borderRadius: '8px',
            display: 'inline-flex',
            width: 'fit-content',
            border: '1px solid rgba(59, 130, 246, 0.22)'
          }}>
            <ShieldCheck style={{ width: '28px', height: '28px', stroke: 'var(--color-primary)' }} />
          </div>

          <h2 style={{ fontSize: '26px', lineHeight: '1.25', color: 'var(--color-text-main)' }}>
            GOSSO Admin Console
          </h2>
          
          <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', maxWidth: '680px', lineHeight: '1.6' }}>
            Welcome to the self-hosted OpenID Connect / OAuth 2.0 identity provider administration interface. Manage security credentials, clients, user scopes, and active sessions.
          </p>

          <div>
            {logged ? (
              userAdmin ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <p style={{ color: 'var(--success-color)', fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success-color)' }} />
                    Logged in as {user?.preferred_username || user?.name || 'Administrator'}
                  </p>
                  <button className="btn btn-primary" onClick={handleAction}>
                    Enter Dashboard
                    <ArrowRight style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <p style={{ color: 'var(--warning-color)', fontWeight: '600', fontSize: '15px' }}>
                    Access Denied: Account lacks administrator permissions.
                  </p>
                  <button className="btn btn-secondary" onClick={() => navigate('/')}>
                    Refresh Credentials
                  </button>
                </div>
              )
            ) : (
              <button className="btn btn-primary" onClick={handleAction}>
                Sign In to Console
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
        
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px' }}>
          <div style={{ display: 'inline-flex', color: 'var(--color-primary)' }}>
            <Key style={{ width: '24px', height: '24px' }} />
          </div>
          <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)' }}>Client Registry</h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
            Register and configure OAuth2 Client credentials, authorized redirect URIs, scopes, and flow models.
          </p>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px' }}>
          <div style={{ display: 'inline-flex', color: 'var(--color-secondary)' }}>
            <UserCheck style={{ width: '24px', height: '24px' }} />
          </div>
          <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)' }}>User Control</h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
            Audit active accounts, update account status, and assign roles for permission scopes.
          </p>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px' }}>
          <div style={{ display: 'inline-flex', color: 'var(--color-primary)' }}>
            <Settings style={{ width: '24px', height: '24px' }} />
          </div>
          <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)' }}>MFA & Passkeys</h3>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
            View system audit logs, configure security, and manage global OIDC provider discovery profiles.
          </p>
        </div>

      </div>

    </div>
  );
}
