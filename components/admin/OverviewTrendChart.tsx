"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export interface TrendPoint {
  label: string;
  attend: number;
  reportedSuns: number;
}

interface Props {
  data: TrendPoint[];
}

export function OverviewTrendChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          주간 추이를 표시하려면 2주 이상의 데이터가 필요합니다
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">주간 참석 추이 (최근 8주)</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-3">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#888" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 10, fill: "#888" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              formatter={(value, name) =>
                name === "attend"
                  ? [`${value}명`, "총참석"]
                  : [`${value}순`, "제출순수"]
              }
            />
            <Legend
              formatter={(val) => (val === "attend" ? "총참석(명)" : "제출순수")}
              wrapperStyle={{ fontSize: 11 }}
            />
            <Line
              type="monotone"
              dataKey="attend"
              stroke="#1B3A6B"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="reportedSuns"
              stroke="#C9A84C"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
