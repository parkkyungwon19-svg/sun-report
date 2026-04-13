import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { SUN_DIRECTORY } from "@/lib/constants/sun-directory";
import { getThisSunday, formatDate } from "@/lib/utils/report-aggregator";
import { OverviewDatePicker } from "@/components/admin/OverviewDatePicker";
import { OverviewTrendChart } from "@/components/admin/OverviewTrendChart";
import { OverviewMissionPdf } from "@/components/admin/OverviewMissionPdf";
import type { MissionStat } from "@/components/admin/OverviewMissionPdf";
import type { TrendPoint } from "@/components/admin/OverviewTrendChart";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
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

  const params = await searchParams;
  const selectedDate = params.date ?? formatDate(getThisSunday());

  // ── 선택된 날짜의 순보고서
  const { data: sunReports } = await supabase
    .from("sun_reports")
    .select("id, sun_number, status, attend_total")
    .eq("report_date", selectedDate);

  const reportMap = new Map(sunReports?.map((r) => [r.sun_number, r]) ?? []);

  // ── 6가지 항목 집계
  const submittedIds = (sunReports ?? [])
    .filter((r) => r.status === "submitted")
    .map((r) => r.id);

  type MRow = {
    attend_samil: boolean; attend_friday: boolean;
    attend_sun_day: boolean; attend_sun_eve: boolean;
    attend_sun: boolean; evangelism: boolean;
  };
  let memberRows: MRow[] = [];
  if (submittedIds.length > 0) {
    const { data } = await supabase
      .from("sun_report_members")
      .select("attend_samil,attend_friday,attend_sun_day,attend_sun_eve,attend_sun,evangelism")
      .in("report_id", submittedIds);
    memberRows = (data ?? []) as MRow[];
  }

  const attend6 = [
    { label: "삼일",   val: memberRows.filter((m) => m.attend_samil).length },
    { label: "금요",   val: memberRows.filter((m) => m.attend_friday).length },
    { label: "주낮",   val: memberRows.filter((m) => m.attend_sun_day).length },
    { label: "주밤",   val: memberRows.filter((m) => m.attend_sun_eve).length },
    { label: "순모임", val: memberRows.filter((m) => m.attend_sun).length },
    { label: "전도",   val: memberRows.filter((m) => m.evangelism).length },
  ];

  // ── 12선교회별 집계
  const missionStats: MissionStat[] = Array.from({ length: 12 }, (_, i) => {
    const missionNum = i + 1;
    const missionSuns = SUN_DIRECTORY.filter((s) => s.missionId === missionNum);
    const submitted = missionSuns.filter((s) => reportMap.get(s.sunNumber)?.status === "submitted").length;
    const attend = missionSuns.reduce((sum, s) => sum + (reportMap.get(s.sunNumber)?.attend_total ?? 0), 0);
    return { missionNum, total: missionSuns.length, submitted, attend };
  });

  // ── 주간 추이 (최근 8주)
  const eightWeeksAgo = new Date(selectedDate);
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  const since = formatDate(eightWeeksAgo);

  const { data: trendReports } = await supabase
    .from("sun_reports")
    .select("report_date, attend_total, status")
    .gte("report_date", since)
    .lte("report_date", selectedDate)
    .eq("status", "submitted");

  const trendBucket = new Map<string, { attend: number; count: number }>();
  for (const r of trendReports ?? []) {
    const e = trendBucket.get(r.report_date) ?? { attend: 0, count: 0 };
    trendBucket.set(r.report_date, { attend: e.attend + r.attend_total, count: e.count + 1 });
  }

  const trendData: TrendPoint[] = Array.from(trendBucket.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([date, v]) => ({
      label: date.slice(5),
      attend: v.attend,
      reportedSuns: v.count,
    }));

  // ── PDF용 44순 row
  const sunRows = SUN_DIRECTORY.map((entry) => {
    const r = reportMap.get(entry.sunNumber);
    return {
      sunNumber: entry.sunNumber,
      sunLeader: entry.sunLeader,
      missionId: entry.missionId,
      status: (r?.status ?? "none") as "submitted" | "draft" | "none",
      attendTotal: r?.attend_total ?? 0,
    };
  });

  const submittedCount = (sunReports ?? []).filter((r) => r.status === "submitted").length;
  const isToday = selectedDate === formatDate(getThisSunday());

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-primary">전체 보고 현황</h2>
          <p className="text-sm text-muted-foreground">
            {selectedDate}{isToday ? " (이번 주)" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <OverviewDatePicker currentDate={selectedDate} />
          <OverviewMissionPdf
            selectedDate={selectedDate}
            missionStats={missionStats}
            sunRows={sunRows}
            trendData={trendData}
          />
        </div>
      </div>

      {/* 6가지 항목별 참석 현황 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            항목별 참석 현황 — {submittedCount}순 제출
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-3 gap-2">
            {attend6.map(({ label, val }) => (
              <div
                key={label}
                className="text-center rounded-lg border bg-muted/30 py-2.5 px-1"
              >
                <p className="text-xl font-bold text-primary leading-tight">{val}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 12선교회별 현황 그리드 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">12선교회 현황</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-3 gap-2">
            {missionStats.map((m) => {
              const pct = Math.round((m.submitted / m.total) * 100);
              const color =
                pct === 100
                  ? "border-green-300 bg-green-50"
                  : pct >= 50
                  ? "border-amber-300 bg-amber-50"
                  : "border-gray-200 bg-gray-50";
              return (
                <div key={m.missionNum} className={`rounded-lg border p-2 ${color}`}>
                  <p className="text-[11px] font-semibold text-primary">{m.missionNum}선교회</p>
                  <p className="text-base font-bold text-primary leading-tight mt-0.5">
                    {m.submitted}
                    <span className="text-xs font-normal text-muted-foreground">/{m.total}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">{m.attend}명</p>
                  <div className="mt-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-[#1B3A6B] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 주간 추이 차트 */}
      <OverviewTrendChart data={trendData} />

      {/* 44순 상세 테이블 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">44순 제출 현황</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium">순</th>
                  <th className="text-left px-4 py-2 font-medium">순장</th>
                  <th className="text-center px-4 py-2 font-medium">참석</th>
                  <th className="text-center px-4 py-2 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {SUN_DIRECTORY.map((entry) => {
                  const report = reportMap.get(entry.sunNumber);
                  return (
                    <tr key={entry.sunNumber} className="border-b last:border-0">
                      <td className="px-4 py-2.5 font-medium">{entry.sunNumber}순</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{entry.sunLeader}</td>
                      <td className="px-4 py-2.5 text-center">{report?.attend_total ?? "−"}</td>
                      <td className="px-4 py-2.5 text-center">
                        {report?.status === "submitted" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                        ) : report?.status === "draft" ? (
                          <Clock className="w-4 h-4 text-amber-400 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
