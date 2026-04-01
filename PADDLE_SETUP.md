# Paddle Setup

This repo is wired for **Paddle only**.

Use this checklist to move from local scaffolding to a working Paddle sandbox, then to live.

## 1. Run the schema update

Apply [`supabase/schema.sql`](./supabase/schema.sql) so profiles can store:

- `paddle_customer_id`
- `paddle_subscription_id`

## 2. Create the Paddle catalog

In Paddle, create products and related prices for the exact billing items used in [`lib/billing/catalog.ts`](./lib/billing/catalog.ts):

- `Creator Monthly`
- `Creator Yearly`
- `Studio Monthly`
- `Studio Yearly`
- `Night Pass`
- `Weekend Pass`

Use the generated `pri_...` IDs in these env vars:

- `PADDLE_PRICE_CREATOR_MONTHLY`
- `PADDLE_PRICE_CREATOR_YEARLY`
- `PADDLE_PRICE_STUDIO_MONTHLY`
- `PADDLE_PRICE_STUDIO_YEARLY`
- `PADDLE_PRICE_NIGHT_PASS`
- `PADDLE_PRICE_WEEKEND_PASS`

## 3. Create the API key

Create a server-side Paddle API key and set:

- `PADDLE_API_KEY`

This app calls the Paddle API from server routes only:

- [`/app/api/billing/checkout/route.ts`](./app/api/billing/checkout/route.ts)
- [`/app/api/billing/portal/route.ts`](./app/api/billing/portal/route.ts)

## 4. Set the payment link domain

This integration creates transactions and passes `checkout.url = NEXT_PUBLIC_SITE_URL`.

That means your Paddle payment-link domain must match the site URL you deploy with:

- local testing: use a forwarded/public URL if needed
- sandbox: domains are automatically approved
- live: request approval for the real production domain before launch

Set:

- `NEXT_PUBLIC_SITE_URL`

## 5. Create the webhook destination

Create a Paddle notification destination that points to:

- `https://<your-domain>/api/billing/webhook`

Recommended settings:

- Type: `URL`
- API version: `1`
- Usage type during sandbox: `platform and simulation`

Subscribe to these events:

- `transaction.completed`
- `subscription.activated`
- `subscription.updated`
- `subscription.canceled`
- `subscription.paused`
- `subscription.resumed`

Store the endpoint secret as:

- `PADDLE_WEBHOOK_SECRET`

The webhook handler is:

- [`/app/api/billing/webhook/route.ts`](./app/api/billing/webhook/route.ts)

## 6. Configure Vercel env vars

Set the billing env vars from [`.env.example`](./.env.example):

```bash
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
PADDLE_PRICE_CREATOR_MONTHLY=
PADDLE_PRICE_CREATOR_YEARLY=
PADDLE_PRICE_STUDIO_MONTHLY=
PADDLE_PRICE_STUDIO_YEARLY=
PADDLE_PRICE_NIGHT_PASS=
PADDLE_PRICE_WEEKEND_PASS=
NEXT_PUBLIC_SITE_URL=
```

## 7. Deploy and verify checkout

Run:

```bash
npm run lint
npm test
npm run build
```

Then verify:

1. Sign in and open `/pricing`.
2. Start a `Creator Monthly` checkout.
3. Complete the checkout in Paddle sandbox.
4. Confirm the webhook updates the profile row.
5. Open `/profile` and verify access is active.
6. Open `/billing/portal` and verify Paddle returns a portal URL.
7. Repeat with `Night Pass` to verify one-time entitlement flow.

## 8. What this repo expects from Paddle

Recurring plan access is provisioned from `subscription.*` events.

One-time pass access is provisioned from `transaction.completed`.

If checkout succeeds but webhooks are not delivered, payment may complete while app access does not update. Check Paddle notification logs first.

## 9. Live launch notes

- Request live domain approval before launch.
- Point the live notification destination to the production domain, not a preview URL.
- Re-check all live `pri_...` IDs. Sandbox and live IDs are different.
- Do one live low-value test purchase before opening traffic.
