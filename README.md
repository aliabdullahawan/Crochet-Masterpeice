# Crochet Masterpiece

Handcrafted crochet storefront with a full admin dashboard for products, orders, discounts, and custom requests.

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase (PostgreSQL + Auth)
- Recharts
- Leaflet

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env.local` file in the project root:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App URL (required)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Google OAuth (optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Brevo email (optional)
BREVO_API_KEY=
BREVO_SMTP_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=

# Social API tokens (optional)
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_USER_ID=
FACEBOOK_ACCESS_TOKEN=
FACEBOOK_PAGE_ID=
TIKTOK_ACCESS_TOKEN=

# WhatsApp (optional)
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_WHATSAPP_CHANNEL=
```

### 3) Set up the database

- Run `DATABASE.sql` in your Supabase SQL editor.
- Optional SQL helpers live in the root (for example: `SETUP_SUPABASE.sql`).

### 4) Start the dev server

```bash
npm run dev
```

Visit: http://localhost:3000

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## App Structure (High Level)

- `app/` routes for user and admin experiences
- `components/` reusable UI and layout pieces
- `lib/` Supabase client, contexts, and helpers
- `public/` static assets

## Admin Access

- Admin dashboard is under `/admin`.
- Admin users are stored in the `admins` table (Supabase).

## Deployment (Vercel)

1. Push to GitHub (do not commit `.env.local`).
2. Import the repo in Vercel.
3. Add the env vars from `.env.local` in Vercel settings.
4. Update `NEXT_PUBLIC_SITE_URL` to your production URL.
5. In Supabase Auth settings, add your production URL to allowed redirect/site URLs.

## Notes

- The root route `/` redirects to `/user/home`.
- If you plan to make this repository public, remove any credentials from local guides or scripts.
