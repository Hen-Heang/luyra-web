import "server-only";
import { sql } from "@/lib/db";
import type { FinancePreferences } from "@/types/finance";

interface BudgetWarningThresholdsRow {
  first?: number;
  strong?: number;
  over?: number;
}

interface QuietHoursRow {
  enabled?: boolean;
  start?: string;
  end?: string;
}

// What the scheduled jobs need, which is not the same set the Settings screen
// edits — quiet hours and the last-sent markers have no UI, and the report
// channel toggles are read but never written here. Kept separate from
// FinancePreferences so the client-facing type doesn't grow fields the client
// has no use for.
export interface CronPreferences {
  budgetWatchThresholdPct: number;
  budgetNearLimitThresholdPct: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  weeklyReviewEnabled: boolean;
  monthlyReviewEnabled: boolean;
  monthlyReportChannelTelegram: boolean;
  weeklyReportLastSentWeek: string | null;
  monthlyReportLastSentMonth: string | null;
}

const DEFAULT_CRON_PREFERENCES: CronPreferences = {
  budgetWatchThresholdPct: 70,
  budgetNearLimitThresholdPct: 90,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  weeklyReviewEnabled: true,
  monthlyReviewEnabled: true,
  monthlyReportChannelTelegram: true,
  weeklyReportLastSentWeek: null,
  monthlyReportLastSentMonth: null,
};

export async function findCronPreferences(userId: string): Promise<CronPreferences> {
  const rows = (await sql`
    select budget_warning_thresholds, quiet_hours, weekly_review_enabled, monthly_review_enabled,
      monthly_report_channel_telegram, weekly_report_last_sent_week, monthly_report_last_sent_month
    from finance_preferences where user_id = ${userId}
  `) as {
    budget_warning_thresholds: BudgetWarningThresholdsRow | null;
    quiet_hours: QuietHoursRow | null;
    weekly_review_enabled: boolean;
    monthly_review_enabled: boolean;
    monthly_report_channel_telegram: boolean;
    weekly_report_last_sent_week: string | null;
    monthly_report_last_sent_month: string | null;
  }[];

  const row = rows[0];
  if (!row) return DEFAULT_CRON_PREFERENCES;

  return {
    budgetWatchThresholdPct: Number(row.budget_warning_thresholds?.first ?? DEFAULT_CRON_PREFERENCES.budgetWatchThresholdPct),
    budgetNearLimitThresholdPct: Number(
      row.budget_warning_thresholds?.strong ?? DEFAULT_CRON_PREFERENCES.budgetNearLimitThresholdPct
    ),
    quietHoursEnabled: row.quiet_hours?.enabled ?? DEFAULT_CRON_PREFERENCES.quietHoursEnabled,
    quietHoursStart: row.quiet_hours?.start ?? DEFAULT_CRON_PREFERENCES.quietHoursStart,
    quietHoursEnd: row.quiet_hours?.end ?? DEFAULT_CRON_PREFERENCES.quietHoursEnd,
    weeklyReviewEnabled: row.weekly_review_enabled,
    monthlyReviewEnabled: row.monthly_review_enabled,
    monthlyReportChannelTelegram: row.monthly_report_channel_telegram,
    weeklyReportLastSentWeek: row.weekly_report_last_sent_week,
    monthlyReportLastSentMonth: row.monthly_report_last_sent_month,
  };
}

// finance_preferences.user_id is the primary key, so ON CONFLICT is safe here.
// A user who has never opened Settings has no row yet, and the scheduler must
// still be able to record that it sent them something.
export async function markWeeklyReportSent(userId: string, week: string): Promise<void> {
  await sql`
    insert into finance_preferences (user_id, weekly_report_last_sent_week)
    values (${userId}, ${week})
    on conflict (user_id) do update set weekly_report_last_sent_week = ${week}, updated_at = now()
  `;
}

export async function markMonthlyReportSent(userId: string, month: string): Promise<void> {
  await sql`
    insert into finance_preferences (user_id, monthly_report_last_sent_month)
    values (${userId}, ${month})
    on conflict (user_id) do update set monthly_report_last_sent_month = ${month}, updated_at = now()
  `;
}

const DEFAULT_PREFERENCES: FinancePreferences = {
  monthlySpendingLimitKrw: null,
  targetSavingsRate: 20,
  budgetWatchThresholdPct: 70,
  budgetNearLimitThresholdPct: 90,
  monthlyReviewEnabled: true,
  financeReportEmail: null,
  weeklyReportEmailEnabled: false,
  monthlyReportEmailEnabled: false,
};

