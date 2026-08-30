export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

export type DashboardGreeting = {
  title: string;
  subtitle: string;
};

type GreetingTemplate = {
  /** Empty = any time of day */
  periods?: DayPeriod[];
  title: string;
  subtitle: string;
};

const TEMPLATES: GreetingTemplate[] = [
  {
    periods: ["morning"],
    title: "Good morning, {name}",
    subtitle: "Ready to dig into your documents? DoqSeal is standing by.",
  },
  {
    periods: ["afternoon"],
    title: "Good afternoon, {name}",
    subtitle: "Your workspace is ready — pick up where you left off.",
  },
  {
    periods: ["evening"],
    title: "Good evening, {name}",
    subtitle: "Wrapping up the day? Review extractions or ask AI a quick question.",
  },
  {
    periods: ["night"],
    title: "Still at it, {name}?",
    subtitle: "Late-night document work — DoqSeal has your back.",
  },
  {
    title: "Welcome back, {name}",
    subtitle: "How can DoqSeal help you today?",
  },
  {
    title: "Hey {name}",
    subtitle: "What are we working on — Drive, Projects, or Intelligence?",
  },
  {
    title: "Nice to see you, {name}",
    subtitle: "Upload a file, check a project, or ask AI across your docs.",
  },
  {
    title: "Let’s get to work, {name}",
    subtitle: "Document intelligence for your organisation, all in one place.",
  },
  {
    title: "You’re in, {name}",
    subtitle: "Secure docs, smart extraction, and answers grounded in your data.",
  },
  {
    title: "What shall we tackle, {name}?",
    subtitle: "From one-off files to full projects — DoqSeal keeps context clear.",
  },
  {
    title: "Back at DoqSeal, {name}",
    subtitle: "Your Drive and projects are ready whenever you are.",
  },
  {
    title: "How can we help, {name}?",
    subtitle: "Ask AI, open a project, or drop a document into Drive.",
  },
  {
    title: "Onward, {name}",
    subtitle: "Compliance-minded document intelligence — without the busywork.",
  },
  {
    title: "Hello again, {name}",
    subtitle: "Need something extracted, verified, or found across your archive?",
  },
  {
    title: "Glad you’re here, {name}",
    subtitle: "Make documents useful — search, extract, and act with confidence.",
  },
];

export function getDayPeriod(date = new Date()): DayPeriod {
  const hour = date.getHours();
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

function fillName(template: string, name: string): string {
  return template.replaceAll("{name}", name);
}

/**
 * Picks a greeting for the dashboard. Prefer time-matched templates,
 * then fall back to any-time ones, and choose randomly among matches.
 */
export function pickDashboardGreeting(
  firstName: string,
  date = new Date()
): DashboardGreeting {
  const name = firstName?.trim() || "there";
  const period = getDayPeriod(date);

  const timed = TEMPLATES.filter(
    (t) => t.periods?.includes(period)
  );
  const anytime = TEMPLATES.filter((t) => !t.periods?.length);
  const pool = [...timed, ...anytime];

  const pick = pool[Math.floor(Math.random() * pool.length)] ?? TEMPLATES[0];

  return {
    title: fillName(pick.title, name),
    subtitle: fillName(pick.subtitle, name),
  };
}
