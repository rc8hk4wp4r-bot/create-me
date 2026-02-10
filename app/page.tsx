import { HomeClient } from "@/components/home/home-client";
import { getDashboardData } from "@/lib/dashboard";
import { todayInTokyo } from "@/lib/time";

export default function HomePage() {
  const data = getDashboardData();
  const today = todayInTokyo();

  return (
    <main className="grid gap-5">
      <HomeClient data={data} today={today} />
    </main>
  );
}
