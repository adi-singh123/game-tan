"use client";

import { FormEvent, useEffect, useState } from "react";
import { GameState, initialState, normalizeState, STORAGE_KEY, Submission } from "@/lib/game";

const labels = ["A proper sorry", "A new couple photo", "The honest answer", "The hard truth", "Something random", "The choice", "One for the vault"];
function fmt(value?: string) { return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"; }

export default function Admin() {
  const [authed, setAuthed] = useState(false), [password, setPassword] = useState(""), [error, setError] = useState("");
  const [loading, setLoading] = useState(false), [state, setState] = useState<GameState>(initialState);
  useEffect(() => {
    const refresh = () => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setState(normalizeState(JSON.parse(raw))); } catch {} };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", onVisible); };
  }, []);
  function save(next: GameState) { setState(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  async function login(e: FormEvent) { e.preventDefault(); setLoading(true); setError(""); try { const response = await fetch("/api/admin-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setAuthed(true); setPassword(""); } catch (err) { setError(err instanceof Error ? err.message : "Could not sign in."); } finally { setLoading(false); } }
  function review(index: number, status: "approved" | "rejected") { const submissions = state.submissions.map((item, i) => i === index ? { ...item, status, reviewedAt: new Date().toISOString() } as Submission : item); const approved = submissions.filter(s => s.status === "approved").length; save({ ...state, submissions, machineUnlocked: state.machineUnlocked || approved >= 5 }); }
  function reset() { if (window.confirm("Reset Tannu’s entire game on this device? This cannot be undone.")) save(initialState); }
  const approved = state.submissions.filter(s => s.status === "approved").length;

  if (!authed) return <main className="admin-page"><section className="admin-login"><p className="eyebrow">PRIVATE PAGE</p><h1>Tannu’s Game</h1><p>Aditya’s little control room.</p><form onSubmit={login}><label htmlFor="password">Admin password</label><input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /><button className="button" disabled={loading}>{loading ? "CHECKING…" : "ENTER"}</button>{error && <p className="error" role="alert">{error}</p>}</form><a href="/">← Back to the invitation</a></section></main>;

  return <main className="admin-page"><section className="admin-shell"><header className="admin-header"><div><p className="eyebrow">PRIVATE · ADITYA ONLY</p><h1>Tannu’s Game</h1></div><a href="/">Open game ↗</a></header><section className="admin-progress"><div><span>PROGRESS</span><strong>{approved} <i>/ 7</i></strong></div><p>{approved >= 5 ? "The Random Machine is unlocked." : `${5 - approved} more approval${5 - approved === 1 ? "" : "s"} to unlock the surprise.`}</p></section><div className="admin-actions"><button onClick={() => save({ ...state, machineUnlocked: true })} disabled={state.machineUnlocked}>UNLOCK RANDOM MACHINE</button><button className="danger" onClick={reset}>RESET EVERYTHING</button></div><section className="submission-list">{state.submissions.map((item, index) => <article className="submission" key={index}><div className="submission-title"><div><span>CHALLENGE {String(index + 1).padStart(2, "0")}</span><h2>{labels[index]}</h2></div><b className={`status ${item.status}`}>{item.status}</b></div>{item.answer && <div className="answer"><label>ANSWER</label><p>{item.answer}</p></div>}{item.choice && <div className="answer"><label>CHOICE</label><p>{item.choice}</p></div>}{item.photo && <div className="answer"><label>CHOSEN PHOTO · {item.photoName}</label><img src={item.photo} alt={`Submission for challenge ${index + 1}`} /></div>}<dl><div><dt>Submitted</dt><dd>{fmt(item.submittedAt)}</dd></div><div><dt>Reviewed</dt><dd>{fmt(item.reviewedAt)}</dd></div></dl>{["submitted", "rejected", "approved"].includes(item.status) && <div className="review-buttons"><button className="approve" onClick={() => review(index, "approved")}>APPROVE</button><button className="reject" onClick={() => review(index, "rejected")}>REJECT</button></div>}</article>)}</section><button className="logout" onClick={() => setAuthed(false)}>Lock admin page</button><p className="local-note">This lightweight version stores the game only in this browser. Keep this page and Tannu’s game on the same device/browser for approvals to sync.</p></section></main>;
}
