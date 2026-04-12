"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { PlusCircle, Trash2, Save, Send, ChevronDown, ChevronUp, ChevronLeft } from "lucide-react";
import type { Profile, SunReport, SunReportMember } from "@/types/database";
import { getSunMembers } from "@/lib/constants/sun-directory";

interface Props {
  profile: Profile;
  userId: string;
  reportDate: string;
  reportId: string | null;
  initialData: {
    report: SunReport;
    members: SunReportMember[];
  } | null;
}

type MemberRow = {
  id?: string;
  member_name: string;
  attend_samil: boolean;
  attend_friday: boolean;
  attend_sun_day: boolean;
  attend_sun_eve: boolean;
  attend_sun: boolean;
  evangelism: boolean;
  bulletin_recv: boolean;
  bible_read: number;
  member_note: string;
};

const EMPTY_MEMBER = (): MemberRow => ({
  member_name: "",
  attend_samil: false,
  attend_friday: false,
  attend_sun_day: false,
  attend_sun_eve: false,
  attend_sun: false,
  evangelism: false,
  bulletin_recv: false,
  bible_read: 0,
  member_note: "",
});

// 6가지 출석 항목 정의
const ATTEND_COLS: { key: keyof MemberRow; label: string }[] = [
  { key: "attend_samil",   label: "삼일" },
  { key: "attend_friday",  label: "금요" },
  { key: "attend_sun_day", label: "주낮" },
  { key: "attend_sun_eve", label: "주밤" },
  { key: "attend_sun",     label: "순모임" },
  { key: "evangelism",     label: "전도" },
];

