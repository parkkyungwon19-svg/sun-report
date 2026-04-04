"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useRef, useState } from "react";

type WeekRow = { date: string; attend: number; bible: number; offering: number };
type MissionRow = { mission: string; attend: number };

interface Props {
  weeks: WeekRow[];
  missionChartData: MissionRow[];
  latestDate?: string;
  summary: {
    latestAttend: number;
    latestOffering: number;
    latestBible: number;
    avgAttend: number;
    evangelismCount: number;
  };
}

export function StatisticsDownloadButtons({ weeks, missionChartData, latestDate, summary }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  async function handlePdf() {
    if (!printRef.current) return;
    setLoading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { default: jsPDF } = await import("jspdf");

      const el = printRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          // lab()/oklch() 등 미지원 색상 함수를 사용하는 스타일시트 제거
          const sheets = clonedDoc.querySelectorAll("style, link[rel='stylesheet']");
          sheets.forEach((s) => s.remove());
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pageW = 210;
      const pageH = 297;
      const margin = 10;
      const contentW = pageW - margin * 2;
      const imgH = (canvas.height * contentW) / canvas.width;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      let y = margin;
      let remaining = imgH;

      // 이미지가 여러 페이지에 걸칠 때 분할
      while (remaining > 0) {
        const sliceH = Math.min(remaining, pageH - margin * 2);
        const srcY = ((imgH - remaining) / imgH) * canvas.height;
        const srcH = (sliceH / imgH) * canvas.height;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = srcH;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

        doc.addImage(sliceCanvas.toDataURL("image/png"), "PNG", margin, y, contentW, sliceH);

        remaining -= sliceH;
        if (remaining > 0) {
          doc.addPage();
          y = margin;
        }
      }

      const dateStr = new Date().toISOString().split("T")[0];
      doc.save(`순보고_통계현황_${dateStr}.pdf`);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toLocaleDateString("ko-KR");
  const s = {
    wrap: {
      position: "fixed" as const,
      left: "-9999px",
      top: 0,
      width: "720px",
      backgroundColor: "#ffffff",
      padding: "32px",
      fontFamily: "'맑은 고딕', 'Malgun Gothic', sans-serif",
      color: "#111111",
    },
    h1: { fontSize: "20px", fontWeight: "700", color: "#1B3A6B", marginBottom: "4px" },
    sub: { fontSize: "12px", color: "#6b7280", marginBottom: "24px" },
    h2: { fontSize: "14px", fontWeight: "600", marginBottom: "8px", marginTop: "0px" },
    table: { width: "100%", borderCollapse: "collapse" as const, marginBottom: "24px" },
    th: {
      border: "1px solid #9ca3af",
      padding: "6px 12px",
      fontSize: "13px",
      fontWeight: "600",
      backgroundColor: "#1B3A6B",
      color: "#ffffff",
      textAlign: "left" as const,
    },
    td: {
      border: "1px solid #9ca3af",
      padding: "6px 12px",
      fontSize: "13px",
      backgroundColor: "#ffffff",
      color: "#111111",
    },
    tdAlt: {
      border: "1px solid #9ca3af",
      padding: "6px 12px",
      fontSize: "13px",
      backgroundColor: "#f9fafb",
      color: "#111111",
    },
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handlePdf} disabled={loading} className="gap-1.5">
        <FileDown className="w-4 h-4 text-red-500" />
        {loading ? "생성 중..." : "PDF 다운로드"}
      </Button>

      {/* 캡처용 숨김 DOM — 화면에 보이지 않지만 html2canvas가 읽음 */}
      <div style={s.wrap} ref={printRef}>
        <h1 style={s.h1}>해운대순복음교회 통계 현황</h1>
        <p style={s.sub}>생성일: {today}</p>

        {/* 요약 */}
        <h2 style={s.h2}>요약</h2>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>항목</th>
              <th style={s.th}>값</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["최근 주 참석", `${summary.latestAttend}명`],
              ["최근 주 헌금", `${summary.latestOffering.toLocaleString()}원`],
              ["최근 주 성경읽기", `${summary.latestBible}장`],
              ["8주 평균 참석", `${summary.avgAttend}명`],
              ["최근 8주 전도", `${summary.evangelismCount}건`],
            ].map(([label, val], i) => (
              <tr key={label}>
                <td style={i % 2 === 0 ? s.td : s.tdAlt}>{label}</td>
                <td style={i % 2 === 0 ? s.td : s.tdAlt}>{val}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 주차별 추이 */}
        <h2 style={s.h2}>최근 8주 추이</h2>
        <table style={s.table}>
          <thead>
            <tr>
              {["날짜", "참석인원", "성경(장)", "헌금(원)"].map((h) => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...weeks].reverse().map((w, i) => (
              <tr key={w.date}>
                <td style={i % 2 === 0 ? s.td : s.tdAlt}>{w.date}</td>
                <td style={i % 2 === 0 ? s.td : s.tdAlt}>{w.attend}명</td>
                <td style={i % 2 === 0 ? s.td : s.tdAlt}>{w.bible}장</td>
                <td style={i % 2 === 0 ? s.td : s.tdAlt}>{w.offering.toLocaleString()}원</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 선교회별 참석 */}
        <h2 style={s.h2}>선교회별 참석 현황 ({latestDate ?? ""})</h2>
        <table style={{ ...s.table, marginBottom: 0 }}>
          <thead>
            <tr>
              <th style={s.th}>선교회</th>
              <th style={s.th}>참석인원</th>
            </tr>
          </thead>
          <tbody>
            {missionChartData.map((m, i) => (
              <tr key={m.mission}>
                <td style={i % 2 === 0 ? s.td : s.tdAlt}>{m.mission}</td>
                <td style={i % 2 === 0 ? s.td : s.tdAlt}>{m.attend}명</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
