"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import DeleteReportButton from "./DeleteReportButton";

type Report = {
  id: string;
  report_date: string;
  status: string;
  attend_total: number;
};

export default function SunReportList({ reports }: { reports: Report[] }) {
  if (!reports.length) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        아직 작성한 보고서가 없습니다
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {reports.map((r) => (
        <li key={r.id} className="flex items-center justify-between px-6 py-3">
          <Link
            href={`/report/sun/${r.id}`}
            className="flex-1 flex items-center justify-between hover:opacity-70 transition-opacity"
          >
            <div>
              <p className="text-sm font-medium">
                {format(new Date(r.report_date), "M월 d일 (E)", { locale: ko })} 주일
              </p>
              <p className="text-xs text-muted-foreground">참석 {r.attend_total}명</p>
            </div>
            <Badge
              variant={r.status === "submitted" ? "default" : "secondary"}
              className={r.status === "submitted" ? "bg-green-100 text-green-800" : ""}
            >
              {r.status === "submitted" ? "제출완료" : "임시저장"}
            </Badge>
          </Link>
          <DeleteReportButton
            apiUrl={`/api/reports/sun/${r.id}`}
            confirmMessage={`${format(new Date(r.report_date), "M월 d일")} 순보고서를 삭제하시겠습니까?`}
          />
        </li>
      ))}
    </ul>
  );
}
