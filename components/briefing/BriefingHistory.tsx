"use client";

import { useState } from "react";
import { BriefingCard } from "./BriefingCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText } from "lucide-react";

interface Briefing {
  id: string;
  week_of: string;
  briefing_text: string | null;
  briefing_summary: string | null;
  generated_at: string | null;
  alimtalk_sent_at: string | null;
  read_at: string | null;
  care_members: unknown[];
  joy_news: unknown[];
}

interface BriefingHistoryProps {
  briefings: Briefing[];
}

function formatWeekLabel(weekOf: string): string {
  const d = new Date(weekOf);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const week = Math.ceil(d.getDate() / 7);
  return `${year}년 ${month}월 ${week}주차`;
}

export function BriefingHistory({ briefings }: BriefingHistoryProps) {
  const [selectedWeek, setSelectedWeek] = useState<string>(
    briefings[0]?.week_of ?? ""
  );

  const current = briefings.find((b) => b.week_of === selectedWeek);

  if (briefings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <FileText className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm">아직 생성된 브리핑이 없습니다.</p>
        <p className="text-xs mt-1">위 버튼으로 첫 번째 브리핑을 생성해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-600">주차 선택</span>
        <Select value={selectedWeek} onValueChange={(v) => v && setSelectedWeek(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="주차 선택" />
          </SelectTrigger>
          <SelectContent>
            {briefings.map((b) => (
              <SelectItem key={b.week_of} value={b.week_of}>
                {formatWeekLabel(b.week_of)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {current && <BriefingCard briefing={current} />}
    </div>
  );
}
