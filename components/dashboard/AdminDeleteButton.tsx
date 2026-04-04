"use client";

import DeleteReportButton from "./DeleteReportButton";

interface Props {
  date: string;
  missionId: number;
}

export default function AdminDeleteButton({ date, missionId }: Props) {
  return (
    <DeleteReportButton
      apiUrl="/api/admin/reports"
      body={{ date, missionId }}
      confirmMessage={`${date} 선교회 ${missionId} 보고서를 전체 삭제하시겠습니까?\n(순보고서 포함 모두 삭제됩니다)`}
    />
  );
}
