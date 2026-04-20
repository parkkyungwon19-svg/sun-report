"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DateRangePicker({
  activePeriod,
  defaultFrom,
  defaultTo,
}: {
  activePeriod: string;
  defaultFrom?: string;
  defaultTo?: string;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(defaultFrom ?? "");
  const [to, setTo] = useState(defaultTo ?? "");
  const [open, setOpen] = useState(activePeriod === "custom");

  function apply() {
    if (!from || !to) return;
    if (from > to) return;
    router.push(`/admin/member-scores?period=custom&from=${from}&to=${to}`);
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
          activePeriod === "custom"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background text-muted-foreground border-border hover:bg-muted"
        }`}
      >
        <span className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          기간 직접 선택
        </span>
        <span className="text-xs opacity-70">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border rounded-lg p-3 bg-background space-y-3">
          <div className="grid grid-cols-2 gap-2 items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">시작일</label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">종료일</label>
              <Input
                type="date"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {from && to && from > to && (
            <p className="text-xs text-destructive">종료일은 시작일 이후여야 합니다.</p>
          )}

          <Button
            onClick={apply}
            disabled={!from || !to || from > to}
            className="w-full h-9 text-sm"
          >
            이 기간으로 조회
          </Button>
        </div>
      )}
    </div>
  );
}
