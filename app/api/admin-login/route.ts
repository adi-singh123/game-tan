import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return NextResponse.json({ ok: false, error: "Admin password is not configured." }, { status: 503 });
  const { password } = await request.json().catch(() => ({ password: "" }));
  const a = Buffer.from(String(password)); const b = Buffer.from(expected);
  const valid = a.length === b.length && timingSafeEqual(a, b);
  if (!valid) return NextResponse.json({ ok: false, error: "That password isn’t right." }, { status: 401 });
  return NextResponse.json({ ok: true });
}
