# ╔══════════════════════════════════════════════════════╗
# ║       CROCHET MASTERPIECE — COMPLETE SETUP GUIDE     ║
# ║         Read this FIRST before running the site      ║
# ╚══════════════════════════════════════════════════════╝

---

## STEP 1 — Disable Email Confirmation (DO THIS FIRST)

Without this, signup works but login says "Email not confirmed".

1. Open: https://supabase.com/dashboard/project/ppsulgueckychgazdjbr/auth/providers
2. Click **Email** provider
3. Turn OFF **"Confirm email"**
4. Click **Save**

---

## STEP 2 — Run the Database SQL

1. Open: https://supabase.com/dashboard/project/ppsulgueckychgazdjbr/sql/new
2. Copy ALL of `DATABASE.sql` from this folder
3. Paste it in the SQL editor
4. Click **Run**

This creates all tables: users, products, categories, orders, admins, etc.

---

## STEP 3 — Add Your Admin Account

1. Still in the SQL editor: https://supabase.com/dashboard/project/ppsulgueckychgazdjbr/sql/new
2. Run this SQL:

```sql
INSERT INTO admins (email, name, password_hash)
VALUES ('amnamubeen516@gmail.com', 'Crochet Masterpiece', 'Amnamubeen516@')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
```

Admin login:
- URL: http://localhost:3000/admin/login
- Email: amnamubeen516@gmail.com
- Password: Amnamubeen516@

NOTE: Admin login also works WITHOUT running DATABASE.sql — it has a
built-in fallback with these credentials hardcoded.

---

## STEP 4 — Run the project

```bash
cd crochet-masterpiece
npm install
npm run dev
```

Visit: http://localhost:3000

---

## STEP 5 — Test user signup and login

1. Go to: http://localhost:3000/user/signup
2. Fill in your details and click "Create Account"
3. If STEP 1 was done → you're logged in immediately
4. If STEP 1 was NOT done → check your email for a confirmation link

---

## STEP 6 — Google OAuth (optional)

To enable "Continue with Google":

1. Go to: https://console.cloud.google.com
2. Create a project → Enable "Google+ API"
3. Go to Credentials → Create OAuth 2.0 Client ID → Web Application
4. Add Authorized Redirect URI:
   `https://ppsulgueckychgazdjbr.supabase.co/auth/v1/callback`
5. Copy the Client ID and Client Secret
6. In Supabase: Auth → Providers → Google → paste Client ID + Secret
7. Save

---

## STEP 7 — Deploy to Vercel

1. Push your code to GitHub (`.env.local` is gitignored — safe)
2. Import at: https://vercel.com/new
3. Add ALL env vars from `.env.local` in the Vercel dashboard
4. Change `NEXT_PUBLIC_SITE_URL` to your Vercel URL (e.g. https://mysite.vercel.app)
5. In Supabase → Auth → URL Configuration → add your Vercel URL to "Site URL"

---

## CREDENTIALS SUMMARY

| What | Value |
|------|-------|
| Admin Email | amnamubeen516@gmail.com |
| Admin Password | Amnamubeen516@ |
| Admin URL | /admin/login |
| Supabase Project | ppsulgueckychgazdjbr |
| Supabase URL | https://ppsulgueckychgazdjbr.supabase.co |

---

## COMMON ERRORS

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid admin credentials" | Admin not in DB yet | Admin still works with hardcoded credentials above — just use those |
| "Something went wrong" on signup | Email confirmation ON | Do STEP 1 above |
| "Email not confirmed" on login | Email confirmation ON | Do STEP 1 above |
| "relation users does not exist" | DATABASE.sql not run | Do STEP 2 above |
| Google button does nothing | Google OAuth not set up | Do STEP 6 above |
| Notifications show nothing | Normal — no notifications yet | They appear when orders are placed |
| Categories show nothing | Normal — no categories yet | Add categories in Admin → Categories |
| Products show nothing | Normal — no products yet | Add products in Admin → Products |

---

## WHERE TO GET API KEYS

### Supabase (already configured)
- Project URL and keys are already in `.env.local`
- Dashboard: https://supabase.com/dashboard/project/ppsulgueckychgazdjbr

### Google OAuth Client Secret
- Go to: https://console.cloud.google.com/apis/credentials
- Your Client ID: `35407490439-uo798spa0vucha5udi31khgt7s7lti1e.apps.googleusercontent.com`
- Create/find the matching Client Secret there

### Brevo Email (already configured)
- Already in `.env.local`
- Dashboard: https://app.brevo.com

### Social Media API Tokens (optional — admin can set counts manually)
- Instagram: https://developers.facebook.com/apps
- Facebook: same as Instagram (they share the same platform)
- TikTok: https://developers.tiktok.com

