# Mobile App Readiness

BJ Fit is configured as an installable PWA and can also be wrapped as a separate Android app with a Trusted Web Activity.

## Web/PWA

- Root manifest is served from `/manifest.json`.
- App icons are served from `/icon.svg` and `/maskable-icon.svg`.
- Install prompt support is wired in the dashboard/profile UI.
- Notification permission and 24-hour workout reminders are wired in the dashboard/profile UI.

## Google Sign-In

The landing page uses Google Identity Services when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set.

Required Google Cloud setup:

- Authorized JavaScript origins must include the production HTTPS origin.
- For local testing, include `http://localhost:3000` and `http://127.0.0.1:3000`.
- Supabase Google provider must be enabled and configured for the same Google OAuth client.

## Android/TWA

For a Play Store release:

- Deploy the app to a production HTTPS domain.
- Generate Android package metadata with Bubblewrap or Android Studio TWA tooling.
- Host a Digital Asset Links file at `https://YOUR_DOMAIN/.well-known/assetlinks.json`.
- Add Play Store screenshots, privacy policy, Data Safety answers, and app signing.

If a fully separate native app is preferred later, keep Supabase as the backend and use platform Google Sign-In to obtain an ID token, then call Supabase `signInWithIdToken`.
