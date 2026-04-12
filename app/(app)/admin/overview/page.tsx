import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { SUN_DIRECTORY } from "@/lib/constants/sun-directory";
import { getThisSunday, formatDate } from "@/lib/utils/report-aggregator";
import { AdminPdfDownload } from "@/components/admin/AdminPdfDownload";

export default async function OverviewPage() {
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

  const thisSunday = formatDate(getThisSunday());

  const { data: sunReports } = await supabase
    .from("sun_reports")
    .select("id, sun_number, status, attend_total")
    .eq("report_date", thisSunday);

  const reportMap = new Map(sunReports?.map((r) => [r.sun_number, r]) ?? []);

  // 6가지 항목 집계
  const submittedIds = (sunReports ?? []).filter((r) => r.status === "submitted").map((r) => r.id);
  type MRow = { attend_samil:boolean; attend_friday:boolean; attend_sun_day:boolean; attend_sun_eve:boolean; attend_sun:boolean; evangelism:boolean };
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-primary">전체 보고 현황</h2>
          <p className="text-sm text-muted-foreground">{thisSunday}</p>
        </div>
        <AdminPdfDownload />
      </div>

      {/* 6가지 항목별 참석 현황 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">항목별 참석 현황 — {thisSunday}</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-3 gap-2">
            {attend6.map(({ label, val }) => (
              <div key={label} className="text-center rounded-lg border bg-muted/30 py-2.5 px-1">
                <p className="text-xl font-bold text-primary leading-tight">{val}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
                      <td className="px-4 py-2.5 font-medium">
                        {entry.sunNumber}순
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {entry.sunLeader}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {report?.attend_total ?? "-"}
                      </td>
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

      <Button asChild variant="outline" className="w-full">
        <Link href="/admin/statistics">통계 보기</Link>
      </Button>
    </div>
  );
}
