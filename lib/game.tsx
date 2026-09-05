export type Status = "locked" | "available" | "submitted" | "approved" | "rejected" | "skipped";

export type Submission = {
  status: Status;
  answer?: string;
  choice?: string;
  photo?: string;
  photoName?: string;
  submittedAt?: string;
  reviewedAt?: string;
};

export type GameState = {
  screen: "home" | "busy" | "rule" | "intro" | "game" | "unlock" | "machine";
  current: number;
  submissions: Submission[];
  machineUnlocked: boolean;
  machinePulls: number;
  customQuestions: Record<string, string>;
  customTitles: Record<string, string>;
};

export const STORAGE_KEY = "tannu-weekend-game-v1";

export const initialState: GameState = {
  screen: "home",
  current: 0,
  submissions: Array.from({ length: 7 }, (_, i) => ({ status: i === 0 ? "available" : "locked" })),
  machineUnlocked: false,
  machinePulls: 0,
  customQuestions: {},
  customTitles: {},
};

export const dares = [
  { title: "A proper sorry", editableText: "If you think you were wrong about something and genuinely feel sorry…\n\nSay sorry to Aditya Singh.\n\nNo excuses. No ‘sorry, but…’ Just a proper sorry.", body: <>If you think you were wrong about something<br />and genuinely feel sorry…<br /><br />Say sorry to <strong>Aditya Singh</strong>.<br /><br />No excuses. No “sorry, but…”<br />Just a proper sorry.</>, kind: "whatsapp", action: "OPEN WHATSAPP", prompt: "💬 Send it to Aditya" },
  { title: "A new couple photo", editableText: "Choose a new photo of you with your partner.\n\nIf you can, take a fresh one today.\n\nNot an old favourite. Not one you’ve already sent Aditya. Make this one a new little memory.", body: <>Choose a new photo of you with your partner.<br /><br /><strong>If you can, take a fresh one today.</strong><br /><br />Not an old favourite. Not one you’ve already sent Aditya.<br /><br />Make this one a new little memory.</>, kind: "photo", action: "CHOOSE A PHOTO" },
  { title: "Be honest", editableText: "Be honest for a minute.\n\nWhat’s one thing about Aditya that annoys you… but you secretly find cute?", body: <>Be honest for a minute.<br /><br />What’s one thing about Aditya that annoys you…<br /><br /><strong>but you secretly find cute?</strong></>, kind: "text", action: "I’M BEING HONEST", placeholder: "Write the honest answer here…" },
  { title: "The hard truth", editableText: "Imagine our story paused today.\n\nWhat is the one thing you would regret not saying or not doing with Aditya?\n\nAnd what small step could you take about it this weekend?", body: <>Imagine our story paused today.<br /><br />What is the one thing you would regret<br /><strong>not saying or not doing with Aditya?</strong><br /><br />And what small step could you take<br />about it this weekend?</>, kind: "text", action: "I’VE THOUGHT ABOUT IT", placeholder: "I would regret… and this weekend I could…" },
  { title: "Something random", editableText: "Send Aditya something completely random.\n\nA joke. A meme. A weird thought. A compliment. Or literally one random word.\n\nDon’t explain why.", body: <>Send Aditya something completely random.<br /><br />A joke. A meme. A weird thought.<br />A compliment. Or literally one random word.<br /><br /><strong>Don’t explain why.</strong></>, kind: "whatsapp", action: "SEND SOMETHING RANDOM", prompt: "No context. That’s the rule." },
  { title: "Choose one", editableText: "You have to choose one.\n\nNo ‘both’.", body: <>You have to choose one.<br /><br /><strong>No “both”.</strong></>, kind: "choice", action: "THAT’S MY CHOICE" },
  { title: "One for the vault", editableText: "Last one. Don’t overthink it.\n\nWhat’s one thing you would really like us to do together someday?", body: <>Last one. Don’t overthink it.<br /><br />What’s one thing you would really like<br />us to do together someday?</>, kind: "text", action: "PUT IT IN THE VAULT", placeholder: "Someday, I’d like us to…" },
] as const;

export const machineEvents = [
  ["MISSION", "Find something around you that reminds you of Aditya."],
  ["MEMORY", "Tell me about a memory that still makes you smile."],
  ["QUESTION", "What’s something you’ve never asked Aditya?"],
  ["RANDOM", "Send Aditya the first emoji that comes to your mind."],
  ["CHALLENGE", "Make Aditya laugh without saying “haha”."],
  ["PREDICTION", "I predict you’re going to press this button again."],
  ["CHAOS", "You have 20 seconds. Do something completely random."],
] as const;

export const approvedCount = (state: GameState) => state.submissions.filter(s => s.status === "approved").length;
export const completedCount = (state: GameState) => state.submissions.filter(s => ["submitted", "approved"].includes(s.status)).length;
export const skippedCount = (state: GameState) => state.submissions.filter(s => s.status === "skipped").length;

export function normalizeState(saved: Partial<GameState>): GameState {
  return { ...initialState, ...saved, submissions: saved.submissions?.length === 7 ? saved.submissions : initialState.submissions, customQuestions: saved.customQuestions ?? {}, customTitles: saved.customTitles ?? {} };
}
