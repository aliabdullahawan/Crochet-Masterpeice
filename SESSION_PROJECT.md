# Crochet Masterpiece — Project Documentation

> Handmade crochet products by a Pakistani artisan. Every piece made by hand with love.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 3 + custom design system |
| Animation | Framer Motion |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Google OAuth |
| Email | Brevo (transactional) |
| Deployment | Vercel |
| Charts | Recharts |

---

## Repository Structure

```
crochet-masterpiece/
├── app/
│   ├── layout.tsx                    # Root layout + ShopProvider
│   ├── globals.css                   # Full design system
│   ├── page.tsx                      # → /user/home
│   ├── api/
│   │   └── social-counts/route.ts    # Instagram/FB/TikTok API
│   ├── user/
│   │   ├── login/page.tsx            # Supabase auth + Google OAuth
│   │   ├── signup/page.tsx           # Supabase signup
│   │   ├── forgot-password/page.tsx  # OTP reset flow
│   │   ├── home/page.tsx             # Home page
│   │   ├── shop/page.tsx             # Shop with filters
│   │   ├── shop/[id]/page.tsx        # Product detail + related
│   │   ├── custom-order/page.tsx     # Custom order form
│   │   ├── contact/page.tsx          # Contact + socials
│   │   ├── cart/page.tsx             # Cart (legacy page)
│   │   ├── wishlist/page.tsx         # Wishlist (legacy page)
│   │   └── notifications/page.tsx    # Notification centre
│   └── admin/
│       ├── login/page.tsx            # Admin login
│       ├── dashboard/page.tsx        # Stats + recent orders
│       ├── products/page.tsx         # Product CRUD
│       ├── categories/page.tsx       # Category CRUD + photo upload
│       ├── orders/page.tsx           # Orders + slide panel
│       ├── customers/page.tsx        # Customers + slide panel
│       ├── analytics/page.tsx        # Recharts analytics
│       └── discounts/page.tsx        # Coupon/discount management
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx                # Glass navbar + drawers
│   │   └── Footer.tsx                # Footer + animated socials
│   ├── ui/
│   │   ├── CartDrawer.tsx            # Slide-in cart
│   │   ├── WishlistDrawer.tsx        # Slide-in wishlist
│   │   ├── LoadingScreen.tsx         # Crochet-themed loader
│   │   ├── GlowCard.tsx              # Cursor-tracking spotlight
│   │   ├── BubbleButton.tsx          # Bubble pop effect
│   │   ├── AnimatedSocialIcons.tsx   # Plus → reveals socials
│   │   ├── ExpandingCategoryCards.tsx # CSS grid expand
│   │   └── CrochetLogo.tsx           # SVG logo
│   ├── admin/
│   │   └── AdminNavbar.tsx
│   └── user/
│       ├── HeroSection.tsx
│       ├── CategoriesSection.tsx
│       ├── FeaturedProducts.tsx
│       ├── AboutSection.tsx
│       ├── CustomOrderBanner.tsx
│       └── ReviewsSection.tsx
├── lib/
│   ├── supabase.ts                   # Typed Supabase client
│   ├── ShopContext.tsx               # Cart + wishlist global state
│   ├── categories.ts                 # Shared category data
│   └── utils.ts                      # cn(), formatPrice(), WhatsApp builder
├── public/images/
│   ├── logo.png                      # Brand logo
│   ├── bg-yarn-table.jpg
│   ├── bg-hands-knitting.jpg
│   ├── bg-crochet-pink.jpg
│   └── bg-crochet-items.jpg
├── DATABASE.sql                      # Complete Supabase schema
├── .env.local                        # All environment variables
├── .env.example                      # Template (safe to commit)
├── SESSION_TASKS.md                  # Build log (this file's companion)
└── session_task.txt                  # Raw session log
```

---

## Design System

### Colour Palette
```css
cream:   #FFF8ED (background)
blush:   #F4B8C1 (primary accent)
mauve:   #C9A0DC (secondary)
caramel: #C8956C (CTA / buttons)
latte:   #D4A890 (warm brown)
rose:    #E8A0A8 (soft pink)
ink:     #3B2F2F (dark text)
```

### Typography
- **Headings:** Playfair Display
- **Script accents:** Dancing Script
- **UI text:** Nunito
- **Body:** Lato

### Key CSS Classes
| Class | Purpose |
|-------|---------|
| `.glass` | Glassmorphism card |
| `.btn-bubble` | Bubble pop on click |
| `.shadow-card` | Warm card shadow |
| `.card-rainbow-border` | Multi-colour animated border |
| `.img-overlay-caramel/blush/mauve/rose` | Product card overlays |
| `.admin-card-caramel/blush/mauve/rose` | Admin stat card gradients |

---

## Authentication

### User Auth (Supabase)
```typescript
// Login
supabase.auth.signInWithPassword({ email, password })

// Google OAuth
supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "/user/home" } })

// Sign up
supabase.auth.signUp({ email, password, options: { data: { name, phone } } })
```

