"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown } from "lucide-react";
import type { SunReportWithMembers } from "@/types/database";

interface Props {
  missionId: number;
  missionLeader: string;
  reportDate: string;
  sunReports: SunReportWithMembers[];
  totalOffering: number;
}

export function MissionReportPrintPanel({
  missionId,
  missionLeader,
  reportDate,
  sunReports,
  totalOffering,
}: Props) {
  const handlePrint = () => window.print();

  // 모든 순원 플래튼 — 성경 읽은 장수 내림차순
  const allMembers = sunReports.flatMap((sr) =>
    sr.sun_report_members.map((m) => ({
      sunNumber: sr.sun_number,
      sunLeader: sr.sun_leader,
      memberName: m.member_name,
      bibleRead: m.bible_read,
      attendSunDay: m.attend_sun_day,
      evangelism: m.evangelism,
    }))
  );

  const totalBible = allMembers.reduce((s, m) => s + m.bibleRead, 0);
  const attendCount = allMembers.filter((m) => m.attendSunDay).length;
  const evangelismCount = allMembers.filter((m) => m.evangelism).length;

  return (
    <>
      {/* 화면 표시용 PDF 버튼 */}
      <div className="no-print">
        <Button
          variant="outline"
          className="w-full h-11 gap-2 border-primary/30 text-primary hover:bg-primary/5"
          onClick={handlePrint}
        >
          <FileDown className="w-4 h-4" />
          PDF로 저장 / 인쇄
        </Button>
      </div>

      {/* 인쇄 전용 레이아웃 */}
      <div className="print-only hidden">
        <div style={{ fontFamily: "sans-serif", padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "18pt", fontWeight: "bold", textAlign: "center", marginBottom: "4px" }}>
            해운대순복음교회 선교회보고서
          </h1>
          <p style={{ textAlign: "center", marginBottom: "16px", fontSize: "11pt", color: "#555" }}>
            선교회 {missionId} · {missionLeader} · {reportDate}
          </p>

          {/* 요약 */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px", fontSize: "11pt" }}>
            <tbody>
              <tr style={{ background: "#f0f4ff" }}>
                <td style={{ padding: "6px 12px", border: "1px solid #ccc", fontWeight: "bold" }}>총 참석인원</td>
                <td style={{ padding: "6px 12px", border: "1px solid #ccc" }}>{attendCount}명</td>
                <td style={{ padding: "6px 12px", border: "1px solid #ccc", fontWeight: "bold" }}>성경읽기 합계</td>
                <td style={{ padding: "6px 12px", border: "1px solid #ccc" }}>{totalBible}장</td>
                <td style={{ padding: "6px 12px", border: "1px solid #ccc", fontWeight: "bold" }}>전도</td>
                <td style={{ padding: "6px 12px", border: "1px solid #ccc" }}>{evangelismCount}건</td>
                <td style={{ padding: "6px 12px", border: "1px solid #ccc", fontWeight: "bold" }}>헌금 총액</td>
                <td style={{ padding: "6px 12px", border: "1px solid #ccc" }}>{totalOffering.toLocaleString()}원</td>
              </tr>
            </tbody>
          </table>

          {/* 순별 순원 성경 현황 */}
          {sunReports.map((sr) => (
            <div key={sr.id} style={{ marginBottom: "16px" }}>
              <h2 style={{ fontSize: "13pt", fontWeight: "bold", marginBottom: "6px", borderBottom: "2px solid #1B3A6B", paddingBottom: "3px" }}>
                {sr.sun_number}순 · {sr.sun_leader} &nbsp;
                <span style={{ fontSize: "10pt", fontWeight: "normal", color: "#555" }}>
                  참석 {sr.attend_total}명 · 성경 {sr.bible_chapters}장
                </span>
              </h2>
              {sr.sun_report_members.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
                  <thead>
                    <tr style={{ background: "#f8f8f0" }}>
                      <th style={{ padding: "4px 8px", border: "1px solid #ddd", textAlign: "left" }}>성명</th>
                      <th style={{ padding: "4px 8px", border: "1px solid #ddd", textAlign: "center" }}>주일낮</th>
                      <th style={{ padding: "4px 8px", border: "1px solid #ddd", textAlign: "center" }}>순모임</th>
                      <th style={{ padding: "4px 8px", border: "1px solid #ddd", textAlign: "center" }}>전도</th>
                      <th style={{ padding: "4px 8px", border: "1px solid #ddd", textAlign: "center" }}>성경(장)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sr.sun_report_members.map((m) => (
                      <tr key={m.id}>
                        <td style={{ padding: "4px 8px", border: "1px solid #ddd" }}>{m.member_name}</td>
                        <td style={{ padding: "4px 8px", border: "1px solid #ddd", textAlign: "center" }}>{m.attend_sun_day ? "✓" : ""}</td>
                        <td style={{ padding: "4px 8px", border: "1px solid #ddd", textAlign: "center" }}>{m.attend_sun ? "✓" : ""}</td>
                        <td style={{ padding: "4px 8px", border: "1px solid #ddd", textAlign: "center" }}>{m.evangelism ? "✓" : ""}</td>
                        <td style={{ padding: "4px 8px", border: "1px solid #ddd", textAlign: "center", fontWeight: m.bible_read > 0 ? "bold" : "normal" }}>
                          {m.bible_read > 0 ? m.bible_read : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: "#888", fontSize: "10pt" }}>순원 정보 없음</p>
              )}
              {sr.special_note && (
                <p style={{ marginTop: "4px", fontSize: "10pt", color: "#555" }}>
                  특별보고: {sr.special_note}
                </p>
              )}
            </div>
          ))}

          <p style={{ marginTop: "24px", fontSize: "9pt", color: "#999", textAlign: "right" }}>
            출력일: {new Date().toLocaleDateString("ko-KR")} · 해운대순복음교회 순보고 시스템
          </p>
        </div>
      </div>

      {/* 화면 전용 순원 성경 현황 카드 */}
      <div className="no-print">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              전체 순원 성경읽기 현황
              <span className="text-xs font-normal text-muted-foreground ml-2">
                합계 {totalBible}장
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sunReports.map((sr) =>
              sr.sun_report_members.length > 0 ? (
                <div key={sr.id}>
                  <div className="px-4 py-2 bg-muted/30 text-xs font-semibold text-muted-foreground border-b">
                    {sr.sun_number}순 · {sr.sun_leader}
                  </div>
                  <div className="divide-y">
                    {sr.sun_report_members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between px-4 py-2 text-sm">
                        <span className="font-medium">{m.member_name}</span>
                        <div className="flex items-center gap-3 text-muted-foreground text-xs">
                          {m.evangelism && (
                            <span className="text-orange-600 font-medium">전도</span>
                          )}
                          <span className="tabular-nums">
                            {m.bible_read > 0 ? (
                              <span className="text-green-700 font-semibold">{m.bible_read}장</span>
                            ) : (
                              "−"
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
