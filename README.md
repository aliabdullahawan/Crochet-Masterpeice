# Crochet Masterpiece

Handcrafted crochet commerce platform with a modern customer experience and a complete admin back office.

This README is intentionally detailed to document architecture, data flow, API routes, and operational setup for both developers and stakeholders.

## Table of Contents

- Overview
- Key Features
- User Journey
- Admin Journey
- Tech Stack
- Quick Start
- Environment Variables
- Database Setup
- Project Architecture
- Key Files and Modules
- API Routes Reference
- Database Schema Overview
- Authentication and Authorization
- Email and Notifications
- Discounts and Coupons
- Custom Orders
- Performance Notes
- Security and Secrets
- Deployment (Vercel)
- Troubleshooting
- Contributing
- Roadmap

## Overview

Crochet Masterpiece is a full-stack storefront for handcrafted crochet products. It combines a rich marketing site, a product catalog, a cart and checkout flow, and a fully featured admin panel for daily operations.

The system is designed for:

- Small business owners who need a clean, high-trust shopping experience.
- Admins who need to manage products, orders, custom orders, and discounts quickly.
- Developers who want a clear structure with typed data, reusable components, and a stable API layer.

## Key Features

Customer-facing experience:

- Modern landing page with motion, storytelling, and social proof.
- Shop catalog with filters, discount support, and quick actions.
- Product details with reviews and related items.
- Cart and wishlist stored locally for guests and synced for logged-in users.
- Custom order request flow for made-to-order items.
- Notifications and order history for signed-in users.

Admin experience:

- Dashboard with KPIs, recent orders, and notifications.
- Products and categories management, including featured items and stock tracking.
- Orders management with status changes and return updates.
- Custom orders pricing flow and internal notifications.
- Discounts with code or badge offers, per product or category.
- Reviews moderation with hide and delete actions.

## User Journey

1. Visit the storefront and explore featured collections.
2. Browse the shop, open product details, and add items to the cart or wishlist.
3. Apply a coupon code if available.
4. Checkout and submit an order request, including delivery details.
5. Receive confirmation and follow order status from the profile area.

Key entry points:

- Root route redirects to the user home page. The logic lives in [app/page.tsx](app/page.tsx).
- The marketing and home experience is in [app/user/home/page.tsx](app/user/home/page.tsx).
- The catalog lives in [app/user/shop/page.tsx](app/user/shop/page.tsx).
- Product details live in [app/user/shop/[id]/page.tsx](app/user/shop/[id]/page.tsx).

## Admin Journey

1. Sign in and land on the admin dashboard.
2. Review recent orders, check low stock alerts, and monitor revenue.
3. Update order status and send notifications to customers.
4. Manage products, categories, and promotions.
5. Respond to reviews and monitor custom order requests.

Key entry points:

- Admin layout and session check live in [app/admin/layout.tsx](app/admin/layout.tsx) and [components/admin/AdminSecurityGate.tsx](components/admin/AdminSecurityGate.tsx).
- Dashboard lives in [app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx).

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase (PostgreSQL and Auth)
- Recharts
- Leaflet

## Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Start from the example environment file: [.env.example](.env.example)

Place the values in your local environment file and fill them in with your own credentials.

Required variables (minimum for local dev):

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Optional variables (enable additional features):

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

BREVO_API_KEY=
BREVO_SMTP_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=

INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_USER_ID=
FACEBOOK_ACCESS_TOKEN=
FACEBOOK_PAGE_ID=
TIKTOK_ACCESS_TOKEN=

NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_WHATSAPP_CHANNEL=

