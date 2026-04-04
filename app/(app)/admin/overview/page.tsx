import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { SUN_DIRECTORY } from "@/lib/constants/sun-directory";
import { getThisSunday, formatDate } from "@/lib/utils/report-aggregator";

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
    .select("sun_number, status, attend_total")
    .eq("report_date", thisSunday);

  const reportMap = new Map(sunReports?.map((r) => [r.sun_number, r]) ?? []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">전체 보고 현황</h2>
        <p className="text-sm text-muted-foreground">{thisSunday}</p>
      </div>

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
