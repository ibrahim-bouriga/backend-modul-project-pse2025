/**
 * Shared API utilities for connecting to the backend.
 *
 * Set NEXT_PUBLIC_BACKEND_URL in your .env.local to override the default.
 * Example: NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
 */
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