CRON_SECRET=
TEST_EMAIL_SECRET=
```

### 3) Set up the database

Run the schema in [DATABASE.sql](DATABASE.sql) in your Supabase SQL editor.

Optional helper scripts can be found in files like [SETUP_SUPABASE.sql](SETUP_SUPABASE.sql).

### 4) Start the dev server

```bash
npm run dev
```

Open http://localhost:3000

## Environment Variables

Use [.env.example](.env.example) as the canonical list. The app reads from environment at build and runtime.

Variable groups:

- Supabase: URL, anon key, and service role key for server-side tasks.
- Site URL: used for OAuth and email link generation.
- OAuth: Google client ID and secret for social login.
- Email: Brevo keys and sender identity for transactional emails.
- Social APIs: tokens for follower counts and social stats.
- Cron and test keys: for server-only endpoints such as low stock scans and email tests.

## Database Setup

The schema is defined in [DATABASE.sql](DATABASE.sql). It creates tables for products, categories, orders, users, custom orders, discounts, reviews, and notifications.

Recommended steps:

1. Run the SQL schema from [DATABASE.sql](DATABASE.sql).
2. Confirm that tables exist and can be accessed from the admin and user flows.
3. Review RLS policies if you are customizing access rules.

## Project Architecture

The app uses the Next.js App Router with a clear separation between user-facing routes and admin routes.

High-level architecture:

- App Router pages define route composition.
- Layouts and providers set up global state and design defaults.
- Supabase clients manage data and auth for both browser and server.
- Contexts provide cart, wishlist, and user state for the entire app.

Key runtime flows:

- User auth and profile session are managed in [lib/AuthContext.tsx](lib/AuthContext.tsx).
- Cart and wishlist state live in [lib/ShopContext.tsx](lib/ShopContext.tsx).
- Supabase client utilities live in [lib/supabase.ts](lib/supabase.ts).
- Root layout, fonts, and global styles are in [app/layout.tsx](app/layout.tsx) and [app/globals.css](app/globals.css).

## Key Files and Modules

The list below highlights the most important files to understand and extend the project:

- [app/page.tsx](app/page.tsx): Root redirect into the user site.
- [app/user/home/page.tsx](app/user/home/page.tsx): Marketing home page composition.
- [app/user/shop/page.tsx](app/user/shop/page.tsx): Product catalog view.
- [app/user/shop/[id]/page.tsx](app/user/shop/[id]/page.tsx): Product detail page.
- [app/user/cart/page.tsx](app/user/cart/page.tsx): Cart page (legacy but still supported).
- [app/user/wishlist/page.tsx](app/user/wishlist/page.tsx): Wishlist page (legacy but still supported).
- [components/layout/Navbar.tsx](components/layout/Navbar.tsx): Navbar and drawers.
- [components/layout/Footer.tsx](components/layout/Footer.tsx): Footer and social links.
- [components/user/HeroSection.tsx](components/user/HeroSection.tsx): Homepage hero and social stats.
- [components/user/FeaturedProducts.tsx](components/user/FeaturedProducts.tsx): Featured items and ratings.
- [components/user/ReviewsSection.tsx](components/user/ReviewsSection.tsx): Reviews carousel and live updates.
- [components/admin/AdminNavbar.tsx](components/admin/AdminNavbar.tsx): Admin navigation and notifications.
- [components/admin/AdminSecurityGate.tsx](components/admin/AdminSecurityGate.tsx): Admin session guard.
- [lib/supabase.ts](lib/supabase.ts): Supabase client setup.
- [lib/AuthContext.tsx](lib/AuthContext.tsx): User auth provider.
- [lib/ShopContext.tsx](lib/ShopContext.tsx): Cart and wishlist provider.
- [next.config.ts](next.config.ts): Next.js configuration.
- [package.json](package.json): Scripts and dependencies.

## API Routes Reference

These routes are implemented as Next.js Route Handlers. They are grouped by purpose below.

Public or general endpoints:

- POST /api/validate-coupon
  - Validates discount codes against the discounts table.
  - Returns discount type, value, and scope.

- GET /api/social-counts
  - Aggregates social counts from APIs and Supabase fallback values.
  - Includes total community size and sources.

Authentication helpers:

- POST /api/auth/check-email
  - Checks if a user account exists for a given email.
  - Used by the magic link and signup flows.

Development tools:

- POST /api/dev/test-email
  - Sends a test transactional email if server secrets are configured.
  - Blocked unless a test secret is provided.

Order creation and checkout:

- POST /api/orders/query
  - Creates a pending order query (pre-checkout intent).
  - Inserts order items and updates stock if available.

- POST /api/orders/checkout
  - Creates a full order with delivery details and optional custom order payload.
  - Sends confirmation emails and admin notifications when enabled.

User order APIs (authenticated via bearer token):

- GET /api/user/orders
  - Returns a list of the current user orders with items.

- DELETE /api/user/orders?id=...
  - Deletes linked notifications for an order.

- GET /api/user/orders/[id]
  - Returns detailed order information and status history.

- PATCH /api/user/orders/[id]
  - Cancels an order if it is still cancellable.

Admin APIs:

- GET /api/admin/orders
  - Returns orders with optional limit parameter.

- PATCH /api/admin/orders
  - Updates return status and posts user notifications.

- DELETE /api/admin/orders?id=...
  - Deletes an order by id.

- GET /api/admin/custom-orders
  - Returns all custom order requests.

- PATCH /api/admin/custom-orders
  - Quotes or rejects a custom order.

- GET /api/admin/low-stock
  - Scans low-stock items and creates admin notifications.

- POST /api/admin/low-stock
  - Same as GET; can be secured with a cron secret.

- POST /api/admin/social-counts
  - Updates manual social counts in site settings.

- POST /api/admin/notifications
  - Sends a user notification (admin message, promo, order update).

- GET /api/admin/reviews
  - Returns reviews with optional hidden entries.

- PATCH /api/admin/reviews
  - Hides or un-hides a review.

- DELETE /api/admin/reviews
  - Deletes a review by id.

- GET /api/admin/admin-notifications
  - Returns admin notifications with optional filters.

- POST /api/admin/admin-notifications
  - Creates a new admin notification.

- PATCH /api/admin/admin-notifications
  - Marks read, marks all read, or clears all notifications.

- POST /api/admin/email/bulk
  - Sends a bulk email to active users, optionally only subscribed users.

## Database Schema Overview

Core domain tables:

- users: customer profiles and metadata.
- products: catalog items, pricing, and stock.
- categories: product grouping and display order.
- orders: master order records.
- order_items: line items tied to orders.
- custom_orders: custom requests and quotes.
- discounts: coupon codes and badge discounts.
- reviews: product reviews with moderation support.
- notifications: user notifications.
- admin_notifications: internal admin alerts.
- site_settings: dynamic settings such as social counts and hidden review ids.

Notes:

- Some endpoints use the service role key to bypass RLS for admin tasks.
- Ensure your RLS policies reflect your public and private access model.

## Authentication and Authorization

User authentication:

- Supabase Auth handles email/password and OAuth sign-in.
- Auth state is stored and shared via [lib/AuthContext.tsx](lib/AuthContext.tsx).

Admin authentication:

- Admin sessions are stored locally using a session key in local storage.
- Admin guard logic is in [components/admin/AdminSecurityGate.tsx](components/admin/AdminSecurityGate.tsx).
- Admin user records live in the admins table.
- Remove any hardcoded fallback checks before deploying a public version.

## Email and Notifications

Email:

- Transactional emails are sent via Brevo.
- The checkout flow validates email setup and sends confirmations.

User notifications:

- User notifications are stored in the notifications table.
- Admins can create notifications via the admin API.

Admin notifications:

- Admin alerts are stored in admin_notifications.
- Low stock scans create notifications when stock drops.

## Discounts and Coupons

Discounts are stored in the discounts table and can be:

- Code-based or badge-based.
- Applied to all products, a category, a specific product, or the entire cart.
- Limited by usage count and date range.

The validation logic lives in the coupon API route and uses a consistent response shape.

## Custom Orders

Custom orders support:

- User-submitted custom requests with category and description.
- Admin quoting and approval or rejection.
- Optional linking to a regular order for tracking and notifications.

Custom order handling is available in the admin custom orders view and API routes.

## Performance Notes

Key performance tactics used in the project:

- Client-side routing for faster navigation between pages.
- Cached social counts with API fallback to manual values.
- Deferred animations and loading states for large UI blocks.
- Minimal data payloads by selecting only required fields.

If you want to optimize further, consider:

- Converting large images to Next.js Image with sizes and priority.
- Reducing polling frequency for social counts and reviews.
- Splitting heavy sections into lazy-loaded components.

## Security and Secrets

Do:

- Store secrets only in server-side environment variables.
- Keep service role keys and email credentials private.
- Protect cron endpoints with a secret header.
- Remove or disable any fallback admin credentials in production.

Do not:

- Commit any private keys to Git.
- Share real credentials in public documentation.
- Expose the service role key in the browser.

Before making the repository public, review all files for credentials and remove them.

## Deployment (Vercel)

Recommended steps:

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Add environment variables to the Vercel project settings.
4. Update the site URL variable to match your deployed domain.
5. Update Supabase Auth site URLs and OAuth redirect URLs.
6. Deploy and verify the user and admin flows.

## Troubleshooting

Common issues and fixes:

- Email not confirmed
  - Disable email confirmation or ensure users confirm the email.

- Admin notifications show no results
  - Ensure admin_notifications table exists and service role key is configured.

- Social counts are always zero
  - Add social API tokens or update manual counts in site settings.

- Orders do not send emails
  - Check that Brevo credentials are configured on the server.

- Coupon is rejected even when valid
  - Verify date range, usage limits, and scope in the discounts table.

## Contributing

Basic guidelines:

- Create a feature branch for each change.
- Keep components small and reusable.
- Use TypeScript types for data from Supabase.
- Run lint before opening a PR.

Suggested workflow:

```bash
npm run lint
npm run build
```

## Roadmap

Potential enhancements:

- Add image optimization and CDN support for product galleries.
- Add full audit logs for admin actions.
- Build a dedicated returns portal for users.
- Add analytics dashboards for sales and traffic sources.
- Introduce a theme toggle for seasonal styles.

---

If you want this README to be even longer or include screenshots, diagrams, or endpoint payload examples, tell me what to add and I will extend it.
