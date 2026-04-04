"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SpecialReportItem, SpecialCategory, SpecialStatus } from "@/types/database";
import { SPECIAL_CATEGORIES, SPECIAL_STATUSES } from "@/types/database";

const STATUS_STYLES: Record<SpecialStatus, string> = {
  기도중: "bg-blue-100 text-blue-800",
  진행중: "bg-orange-100 text-orange-800",
  해결됨: "bg-green-100 text-green-800",
};

const CATEGORY_STYLES: Record<SpecialCategory, string> = {
  질병: "bg-red-100 text-red-700",
  재정문제: "bg-yellow-100 text-yellow-700",
  인간관계: "bg-purple-100 text-purple-700",
  "진로및직장문제": "bg-indigo-100 text-indigo-700",
  기타: "bg-gray-100 text-gray-700",
};

interface Props {
  items: SpecialReportItem[];
}

export default function SpecialReportsManager({ items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [memos, setMemos] = useState<Record<string, string>>(
    Object.fromEntries(initialItems.map((i) => [i.id, i.pastor_memo ?? ""]))
  );
  const [statuses, setStatuses] = useState<Record<string, SpecialStatus>>(
    Object.fromEntries(initialItems.map((i) => [i.id, i.status]))
  );
  const [filterCategory, setFilterCategory] = useState<SpecialCategory | "전체">("전체");
  const [filterStatus, setFilterStatus] = useState<SpecialStatus | "전체">("전체");
  const [, startTransition] = useTransition();

  const filtered = items.filter((i) => {
    if (filterCategory !== "전체" && i.category !== filterCategory) return false;
    if (filterStatus !== "전체" && statuses[i.id] !== filterStatus) return false;
    return true;
  });

  // 카테고리별 그룹
  const grouped = SPECIAL_CATEGORIES.reduce<Record<string, SpecialReportItem[]>>((acc, cat) => {
    acc[cat] = filtered.filter((i) => i.category === cat);
    return acc;
  }, {});

  async function saveItem(id: string) {
    const supabase = createClient();
    startTransition(async () => {
      const { error } = await supabase
        .from("special_report_items")
        .update({
          status: statuses[id],
          pastor_memo: memos[id] || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        toast.error("저장 실패: " + error.message);
      } else {
        setItems((prev) =>
          prev.map((i) =>
            i.id === id
              ? { ...i, status: statuses[id], pastor_memo: memos[id] || null }
              : i
          )
        );
        toast.success("저장되었습니다");
      }
    });
  }

  const totalCounts = {
    기도중: items.filter((i) => statuses[i.id] === "기도중").length,
    진행중: items.filter((i) => statuses[i.id] === "진행중").length,
    해결됨: items.filter((i) => statuses[i.id] === "해결됨").length,
  };

  return (
    <div className="space-y-4">
      {/* 현황 요약 */}
      <div className="grid grid-cols-3 gap-3">
        {(["기도중", "진행중", "해결됨"] as SpecialStatus[]).map((s) => (
          <Card
            key={s}
            className="cursor-pointer hover:shadow-sm transition-shadow"
            onClick={() => setFilterStatus(filterStatus === s ? "전체" : s)}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalCounts[s]}</p>
              <Badge className={`${STATUS_STYLES[s]} mt-1 text-xs`}>{s}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 필터 */}
      <div className="flex gap-2 flex-wrap">
        <Select
          value={filterCategory}
          onValueChange={(v) => setFilterCategory(v as SpecialCategory | "전체")}
        >
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="전체">전체 카테고리</SelectItem>
            {SPECIAL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as SpecialStatus | "전체")}
        >
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="전체">전체 상태</SelectItem>
            {SPECIAL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 카테고리별 목록 */}
      {SPECIAL_CATEGORIES.map((cat) => {
        const catItems = grouped[cat];
        if (catItems.length === 0) return null;
        return (
          <Card key={cat}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Badge className={CATEGORY_STYLES[cat]}>{cat}</Badge>
                <span className="text-sm text-muted-foreground">{catItems.length}건</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {catItems.map((item) => (
                <div key={item.id} className="border-b last:border-0">
                  {/* 항목 헤더 */}
                  <button
                    type="button"
                    className="w-full flex items-start justify-between px-6 py-3 hover:bg-muted/30 transition-colors text-left gap-3"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs text-muted-foreground">
                          {item.report_date} · 선교회{item.mission_id} {item.mission_leader}
                        </span>
                        <Badge className={`${STATUS_STYLES[statuses[item.id]]} text-xs`}>
                          {statuses[item.id]}
                        </Badge>
                        {item.pastor_memo && (
                          <span className="text-xs text-primary">메모 있음</span>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2">{item.content}</p>
                    </div>
                    {expandedId === item.id
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    }
                  </button>

                  {/* 항목 상세 — 담임목사 관리 영역 */}
                  {expandedId === item.id && (
                    <div className="px-6 pb-4 space-y-3 bg-muted/10">
                      <p className="text-sm pt-1">{item.content}</p>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">진행상황</label>
                        <Select
                          value={statuses[item.id]}
                          onValueChange={(v) =>
                            setStatuses((prev) => ({ ...prev, [item.id]: v as SpecialStatus }))
                          }
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SPECIAL_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          목사님 메모
                        </label>
                        <Textarea
                          value={memos[item.id]}
                          onChange={(e) =>
                            setMemos((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          placeholder="기도 내용, 상담 내용, 진행 메모 등"
                          rows={3}
                          className="resize-none text-sm"
                        />
                      </div>

                      <Button size="sm" onClick={() => saveItem(item.id)}>
                        저장
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          해당하는 특별보고 항목이 없습니다
        </div>
      )}
    </div>
  );
}
