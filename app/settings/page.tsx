import { Card } from "@/components/ui/card";
import { getDashboardData } from "@/lib/dashboard";

export default function SettingsPage() {
  const data = getDashboardData();

  return (
    <main className="space-y-5">
      <Card>
        <h2 className="mb-2 text-lg font-semibold">Status Toggle（Recovery）</h2>
        <p className="text-sm text-slate-600">
          現在: {data.profile.status} / Freeでは変更不可（Proで多忙・体調モードを解放）
        </p>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold">If-Then Planning</h2>
        <p className="text-sm text-slate-700">もし集中できないなら → 5分だけ深呼吸して着席。</p>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold">Billing</h2>
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-lg border p-3">
            <p className="font-medium">Free</p>
            <p>履歴14日 / 固定提案</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-medium">Pro（月額 ¥980 仮）</p>
            <p>Adaptive提案 / Recovery機能 / Heatmap</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="font-medium">Lifetime（¥12,000 仮）</p>
            <p>買い切りで全機能</p>
          </div>
        </div>
      </Card>
    </main>
  );
}
