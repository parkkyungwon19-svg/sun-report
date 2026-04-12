"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useRef, useState } from "react";
import type { PeriodData } from "@/app/(app)/admin/statistics/page";

type MissionRow = { mission: string; attend: number };

interface Props {
  periodData: PeriodData[];
  missionChartData: MissionRow[];
  latestDate?: string;
  period: string;
  summary: {
    latestAttend: number;
    latestOffering: number;
    latestBible: number;
    avgAttend: number;
    evangelismCount: number;
  };
}

const PERIOD_LABEL: Record<string, string> = { week: "주간", month: "월간", year: "연간" };

export function StatisticsDownloadButtons({ periodData, missionChartData, latestDate, period, summary }: Props) {
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
        scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false,
        onclone: (d) => { d.querySelectorAll("style,link[rel='stylesheet']").forEach((s) => s.remove()); },
      });
      const imgData = canvas.toDataURL("image/png");
      const pageW = 210, pageH = 297, margin = 10;
      const contentW = pageW - margin * 2;
      const imgH = (canvas.height * contentW) / canvas.width;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      let y = margin, remaining = imgH;
      while (remaining > 0) {
        const sliceH = Math.min(remaining, pageH - margin * 2);
        const srcY = ((imgH - remaining) / imgH) * canvas.height;
        const srcH = (sliceH / imgH) * canvas.height;
        const sc = document.createElement("canvas");
        sc.width = canvas.width; sc.height = srcH;
        sc.getContext("2d")!.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        doc.addImage(sc.toDataURL("image/png"), "PNG", margin, y, contentW, sliceH);
        remaining -= sliceH;
        if (remaining > 0) { doc.addPage(); y = margin; }
      }
      doc.save(`순보고_통계_${PERIOD_LABEL[period] ?? period}_${new Date().toISOString().split("T")[0]}.pdf`);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toLocaleDateString("ko-KR");
  const s = {
    wrap: { position: "fixed" as const, left: "-9999px", top: 0, width: "720px", backgroundColor: "#fff", padding: "32px", fontFamily: "'맑은 고딕','Malgun Gothic',sans-serif", color: "#111" },
    h1: { fontSize: "18px", fontWeight: "700", color: "#1B3A6B", marginBottom: "4px" },
    sub: { fontSize: "11px", color: "#6b7280", marginBottom: "20px" },
    h2: { fontSize: "13px", fontWeight: "600", marginBottom: "6px", marginTop: "0px", color: "#1B3A6B" },
    table: { width: "100%", borderCollapse: "collapse" as const, marginBottom: "20px" },
    th: { border: "1px solid #9ca3af", padding: "5px 10px", fontSize: "12px", fontWeight: "600", backgroundColor: "#1B3A6B", color: "#fff", textAlign: "left" as const },
    td: { border: "1px solid #ddd", padding: "5px 10px", fontSize: "12px", backgroundColor: "#fff" },
    tdAlt: { border: "1px solid #ddd", padding: "5px 10px", fontSize: "12px", backgroundColor: "#f9fafb" },
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handlePdf} disabled={loading} className="gap-1.5">
        <FileDown className="w-4 h-4 text-red-500" />
        {loading ? "생성 중..." : `통계 PDF`}
      </Button>

      {/* 캡처용 숨김 DOM */}
      <div style={s.wrap} ref={printRef}>
        <h1 style={s.h1}>해운대순복음교회 통계 현황 — {PERIOD_LABEL[period] ?? period}</h1>
        <p style={s.sub}>생성일: {today}</p>

        <h2 style={s.h2}>요약</h2>
        <table style={s.table}>
          <thead><tr><th style={s.th}>항목</th><th style={s.th}>값</th></tr></thead>
          <tbody>
            {[
              ["최근 참석", `${summary.latestAttend}명`],
              ["최근 헌금", `${summary.latestOffering.toLocaleString()}원`],
              ["최근 성경", `${summary.latestBible}장`],
              ["평균 참석", `${summary.avgAttend}명`],
              ["기간 전도", `${summary.evangelismCount}건`],
            ].map(([l, v], i) => (
              <tr key={l as string}><td style={i%2===0?s.td:s.tdAlt}>{l}</td><td style={i%2===0?s.td:s.tdAlt}>{v}</td></tr>
            ))}
          </tbody>
        </table>

        <h2 style={s.h2}>6가지 항목별 참석 추이</h2>
        <table style={s.table}>
          <thead>
            <tr>
              {["기간","삼일","금요","주낮","주밤","순모임","전도","성경","헌금"].map((h) => (
                <th key={h} style={{ ...s.th, textAlign: "center" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...periodData].reverse().map((d, i) => (
              <tr key={d.date}>
                {[d.label, d.samil, d.friday, d.sunDay, d.sunEve, d.sun, d.evangelism, `${d.bible}장`, d.offering > 0 ? `${d.offering.toLocaleString()}원` : "−"].map((v, j) => (
                  <td key={j} style={{ ...(i%2===0?s.td:s.tdAlt), textAlign: j === 0 ? "left" : "center" }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <h2 style={s.h2}>선교회별 참석 ({latestDate ?? ""})</h2>
        <table style={{ ...s.table, marginBottom: 0 }}>
          <thead><tr><th style={s.th}>선교회</th><th style={s.th}>참석인원</th></tr></thead>
          <tbody>
            {missionChartData.map((m, i) => (
              <tr key={m.mission}>
                <td style={i%2===0?s.td:s.tdAlt}>{m.mission}</td>
                <td style={i%2===0?s.td:s.tdAlt}>{m.attend}명</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
