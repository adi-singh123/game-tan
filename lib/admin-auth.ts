import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "tannu_admin";
export function adminToken() { const secret = process.env.ADMIN_PASSWORD ?? ""; return createHmac("sha256", secret).update("tannu-weekend-admin-session").digest("hex"); }
export function validAdminCookie(value?: string) { if (!value || !process.env.ADMIN_PASSWORD) return false; const expected = Buffer.from(adminToken()); const actual = Buffer.from(value); return actual.length === expected.length && timingSafeEqual(actual, expected); }
