// Encrypts login sessions. NEXTAUTH_SECRET must be set in production; the
// fallback only exists so local development works without extra setup.
export const AUTH_SECRET = process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "production" ? undefined : "afratinhs-development-only-secret");
