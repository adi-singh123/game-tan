import { NextRequest, NextResponse } from "next/server";
import { approvedCount, initialState, skippedCount, Submission } from "@/lib/game";
import { ADMIN_COOKIE, validAdminCookie } from "@/lib/admin-auth";
import { readGame, remoteConfigured, writeGame } from "@/lib/server-store";

function unavailable() { return NextResponse.json({ error: "Shared storage is not configured" }, { status: 503 }); }
async function currentGame() { try { return await readGame(); } catch (error) { console.error(error); return null; } }

export async function GET() {
  if (!remoteConfigured) return unavailable();
  const state = await currentGame();
  return state ? NextResponse.json(state) : NextResponse.json({ error: "Could not read shared game" }, { status: 502 });
}

export async function POST(request: NextRequest) {
  if (!remoteConfigured) return unavailable();
  const state = await currentGame(); if (!state) return NextResponse.json({ error: "Could not read shared game" }, { status: 502 });
  const body = await request.json().catch(() => ({}));
  const index = Number(body.index);
  if (index !== state.current || index < 0 || index > 6) return NextResponse.json({ error: "That dare is not currently available" }, { status: 409 });
  const existing = state.submissions[index];
  if (body.action === "submit") {
    if (!["available", "rejected"].includes(existing.status)) return NextResponse.json({ error: "This dare cannot be submitted now" }, { status: 409 });
    const submission: Submission = { ...existing, status: "submitted", answer: String(body.answer ?? "").slice(0, 4000) || undefined, choice: String(body.choice ?? "").slice(0, 500) || undefined, photo: typeof body.photo === "string" && body.photo.length < 2_500_000 ? body.photo : undefined, photoName: String(body.photoName ?? "").slice(0, 200) || undefined, submittedAt: new Date().toISOString(), reviewedAt: undefined };
    state.submissions = state.submissions.map((item, i) => i === index ? submission : item);
  } else if (body.action === "skip") {
    if (skippedCount(state) >= 2) return NextResponse.json({ error: "Both skips are already used" }, { status: 409 });
    state.submissions = state.submissions.map((item, i) => i === index ? { ...item, status: "skipped", submittedAt: new Date().toISOString() } : i === index + 1 ? { ...item, status: "available" } : item);
    state.current = Math.min(index + 1, 6);
  } else return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  await writeGame(state); return NextResponse.json(state);
}

export async function PATCH(request: NextRequest) {
  if (!remoteConfigured) return unavailable();
  if (!validAdminCookie(request.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ error: "Admin login required" }, { status: 401 });
  const state = await currentGame(); if (!state) return NextResponse.json({ error: "Could not read shared game" }, { status: 502 });
  const body = await request.json().catch(() => ({})); const index = Number(body.index);
  if (body.action === "reset") { await writeGame(initialState); return NextResponse.json(initialState); }
  if (body.action === "unlock") { state.machineUnlocked = true; state.screen = "unlock"; }
  else if (body.action === "question" && index >= 0 && index < 7) state.customQuestions[String(index)] = String(body.value ?? "").slice(0, 4000);
  else if (body.action === "restore-question" && index >= 0 && index < 7) delete state.customQuestions[String(index)];
  else if (["approved", "rejected"].includes(body.action) && index >= 0 && index < 7) {
    const status = body.action as "approved" | "rejected";
    state.submissions = state.submissions.map((item, i) => i === index ? { ...item, status, reviewedAt: new Date().toISOString() } : item);
    if (status === "approved" && index === state.current) { const next = state.submissions.findIndex((item, i) => i > index && !["approved", "skipped"].includes(item.status)); if (next >= 0) { state.submissions[next].status = "available"; state.current = next; } }
    if (status === "rejected") { state.current = index; state.screen = "game"; }
    if (approvedCount(state) >= 5) { state.machineUnlocked = true; state.screen = "unlock"; }
  } else return NextResponse.json({ error: "Invalid admin action" }, { status: 400 });
  await writeGame(state); return NextResponse.json(state);
}
