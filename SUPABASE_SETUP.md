# Supabase + Firebase Auth setup for MeneElectricPower

This app keeps Firebase Authentication (Google sign-in) and replaces Firestore cloud storage with Supabase Postgres. Local browser storage remains available offline.

## Required configuration

Set these values in Vercel Project Settings → Environment Variables and in Codespaces Secrets for local development:

- `VITE_SUPABASE_URL`: `https://lqtwchfquemarmzanzqt.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: the project's anon/publishable key (not a `service_role` or secret key)

The URL is also the development fallback. The key must be provided through the secure environment. Restart/redeploy after changing environment variables.

## One-time Supabase dashboard setup

1. In Supabase, enable Firebase as a Third-Party Auth provider and configure it for the Firebase project used by this application (`aqueous-mode-d6pck`). Follow Supabase's Firebase integration instructions. This lets PostgREST verify Firebase ID tokens used by the app and makes the token subject available to RLS.
2. Apply `supabase/migrations/20261108000100_circuits_and_custom_components.sql` to the shared Supabase project using the Supabase SQL editor or the authorized Supabase CLI. Review the SQL before applying it.
3. Keep Firebase Google sign-in enabled. The Firebase UID (`sub` in the verified Firebase token) is used as the owner key in Supabase policies.

Without the Firebase third-party auth integration and migration, cloud requests will fail closed; offline local storage still works. Do not disable RLS or put service-role keys in browser code.

## Data migration note

This changes future cloud reads/writes to Supabase. Existing Firestore documents are not copied or deleted. Export/migrate existing data separately only after reviewing the data and choosing an authorized migration plan.
