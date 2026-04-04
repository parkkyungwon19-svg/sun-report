"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface WeekData {
  date: string;
  attend: number;
  bible: number;
  offering: number;
}

interface MissionData {
  mission: string;
  attend: number;
}

interface Props {
  weeks: WeekData[];
  missionChartData: MissionData[];
  latestDate: string | undefined;
}

export function StatisticsCharts({ weeks, missionChartData, latestDate }: Props) {
  const formatted = weeks.map((d) => ({ ...d, label: d.date.slice(5) }));

  return (
    <>
      {/* 출석 추이 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">주차별 참석 추이</CardTitle>
        </CardHeader>
        <CardContent>
          {weeks.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [`${v}명`, "참석인원"]}
                  labelFormatter={(l) => `날짜: ${l}`}
                />
                <Line type="monotone" dataKey="attend" stroke="#1B3A6B" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
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
          <CardTitle className="text-base">주차별 성경읽기 추이</CardTitle>
        </CardHeader>
        <CardContent>
          {weeks.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [`${v}장`, "성경읽기"]}
                  labelFormatter={(l) => `날짜: ${l}`}
                />
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
            선교회별 참석 현황
            {latestDate && (
              <span className="text-xs font-normal text-muted-foreground ml-2">
                ({latestDate})
              </span>
            )}
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
