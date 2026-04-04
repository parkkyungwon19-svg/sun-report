"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";

export interface SunRow {
  sunNumber: number;
  missionId: number;
  sunLeader: string;
  worshipPlace: string;
  worshipLeader: string;
  attendTotal: number | null;
  bibleChapters: number | null;
  submitted: boolean;
}

interface Props {
  rows: SunRow[];
  reportDate: string;
}

// 선교회 병합 범위 계산
function computeMerges(
  rows: SunRow[],
  startDataRow: number,
  colIndex: number
) {
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
  let i = 0;
  while (i < rows.length) {
    const mid = rows[i].missionId;
    let j = i;
    while (j < rows.length && rows[j].missionId === mid) j++;
    if (j - i > 1) {
      merges.push({
        s: { r: startDataRow + i, c: colIndex },
        e: { r: startDataRow + j - 1, c: colIndex },
      });
    }
    i = j;
  }
  return merges;
}

export function WeeklyReportExporter({ rows, reportDate }: Props) {
  const [excelLoading, setExcelLoading] = useState(false);

  const leftRows = rows.slice(0, 22);
  const rightRows = rows.slice(22, 44);

  // ─── Excel 다운로드 ───────────────────────────────────
  async function handleExcel() {
    setExcelLoading(true);
    try {
      const XLSX = await import("xlsx");

      const title = "선교회별 예배 보고 현황";
      const dateRow = `보고 일자: ${reportDate}`;

      // 데이터 배열 구성 (좌우 2열)
      const headers = ["선교회", "순", "순장", "장소", "인도", "인원", "성경"];
      const aoa: (string | number)[][] = [
        // 제목 행 (14컬럼 병합용)
        [title, "", "", "", "", "", "", "", "", "", "", "", "", ""],
        [dateRow, "", "", "", "", "", "", "", "", "", "", "", "", ""],
        // 헤더
        [...headers, "", ...headers],
      ];

      const maxLen = Math.max(leftRows.length, rightRows.length);
      for (let i = 0; i < maxLen; i++) {
        const L = leftRows[i];
        const R = rightRows[i];
        aoa.push([
          L ? L.missionId : "",
          L ? L.sunNumber : "",
          L ? L.sunLeader : "",
          L ? (L.submitted ? L.worshipPlace || "" : "") : "",
          L ? (L.submitted ? L.worshipLeader || "" : "") : "",
          L ? (L.submitted ? (L.attendTotal ?? "") : "") : "",
          L ? (L.submitted ? (L.bibleChapters ?? "") : "") : "",
          "",
          R ? R.missionId : "",
          R ? R.sunNumber : "",
          R ? R.sunLeader : "",
          R ? (R.submitted ? R.worshipPlace || "" : "") : "",
          R ? (R.submitted ? R.worshipLeader || "" : "") : "",
          R ? (R.submitted ? (R.attendTotal ?? "") : "") : "",
          R ? (R.submitted ? (R.bibleChapters ?? "") : "") : "",
        ]);
      }

      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // 병합: 제목/날짜 행
      const totalCols = 14;
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }, // 제목
        { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } }, // 날짜
        // 좌측 선교회 병합
        ...computeMerges(leftRows, 3, 0),
        // 우측 선교회 병합
        ...computeMerges(rightRows, 3, 8),
      ];
      ws["!merges"] = merges;

      // 열 너비
      ws["!cols"] = [
        { wch: 6 },  // 선교회
        { wch: 4 },  // 순
        { wch: 8 },  // 순장
        { wch: 8 },  // 장소
        { wch: 8 },  // 인도
        { wch: 5 },  // 인원
        { wch: 6 },  // 성경
        { wch: 1 },  // spacer
        { wch: 6 },
        { wch: 4 },
        { wch: 8 },
        { wch: 8 },
        { wch: 8 },
        { wch: 5 },
        { wch: 6 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "예배보고현황");
      XLSX.writeFile(wb, `선교회별예배보고현황_${reportDate}.xlsx`);
    } finally {
      setExcelLoading(false);
    }
  }

  // ─── PDF 저장 (새 창 인쇄) ───────────────────────────
  function handlePdf() {
    const html = buildPrintHtml(leftRows, rightRows, reportDate);
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 500);
  }

  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        className="flex-1 h-11 gap-2"
        onClick={handlePdf}
      >
        <FileDown className="w-4 h-4" />
        PDF 저장
      </Button>
      <Button
        variant="outline"
        className="flex-1 h-11 gap-2"
        onClick={handleExcel}
        disabled={excelLoading}
      >
        {excelLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        엑셀 저장
      </Button>
    </div>
  );
}

