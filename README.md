# Saturday & Sunday — Let's Play

A private, mobile-first weekend game made for Tannu.

## Run locally

1. Copy `.env.example` to `.env.local` and choose an `ADMIN_PASSWORD`.
2. Run `npm install`, then `npm run dev`.
3. Open `/` for the game and `/admin` for moderation.

## Vercel

Import the repository and add `ADMIN_PASSWORD` in Project Settings → Environment Variables. No database or paid service is needed.

Progress, answers, the compressed selected photo, and moderation status stay in `localStorage`. The game and admin panel therefore need the same browser/device. For separate-device moderation, replace the storage helper with a database API later.

To open a specific WhatsApp conversation, set `WHATSAPP_NUMBER` near the top of `app/page.tsx` to Aditya’s international number without `+` or spaces.