export async function findPreferences(userId: string): Promise<FinancePreferences> {
  const rows = (await sql`
    select monthly_spending_limit_krw, target_savings_rate, budget_warning_thresholds, monthly_review_enabled,
      finance_report_email, weekly_report_channel_email, monthly_report_channel_email
    from finance_preferences where user_id = ${userId}
  `) as {
    monthly_spending_limit_krw: string | null;
    target_savings_rate: string;
    budget_warning_thresholds: BudgetWarningThresholdsRow | null;
    monthly_review_enabled: boolean;
    finance_report_email: string | null;
    weekly_report_channel_email: boolean;
    monthly_report_channel_email: boolean;
  }[];

  if (!rows[0]) return DEFAULT_PREFERENCES;

  const thresholds = rows[0].budget_warning_thresholds;
  return {
    monthlySpendingLimitKrw: rows[0].monthly_spending_limit_krw !== null ? Number(rows[0].monthly_spending_limit_krw) : null,
    targetSavingsRate: Number(rows[0].target_savings_rate),
    budgetWatchThresholdPct: Number(thresholds?.first ?? DEFAULT_PREFERENCES.budgetWatchThresholdPct),
    budgetNearLimitThresholdPct: Number(thresholds?.strong ?? DEFAULT_PREFERENCES.budgetNearLimitThresholdPct),
    monthlyReviewEnabled: rows[0].monthly_review_enabled,
    financeReportEmail: rows[0].finance_report_email,
    weeklyReportEmailEnabled: rows[0].weekly_report_channel_email,
    monthlyReportEmailEnabled: rows[0].monthly_report_channel_email,
  };
}

export async function upsertPreferences(
  userId: string,
  input: {
    monthlySpendingLimitKrw?: number | null;
    targetSavingsRate?: number;
    budgetWatchThresholdPct?: number;
    budgetNearLimitThresholdPct?: number;
    monthlyReviewEnabled?: boolean;
    financeReportEmail?: string | null;
    weeklyReportEmailEnabled?: boolean;
    monthlyReportEmailEnabled?: boolean;
  }
): Promise<FinancePreferences> {
  const existing = (await sql`
    select budget_warning_thresholds from finance_preferences where user_id = ${userId}
  `) as { budget_warning_thresholds: BudgetWarningThresholdsRow | null }[];

  const needsThresholdUpdate = input.budgetWatchThresholdPct !== undefined || input.budgetNearLimitThresholdPct !== undefined;
  const currentThresholds = existing[0]?.budget_warning_thresholds;
  const nextThresholds = needsThresholdUpdate
    ? {
        first: input.budgetWatchThresholdPct ?? currentThresholds?.first ?? DEFAULT_PREFERENCES.budgetWatchThresholdPct,
        strong: input.budgetNearLimitThresholdPct ?? currentThresholds?.strong ?? DEFAULT_PREFERENCES.budgetNearLimitThresholdPct,
        over: 100,
      }
    : undefined;

  if (existing.length > 0) {
    const sets: string[] = [];
    const params: unknown[] = [userId];
    const set = (column: string, value: unknown) => {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    };
    if (input.monthlySpendingLimitKrw !== undefined) set("monthly_spending_limit_krw", input.monthlySpendingLimitKrw);
    if (input.targetSavingsRate !== undefined) set("target_savings_rate", input.targetSavingsRate);
    if (nextThresholds) set("budget_warning_thresholds", JSON.stringify(nextThresholds));
    if (input.monthlyReviewEnabled !== undefined) set("monthly_review_enabled", input.monthlyReviewEnabled);
    if (input.financeReportEmail !== undefined) set("finance_report_email", input.financeReportEmail);
    if (input.weeklyReportEmailEnabled !== undefined) set("weekly_report_channel_email", input.weeklyReportEmailEnabled);
    if (input.monthlyReportEmailEnabled !== undefined) set("monthly_report_channel_email", input.monthlyReportEmailEnabled);
    sets.push("updated_at = now()");

    await sql.query(`update finance_preferences set ${sets.join(", ")} where user_id = $1`, params);
  } else {
    await sql`
      insert into finance_preferences (
        user_id, monthly_spending_limit_krw, target_savings_rate, budget_warning_thresholds, monthly_review_enabled,
        finance_report_email, weekly_report_channel_email, monthly_report_channel_email
      )
      values (
        ${userId}, ${input.monthlySpendingLimitKrw ?? null}, ${input.targetSavingsRate ?? DEFAULT_PREFERENCES.targetSavingsRate},
        ${JSON.stringify(
          nextThresholds ?? { first: DEFAULT_PREFERENCES.budgetWatchThresholdPct, strong: DEFAULT_PREFERENCES.budgetNearLimitThresholdPct, over: 100 }
        )},
        ${input.monthlyReviewEnabled ?? DEFAULT_PREFERENCES.monthlyReviewEnabled},
        ${input.financeReportEmail ?? null},
        ${input.weeklyReportEmailEnabled ?? DEFAULT_PREFERENCES.weeklyReportEmailEnabled},
        ${input.monthlyReportEmailEnabled ?? DEFAULT_PREFERENCES.monthlyReportEmailEnabled}
      )
    `;
  }

  return findPreferences(userId);
}
