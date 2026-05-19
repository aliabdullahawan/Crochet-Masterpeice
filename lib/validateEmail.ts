/** RFC 5322–inspired pattern (practical subset for checkout). */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "10minutemail.com",
  "yopmail.com",
  "throwaway.email",
]);

export type EmailValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; error: string };

export function validateCustomerEmail(raw: string): EmailValidationResult {
  const normalized = String(raw ?? "").trim().toLowerCase();

  if (!normalized) {
    return { ok: false, error: "Email is required to place an order." };
  }
  if (normalized.length > 254) {
    return { ok: false, error: "Email address is too long." };
  }
  if (!EMAIL_REGEX.test(normalized)) {
    return { ok: false, error: "Please enter a valid email address (e.g. you@example.com)." };
  }

  const [local, domain] = normalized.split("@");
  if (!local || !domain || local.length > 64) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, error: "Disposable email addresses are not allowed. Use your real inbox." };
  }
  if (domain.includes("..") || domain.startsWith(".") || domain.endsWith(".")) {
    return { ok: false, error: "Please enter a valid email domain." };
  }

  return { ok: true, normalized };
}
