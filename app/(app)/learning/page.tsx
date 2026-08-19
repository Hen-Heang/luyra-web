import { BookOpenCheck, CalendarDays, Flame, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getHengoLearningSummary } from "@/lib/integrations/hengo/learning-summary";

export default async function LearningPage() {
  const summary = await getHengoLearningSummary();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Hengo</p>
        <h1 className="text-2xl font-semibold tracking-tight">Learning</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your Korean learning progress, read from the existing Hengo Supabase project.
        </p>
      </div>

      {summary.status === "unauthenticated" && (
        <Card>
          <CardHeader>
            <CardTitle>Hengo session unavailable</CardTitle>
            <CardDescription>Sign in to HeangOS again to load your learning data.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {summary.status === "error" && (
        <Card>
          <CardHeader>
            <CardTitle>Hengo data is unavailable</CardTitle>
            <CardDescription>{summary.message}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {summary.status === "ready" && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">Hengo connected</Badge>
            {summary.profile?.korean_level && (
              <Badge variant="outline">Level: {summary.profile.korean_level}</Badge>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Languages className="size-4" />
                  <CardDescription>Vocabulary cards</CardDescription>
                </div>
                <CardTitle className="text-2xl">{summary.vocabularyCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpenCheck className="size-4" />
                  <CardDescription>Reviews due</CardDescription>
                </div>
                <CardTitle className="text-2xl">{summary.reviewsDue}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Flame className="size-4" />
                  <CardDescription>Best vocab streak</CardDescription>
                </div>
                <CardTitle className="text-2xl">{summary.profile?.best_vocab_streak ?? 0}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                <CardTitle>Latest study plan</CardTitle>
              </div>
              <CardDescription>
                {summary.recentActivityCount} learning activities recorded in the last seven days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summary.latestPlan ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium">{summary.latestPlan.topic_label}</p>
                  <p className="text-sm text-muted-foreground">
                    {summary.latestPlan.study_date} · {Math.round(summary.latestPlan.total_focus_seconds / 60)} focused minutes
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No saved daily study plan yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
