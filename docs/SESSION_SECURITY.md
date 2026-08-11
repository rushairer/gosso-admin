# Browser Session Security

The Admin client uses `HttpOnly` access and refresh-token cookies. It does not persist either credential in `localStorage` or `sessionStorage`; browser storage is limited to the short-lived PKCE verifier, OAuth state, and post-login route.

The required compatible migration is:

1. Gosso sets both access and rotating refresh credentials in `HttpOnly`, `Secure`, `SameSite` cookies and accepts refresh without requiring the browser to submit a stored refresh token.
2. The Admin SPA performs the authorization-code exchange only to establish same-origin cookies, then discards the token response.
3. The Admin SPA obtains a non-sensitive profile projection and sends CSRF headers for state-changing requests.

Production deployments must keep the strict CSP in `gosso-admin-frontend/nginx.conf`, prohibit third-party scripts, use immutable assets, and treat any XSS finding as an in-session action risk.
