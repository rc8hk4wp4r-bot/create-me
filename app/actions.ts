"use server";

import { revalidatePath } from "next/cache";
import { expFromIntensity, downgradeMode } from "@/lib/engine";
import { upsertLog, readDemoData, saveDemoData } from "@/lib/demo-store";
import { proposalDecisionSchema, setIntensitySchema, toggleHabitSchema } from "@/lib/validators";

export async function toggleHabitAction(input: { habitId: string; date: string; done: boolean }) {
  const parsed = toggleHabitSchema.parse(input);
  const store = readDemoData();
  const existing = store.daily_logs.find((l) => l.habit_id === parsed.habitId && l.date === parsed.date);
  const intensity = existing?.intensity ?? "S";

  upsertLog({
    habitId: parsed.habitId,
    date: parsed.date,
    done: parsed.done,
    intensity,
    exp: expFromIntensity(intensity),
  });

  revalidatePath("/");
}

export async function setIntensityAction(input: { habitId: string; date: string; intensity: "S" | "M" | "L" }) {
  const parsed = setIntensitySchema.parse(input);
  const store = readDemoData();
  const existing = store.daily_logs.find((l) => l.habit_id === parsed.habitId && l.date === parsed.date);

  upsertLog({
    habitId: parsed.habitId,
    date: parsed.date,
    intensity: parsed.intensity,
    done: existing?.done ?? false,
    exp: expFromIntensity(parsed.intensity),
  });

  revalidatePath("/");
}

export async function proposalDecisionAction(input: { date: string; action: "accept" | "downgrade" }) {
  const parsed = proposalDecisionSchema.parse(input);
  const store = readDemoData();
  const proposal = store.proposals.find((p) => p.date === parsed.date);
  if (!proposal) return;

  if (parsed.action === "accept") {
    proposal.accepted = true;
    proposal.downgraded = false;
  } else {
    proposal.mode = downgradeMode(proposal.mode);
    proposal.downgraded = true;
    proposal.accepted = true;
    proposal.text = "今日は軽めで合格。5分タスクだけやればOK。";
  }

  saveDemoData(store);
  revalidatePath("/");
}

export async function setEnergyAction(energy: number) {
  if (energy < 0 || energy > 100) return;
  const store = readDemoData();
  store.profile.energy_today = energy;
  saveDemoData(store);
  revalidatePath("/");
}
