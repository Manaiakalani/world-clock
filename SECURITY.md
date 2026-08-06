# Security Policy

## Supported versions

World Clock is a single-page application with no backend and no stored user
data. Security fixes land on `main` and are released as a new tag.

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately through GitHub Security Advisories:

<https://github.com/Manaiakalani/world-clock/security/advisories/new>

Please include:

- A description of the issue and why you believe it is a security problem
- Steps to reproduce, ideally with a minimal proof of concept
- The affected version, commit, or deployed URL
- Any suggested remediation

### What to expect

| Stage                | Target                        |
| -------------------- | ----------------------------- |
| Acknowledgement      | Within 3 business days        |
| Initial assessment   | Within 7 business days        |
| Fix or mitigation    | Depends on severity           |
| Public disclosure    | Coordinated, after a fix ships |

We will keep you updated as the report progresses, and we are happy to credit
you in the advisory unless you prefer to stay anonymous.

## Scope

In scope:

- The application source in this repository
- The build, container, and CI configuration in this repository
- Dependency vulnerabilities that are reachable from this application

Out of scope:

- Findings that require a compromised device, browser, or browser extension
- Denial of service through sheer traffic volume against a self-hosted instance
- Missing hardening headers that are already documented as intentional below
- Vulnerabilities in <https://api.open-meteo.com>, the one third-party API this
  app calls. Report those to Open-Meteo directly.

## Security posture

These choices are deliberate and worth knowing before you file a report:

- **No accounts, no backend, no database.** Everything runs client side.
  There are no credentials to steal and no server-side user records.
- **No telemetry, analytics, cookies, or fingerprinting.** The app collects
  nothing. Preferences (tracked regions, theme, clock style) are kept in
  `localStorage` on the user's own device and never transmitted.
- **One third-party origin.** Weather comes from Open-Meteo, which needs no API
  key and receives only coarse coordinates for cities the user chose to track.
- **A strict Content Security Policy** is set in `next.config.ts`, alongside
  `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy`, and HSTS.
  - `'unsafe-inline'` remains in `script-src` because Next.js emits inline
    bootstrap and hydration scripts and this app has no middleware to inject a
    per-request nonce. Adding a nonce would make browsers ignore
    `'unsafe-inline'` and break hydration.
  - `'unsafe-eval'` is only present in development, for the dev overlay and HMR.
- **Dependencies are pinned to exact versions** in `package.json`, and
  `package-lock.json` is committed, so CI, Docker, and local installs all
  resolve to identical artifacts. Dependabot watches npm, GitHub Actions, and
  Docker so pinning does not turn into stale, unpatched versions.
  - The `overrides` block deliberately keeps caret ranges. Those entries exist
    to force a *minimum* patched version of a transitive package, so pinning
    them exactly would block future security patches rather than guarantee them.
  - Transitive packages still declare their own ranges inside the lockfile. That
    is upstream metadata; the resolved tree is fixed by `package-lock.json` and
    verified by its `integrity` hashes.
- **CI actions are pinned to full commit SHAs**, so a compromised or retagged
  action release cannot silently enter the build.

## Self-hosting notes

If you deploy your own instance:

- Serve it over HTTPS. The app sends HSTS with a two-year `max-age`.
- Set `NEXT_PUBLIC_SITE_URL` to your real origin so canonical URLs,
  `robots.txt`, `sitemap.xml`, and `.well-known/security.txt` are correct.
- Replace the contact details in this file with your own so reports reach you
  rather than us.
