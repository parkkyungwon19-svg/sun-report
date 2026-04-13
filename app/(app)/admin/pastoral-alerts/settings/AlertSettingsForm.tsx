"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Trash2, UserPlus } from "lucide-react";

interface AlertSetting {
  id: string;
  alert_type: string;
  is_enabled: boolean;
  absence_weeks: number | null;
  quiet_hours_start: number;
  quiet_hours_end: number;
  dedup_days: number;
}

interface Recipient {
  id: string;
  role: string;
  name: string;
  phone: string;
  is_active: boolean;
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  keyword_critical: "긴급 키워드 알림 (수술·입원·사망 등)",
  absence_2w: "2주 연속 결석 알림",
  absence_4w: "4주 연속 결석 알림",
  absence_8w: "8주 이상 결석 알림",
  joy_news: "기쁜 소식 알림 (취업·출산 등)",
};

interface AlertSettingsFormProps {
  settings: AlertSetting[];
  recipients: Recipient[];
}

export function AlertSettingsForm({
  settings: initialSettings,
  recipients: initialRecipients,
}: AlertSettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [recipients, setRecipients] = useState(initialRecipients);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  const toggleAlert = (id: string, enabled: boolean) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_enabled: enabled } : s))
    );
  };

  const updateQuietHours = (id: string, field: "quiet_hours_start" | "quiet_hours_end", val: number) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  const saveSettings = () => {
    startTransition(async () => {
      for (const s of settings) {
        await supabase
          .from("alert_settings")
          .update({
            is_enabled: s.is_enabled,
            quiet_hours_start: s.quiet_hours_start,
            quiet_hours_end: s.quiet_hours_end,
            updated_at: new Date().toISOString(),
          })
          .eq("id", s.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const addRecipient = () => {
    if (!newName.trim() || !newPhone.trim()) return;
    startTransition(async () => {
      const { data } = await supabase
        .from("alert_recipients")
        .insert({ role: "pastor", name: newName.trim(), phone: newPhone.trim() })
        .select()
        .single();
      if (data) setRecipients((prev) => [...prev, data]);
      setNewName("");
      setNewPhone("");
    });
  };

  const removeRecipient = (id: string) => {
    startTransition(async () => {
      await supabase.from("alert_recipients").delete().eq("id", id);
      setRecipients((prev) => prev.filter((r) => r.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      {/* 알림 유형별 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-[#1B3A6B]">알림 유형 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.map((s) => (
            <div key={s.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  {ALERT_TYPE_LABELS[s.alert_type] ?? s.alert_type}
                </Label>
                <Switch
                  checked={s.is_enabled}
                  onCheckedChange={(v) => toggleAlert(s.id, v)}
                />
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>야간 발송 금지:</span>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={s.quiet_hours_start}
                  onChange={(e) =>
                    updateQuietHours(s.id, "quiet_hours_start", Number(e.target.value))
                  }
                  className="w-16 h-7 text-xs"
                />
                <span>시 ~</span>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={s.quiet_hours_end}
                  onChange={(e) =>
                    updateQuietHours(s.id, "quiet_hours_end", Number(e.target.value))
                  }
                  className="w-16 h-7 text-xs"
                />
                <span>시</span>
              </div>
              <hr className="border-gray-100" />
            </div>
          ))}

          <Button
            onClick={saveSettings}
            disabled={isPending}
            className="w-full bg-[#1B3A6B] hover:bg-[#1B3A6B]/90 text-white"
          >
            {saved ? "저장 완료!" : "설정 저장"}
          </Button>
        </CardContent>
      </Card>

      {/* 수신자 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-[#1B3A6B]">알림 수신자 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recipients.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <span className="text-sm font-medium text-gray-800">{r.name}</span>
                <span className="text-xs text-gray-500 ml-2">{r.phone}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRecipient(r.id)}
                disabled={isPending}
                className="text-red-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {/* 수신자 추가 */}
          <div className="flex gap-2 pt-2">
            <Input
              placeholder="이름"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="010-0000-0000"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={addRecipient}
              disabled={isPending || !newName || !newPhone}
              size="sm"
              className="bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-white shrink-0"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
