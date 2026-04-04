import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Heart, TrendingUp, Megaphone } from "lucide-react";
import { StatisticsCharts } from "@/components/charts/StatisticsCharts";
import { StatisticsDownloadButtons } from "@/components/charts/StatisticsDownloadButtons";

export default async function StatisticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "pastor") redirect("/dashboard");

  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  const since = eightWeeksAgo.toISOString().split("T")[0];

  const [{ data: sunReports }, { data: missionReports }, { data: memberRows }] =
    await Promise.all([
      supabase
        .from("sun_reports")
        .select("report_date, attend_total, bible_chapters, mission_id, status")
        .gte("report_date", since)
        .eq("status", "submitted")
        .order("report_date", { ascending: true }),
      supabase
        .from("mission_reports")
        .select("report_date, total_offering")
        .gte("report_date", since)
        .eq("status", "submitted"),
      supabase
        .from("sun_report_members")
        .select("id")
        .eq("evangelism", true),
    ]);

  // 주차별 집계
  const weeklyMap = new Map<string, { attend: number; bible: number; offering: number }>();

  sunReports?.forEach((r) => {
    const e = weeklyMap.get(r.report_date) ?? { attend: 0, bible: 0, offering: 0 };
    weeklyMap.set(r.report_date, { ...e, attend: e.attend + r.attend_total, bible: e.bible + r.bible_chapters });
  });
  missionReports?.forEach((r) => {
    const e = weeklyMap.get(r.report_date) ?? { attend: 0, bible: 0, offering: 0 };
    weeklyMap.set(r.report_date, { ...e, offering: e.offering + r.total_offering });
  });

  const weeks = Array.from(weeklyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([date, w]) => ({ date, ...w }));

  const latestWeek = weeks[weeks.length - 1];
  const avgAttend =
    weeks.length > 0 ? Math.round(weeks.reduce((s, w) => s + w.attend, 0) / weeks.length) : 0;

  const latestDate = latestWeek?.date;
  const missionMap = new Map<number, number>();
  sunReports
    ?.filter((r) => r.report_date === latestDate)
    .forEach((r) => {
      missionMap.set(r.mission_id, (missionMap.get(r.mission_id) ?? 0) + r.attend_total);
    });

  const missionChartData = Array.from({ length: 12 }, (_, i) => ({
    mission: `${i + 1}선`,
    attend: missionMap.get(i + 1) ?? 0,
  }));

  const evangelismCount = memberRows?.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">통계 현황</h2>
        <StatisticsDownloadButtons
          weeks={weeks}
          missionChartData={missionChartData}
          latestDate={latestDate}
          summary={{
            latestAttend: latestWeek?.attend ?? 0,
            latestOffering: latestWeek?.offering ?? 0,
            latestBible: latestWeek?.bible ?? 0,
            avgAttend,
            evangelismCount,
          }}
        />
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-muted-foreground">최근 주 참석</p>
            </div>
            <p className="text-2xl font-bold text-primary mt-1">{latestWeek?.attend ?? 0}명</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              <p className="text-xs text-muted-foreground">최근 주 헌금</p>
            </div>
            <p className="text-2xl font-bold text-primary mt-1">
              {(latestWeek?.offering ?? 0).toLocaleString()}원
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-green-500" />
              <p className="text-xs text-muted-foreground">최근 주 성경</p>
            </div>
            <p className="text-2xl font-bold text-primary mt-1">{latestWeek?.bible ?? 0}장</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <p className="text-xs text-muted-foreground">8주 평균 참석</p>
            </div>
            <p className="text-2xl font-bold text-primary mt-1">{avgAttend}명</p>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-orange-500" />
              <p className="text-xs text-muted-foreground">최근 8주 전도</p>
            </div>
            <p className="text-2xl font-bold text-primary mt-1">{evangelismCount}건</p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 (Client Component) */}
      <StatisticsCharts weeks={weeks} missionChartData={missionChartData} latestDate={latestDate} />

      {/* 주차별 추이 테이블 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">최근 8주 추이</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">날짜</th>
                  <th className="text-right px-4 py-2 font-medium">참석</th>
                  <th className="text-right px-4 py-2 font-medium">성경</th>
                  <th className="text-right px-4 py-2 font-medium">헌금</th>
                </tr>
              </thead>
              <tbody>
                {weeks.length > 0 ? (
                  [...weeks].reverse().map((w) => (
                    <tr key={w.date} className="border-b last:border-0">
                      <td className="px-4 py-2.5">{w.date}</td>
                      <td className="px-4 py-2.5 text-right">{w.attend}명</td>
                      <td className="px-4 py-2.5 text-right">{w.bible}장</td>
                      <td className="px-4 py-2.5 text-right">{w.offering.toLocaleString()}원</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-muted-foreground py-8">
                      데이터 없음
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
