export type Plan = "free" | "pro" | "lifetime";
export type UserStatus = "normal" | "busy" | "sick";
export type ProposalMode = "growth" | "maintenance" | "recovery";
export type BandState = "overreaching" | "on_track" | "drifting";
export type Intensity = "S" | "M" | "L";

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  category: "work" | "body" | "mind";
  order_index: number;
  is_active: boolean;
};

export type DailyLog = {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  done: boolean;
  intensity: Intensity;
  exp: number;
};

export type Proposal = {
  id: string;
  user_id: string;
  date: string;
  mode: ProposalMode;
  text: string;
  accepted: boolean | null;
  downgraded: boolean;
};

export type DashboardData = {
  profile: {
    id: string;
    timezone: string;
    plan: Plan;
    status: UserStatus;
    energy_today: number;
  };
  habits: Habit[];
  logsToday: DailyLog[];
  logs90Days: DailyLog[];
  proposal: Proposal;
  band: {
    baseline: number;
    upper: number;
    lower: number;
    line7d: number;
    state: BandState;
    note: string;
  };
  weeklyReview: string;
  paywallHints: string[];
};
