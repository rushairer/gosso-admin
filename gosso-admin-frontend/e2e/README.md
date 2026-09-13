# Gosso Admin browser acceptance

This runner validates the real Gosso Admin Vite application against deterministic network fixtures. It does not add test-only branches to production authentication or UI code.

Coverage:

- 11 real routes across 1440 / 1024 / 768 / 390 viewports
- light and dark theme rendering
- AppShell brand/theme ownership, page visibility, horizontal overflow, unknown API calls, console/page errors
- mobile navigation drawer routing and focus restoration
- client editor and audit detail modals
- Site Settings load failure/retry plus the real AppShell sticky preview offset
- System Status degraded readiness and refresh recovery

The GitHub Actions workflow retains the Playwright HTML report, screenshots, traces on retry, and failure evidence for seven days.
