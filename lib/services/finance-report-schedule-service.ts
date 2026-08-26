import "server-only";
import {
  findCronPreferences,
  markMonthlyReportSent,
  markWeeklyReportSent,
} from "@/lib/repositories/finance-preferences-repository";
import { findLinkedAccounts } from "@/lib/repositories/telegram-account-repository";
import { sendMonthlyReportToTelegram, sendWeeklySummaryToTelegram } from "@/lib/services/finance-telegram-service";
import { appDate, appMonth, monthKeyLabel, previousMonth, weekStart } from "@/lib/finance-cron-time";
import { isTelegramConfigured } from "@/lib/telegram/client";
import type { CronRunResult } from "@/lib/server/cron";

const NOT_CONFIGURED: CronRunResult = { scanned: 0, notified: 0, skipped: "telegram_not_configured" };

/**
 * Weekly summary for every linked user who hasn't opted out.
 *
 * The send is recorded against the Monday of the current week, so a retry or a
 * manual re-trigger inside the same week is a no-op rather than a second
 * message.
 */
export async function runWeeklySummaries(now: Date = new Date()): Promise<CronRunResult> {
  if (!isTelegramConfigured()) return NOT_CONFIGURED;

  const accounts = await findLinkedAccounts();
  const week = weekStart(appDate(now));
  let notified = 0;

  for (const account of accounts) {
    const preferences = await findCronPreferences(account.userId);
    if (!preferences.weeklyReviewEnabled) continue;
    if (preferences.weeklyReportLastSentWeek === week) continue;

    const result = await sendWeeklySummaryToTelegram(account.userId);
    if (!result.sent) continue;

    // Only recorded after a confirmed send, so a Telegram outage means the
    // next run retries rather than silently skipping the week.
    await markWeeklyReportSent(account.userId, week);
    notified += 1;
  }

  return { scanned: accounts.length, notified };
}

/**
 * Monthly report for the month that has just finished.
 *
 * This runs daily rather than on the 1st: a run that fails or is skipped on
 * the 1st would otherwise lose the report for a whole month. The last-sent
 * marker is what keeps a daily schedule from re-sending it every morning.
 */
export async function runMonthlyReports(now: Date = new Date()): Promise<CronRunResult> {
  if (!isTelegramConfigured()) return NOT_CONFIGURED;

  const accounts = await findLinkedAccounts();
  const reportMonth = previousMonth(appMonth(now));
  const label = monthKeyLabel(reportMonth);
  let notified = 0;

  for (const account of accounts) {
    const preferences = await findCronPreferences(account.userId);
    if (!preferences.monthlyReviewEnabled || !preferences.monthlyReportChannelTelegram) continue;
    if (preferences.monthlyReportLastSentMonth === reportMonth) continue;

    const result = await sendMonthlyReportToTelegram(account.userId, reportMonth, label);
    if (!result.sent) continue;

    await markMonthlyReportSent(account.userId, reportMonth);
    notified += 1;
  }

  return { scanned: accounts.length, notified };
}
