/** Map Supabase Auth errors to clear messages for login/signup forms. */
export function describeAuthError(message: string, context: "login" | "signup" = "login"): string {
  const msg = message.toLowerCase();

  if (msg.includes("invalid login credentials") || msg.includes("invalid email or password")) {
    return "Wrong email or password. Double-check spelling and caps lock, then try again.";
  }
  if (msg.includes("email not confirmed")) {
    return "Your email is not confirmed yet. Check your inbox (and spam) for the confirmation link, or ask admin to disable email confirmation in Supabase.";
  }
  if (msg.includes("user already registered") || msg.includes("already been registered")) {
    return "This email is already registered. Sign in instead or use Forgot password.";
  }
  if (msg.includes("password") && (msg.includes("short") || msg.includes("least"))) {
    return context === "signup"
      ? "Password is too weak. Use at least 8 characters with letters and numbers."
      : "Password does not meet requirements.";
  }
  if (msg.includes("unable to validate email") || msg.includes("invalid email")) {
    return "That email address does not look valid. Example: name@example.com";
  }
  if (msg.includes("signup is disabled")) {
    return "New sign-ups are temporarily disabled. Please contact support.";
  }
  if (msg.includes("too many") || msg.includes("rate limit") || msg.includes("rate_limit")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (msg.includes("user not found") || msg.includes("no user")) {
    return "No account with this email. Create an account on the sign-up page first.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error — check your internet connection and try again.";
  }
  if (msg.includes("error sending magic link") || msg.includes("smtp") || msg.includes("email provider")) {
    return "Could not send login email. Try email & password sign-in, or contact support.";
  }

  return context === "signup"
    ? `Sign up failed: ${message}`
    : `Login failed: ${message}`;
}
