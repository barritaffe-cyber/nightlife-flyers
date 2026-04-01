# Nightlife Flyers

Production stack:

- `Vercel` for the app and API routes
- `Supabase` for auth and database
- `Vercel Blob` for edit-region storage

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment

Copy the variables in [`.env.example`](./.env.example) into your local `.env.local` and Vercel project settings.

## Database

Apply the schema in [`supabase/schema.sql`](./supabase/schema.sql) to your Supabase project before testing auth flows.

## Production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the live launch checklist and required hosting setup.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
