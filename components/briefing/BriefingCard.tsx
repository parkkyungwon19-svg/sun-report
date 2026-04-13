"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Printer } from "lucide-react";

interface BriefingCardProps {
  briefing: {
    id: string;
    week_of: string;
    briefing_text: string | null;
    briefing_summary: string | null;
    generated_at: string | null;
    alimtalk_sent_at: string | null;
    read_at: string | null;
    care_members: unknown[];
    joy_news: unknown[];
  };
}

function formatWeekLabel(weekOf: string): string {
  const d = new Date(weekOf);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const week = Math.ceil(d.getDate() / 7);
  return `${year}년 ${month}월 ${week}주차`;
}

// 브리핑 텍스트를 섹션별로 파싱
function parseSections(text: string): Array<{ title: string; content: string }> {
  const sections: Array<{ title: string; content: string }> = [];
  const lines = text.split("\n");
  let current: { title: string; content: string } | null = null;

  for (const line of lines) {
    const titleMatch = line.match(/^\*\*(.+?)\*\*$/);
    if (titleMatch) {
      if (current) sections.push(current);
      current = { title: titleMatch[1], content: "" };
    } else if (current) {
      current.content += line + "\n";
    }
  }
  if (current) sections.push(current);
  return sections.filter((s) => s.content.trim());
}

export function BriefingCard({ briefing }: BriefingCardProps) {
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  const weekLabel = formatWeekLabel(briefing.week_of);
  const sections = briefing.briefing_text ? parseSections(briefing.briefing_text) : [];

  const handlePrint = () => window.print();

  return (
    <Card className="border-[#1B3A6B]/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#1B3A6B] text-lg font-bold">
            {weekLabel} 목회 브리핑
          </CardTitle>
          <div className="flex items-center gap-2">
            {briefing.alimtalk_sent_at && (
              <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                알림톡 발송됨
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              className="text-[#1B3A6B]"
            >
              <Printer className="h-4 w-4 mr-1" />
              PDF 저장
            </Button>
          </div>
        </div>

        {briefing.briefing_summary && (
          <p className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            {briefing.briefing_summary}
          </p>
        )}

        {briefing.generated_at && (
          <p className="text-xs text-gray-400 mt-1">
            생성: {new Date(briefing.generated_at).toLocaleString("ko-KR")}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        {sections.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            브리핑이 아직 생성되지 않았습니다.
          </p>
        ) : (
          sections.map((section, idx) => (
            <div
              key={idx}
              className="border border-gray-100 rounded-lg overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
                onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
              >
                <span className="font-semibold text-sm text-[#1B3A6B]">
                  {section.title}
                </span>
                {expandedSection === idx ? (
                  <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                )}
              </button>
              {expandedSection === idx && (
                <div className="px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {section.content.trim()}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
