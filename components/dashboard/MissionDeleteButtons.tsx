"use client";

import DeleteReportButton from "./DeleteReportButton";

interface Props {
  missionReportId?: string;
  missionReportStatus?: string;
  selectedDate: string;
}

export default function MissionDeleteButtons({
  missionReportId,
  missionReportStatus,
  selectedDate,
}: Props) {
  if (!missionReportId) return null;
  if (missionReportStatus === "submitted") {
    return (
      <p className="text-xs text-muted-foreground">제출 완료 — 삭제 불가</p>
    );
  }
  return (
    <DeleteReportButton
      apiUrl={`/api/reports/mission/${missionReportId}`}
      confirmMessage={`${selectedDate} 선교회보고서를 삭제하시겠습니까?`}
      variant="outline"
      size="sm"
      label="삭제"
    />
  );
}