### Admin Auth (Hardcoded + Supabase)
- **Email:** NimaToda@gmail.com
- **Password:** NimaToda3252933*
- Stored in `admins` table in Supabase
- Falls back to hardcoded check if DB not connected
- Session stored in `localStorage` (`cm_admin_logged_in`)

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ppsulgueckychgazdjbr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Brevo Email
BREVO_API_KEY=xkeysib-...
BREVO_SMTP_KEY=xsmtpsib-...
BREVO_SENDER_EMAIL=amnamubeen516@gmail.com
BREVO_SENDER_NAME=Crochet Masterpiece

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=923001234567
NEXT_PUBLIC_WHATSAPP_CHANNEL=https://whatsapp.com/channel/...

# Google OAuth (add from Google Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Social APIs (optional)
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_USER_ID=
FACEBOOK_ACCESS_TOKEN=
FACEBOOK_PAGE_ID=
TIKTOK_ACCESS_TOKEN=

# App URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Database Schema Summary

| Table | Purpose |
|-------|---------|
| `admins` | Admin users (hardcoded + DB) |
| `users` | Registered customers (Supabase Auth) |
| `categories` | Product categories with photo (BYTEA) |
| `products` | Products with stock, tags, ratings |
| `product_images` | Multiple images per product (BYTEA) |
| `discounts` | Coupon codes + badge discounts |
| `orders` | Orders (website + WhatsApp + custom) |
| `order_items` | Line items per order |
| `custom_orders` | Custom order requests |
| `reviews` | Product reviews with admin replies |
| `wishlist` | User wishlists |
| `cart` | Logged-in user carts |
| `notifications` | User notifications |
| `site_settings` | Config (social counts, etc.) |

**Run `DATABASE.sql` in Supabase SQL Editor to set up the database.**

---

## Key Features

### User Side
- Loading screen with yarn spinner animation
- Hero with 3-image background collage
- Expanding category cards (CSS grid animation)
- Featured products with spotlight glow
- Shop with search, filters, sort (no login needed)
- Product detail with "You May Also Like"
- **Cart + Wishlist as right-slide drawers** (no separate pages)
- Guest cart persists via `localStorage`
- Order popup: WhatsApp always available; site query requires login
- Custom order form with image category tiles
- Notification centre
- Contact page with social cards

### Admin Side
- Login with hardcoded + Supabase credentials
- Dashboard: stats, social counts, recent orders
- **Products:** full CRUD, tabs (basic/pricing/extra), image upload
- **Categories:** CRUD + photo upload → shows on user site
- **Orders:** slide-in panel (no popup), status updates, WA message customer
- **Customers:** slide-in panel, profile stats, WA + email
- **Analytics:** Recharts line/area/bar/pie charts, 8 KPI cards
- **Discounts:** coupon codes + badge discounts, product/category targeting

---

## Deployment to Vercel

1. Push to GitHub (`.env.local` is gitignored — safe)
2. Import project in Vercel
3. Add **all environment variables** from `.env.local` in Vercel dashboard
4. Set `NEXT_PUBLIC_SITE_URL` to your Vercel URL
5. In Supabase: add Vercel URL to **Authentication > URL Configuration > Site URL**
6. In Google Console: add `https://your-app.vercel.app` to authorized redirect URIs
7. Deploy

---

## Google OAuth Setup (one-time)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → Enable Google+ API
3. OAuth consent screen → External → fill in app name
4. Credentials → OAuth 2.0 Client ID → Web application
5. Authorized redirect URI: `https://ppsulgueckychgazdjbr.supabase.co/auth/v1/callback`
6. Copy Client ID + Secret → Supabase Dashboard → Auth → Providers → Google
7. Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to `.env.local`

---

## Connecting Supabase (when ready)

Replace mock data arrays with real queries, for example:

```typescript
// Products
const { data } = await supabase.from("product_listing").select("*");

// Categories
const { data } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order");

// Place order
const { data: orderId } = await supabase.rpc("place_order", {
  p_user_id: user.id,
  p_items: JSON.stringify(cartItems),
  p_address: address,
  p_coupon_code: coupon || null,
});
```

---

## Brevo Email (when ready)

Use for:
- Order confirmation emails
- OTP password reset
- Admin notifications of new orders

```typescript
// Send via API
const response = await fetch("https://api.brevo.com/v3/smtp/email", {
  method: "POST",
  headers: { "api-key": process.env.BREVO_API_KEY!, "Content-Type": "application/json" },
  body: JSON.stringify({
    sender: { email: process.env.BREVO_SENDER_EMAIL, name: process.env.BREVO_SENDER_NAME },
    to: [{ email: customerEmail }],
    subject: "Your Crochet Masterpiece order is confirmed!",
    htmlContent: "<p>Thank you for your order!</p>",
  }),
});
```

---

## What's Next

- [ ] Connect Supabase — replace all `MOCK_` arrays with real queries
- [ ] Google OAuth — add Client ID from Google Console
- [ ] Brevo emails — order confirmations + OTP
- [ ] Social API tokens — live follower counts
- [ ] Image upload — store product/category photos in Supabase storage
- [ ] Admin forgot password flow
- [ ] Push notifications (optional)
- [ ] PWA / mobile app (optional)

---

*Built with Claude across 15 sessions. Last updated: March 2026.*
