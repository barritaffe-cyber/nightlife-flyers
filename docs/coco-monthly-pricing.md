# Coco pricing and flyer allowance

| Product | Catalog selection | Price | Volume and tools |
| --- | --- | --- | --- |
| One Flyer | `offer=one-flyer` | USD 5 once | One project, both sizes, template library, cinematic headlines, quick edits and logo upload |
| Coco | `basic:monthly` | USD 10/month | 20 new flyer projects per cycle, both sizes, quick edits, logo upload, saved projects, duplicate/reuse, remembered brand |
| Coco + Studio | `full:monthly` | USD 15/month | Same 20 projects, plus full studio, personal artwork/background/subject uploads, full assets, multiple brands and template requests |

Everyone sees the same template library. Copy says “new designs added regularly,” not an unverified weekly delivery promise. Template requests link to the contact form and guide the shared library; bespoke work and delivery dates are not promised.

## Counting

- One flyer is a project, identified by `cocoProjectId`. Square, Story, corrections and repeated downloads share that ID. Duplicate and a fresh Coco creation get a new ID. Imported project files retain their ID.
- One Flyer credits do not expire unused. First successful export binds one credit to its project and starts seven days of corrections/downloads. Buying again grants another credit without overwriting a subscription.
- Monthly allowance is 20 new project exports per paid cycle, keyed by the subscription's `current_period_end`. It does not roll over. Re-exporting a previously exported project while subscribed does not spend a new monthly credit. Use Duplicate to create the next event.
- Subscription credits are used before purchased extras. An extra can also reopen a past project after a subscription expires.
- The server checks before rendering and consumes only after a usable image exists, before returning the export artifact to the UI. Failure before consume spends nothing. A failed second format can be retried without an extra charge.
- The database locks the profile row to serialize concurrent exports. Payment references are unique and grant credits idempotently. Credits and usage have RLS and are only writable by the service role. The migration also removes the old profile self-update policy and client write grants so customers cannot grant themselves a plan or change their billing date. Existing profile updates already use server routes.
- As with the existing local canvas editor, this is product access control, not DRM: a client-rendered canvas cannot prevent a technical user from capturing or modifying their local artwork. The server prevents overspending credits through the supported flow; there is no claim of tamper-proof content/event recognition.

## Saved work and brand details

Subscriber Save downloads the portable `.nflyer` backup and stores the project in IndexedDB. Successful exports also save locally. **My flyers** opens this history; **Duplicate** creates a new project identity. Data is scoped to the signed-in user and stays on this device after cancellation; no cloud-sync claim is made. Expired subscribers can open retained work, but subscription save/duplicate is disabled and exporting requires an allowance/purchase.

One Flyer retains only its current exported project for reopening during the correction window, not a reusable history. Subscriber brand opt-in appears beside presenter/venue answers: remember presenter/logo, venue, address, socials, website and QR destination, excluding dates, pricing and lineup. Empty initial form defaults do not erase remembered values. Compatibility filtering still determines which fields each recipe can show. Existing Full/Studio multi-brand tools are retained.

## Billing and deployment

Public checkout reads the same catalog as the pricing cards: $5 once, $10/month, $15/month. No founding discount applies. Old Creator/Studio/yearly/passes remain parseable for receipts and keep their existing privileges. Monthly billing uses calendar months clamped at short month ends. The existing payment provider and recurring-payment agreement are preserved.

**Apply `supabase/migrations/20260918_coco_flyer_credits.sql` to Supabase before deploying the application changes.** It adds two tables and a service-role-only RPC, without replacing profiles or existing payments. The workspace has no PostgreSQL migration connection; the hosted database has not been changed. Checkout now performs a readiness check and refuses to initiate a payment if the allowance RPC is unavailable. Do not remove that guard to work around an unapplied migration.

The template uploader, subject/background replacement and artwork controls remain gated by `studioCapabilities`. Basic and One Flyer AI reservation are denied server-side. Full retains the existing Studio AI budget of 180 units per cycle, separate from the 20-flyer export allowance; unlimited AI is not advertised.

## Verification

```sh
node --experimental-strip-types --test tests/coco-studio-pricing.test.ts tests/coco-saved-flyers.test.ts tests/access-quota-starter.test.ts tests/founding-offer.test.ts tests/billing-provider.test.ts
# Install PGlite in a temporary directory; no production dependency required.
npm install --prefix /tmp/coco-pricing-db-test --no-audit --no-fund --ignore-scripts @electric-sql/pglite
PGLITE_MODULE=/tmp/coco-pricing-db-test/node_modules/@electric-sql/pglite/dist/index.js node scripts/verify-coco-flyer-allowance.mjs
node scripts/verify-coco-studio-pricing.mjs
```

- 21 unit tests cover catalog/capabilities, calendar billing, idempotent credit fulfillment, AI gates, legacy behavior, brand filtering and duplicate identity.
- SQL verification uses the actual migration in local PostgreSQL/PGlite: cap/reset, simultaneous retries, same-project reuse, correction expiry, repeated purchases, user isolation, legacy access and denied untrusted writes.
- Browser checks PASS all three tiers with zero page errors. One-off saved-current entry is verified; file round trips and duplicate exports are verified for both subscribers. Tests use isolated account/allowance fixtures; no customer records, payment transactions, emails or hosted database changes. Desktop/mobile pricing and three checkout products, Coco editing, logo upload, saved files, local history, duplicate, both-size exports and tier restrictions are exercised.
- Existing TypeScript baseline: 298 unrelated diagnostics. No new errors in pricing, access or saved-flyer code.
