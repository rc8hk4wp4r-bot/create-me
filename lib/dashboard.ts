import { shiftDate } from "@/lib/date";
import { calcBand, decideProposal, summarizeDay } from "@/lib/engine";
import { readDemoData, ensureTodayProposal } from "@/lib/demo-store";
import { todayInTokyo } from "@/lib/time";
import type { DashboardData } from "@/lib/types";

export function getDashboardData(): DashboardData {
  const data = readDemoData();
  const today = todayInTokyo();
  const yesterday = shiftDate(today, -1);

  const logsToday = data.daily_logs.filter((l) => l.date === today);
  const logsYesterday = data.daily_logs.filter((l) => l.date === yesterday);
  const logs90Days = data.daily_logs.filter((l) => {
    const diff = Math.floor((new Date(`${today}T00:00:00+09:00`).getTime() - new Date(`${l.date}T00:00:00+09:00`).getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 89;
  });

  const band = calcBand(logs90Days, today);
  const completion = summarizeDay(logsYesterday).completionRate;
  const proposalRule = decideProposal({
    yesterdayCompletionRate: completion,
    energyToday: data.profile.energy_today,
    bandState: band.state,
    status: data.profile.status,
  });

  ensureTodayProposal(proposalRule.mode, proposalRule.text);
  const proposal = readDemoData().proposals.find((p) => p.date === today)!;

  const weeklyReview =
    band.state === "on_track"
      ? "先週は安定。次週も同じ設計で続けよう。"
      : band.state === "drifting"
        ? "先週は負荷が高め。今週は回復優先で再始動。"
        : "先週は攻めた。今週は維持モードで反動を防ぐ。";

  const paywallHints = [
    "Freeは履歴14日まで。Proで無制限。",
    "途切れ翌日のGrace CheckはPro限定。",
  ];

  return {
    profile: data.profile,
    habits: data.habits.sort((a, b) => a.order_index - b.order_index).slice(0, 5),
    logsToday,
    logs90Days,
    proposal,
    band,
    weeklyReview,
    paywallHints,
  };
}
