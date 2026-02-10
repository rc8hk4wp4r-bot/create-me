import { Card } from "@/components/ui/card";
import { getDashboardData } from "@/lib/dashboard";

export default function HistoryPage() {
  const data = getDashboardData();
  const points = data.band.points.slice(-90);
  const plan = data.profile.plan;

  return (
    <main className="space-y-5">
      <Card>
        <h2 className="mb-2 text-lg font-semibold">90日 Band（簡易）</h2>
        <div className="space-y-1 text-sm">
          {points.slice(-14).map((p) => (
            <div key={p.date} className="grid grid-cols-[90px_1fr] gap-2">
              <span className="text-slate-500">{p.date.slice(5)}</span>
              <div className="h-5 rounded bg-slate-100">
                <div className="h-5 rounded bg-blue-500" style={{ width: `${Math.min(100, p.exp * 12)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold">年間 Heatmap</h2>
        {plan === "free" ? (
          <p className="text-sm text-slate-600">Freeは14日まで。ProでHeatmapと無制限履歴を開放。</p>
        ) : (
          <p className="text-sm text-slate-600">Heatmap（MVPでは次のマイルストーンで実装）。</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold">Weekly Review</h2>
        <p className="text-sm text-slate-700">{data.weeklyReview}</p>
      </Card>
    </main>
  );
}
