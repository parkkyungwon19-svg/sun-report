"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { PeriodData } from "@/app/(app)/admin/statistics/page";

interface MissionData { mission: string; attend: number; }

interface Props {
  periodData: PeriodData[];
  missionChartData: MissionData[];
  latestDate: string | undefined;
  period: string;
  periodLabel: string;
}

const ATTEND6_COLORS = {
  samil:      "#6366f1",
  friday:     "#a855f7",
  sunDay:     "#f59e0b",
  sunEve:     "#ef4444",
  sun:        "#22c55e",
  evangelism: "#f97316",
};
const ATTEND6_LABELS = {
  samil: "삼일", friday: "금요", sunDay: "주낮",
  sunEve: "주밤", sun: "순모임", evangelism: "전도",
};

export function StatisticsCharts({ periodData, missionChartData, latestDate, period, periodLabel }: Props) {
  return (
    <>
      {/* 6가지 항목별 참석 추이 — stacked bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">항목별 참석 추이 ({periodLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          {periodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={periodData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v, name) => [`${v}명`, ATTEND6_LABELS[name as keyof typeof ATTEND6_LABELS] ?? name]}
                  labelFormatter={(l) => `기간: ${l}`}
                />
                <Legend
                  formatter={(v) => ATTEND6_LABELS[v as keyof typeof ATTEND6_LABELS] ?? v}
                  iconSize={10}
                  wrapperStyle={{ fontSize: 11 }}
                />
                {(Object.keys(ATTEND6_COLORS) as (keyof typeof ATTEND6_COLORS)[]).map((key) => (
                  <Bar key={key} dataKey={key} stackId="a" fill={ATTEND6_COLORS[key]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">데이터 없음</p>
          )}
        </CardContent>
      </Card>

      {/* 순모임 참석 추이 — line */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">순모임 참석 추이 ({periodLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          {periodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={periodData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}명`, "순모임 참석"]} labelFormatter={(l) => `기간: ${l}`} />
                <Line type="monotone" dataKey="sun" name="순모임" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="evangelism" name="전도" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">데이터 없음</p>
          )}
        </CardContent>
      </Card>

      {/* 성경읽기 추이 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">성경읽기 추이 ({periodLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          {periodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={periodData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}장`, "성경읽기"]} labelFormatter={(l) => `기간: ${l}`} />
                <Line type="monotone" dataKey="bible" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">데이터 없음</p>
          )}
        </CardContent>
      </Card>

      {/* 선교회별 참석 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            선교회별 참석
            {latestDate && <span className="text-xs font-normal text-muted-foreground ml-2">({latestDate})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={missionChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mission" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}명`, "참석인원"]} />
              <Bar dataKey="attend" fill="#C9A84C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}