// ─── 인쇄용 HTML 생성 ────────────────────────────────────
function buildPrintHtml(
  leftRows: SunRow[],
  rightRows: SunRow[],
  reportDate: string
): string {
  // 선교회별 rowspan 계산
  function rowspans(rows: SunRow[]): number[] {
    const spans: number[] = new Array(rows.length).fill(0);
    let i = 0;
    while (i < rows.length) {
      const mid = rows[i].missionId;
      let j = i;
      while (j < rows.length && rows[j].missionId === mid) j++;
      spans[i] = j - i;
      i = j;
    }
    return spans;
  }

  const leftSpans = rowspans(leftRows);
  const rightSpans = rowspans(rightRows);
  const maxLen = Math.max(leftRows.length, rightRows.length);

  function cell(val: string | number | null | undefined, extra = "") {
    return `<td ${extra}>${val ?? ""}</td>`;
  }

  let rows = "";
  for (let i = 0; i < maxLen; i++) {
    const L = leftRows[i];
    const R = rightRows[i];
    let tr = "<tr>";

    // 좌측
    if (L) {
      if (leftSpans[i] > 0) {
        tr += `<td rowspan="${leftSpans[i]}" class="mission-cell">${L.missionId}</td>`;
      }
      tr += cell(L.sunNumber, 'class="center"');
      tr += cell(L.sunLeader);
      tr += cell(L.submitted ? L.worshipPlace || "" : "");
      tr += cell(L.submitted ? L.worshipLeader || "" : "");
      tr += cell(L.submitted ? (L.attendTotal ?? "") : "", 'class="center"');
      tr += cell(L.submitted ? (L.bibleChapters ?? "") : "", 'class="center num"');
    } else {
      tr += '<td colspan="7"></td>';
    }

    // 구분선
    tr += '<td class="spacer"></td>';

    // 우측
    if (R) {
      if (rightSpans[i] > 0) {
        tr += `<td rowspan="${rightSpans[i]}" class="mission-cell">${R.missionId}</td>`;
      }
      tr += cell(R.sunNumber, 'class="center"');
      tr += cell(R.sunLeader);
      tr += cell(R.submitted ? R.worshipPlace || "" : "");
      tr += cell(R.submitted ? R.worshipLeader || "" : "");
      tr += cell(R.submitted ? (R.attendTotal ?? "") : "", 'class="center"');
      tr += cell(R.submitted ? (R.bibleChapters ?? "") : "", 'class="center num"');
    } else {
      tr += '<td colspan="7"></td>';
    }

    tr += "</tr>";
    rows += tr;
  }

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>선교회별 예배 보고 현황</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "맑은 고딕", "Malgun Gothic", sans-serif; font-size: 10pt; padding: 16px; }
  h1 { text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 4px; letter-spacing: 2px; }
  .date { text-align: center; font-size: 10pt; color: #555; margin-bottom: 12px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #999; padding: 3px 5px; font-size: 9.5pt; white-space: nowrap; }
  th { background: #f0f4ff; font-weight: bold; text-align: center; }
  .mission-cell { text-align: center; font-weight: bold; background: #fafafa; vertical-align: middle; }
  .center { text-align: center; }
  .num { text-align: center; font-weight: bold; }
  .spacer { border: none; width: 8px; background: white; }
  @page { size: A4 landscape; margin: 10mm; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<h1>선교회별 예배 보고 현황</h1>
<p class="date">${reportDate} 주일</p>
<table>
  <colgroup>
    <col style="width:36px"/><col style="width:28px"/><col style="width:60px"/>
    <col style="width:60px"/><col style="width:60px"/>
    <col style="width:36px"/><col style="width:48px"/>
    <col style="width:8px"/>
    <col style="width:36px"/><col style="width:28px"/><col style="width:60px"/>
    <col style="width:60px"/><col style="width:60px"/>
    <col style="width:36px"/><col style="width:48px"/>
  </colgroup>
  <thead>
    <tr>
      <th>선교회</th><th>순</th><th>순장</th><th>장소</th><th>인도</th><th>인원</th><th>성경</th>
      <th class="spacer"></th>
      <th>선교회</th><th>순</th><th>순장</th><th>장소</th><th>인도</th><th>인원</th><th>성경</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<p style="margin-top:8px;font-size:8pt;color:#aaa;text-align:right;">
  출력일: ${new Date().toLocaleDateString("ko-KR")} &nbsp;·&nbsp; 해운대순복음교회 순보고 시스템
</p>
</body>
</html>`;
}
