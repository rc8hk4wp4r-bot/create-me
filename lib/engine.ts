import { shiftDate } from "@/lib/date";
import type { BandState, DailyLog, ProposalMode, UserStatus } from "@/lib/types";

const INTENSITY_EXP = { S: 1, M: 2, L: 3 } as const;

export function expFromIntensity(intensity: keyof typeof INTENSITY_EXP): number {
  return INTENSITY_EXP[intensity];
}

export function summarizeDay(logs: DailyLog[]) {
  if (logs.length === 0) return { completionRate: 0, exp: 0 };
  const done = logs.filter((l) => l.done).length;
  const exp = logs.filter((l) => l.done).reduce((s, l) => s + l.exp, 0);
  return { completionRate: done / logs.length, exp };
}

export function calcBand(logs90: DailyLog[], today: string) {
  const dayExp = new Map<string, number>();
  for (let i = 0; i < 90; i++) {
    const d = shiftDate(today, -i);
    dayExp.set(d, 0);
  }
  logs90.forEach((l) => {
    if (!l.done) return;
    dayExp.set(l.date, (dayExp.get(l.date) ?? 0) + l.exp);
  });

  const dates = [...dayExp.keys()].sort();
  const latest28 = dates.slice(-28).map((d) => dayExp.get(d) ?? 0);
  const baseline = latest28.length ? latest28.reduce((a, b) => a + b, 0) / latest28.length : 0;
  const upper = baseline * 1.2;
  const lower = baseline * 0.8;

  const latest7 = dates.slice(-7).map((d) => dayExp.get(d) ?? 0);
  const line7d = latest7.length ? latest7.reduce((a, b) => a + b, 0) / latest7.length : 0;

  let state: BandState = "on_track";
  if (line7d > upper && baseline > 0) state = "overreaching";
  if (line7d < lower) state = "drifting";

  const noteMap: Record<BandState, string> = {
    overreaching: "飛ばし気味。今日は軽めで積み上げよう。",
    on_track: "安定している。今のペースで十分。",
    drifting: "下振れ中。5分タスクで再始動しよう。",
  };

  return { baseline, upper, lower, line7d, state, note: noteMap[state], points: dates.map((d) => ({ date: d, exp: dayExp.get(d) ?? 0 })) };
}

export function decideProposal(args: {
  yesterdayCompletionRate: number;
  energyToday: number;
  bandState: BandState;
  status: UserStatus;
}): { mode: ProposalMode; text: string } {
  const { yesterdayCompletionRate, energyToday, bandState, status } = args;

  let mode: ProposalMode;
  if (status === "busy" || status === "sick") {
    mode = "recovery";
  } else if (yesterdayCompletionRate > 0.8 && energyToday > 70 && bandState !== "overreaching") {
    mode = "growth";
  } else if (yesterdayCompletionRate < 0.3 || energyToday < 40 || bandState === "drifting") {
    mode = "recovery";
  } else {
    mode = "maintenance";
  }

  const texts: Record<ProposalMode, string> = {
    growth: "25分だけ深作業。終わったら短く記録して完了。",
    maintenance: "15分だけ着手。質より継続を優先しよう。",
    recovery: "5分だけ最小タスク。今日は軽めで合格。",
  };

  return { mode, text: texts[mode] };
}

export function downgradeMode(mode: ProposalMode): ProposalMode {
  if (mode === "growth") return "maintenance";
  return "recovery";
}
