"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { approvedCount, dares, GameState, initialState, machineEvents, normalizeState, skippedCount, STORAGE_KEY } from "@/lib/game";

const WHATSAPP_NUMBER = ""; // Add an international number, e.g. 9198XXXXXXXX, to open a specific chat.

function WeekendMark() {
  const [weekend, setWeekend] = useState<boolean | null>(null);
  useEffect(() => { const day = new Date().getDay(); setWeekend(day === 0 || day === 6); }, []);
  return <div className="weekend-mark"><span>SATURDAY</span><i>•</i><span>SUNDAY</span>{weekend !== null && <small>{weekend ? "Weekend mode: on" : "Best enjoyed on a weekend — but I won’t stop you :)"}</small>}</div>;
}

function Shell({ children, footer = true, className = "" }: { children: React.ReactNode; footer?: boolean; className?: string }) {
  return <main className={`page ${className}`}><div className="paper"><WeekendMark />{children}{footer && <footer>Made for Tannu.<br /><span>— Aditya</span></footer>}</div></main>;
}

function Button({ children, secondary, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean }) {
  return <button className={secondary ? "button secondary" : "button"} {...props}>{children}</button>;
}

function whatsapp(text: string) {
  const number = WHATSAPP_NUMBER ? `/${WHATSAPP_NUMBER}` : "";
  window.open(`https://wa.me${number}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}

async function compressPhoto(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = raw; });
  const scale = Math.min(1, 1000 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas"); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", .72);
}

export default function Home() {
  const [state, setState] = useState<GameState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [answer, setAnswer] = useState("");
  const [choice, setChoice] = useState("");
  const [photo, setPhoto] = useState<{ data: string; name: string } | null>(null);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [eventIndex, setEventIndex] = useState<number | null>(null);
  const [machineAside, setMachineAside] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const saved = normalizeState(JSON.parse(raw)); setState(saved.machineUnlocked && saved.screen === "game" ? { ...saved, screen: "unlock" } : saved); } } catch {} setLoaded(true); }, []);
  useEffect(() => { if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state, loaded]);
  useEffect(() => {
    if (!loaded) return;
    const sync = () => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const saved = normalizeState(JSON.parse(raw)); setState(saved.machineUnlocked && saved.screen === "game" ? { ...saved, screen: "unlock" } : saved); } } catch {} };
    window.addEventListener("storage", sync); window.addEventListener("focus", sync); return () => { window.removeEventListener("storage", sync); window.removeEventListener("focus", sync); };
  }, [loaded]);

  const done = approvedCount(state), approved = approvedCount(state), skips = skippedCount(state);
  const dare = dares[state.current];
  const canSubmit = dare?.kind === "text" ? answer.trim().length > 1 : dare?.kind === "choice" ? Boolean(choice) : dare?.kind === "photo" ? Boolean(photo) : true;
  const progressText = useMemo(() => done === 0 ? "Your first challenge is waiting." : done === 4 ? "Four challenges down. One more and you’re through." : `You’ve survived ${done}.`, [done]);

  function go(screen: GameState["screen"]) { setState(s => ({ ...s, screen })); }
  function advance(nextState: GameState) {
    const next = nextState.submissions.findIndex((s, i) => i > state.current && ["available", "rejected"].includes(s.status));
    if (approvedCount(nextState) >= 5 || nextState.machineUnlocked) setState({ ...nextState, screen: "unlock" });
    else setState({ ...nextState, current: next >= 0 ? next : Math.min(state.current + 1, 6) });
    setAnswer(""); setChoice(""); setPhoto(null); setSkipConfirm(false);
  }
  function submit() {
    if (!canSubmit) return;
    const submissions = state.submissions.map((s, i) => i === state.current ? { ...s, status: "submitted" as const, answer: answer.trim() || undefined, choice: choice || undefined, photo: photo?.data, photoName: photo?.name, submittedAt: new Date().toISOString(), reviewedAt: undefined } : s);
    setState({ ...state, submissions });
    setAnswer(""); setChoice(""); setPhoto(null); setSkipConfirm(false);
  }
  function skip() {
    const submissions = state.submissions.map((s, i) => i === state.current ? { ...s, status: "skipped" as const, submittedAt: new Date().toISOString() } : i === state.current + 1 && s.status === "locked" ? { ...s, status: "available" as const } : s);
    advance({ ...state, submissions });
  }
  async function selectPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try { setPhoto({ data: await compressPhoto(file), name: file.name }); } catch { setPhoto(null); }
  }
  function pullMachine() {
    let next = Math.floor(Math.random() * machineEvents.length); if (machineEvents.length > 1 && next === eventIndex) next = (next + 1) % machineEvents.length;
    const pulls = state.machinePulls + 1; const asides = ["Hmm…", "That was random.", "Okay, I didn’t expect that.", "You’re really enjoying this, aren’t you?", "Fine. One more."];
    setEventIndex(next); setMachineAside(pulls % 3 === 0 ? asides[Math.floor(pulls / 3) % asides.length] : ""); setState(s => ({ ...s, machinePulls: pulls }));
  }

  if (!loaded) return <Shell><div className="loading">Opening your invitation…</div></Shell>;

  if (state.screen === "busy") return <Shell><section className="center reveal"><p className="eyebrow">NO WORRIES</p><h1>That’s okay. <span className="heart">♥</span></h1><div className="copy"><p>Go do what you need to do.</p><p>The game isn’t going anywhere.</p><p>Come back when you actually have<br />some free time.</p></div><Button onClick={() => go("home")}>I’LL COME BACK LATER</Button></section></Shell>;

  if (state.screen === "rule") return <Shell footer={false} className="envelope-bg"><section className="letter reveal"><p className="eyebrow">A TINY RULE</p><h2>Okay Tannu…</h2><p>Before you enter, there’s just one tiny rule.</p><div className="rule-number">7</div><h1>DARES</h1><p>Complete <strong>any 5 out of 7.</strong><br />That’s all.</p><p className="note">And yes… you can skip 2.</p><Button onClick={() => go("intro")}>LET’S START</Button></section></Shell>;

  if (state.screen === "intro") return <Shell footer={false}><section className="center narrow reveal"><p className="eyebrow">THE WEEKEND GAME</p><h1>Welcome, Tannu.</h1><div className="copy"><p>I made 7 little challenges for you.</p><p>They’re not difficult.</p><p>Some are funny.<br />Some are slightly embarrassing.<br />Some require you to actually do something.</p><p>And one or two…<br />might make you think.</p></div><p className="note">You only need to complete five.</p><Button onClick={() => go("game")}>I’M READY</Button></section></Shell>;

  if (state.screen === "unlock") return <Shell footer={false} className="quiet"><section className="center reveal"><p className="note large">Wait…</p><h1>You actually did it.</h1><div className="ornament">✦</div><div className="copy"><p>5 challenges.<br />7 opportunities.<br />And somehow you survived.</p><p>There’s something waiting for you.</p></div><Button onClick={() => setState(s => ({ ...s, screen: "machine", machineUnlocked: true }))}>OPEN WHAT’S NEXT</Button></section></Shell>;

  if (state.screen === "machine") {
    const event = eventIndex === null ? null : machineEvents[eventIndex];
    return <Shell footer={false} className="machine"><section className="center reveal"><p className="eyebrow">UNLOCKED</p><h1>DO SOMETHING</h1><p className="muted">You never know what you’re going to get.</p><div className={`machine-result ${event ? "has-result" : ""}`} aria-live="polite">{event ? <><p className="eyebrow">{event[0]}</p><h2>{event[1]}</h2></> : <span className="machine-star">✦</span>}</div>{machineAside && <p className="note aside">{machineAside}</p>}<Button onClick={pullMachine}>DO SOMETHING</Button><button className="text-button" onClick={() => go("game")}>look back at the dares</button></section></Shell>;
  }

  if (state.screen === "game" && state.submissions[state.current].status === "submitted") return <Shell footer={false} className="quiet"><section className="center narrow reveal" aria-live="polite"><p className="eyebrow">CHALLENGE {String(state.current + 1).padStart(2, "0")} SENT</p><h1>Waiting for Aditya.</h1><div className="ornament">✦</div><div className="copy"><p>Your answer is safely submitted.</p><p>The next dare stays hidden until Aditya approves this one.</p><p>You can leave this page open or come back later. It will update when the decision arrives.</p></div><p className="note large">No peeking at what comes next…</p></section></Shell>;

  if (state.screen === "game") return <Shell footer={false} className="game"><section className="challenge reveal" key={state.current}><header className="challenge-head"><div><p className="eyebrow">CHALLENGE {String(state.current + 1).padStart(2, "0")} / 07</p><p className="progress-dots" aria-label={`${done} challenges approved`}>{state.submissions.map((s, i) => <span className={s.status === "approved" ? "filled" : s.status === "skipped" ? "skipped" : i === state.current ? "current" : ""} key={i}>●</span>)}</p></div><p className="survived">{progressText}</p></header><article className="dare-card">{state.submissions[state.current].status === "rejected" && <div className="rejected-note"><strong>Not approved yet.</strong><br />Aditya sent this dare back for another try.</div>}<p className="dare-no">DARE #{state.current + 1}</p><h1>{dare.title}</h1><div className={`dare-copy ${state.customQuestions[String(state.current)] ? "custom-question" : ""}`}>{state.customQuestions[String(state.current)] || dare.body}</div>{"prompt" in dare && dare.prompt && <p className="note prompt">{dare.prompt}</p>}
    {dare.kind === "text" && <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder={dare.placeholder} rows={5} aria-label="Your answer" />}
    {dare.kind === "choice" && <div className="choices"><button className={choice === "A perfect planned date" ? "selected" : ""} onClick={() => setChoice("A perfect planned date")}><span>♥</span>A perfect planned date</button><i>or</i><button className={choice === "A completely unplanned adventure" ? "selected" : ""} onClick={() => setChoice("A completely unplanned adventure")}><span>☺</span>A completely unplanned adventure</button>{choice && <><p className="note">Interesting choice. I’m definitely remembering that.</p><input value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Why did you choose it? (optional)" aria-label="Why did you choose it" /></>}</div>}
    {dare.kind === "photo" && <div className="photo-picker">{photo ? <><img src={photo.data} alt="Your chosen preview" /><p>{photo.name}</p><button className="text-button" onClick={() => inputRef.current?.click()}>choose a different photo</button></> : <button className="button" onClick={() => inputRef.current?.click()}>{dare.action}</button>}<input ref={inputRef} type="file" accept="image/*" onChange={selectPhoto} hidden /></div>}
    {dare.kind === "whatsapp" && <Button onClick={() => whatsapp(state.current === 0 ? "I owe you a proper sorry. I’m genuinely sorry, Aditya." : "Here is something completely random — no explanation allowed.")}>{dare.action}</Button>}
    {dare.kind !== "whatsapp" && dare.kind !== "photo" && <Button disabled={!canSubmit} onClick={submit}>{dare.action}</Button>}
    {dare.kind === "photo" && photo && <Button onClick={submit}>USE THIS PHOTO</Button>}
    {dare.kind === "whatsapp" && <div className="done-row"><span>Done?</span><Button onClick={submit}>I DID IT</Button></div>}
    {!skipConfirm && skips < 2 && <button className="text-button skip-link" onClick={() => setSkipConfirm(true)}>skip this one</button>}
    {skipConfirm && <div className="skip-box"><p><strong>Skipping this one?</strong><br />That’s okay. Remember, you only need 5.</p><div><button onClick={skip}>YES, SKIP</button><button onClick={() => setSkipConfirm(false)}>NO, I’LL DO IT</button></div></div>}
    {skips >= 2 && <p className="muted tiny">Both skips have been used.</p>}
  </article><p className="admin-hint">Submissions can be checked by Aditya. Approved so far: {approved}.</p></section></Shell>;

  return <Shell><section className="center opening reveal"><p className="eyebrow">A SMALL INVITATION</p><h2>Hii Tannu Singh <span className="heart">♥</span></h2><h1>Let’s play a<br /><em>little game.</em></h1><div className="divider"><span>✦</span></div><h3>Let’s make Saturday &amp; Sunday<br />our fun days.</h3><div className="copy"><p>If you’re free, come play with me.</p><p>But if you’re busy, don’t play right now.<br />No pressure. No hurry.</p><p>Just play when you actually have<br />some free time.</p><p className="time-note">You’ll need around <strong>30 minutes</strong><br />to properly enjoy this.</p></div><p className="note large">So… whenever you’re free,<br /><strong>shall we play?</strong></p><div className="actions"><Button onClick={() => go("rule")}>YES, LET’S PLAY</Button><Button secondary onClick={() => go("busy")}>I’M BUSY RIGHT NOW</Button></div></section></Shell>;
}
