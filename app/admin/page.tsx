"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { dares, GameState, initialState, normalizeState, STORAGE_KEY, Submission } from "@/lib/game";

const labels = ["A proper sorry", "A new couple photo", "The honest answer", "The hard truth", "Something random", "The choice", "One for the vault"];
function fmt(value?: string) { return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"; }

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<GameState>(initialState);
  const [shared, setShared] = useState(false);
  const editing = useRef(false);

  useEffect(() => {
    const refreshLocal = () => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setState(normalizeState(JSON.parse(raw))); } catch {} };
    const refreshRemote = async () => { try { const response = await fetch("/api/game-state", { cache: "no-store" }); if (response.ok) { const remote = normalizeState(await response.json()); if (!editing.current) setState(remote); setShared(true); } } catch {} };
    const refresh = () => { refreshLocal(); refreshRemote(); };
    refresh(); const timer = window.setInterval(refreshRemote, 2000);
    window.addEventListener("storage", refreshLocal);
    window.addEventListener("focus", refresh);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(timer); window.removeEventListener("storage", refreshLocal); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  function save(next: GameState) { setState(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  async function login(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAuthed(true); setPassword("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not sign in."); }
    finally { setLoading(false); }
  }
  async function adminAction(action: string, extra: Record<string, unknown> = {}) {
    const response = await fetch("/api/game-state", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Shared update failed");
    const remote = normalizeState(await response.json()); setState(remote); return remote;
  }
  async function review(index: number, status: "approved" | "rejected") {
    if (shared) { try { await adminAction(status, { index }); } catch (reason) { window.alert(reason instanceof Error ? reason.message : "Approval failed"); } return; }
    let submissions = state.submissions.map((item, i) => i === index ? { ...item, status, reviewedAt: new Date().toISOString() } as Submission : item);
    let current = state.current;
    if (status === "approved" && index === state.current) {
      const next = submissions.findIndex((item, i) => i > index && !["approved", "skipped"].includes(item.status));
      if (next >= 0) { submissions = submissions.map((item, i) => i === next ? { ...item, status: "available" } : item); current = next; }
    }
    if (status === "rejected") current = index;
    const approved = submissions.filter(item => item.status === "approved").length;
    save({ ...state, submissions, current, screen: approved >= 5 ? "unlock" : "game", machineUnlocked: state.machineUnlocked || approved >= 5 });
  }
  function changeQuestion(index: number, value: string) { setState(current => ({ ...current, customQuestions: { ...current.customQuestions, [String(index)]: value } })); }
  async function commitQuestion(index: number, value: string) { if (shared) { try { await adminAction("question", { index, value }); } catch (reason) { window.alert(reason instanceof Error ? reason.message : "Question update failed"); } } else save({ ...state, customQuestions: { ...state.customQuestions, [String(index)]: value } }); }
  async function restoreQuestion(index: number) { if (shared) { try { await adminAction("restore-question", { index }); } catch (reason) { window.alert(reason instanceof Error ? reason.message : "Restore failed"); } } else { const customQuestions = { ...state.customQuestions }; delete customQuestions[String(index)]; save({ ...state, customQuestions }); } }
  function changeTitle(index: number, value: string) { setState(current => ({ ...current, customTitles: { ...current.customTitles, [String(index)]: value } })); }
  async function commitTitle(index: number, value: string) { if (shared) { try { await adminAction("title", { index, value }); } catch (reason) { window.alert(reason instanceof Error ? reason.message : "Title update failed"); } } else save({ ...state, customTitles: { ...state.customTitles, [String(index)]: value } }); }
  async function restoreTitle(index: number) { if (shared) { try { await adminAction("restore-title", { index }); } catch (reason) { window.alert(reason instanceof Error ? reason.message : "Restore failed"); } } else { const customTitles = { ...state.customTitles }; delete customTitles[String(index)]; save({ ...state, customTitles }); } }
  async function reset() { if (!window.confirm("Reset Tannu’s entire game for every connected device? This cannot be undone.")) return; if (shared) { try { await adminAction("reset"); } catch (reason) { window.alert(reason instanceof Error ? reason.message : "Reset failed"); } } else save(initialState); }
  async function unlock() { if (shared) { try { await adminAction("unlock"); } catch (reason) { window.alert(reason instanceof Error ? reason.message : "Unlock failed"); } } else save({ ...state, screen: "unlock", machineUnlocked: true }); }

  const approved = state.submissions.filter(item => item.status === "approved").length;

  if (!authed) return <main className="admin-page"><section className="admin-login">
    <p className="eyebrow">PRIVATE PAGE</p><h1>Tannu’s Game</h1><p>Aditya’s little control room.</p>
    <form onSubmit={login}><label htmlFor="password">Admin password</label><input id="password" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required /><button className="button" disabled={loading}>{loading ? "CHECKING…" : "ENTER"}</button>{error && <p className="error" role="alert">{error}</p>}</form>
    <a href="/">← Back to the invitation</a>
  </section></main>;

  return <main className="admin-page"><section className="admin-shell">
    <header className="admin-header"><div><p className="eyebrow">PRIVATE · ADITYA ONLY</p><h1>Tannu’s Game</h1></div><a href="/">Open game ↗</a></header>
    <section className="admin-progress"><div><span>APPROVED</span><strong>{approved} <i>/ 7</i></strong></div><p>{approved >= 5 ? "The Random Machine is unlocked." : `${5 - approved} more approval${5 - approved === 1 ? "" : "s"} to unlock the surprise.`}</p></section>
    <div className="connection-state"><span className={shared ? "online" : "local"}>●</span>{shared ? "Shared phone ↔ desktop connection is active" : "Local mode — add Supabase environment variables to connect devices"}</div>
    <div className="admin-actions"><button onClick={unlock} disabled={state.machineUnlocked}>UNLOCK RANDOM MACHINE</button><button className="danger" onClick={reset}>RESET EVERYTHING</button></div>
    <section className="submission-list">{state.submissions.map((item, index) => <article className="submission" key={index}>
      <div className="submission-title"><div><span>CHALLENGE {String(index + 1).padStart(2, "0")}</span><h2>{state.customTitles[String(index)] || labels[index]}</h2></div><b className={`status ${item.status}`}>{item.status}</b></div>
      <div className="question-editor"><label htmlFor={`title-${index}`}>MAIN DARE TITLE</label><input id={`title-${index}`} value={state.customTitles[String(index)] ?? dares[index].title} onFocus={() => { editing.current = true; }} onChange={event => changeTitle(index, event.target.value)} onBlur={async event => { const value = event.currentTarget.value; await commitTitle(index, value); editing.current = false; }} maxLength={120} /><div><span>Example: A new couple photo</span>{state.customTitles[String(index)] !== undefined && <button onClick={() => restoreTitle(index)}>RESTORE TITLE</button>}</div><label className="body-label" htmlFor={`question-${index}`}>QUESTION / INSTRUCTIONS</label><textarea id={`question-${index}`} rows={5} value={state.customQuestions[String(index)] ?? dares[index].editableText} onFocus={() => { editing.current = true; }} onChange={event => changeQuestion(index, event.target.value)} onBlur={async event => { const value = event.currentTarget.value; await commitQuestion(index, value); editing.current = false; }} /><div><span>Changes save when you leave the text box.</span>{state.customQuestions[String(index)] !== undefined && <button onClick={() => restoreQuestion(index)}>RESTORE QUESTION</button>}</div></div>
      {item.answer && <div className="answer"><label>ANSWER</label><p>{item.answer}</p></div>}
      {item.choice && <div className="answer"><label>CHOICE</label><p>{item.choice}</p></div>}
      {item.photo && <div className="answer"><label>CHOSEN PHOTO · {item.photoName}</label><img src={item.photo} alt={`Submission for challenge ${index + 1}`} /></div>}
      <dl><div><dt>Submitted</dt><dd>{fmt(item.submittedAt)}</dd></div><div><dt>Reviewed</dt><dd>{fmt(item.reviewedAt)}</dd></div></dl>
      {["submitted", "rejected", "approved"].includes(item.status) && <div className="review-buttons"><button className="approve" onClick={() => review(index, "approved")}>APPROVE &amp; UNLOCK NEXT</button><button className="reject" onClick={() => review(index, "rejected")}>REJECT &amp; RETRY</button></div>}
    </article>)}</section>
    <button className="logout" onClick={() => setAuthed(false)}>Lock admin page</button>
    <p className="local-note">When the shared connection is active, Tannu’s phone waits after every submission until you approve or reject it here on your desktop.</p>
  </section></main>;
}
