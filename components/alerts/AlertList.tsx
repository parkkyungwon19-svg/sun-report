"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, Smile, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AlertType =
  | "keyword_critical"
  | "absence_2w"
  | "absence_4w"
  | "absence_8w"
  | "joy_news";

interface PastoralAlert {
  id: string;
  alert_type: AlertType;
  member_name: string | null;
  sun_number: number | null;
  sun_leader: string | null;
  triggered_by: string | null;
  source_text: string | null;
  status: string;
  is_read: boolean;
  sent_at: string | null;
  created_at: string;
}

interface AlertListProps {
  alerts: PastoralAlert[];
}

const ALERT_CONFIG: Record<
  AlertType,
  { icon: React.ReactNode; label: string; color: string; bg: string }
> = {
  keyword_critical: {
    icon: <AlertCircle className="h-4 w-4" />,
    label: "긴급",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
  },
  absence_2w: {
    icon: <Clock className="h-4 w-4" />,
    label: "2주 결석",
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-200",
  },
  absence_4w: {
    icon: <Clock className="h-4 w-4" />,
    label: "4주 결석",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
  },
  absence_8w: {
    icon: <AlertCircle className="h-4 w-4" />,
    label: "8주+ 결석",
    color: "text-red-700",
    bg: "bg-red-100 border-red-300",
  },
  joy_news: {
    icon: <Smile className="h-4 w-4" />,
    label: "기쁜 소식",
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
  },
};

export function AlertList({ alerts: initialAlerts }: AlertListProps) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const markRead = (id: string) => {
    startTransition(async () => {
      await supabase
        .from("pastoral_alerts")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
      );
    });
  };

  const markAllRead = () => {
    startTransition(async () => {
      const ids = alerts.filter((a) => !a.is_read).map((a) => a.id);
      if (ids.length === 0) return;
      await supabase
        .from("pastoral_alerts")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", ids);
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    });
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  if (alerts.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400 text-sm">
        아직 접수된 알림이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            disabled={isPending}
            className="text-xs text-gray-500"
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            전체 읽음
          </Button>
        </div>
      )}

      {alerts.map((alert) => {
        const config = ALERT_CONFIG[alert.alert_type];
        return (
          <Card
            key={alert.id}
            className={`border transition-opacity ${config.bg} ${
              alert.is_read ? "opacity-60" : ""
            }`}
            onClick={() => !alert.is_read && markRead(alert.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 ${config.color}`}>{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-xs ${config.color} border-current`}
                    >
                      {config.label}
                    </Badge>
                    {alert.sun_number && (
                      <span className="text-xs text-gray-500">
                        {alert.sun_number}순 ({alert.sun_leader})
                      </span>
                    )}
                    {alert.member_name && (
                      <span className="text-sm font-medium text-gray-800">
                        {alert.member_name}
                      </span>
                    )}
                    {!alert.is_read && (
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    )}
                  </div>

                  {alert.triggered_by && (
                    <p className="text-xs text-gray-600 mt-1">
                      감지 키워드: <strong>{alert.triggered_by}</strong>
                    </p>
                  )}

                  {alert.source_text && (
                    <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                      {alert.source_text}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(alert.created_at).toLocaleString("ko-KR")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
