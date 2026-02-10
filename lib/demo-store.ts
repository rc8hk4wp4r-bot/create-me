import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { DailyLog, Habit, Proposal } from "@/lib/types";
import { todayInTokyo } from "@/lib/time";

const file = join(process.cwd(), ".demo-data.json");
const userId = "11111111-1111-1111-1111-111111111111";

type DemoData = {
  profile: {
    id: string;
    timezone: string;
    plan: "free" | "pro" | "lifetime";
    status: "normal" | "busy" | "sick";
    energy_today: number;
  };
  habits: Habit[];
  daily_logs: DailyLog[];
  proposals: Proposal[];
};

const defaultHabits = [
  { name: "深作業", category: "work" as const },
  { name: "ストレッチ", category: "body" as const },
  { name: "読書", category: "mind" as const },
  { name: "振り返り", category: "mind" as const },
  { name: "散歩", category: "body" as const },
];

export function readDemoData(): DemoData {
  if (!existsSync(file)) {
    const habits: Habit[] = defaultHabits.map((h, i) => ({
      id: randomUUID(),
      user_id: userId,
      name: h.name,
      category: h.category,
      order_index: i,
      is_active: true,
    }));

    const seed: DemoData = {
      profile: {
        id: userId,
        timezone: "Asia/Tokyo",
        plan: "free",
        status: "normal",
        energy_today: 60,
      },
      habits,
      daily_logs: [],
      proposals: [],
    };
    writeFileSync(file, JSON.stringify(seed, null, 2));
  }
  return JSON.parse(readFileSync(file, "utf-8")) as DemoData;
}

export function saveDemoData(data: DemoData) {
  writeFileSync(file, JSON.stringify(data, null, 2));
}

export function upsertLog(args: { habitId: string; date: string; done?: boolean; intensity?: "S" | "M" | "L"; exp?: number }) {
  const data = readDemoData();
  const existing = data.daily_logs.find((l) => l.habit_id === args.habitId && l.date === args.date);
  if (!existing) {
    data.daily_logs.push({
      id: randomUUID(),
      user_id: userId,
      habit_id: args.habitId,
      date: args.date,
      done: args.done ?? false,
      intensity: args.intensity ?? "S",
      exp: args.exp ?? 1,
    });
  } else {
    if (typeof args.done === "boolean") existing.done = args.done;
    if (args.intensity) existing.intensity = args.intensity;
    if (typeof args.exp === "number") existing.exp = args.exp;
  }
  saveDemoData(data);
}

export function upsertProposal(proposal: Omit<Proposal, "id">) {
  const data = readDemoData();
  const existing = data.proposals.find((p) => p.date === proposal.date);
  if (!existing) {
    data.proposals.push({ ...proposal, id: randomUUID() });
  } else {
    Object.assign(existing, proposal);
  }
  saveDemoData(data);
}

export function ensureTodayProposal(mode: Proposal["mode"], text: string) {
  upsertProposal({
    user_id: userId,
    date: todayInTokyo(),
    mode,
    text,
    accepted: null,
    downgraded: false,
  });
}
