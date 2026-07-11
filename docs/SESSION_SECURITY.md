# Browser Session Security

Gosso already issues an `HttpOnly` access-token cookie and supports cookie authentication. The current Admin client still persists access and refresh tokens through `@gosso/client`; therefore the complete BFF/session migration is not yet finished.

The required compatible migration is:

1. Gosso sets both access and rotating refresh credentials in `HttpOnly`, `Secure`, `SameSite` cookies and accepts refresh without exposing the refresh token to JavaScript.
2. OAuth authorization-code exchange terminates at a same-origin backend endpoint, not in the SPA.
3. The Admin SPA obtains only a non-sensitive session/profile projection and sends CSRF headers for state-changing requests.
4. `@gosso/client` releases a cookie-session mode; Admin removes legacy token migration only after one deprecation release.

Until then, production deployments must keep the strict CSP in `gosso-admin-frontend/nginx.conf`, prohibit third-party scripts, use immutable assets, and treat any XSS finding as credential exposure.