export default function SunReportForm({
  profile,
  userId,
  reportDate,
  reportId,
  initialData,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(reportDate);
  const [dateChecking, setDateChecking] = useState(false);

  async function handleDateChange(newDate: string) {
    setSelectedDate(newDate);
    if (!newDate || reportId) return;
    setDateChecking(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("sun_reports")
        .select("id")
        .eq("created_by", userId)
        .eq("report_date", newDate)
        .maybeSingle();
      if (data?.id) {
        router.push(`/report/sun/${data.id}`);
      }
    } finally {
      setDateChecking(false);
    }
  }

  const [worshipAt, setWorshipAt] = useState(initialData?.report.worship_at ?? "");
  const [worshipPlace, setWorshipPlace] = useState(initialData?.report.worship_place ?? "");
  const [worshipLeader, setWorshipLeader] = useState(initialData?.report.worship_leader ?? "");
  const [specialNote, setSpecialNote] = useState(initialData?.report.special_note ?? "");

  const defaultMembers = (): MemberRow[] => {
    const names = getSunMembers(profile.sun_number!);
    const allNames = [profile.name, ...names];
    return allNames.map((name) => ({ ...EMPTY_MEMBER(), member_name: name }));
  };

  const [members, setMembers] = useState<MemberRow[]>(
    initialData?.members.length
      ? initialData.members.map((m) => ({
          id: m.id,
          member_name: m.member_name,
          attend_samil: m.attend_samil,
          attend_friday: m.attend_friday,
          attend_sun_day: m.attend_sun_day,
          attend_sun_eve: m.attend_sun_eve,
          attend_sun: m.attend_sun,
          evangelism: m.evangelism,
          bulletin_recv: m.bulletin_recv,
          bible_read: m.bible_read,
          member_note: m.member_note ?? "",
        }))
      : defaultMembers()
  );

  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const updateMember = useCallback(
    (idx: number, key: keyof MemberRow, value: MemberRow[keyof MemberRow]) => {
      setMembers((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], [key]: value };
        return next;
      });
    },
    []
  );

  const addMember = () => {
    setMembers((prev) => [...prev, EMPTY_MEMBER()]);
    setExpandedIdx(members.length);
  };

  const removeMember = (idx: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
    setExpandedIdx(null);
  };

  // 6가지 출석 집계
  const attendCounts = ATTEND_COLS.map(({ key }) =>
    members.filter((m) => m[key] === true).length
  );
  const attendTotal = attendCounts[4]; // 순모임 참석 (attend_sun)
  const autoBible = members.reduce((s, m) => s + (m.bible_read || 0), 0);

  const [manualBible, setManualBible] = useState<string>(
    initialData?.report.bible_chapters
      ? initialData.report.bible_chapters.toString()
      : ""
  );
  const bibleChapters = manualBible !== "" ? parseInt(manualBible) || 0 : autoBible;

  async function saveReport(status: "draft" | "submitted") {
    if (status === "draft") setSaving(true);
    else setSubmitting(true);

    try {
      const reportPayload = {
        sun_number: profile.sun_number!,
        sun_leader: profile.name,
        mission_id: profile.mission_id!,
        report_date: selectedDate,
        worship_at: worshipAt || null,
        worship_place: worshipPlace || null,
        worship_leader: worshipLeader || null,
        attend_total: attendTotal,
        bible_chapters: bibleChapters,
        special_note: specialNote || null,
        status,
        submitted_at: status === "submitted" ? new Date().toISOString() : null,
        created_by: userId,
      };

      const validMembers = members.filter((m) => m.member_name.trim());

      const res = await fetch("/api/reports/sun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, reportPayload, members: validMembers }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      if (status === "submitted") {
        toast.success("순보고서가 제출되었습니다!");
        router.push("/dashboard/sun-leader");
      } else {
        toast.success("임시저장 완료");
        if (!reportId) router.push(`/report/sun/${json.id}`);
      }
      router.refresh();
    } catch (err) {
      toast.error("저장 실패: " + (err as Error).message);
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 pb-8">
      <Button variant="ghost" size="sm" className="px-0 -ml-1 text-muted-foreground text-base" onClick={() => router.push("/dashboard/sun-leader")}>
        <ChevronLeft className="w-5 h-5 mr-1" />
        뒤로가기
      </Button>

      {/* 기본 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {profile.sun_number}순 — {profile.name} 순장
          </CardTitle>
          {reportId ? (
            <p className="text-base text-muted-foreground">{selectedDate} 주일</p>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={dateChecking}
                className="h-10 w-44 text-base"
                max={new Date().toISOString().split("T")[0]}
              />
              {dateChecking && (
                <span className="text-sm text-muted-foreground">확인 중...</span>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-base">예배 일시</Label>
              <Input
                value={worshipAt}
                onChange={(e) => setWorshipAt(e.target.value)}
                placeholder="예) 2024.4.7 오전11시"
                className="h-11 text-base"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-base">예배 장소</Label>
              <Input
                value={worshipPlace}
                onChange={(e) => setWorshipPlace(e.target.value)}
                placeholder="예) 본당 3구역"
                className="h-11 text-base"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-base">인도자</Label>
            <Input
              value={worshipLeader}
              onChange={(e) => setWorshipLeader(e.target.value)}
              placeholder="인도자 이름"
              className="h-11 text-base"
            />
          </div>

          {/* 6가지 출석 집계 */}
          <div>
            <Label className="text-base mb-2 block">출석 현황 요약</Label>
            <div className="grid grid-cols-3 gap-2">
              {ATTEND_COLS.map(({ label }, i) => (
                <div key={label} className="text-center bg-muted/40 rounded-lg py-2 px-1 border">
                  <p className="text-2xl font-bold text-primary">{attendCounts[i]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-base">성경읽은 장수</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={manualBible}
              onChange={(e) => setManualBible(e.target.value)}
              placeholder={autoBible > 0 ? String(autoBible) : "0"}
              className="h-11 text-base"
              min={0}
            />
          </div>
        </CardContent>
      </Card>

      {/* 순원 출석 현황 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              순원 출석 현황{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({members.filter((m) => m.member_name.trim()).length}명)
              </span>
            </CardTitle>
          </div>
        </CardHeader>

        {/* 컬럼 헤더 */}
        <div className="flex items-center px-3 py-2 bg-muted/50 border-b border-t">
          <span className="flex-1 text-sm font-semibold text-muted-foreground">이름</span>
          {ATTEND_COLS.map(({ label }) => (
            <span key={label} className="w-9 text-center text-[11px] font-semibold text-muted-foreground shrink-0">
              {label}
            </span>
          ))}
          <span className="w-7 shrink-0" />
        </div>

        <CardContent className="p-0">
          {members.map((member, idx) => (
            <div
              key={idx}
              className={`border-b last:border-0 ${idx % 2 === 0 ? "bg-white" : "bg-sky-50/60"}`}
            >
              {/* 인라인 행 — 이름 + 6가지 체크박스 */}
              <div className="flex items-center px-3 py-3">
                <div className="flex-1 pr-1 min-w-0">
                  <Input
                    value={member.member_name}
                    onChange={(e) => updateMember(idx, "member_name", e.target.value)}
                    placeholder="이름"
                    className="h-10 text-base px-2"
                  />
                </div>
                {ATTEND_COLS.map(({ key }) => (
                  <div key={key} className="w-9 flex justify-center shrink-0">
                    <Checkbox
                      checked={member[key] as boolean}
                      onCheckedChange={(v) => updateMember(idx, key, !!v)}
                      className="w-5 h-5"
                    />
                  </div>
                ))}
                {/* 상세 펼치기 버튼 */}
                <button
                  type="button"
                  className="w-7 flex justify-center shrink-0"
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                >
                  {expandedIdx === idx ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>

              {/* 펼침: 성경장수 + 주보전달 + 메모 + 삭제 */}
              {expandedIdx === idx && (
                <div className="px-3 pb-3 space-y-2 bg-muted/20 border-t border-dashed">
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">성경읽은 장수</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={member.bible_read || ""}
                        onChange={(e) => updateMember(idx, "bible_read", parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="h-9 text-base text-center"
                        min={0}
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={member.bulletin_recv}
                          onCheckedChange={(v) => updateMember(idx, "bulletin_recv", !!v)}
                          className="w-5 h-5"
                        />
                        <span className="text-base">주보전달</span>
                      </label>
                    </div>
                  </div>
                  <Input
                    value={member.member_note}
                    onChange={(e) => updateMember(idx, "member_note", e.target.value)}
                    placeholder="개별 메모 (선택)"
                    className="h-9 text-base"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive/80 px-0 h-8 text-sm"
                    onClick={() => removeMember(idx)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    이 순원 삭제
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* 순원 추가 버튼 */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-4 text-base text-primary hover:bg-primary/5 transition-colors font-medium"
            onClick={addMember}
          >
            <PlusCircle className="w-5 h-5" />
            순원 추가
          </button>
        </CardContent>
      </Card>

      {/* 특별 보고사항 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">특별보고사항</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={specialNote}
            onChange={(e) => setSpecialNote(e.target.value)}
            placeholder="기도제목, 특별한 사항 등을 적어주세요 (선택)"
            rows={3}
            className="resize-none text-base"
          />
        </CardContent>
      </Card>

      <Separator />

      {/* 저장·제출 버튼 */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-14 text-base"
          onClick={() => saveReport("draft")}
          disabled={saving || submitting}
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? "저장 중..." : "임시저장"}
        </Button>
        <Button
          className="flex-1 h-14 bg-primary hover:bg-primary/90 font-semibold text-base"
          onClick={() => saveReport("submitted")}
          disabled={saving || submitting}
        >
          <Send className="w-5 h-5 mr-2" />
          {submitting ? "제출 중..." : "제출하기"}
        </Button>
      </div>
    </div>
  );
}
