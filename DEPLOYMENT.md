# Deployment

Production hosting for this app is:

- `Vercel` for the Next.js app and API routes
- `Supabase` for auth and Postgres
- `Vercel Blob` for edit-region storage

## Required Setup

1. Create or choose the production Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL editor.
3. In Supabase Auth, set:
   - `Site URL` to the production domain
   - redirect URLs for:
     - `http://localhost:3000/**`
     - the production Vercel domain
     - the custom production domain
4. In Vercel, set the environment variables from [`.env.example`](./.env.example).
5. Ensure `NEXT_PUBLIC_SITE_URL` matches the real production URL.
6. Attach the custom domain in Vercel.
7. Deploy to the Vercel production environment.
8. Follow the Paddle dashboard checklist in [`PADDLE_SETUP.md`](./PADDLE_SETUP.md).

## Minimum Environment Variables

Core app:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_AUTH_GATE_ENABLED=1`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_SECRET`

Feature providers used by this repo:

- `BLOB_READ_WRITE_TOKEN`
- `OPENAI_API_KEY`
- `REPLICATE_API_TOKEN`
- `FAL_KEY`
- `STABILITY_API_KEY`
- `REMOVE_BG_API_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`

Billing:

- `PADDLE_API_KEY`
- `PADDLE_WEBHOOK_SECRET`
- `PADDLE_PRICE_CREATOR_MONTHLY`
- `PADDLE_PRICE_CREATOR_YEARLY`
- `PADDLE_PRICE_STUDIO_MONTHLY`
- `PADDLE_PRICE_STUDIO_YEARLY`
- `PADDLE_PRICE_NIGHT_PASS`
- `PADDLE_PRICE_WEEKEND_PASS`

## Launch Checks

Run before sending traffic:

1. `npm run lint`
2. `npm run build`
3. Verify signup on the production domain
4. Verify login/logout on the production domain
5. Verify `/api/auth/profile-bootstrap`
6. Verify `/api/auth/status`
7. Verify starter access flow
8. Verify one AI generation flow
9. Verify export on desktop
10. Verify export on mobile
11. Verify profile/account panel
12. Verify `/billing/checkout`
13. Verify `/billing/portal`
14. Verify `/api/billing/checkout`
15. Verify `/api/billing/webhook`

## Notes

- The app currently uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` in code, so that exact env name must exist in Vercel.
- If you use manual pass or subscription activation, the admin route expects `ADMIN_SECRET`.
- Paddle checkout should use an approved `NEXT_PUBLIC_SITE_URL` domain, and your Paddle notification destination should point to `/api/billing/webhook`.
