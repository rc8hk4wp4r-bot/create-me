"use client";

import { useMemo, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { proposalDecisionAction, setEnergyAction, setIntensityAction, toggleHabitAction } from "@/app/actions";
import type { DashboardData, Intensity } from "@/lib/types";

const intensityOrder: Intensity[] = ["S", "M", "L"];

export function HomeClient({ data, today }: { data: DashboardData; today: string }) {
  const [pending, startTransition] = useTransition();

  const logMap = useMemo(() => {
    return new Map(data.logsToday.map((log) => [log.habit_id, log]));
  }, [data.logsToday]);

  const onToggle = (habitId: string, done: boolean) => {
    startTransition(async () => {
      await toggleHabitAction({ habitId, date: today, done: !done });
    });
  };

  const onIntensityUp = (habitId: string, current: Intensity) => {
    const idx = intensityOrder.indexOf(current);
    const next = intensityOrder[Math.min(idx + 1, intensityOrder.length - 1)];
    startTransition(async () => {
      await setIntensityAction({ habitId, date: today, intensity: next });
    });
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    const isShift = event.shiftKey;
    if (event.key.toLowerCase() === "p") {
      startTransition(async () => proposalDecisionAction({ date: today, action: "accept" }));
      return;
    }
    if (event.key.toLowerCase() === "d") {
      startTransition(async () => proposalDecisionAction({ date: today, action: "downgrade" }));
      return;
    }

    const num = Number(event.key);
    if (Number.isNaN(num) || num < 1 || num > data.habits.length) return;

    const habit = data.habits[num - 1];
    const current = logMap.get(habit.id);
    if (isShift) {
      onIntensityUp(habit.id, current?.intensity ?? "S");
    } else {
      onToggle(habit.id, current?.done ?? false);
    }
  };

  return (
    <div className="space-y-5" tabIndex={0} onKeyDown={handleKeyDown}>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">1日1提案</h2>
          <Badge>{data.proposal.mode.toUpperCase()}</Badge>
        </div>
        <p className="text-sm text-slate-700">{data.proposal.text}</p>
        {data.proposal.downgraded ? (
          <p className="mt-2 text-xs text-emerald-700">再交渉済み。今日は軽めで合格です。</p>
        ) : null}
        <div className="mt-4 flex gap-2">
          <Button onClick={() => startTransition(async () => proposalDecisionAction({ date: today, action: "accept" }))}>
            Accept (P)
          </Button>
          <Button
            variant="outline"
            onClick={() => startTransition(async () => proposalDecisionAction({ date: today, action: "downgrade" }))}
          >
            Downgrade (D)
          </Button>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quick Logger</h2>
          <p className="text-xs text-slate-500">1..5: 完了切替 / Shift+1..5: 強度UP</p>
        </div>
        <div className="space-y-2">
          {data.habits.map((habit, idx) => {
            const log = logMap.get(habit.id);
            const done = log?.done ?? false;
            const intensity = log?.intensity ?? "S";
            return (
              <div key={habit.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <div className="flex items-center gap-3">
                  <kbd>{idx + 1}</kbd>
                  <button
                    className={`h-5 w-5 rounded border ${done ? "bg-emerald-500" : "bg-white"}`}
                    onClick={() => onToggle(habit.id, done)}
                    aria-label={`${habit.name} 完了切替`}
                  />
                  <span>{habit.name}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => onIntensityUp(habit.id, intensity)}>
                  強度 {intensity}
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mini Band</h2>
          <Badge className="capitalize">{data.band.state.replace("_", " ")}</Badge>
        </div>
        <p className="text-sm text-slate-700">{data.band.note}</p>
        <p className="mt-2 text-xs text-slate-500">
          baseline {data.band.baseline.toFixed(1)} / line7d {data.band.line7d.toFixed(1)}
        </p>
        <div className="mt-4">
          <label className="text-sm">今日のエネルギー: {data.profile.energy_today}</label>
          <input
            type="range"
            min={0}
            max={100}
            defaultValue={data.profile.energy_today}
            onMouseUp={(event) => {
              const value = Number((event.target as HTMLInputElement).value);
              startTransition(async () => setEnergyAction(value));
            }}
            className="w-full"
          />
        </div>
      </Card>

      <p className="text-xs text-slate-500">
        {pending ? "保存中..." : "キーボード優先で最小入力。罪悪感ではなく再始動を設計。"}
      </p>
    </div>
  );
}
