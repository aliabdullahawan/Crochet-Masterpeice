# Authentication Setup Guide
## Why Login Might Not Work + How To Fix It

---

## Step 1 — Disable Email Confirmation (REQUIRED for testing)

This is the #1 reason login doesn't work after signup.

By default, Supabase forces users to confirm their email before they can log in.
To disable this for development:

1. Go to: https://supabase.com/dashboard/project/ppsulgueckychgazdjbr
2. Click **Authentication** in the left sidebar
3. Click **Providers** → **Email**
4. Turn OFF **"Confirm email"**
5. Click **Save**

Now users can sign up and log in immediately without confirming email.

---

## Step 2 — Add the Admin User (REQUIRED)

Run `ADD_ADMIN.sql` in Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/ppsulgueckychgazdjbr/sql
2. Copy the contents of `ADD_ADMIN.sql`
3. Paste and click **Run**

Admin login credentials:
- **Email:** amnamubeen516@gmail.com
- **Password:** Amnamubeen516@
- **URL:** /admin/login

---

## Step 3 — Run DATABASE.sql (if tables don't exist yet)

1. Go to: https://supabase.com/dashboard/project/ppsulgueckychgazdjbr/sql
2. Copy the contents of `DATABASE.sql`
3. Paste and click **Run**

This creates all tables: users, products, categories, orders, etc.

---

## Step 4 — Google OAuth (optional)

1. Go to Supabase → Authentication → Providers → Google
2. Add your **Google Client ID**: `35407490439-uo798spa0vucha5udi31khgt7s7lti1e.apps.googleusercontent.com`
3. Add your **Google Client Secret** (from Google Console)
4. In Google Console, add authorized redirect URI:
   `https://ppsulgueckychgazdjbr.supabase.co/auth/v1/callback`

---

## Step 5 — Test Login Flow

1. Go to `/user/signup` → create an account
2. If email confirmation is OFF → you're logged in immediately
3. If email confirmation is ON → check your inbox, click the link, then log in

---

## Common Error Messages and What They Mean

| Error | Cause | Fix |
|-------|-------|-----|
| "Wrong email or password" | Wrong credentials | Check email/password |
| "Email not confirmed" | Supabase email confirmation is ON | Disable it (Step 1 above) or click the confirmation link |
| "No account found" | Haven't signed up yet | Go to /user/signup |
| "Sign in failed: ..." | Unknown error | Check the raw message and look in Supabase logs |
| "Too many attempts" | Rate limited | Wait 60 seconds |

---

## Check Supabase Logs

If login still fails, check:
https://supabase.com/dashboard/project/ppsulgueckychgazdjbr/logs/auth

You will see exactly what error is occurring.

---

## Why Notifications Show Old Data

If you see old notification data — you are running an old ZIP file.
The latest ZIP (v4+) has the notifications page fetching from Supabase.
An empty database = no notifications shown. This is correct.

---

## Why Avatars Didn't Show

Tailwind CSS purges dynamic class names that are built with template literals.
This has been fixed in v4+ — avatars now use `style={{ background: ... }}`
(inline CSS) instead of dynamic Tailwind class strings.

