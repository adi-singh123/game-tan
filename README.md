# Saturday & Sunday — Let's Play

A private, mobile-first weekend game made for Tannu.

## Run locally

1. Copy `.env.example` to `.env.local` and choose an `ADMIN_PASSWORD`.
2. Run `npm install`, then `npm run dev`.
3. Open `/` for the game and `/admin` for moderation.

## Vercel

Import the repository and add `ADMIN_PASSWORD`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in Project Settings → Environment Variables.

For phone-to-desktop approvals, create a free Supabase project, open its SQL Editor, and run [`supabase/schema.sql`](supabase/schema.sql). Copy the project URL and secret/service-role key into Vercel. Never use a `NEXT_PUBLIC_` prefix for the service key. Redeploy after adding the variables.

With Supabase configured, progress, answers, question edits, and approvals sync between Tannu’s phone and the desktop admin panel every two seconds. Without it, the app automatically falls back to same-browser `localStorage` mode.

To open a specific WhatsApp conversation, set `WHATSAPP_NUMBER` near the top of `app/page.tsx` to Aditya’s international number without `+` or spaces.
