# Browser Session Security

The GOSSO Admin frontend uses the **identity provider's Cookie session mode** (`gosso-admin-frontend/src/auth.ts` sets `sessionMode: 'cookie'`). This differs from the **Blog confidential BFF** (`gouno-blog/blog-backend/internal/authbff`), where the browser has an opaque Blog session handle and provider OAuth tokens remain server-side. GOSSO sets `HttpOnly` access and refresh-token cookies. It does not persist either credential in `localStorage` or `sessionStorage`; browser storage is limited to the short-lived PKCE verifier, OAuth state, and post-login route.

The required compatible migration is:

1. Gosso sets both access and rotating refresh credentials in `HttpOnly`, `Secure`, `SameSite` cookies and accepts refresh without requiring the browser to submit a stored refresh token.
2. The Admin SPA performs the authorization-code exchange only to establish same-origin cookies, then discards the token response.
3. The Admin SPA obtains a non-sensitive profile projection and sends CSRF headers for state-changing requests.

Production deployments must keep the strict CSP in `gosso-admin-frontend/nginx.conf`, prohibit third-party scripts, use immutable assets, and treat any XSS finding as an in-session action risk.

The integrated multi-origin topology is documented in [Gouno Blog As-Is Architecture](https://github.com/rushairer/gouno-blog/blob/main/docs/architecture/README.md). GOSSO Admin uses the GOSSO origin and its own authorization checks; Blog Admin uses Blog-local memberships and permissions.
