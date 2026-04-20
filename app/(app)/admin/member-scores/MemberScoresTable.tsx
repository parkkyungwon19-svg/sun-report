"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Download } from "lucide-react";

type MemberAgg = {
  memberName: string;
  sunNumber: number;
  missionId: number;
  samil: number;
  friday: number;
  sunDay: number;
  sunEve: number;
  sun: number;
  evangelism: number;
  totalBible: number;
  totalScore: number;
  rank: number;
};

function AttendCell({ val, isWeek }: { val: number; isWeek: boolean }) {
  if (isWeek) {
    return val ? (
      <span className="text-green-600 font-bold">✓</span>
    ) : (
      <span className="text-gray-300">−</span>
    );
  }
  return val > 0 ? (
    <span className="text-primary font-semibold">{val}</span>
  ) : (
    <span className="text-gray-300">0</span>
  );
}

function EvangelCell({ val, isWeek }: { val: number; isWeek: boolean }) {
  if (isWeek) {
    return val ? (
      <span className="text-amber-600 font-bold">✓</span>
    ) : (
      <span className="text-gray-300">−</span>
    );
  }
  return val > 0 ? (
    <span className="text-amber-600 font-bold">{val}</span>
  ) : (
    <span className="text-gray-300">0</span>
  );
}

export default function MemberScoresTable({
  ranked,
  isWeek,
  period,
  label,
  customFrom,
  customTo,
}: {
  ranked: MemberAgg[];
  isWeek: boolean;
  period: string;
  label: string;
  customFrom?: string;
  customTo?: string;
}) {
  const [query, setQuery] = useState("");
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      let url = `/api/member-scores/download?period=${period}`;
      if (period === "custom" && customFrom && customTo) {
        url += `&from=${customFrom}&to=${customTo}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("다운로드 실패");
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = `순원점수순위_${label}.xlsx`;
      a.click();
      URL.revokeObjectURL(objUrl);
    } finally {
      setDownloading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return ranked;
    return ranked.filter((m) => m.memberName.includes(q));
  }, [ranked, query]);

  // 검색 결과가 1명일 때 강조 카드 표시
  const searchResult = query.trim() && filtered.length > 0 ? filtered[0] : null;
  const showHighlight = query.trim() !== "" && filtered.length === 1 && searchResult;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">전체 순위표</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={downloading || ranked.length === 0}
            className="gap-1.5 text-xs h-8"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? "다운로드 중..." : "엑셀 다운로드"}
          </Button>
        </div>

        {/* 이름 검색 */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="이름 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9 text-sm h-9"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 검색 결과 강조 카드 (1명 매칭 시) */}
        {showHighlight && (
          <div className="mt-3 p-3 rounded-lg border-2 border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-bold text-base text-primary">{searchResult!.memberName}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {searchResult!.sunNumber}순 · {searchResult!.missionId}선교회
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">전체 순위</div>
                <div className="text-xl font-bold text-primary">
                  {searchResult!.rank === 1 ? "🥇" :
                   searchResult!.rank === 2 ? "🥈" :
                   searchResult!.rank === 3 ? "🥉" : `${searchResult!.rank}위`}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-xs text-center">
              <div className="bg-white rounded p-1.5 border">
                <div className="text-muted-foreground mb-0.5">삼일</div>
                <div className="font-semibold">{isWeek ? (searchResult!.samil ? "✓" : "−") : searchResult!.samil}</div>
              </div>
              <div className="bg-white rounded p-1.5 border">
                <div className="text-muted-foreground mb-0.5">금요</div>
                <div className="font-semibold">{isWeek ? (searchResult!.friday ? "✓" : "−") : searchResult!.friday}</div>
              </div>
              <div className="bg-white rounded p-1.5 border">
                <div className="text-muted-foreground mb-0.5">주낮</div>
                <div className="font-semibold">{isWeek ? (searchResult!.sunDay ? "✓" : "−") : searchResult!.sunDay}</div>
              </div>
              <div className="bg-white rounded p-1.5 border">
                <div className="text-muted-foreground mb-0.5">주밤</div>
                <div className="font-semibold">{isWeek ? (searchResult!.sunEve ? "✓" : "−") : searchResult!.sunEve}</div>
              </div>
              <div className="bg-white rounded p-1.5 border">
                <div className="text-muted-foreground mb-0.5">순모임</div>
                <div className="font-semibold">{isWeek ? (searchResult!.sun ? "✓" : "−") : searchResult!.sun}</div>
              </div>
              <div className="bg-white rounded p-1.5 border">
                <div className="text-muted-foreground mb-0.5">전도</div>
                <div className="font-semibold text-amber-600">{isWeek ? (searchResult!.evangelism ? "✓" : "−") : searchResult!.evangelism}</div>
              </div>
              <div className="bg-white rounded p-1.5 border">
                <div className="text-muted-foreground mb-0.5">성경(장)</div>
                <div className="font-semibold text-blue-600">{searchResult!.totalBible}</div>
              </div>
              <div className="bg-white rounded p-1.5 border border-primary/30 bg-primary/5">
                <div className="text-muted-foreground mb-0.5">총점</div>
                <div className="font-bold text-primary">{searchResult!.totalScore}</div>
              </div>
            </div>
          </div>
        )}

        {/* 복수 검색 결과 안내 */}
        {query.trim() && filtered.length > 1 && (
          <p className="text-xs text-muted-foreground mt-1">
            &ldquo;{query}&rdquo; 검색 결과 {filtered.length}명
          </p>
        )}
        {query.trim() && filtered.length === 0 && (
          <p className="text-xs text-destructive mt-1">
            &ldquo;{query}&rdquo;에 해당하는 순원이 없습니다
          </p>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[560px]">
            <thead>
              <tr className="border-b bg-muted/50 text-muted-foreground">
                <th className="text-center px-2 py-3 font-semibold w-10">순위</th>
                <th className="text-left px-3 py-3 font-semibold">이름</th>
                <th className="text-center px-1 py-3 font-semibold w-10">삼일</th>
                <th className="text-center px-1 py-3 font-semibold w-10">금요</th>
                <th className="text-center px-1 py-3 font-semibold w-10">주낮</th>
                <th className="text-center px-1 py-3 font-semibold w-10">주밤</th>
                <th className="text-center px-1 py-3 font-semibold w-10">순모임</th>
                <th className="text-center px-1 py-3 font-semibold w-10 text-amber-700">전도</th>
                <th className="text-center px-1 py-3 font-semibold w-14">성경(장)</th>
                <th className="text-right px-3 py-3 font-semibold w-16 text-primary">총점</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const rankBadge =
                  m.rank === 1 ? "🥇" :
                  m.rank === 2 ? "🥈" :
                  m.rank === 3 ? "🥉" : null;

                const isMatch = query.trim() !== "" && m.memberName.includes(query.trim());

                return (
                  <tr
                    key={`${m.memberName}-${m.sunNumber}`}
                    className={`border-b last:border-0 transition-colors ${
                      isMatch
                        ? "bg-primary/10 font-medium"
                        : i % 2 === 0 ? "" : "bg-muted/20"
                    } ${m.rank <= 3 ? "font-medium" : ""}`}
                  >
                    <td className="text-center px-2 py-2.5">
                      {rankBadge ? (
                        <span className="text-base">{rankBadge}</span>
                      ) : (
                        <span className="text-muted-foreground font-normal">{m.rank}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-sm">{m.memberName}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {m.sunNumber}순 · {m.missionId}선교회
                      </div>
                    </td>
                    <td className="text-center px-1 py-2.5">
                      <AttendCell val={m.samil} isWeek={isWeek} />
                    </td>
                    <td className="text-center px-1 py-2.5">
                      <AttendCell val={m.friday} isWeek={isWeek} />
                    </td>
                    <td className="text-center px-1 py-2.5">
                      <AttendCell val={m.sunDay} isWeek={isWeek} />
                    </td>
                    <td className="text-center px-1 py-2.5">
                      <AttendCell val={m.sunEve} isWeek={isWeek} />
                    </td>
                    <td className="text-center px-1 py-2.5">
                      <AttendCell val={m.sun} isWeek={isWeek} />
                    </td>
                    <td className="text-center px-1 py-2.5">
                      <EvangelCell val={m.evangelism} isWeek={isWeek} />
                    </td>
                    <td className="text-center px-1 py-2.5">
                      {m.totalBible > 0 ? (
                        <span className="text-blue-600">{m.totalBible}</span>
                      ) : (
                        <span className="text-gray-300">0</span>
                      )}
                    </td>
                    <td className="text-right px-3 py-2.5 font-bold text-primary">
                      {m.totalScore}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
