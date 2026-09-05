import "server-only";
import { GameState, initialState, normalizeState } from "@/lib/game";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
export const remoteConfigured = Boolean(url && key);

function headers(extra?: Record<string, string>) {
  return { apikey: key!, ...(key?.startsWith("eyJ") ? { Authorization: `Bearer ${key}` } : {}), "Content-Type": "application/json", ...extra };
}

export async function readGame(): Promise<GameState> {
  if (!remoteConfigured) throw new Error("Remote storage is not configured");
  const response = await fetch(`${url}/rest/v1/weekend_game?id=eq.main&select=state`, { headers: headers(), cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase read failed: ${response.status}`);
  const rows = await response.json() as { state: Partial<GameState> }[];
  if (rows[0]) return normalizeState(rows[0].state);
  await writeGame(initialState);
  return initialState;
}

export async function writeGame(state: GameState): Promise<void> {
  if (!remoteConfigured) throw new Error("Remote storage is not configured");
  const response = await fetch(`${url}/rest/v1/weekend_game`, { method: "POST", headers: headers({ Prefer: "resolution=merge-duplicates" }), body: JSON.stringify({ id: "main", state, updated_at: new Date().toISOString() }) });
  if (!response.ok) throw new Error(`Supabase write failed: ${response.status} ${await response.text()}`);
}
