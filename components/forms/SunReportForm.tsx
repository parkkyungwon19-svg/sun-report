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
    if (!newDate || reportId) return; // 기존 보고서 수정 시 날짜 변경 불가
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

  // 기본 정보
  const [worshipAt, setWorshipAt] = useState(
    initialData?.report.worship_at ?? ""
  );
  const [worshipPlace, setWorshipPlace] = useState(
    initialData?.report.worship_place ?? ""
  );
  const [worshipLeader, setWorshipLeader] = useState(
    initialData?.report.worship_leader ?? ""
  );
  const [specialNote, setSpecialNote] = useState(
    initialData?.report.special_note ?? ""
  );

  // 순원 목록
  const defaultMembers = (): MemberRow[] => {
    const names = getSunMembers(profile.sun_number!);
    // 순장 본인을 맨 앞에 포함
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

  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

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

  const autoAttend = members.filter((m) => m.attend_sun).length;
  const autoBible = members.reduce((s, m) => s + (m.bible_read || 0), 0);

  // 성경장수 수동 입력 (미등록 순원 대응)
  const [manualBible, setManualBible] = useState<string>(
    initialData?.report.bible_chapters
      ? initialData.report.bible_chapters.toString()
      : ""
  );

  // 참석인원: 순모임 체크 자동 집계
  const attendTotal = autoAttend;
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
      <Button variant="ghost" size="sm" className="px-0 -ml-1 text-muted-foreground" onClick={() => router.push("/dashboard/sun-leader")}>
        <ChevronLeft className="w-4 h-4 mr-1" />
        뒤로가기
      </Button>
      {/* 기본 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {profile.sun_number}순 — {profile.name} 순장
          </CardTitle>
          {/* 날짜 선택 (기존 보고서 수정 시에는 고정) */}
          {reportId ? (
            <p className="text-sm text-muted-foreground">{selectedDate} 주일</p>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={dateChecking}
                className="h-9 w-44 text-sm"
                max={new Date().toISOString().split("T")[0]}
              />
              {dateChecking && (
                <span className="text-xs text-muted-foreground">확인 중...</span>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">예배 일시</Label>
              <Input
                value={worshipAt}
                onChange={(e) => setWorshipAt(e.target.value)}
                placeholder="예) 2024.4.7 오전11시"
                className="h-11"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">예배 장소</Label>
              <Input
                value={worshipPlace}
                onChange={(e) => setWorshipPlace(e.target.value)}
                placeholder="예) 본당 3구역"
                className="h-11"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">참석인원 (순모임)</Label>
              <div className="h-11 px-3 flex items-center rounded-md border bg-muted/50 text-base font-semibold text-primary">
                {attendTotal}명
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">성경읽은 장수</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={manualBible}
                onChange={(e) => setManualBible(e.target.value)}
                placeholder={autoBible > 0 ? String(autoBible) : "0"}
                className="h-11"
                min={0}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-sm">인도자</Label>
            <Input
              value={worshipLeader}
              onChange={(e) => setWorshipLeader(e.target.value)}
              placeholder="인도자 이름"
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      {/* 순원 출석 현황 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              순원 출석 현황{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({members.filter((m) => m.member_name.trim()).length}명 등록)
              </span>
            </CardTitle>
          </div>
          {/* 집계 요약 */}
          <div className="flex gap-4 text-sm">
            <span className="text-primary font-medium">
              순모임 참석 {attendTotal}명
            </span>
            <span className="text-muted-foreground">
              성경 {bibleChapters}장
            </span>
          </div>
        </CardHeader>
        {/* 컬럼 헤더 */}
        <div className="flex items-center gap-1 px-4 py-2 bg-muted/40 border-b text-[11px] text-muted-foreground font-medium">
          <span className="w-[4.5rem] shrink-0">이름</span>
          <span className="w-10 text-center shrink-0">주일낮</span>
          <span className="w-10 text-center shrink-0">순모임</span>
          <span className="w-8 text-center shrink-0">전도</span>
          <span className="flex-1 text-center">성경(장)</span>
          <span className="w-6 shrink-0" />
        </div>
        <CardContent className="p-0">
          {members.map((member, idx) => (
            <div key={idx} className="border-b last:border-0">
              {/* 인라인 입력 행 */}
              <div className="flex items-center gap-1 px-4 py-2.5">
                {/* 이름 */}
                <div className="w-[4.5rem] shrink-0">
                  <Input
                    value={member.member_name}
                    onChange={(e) => updateMember(idx, "member_name", e.target.value)}
                    placeholder="이름"
                    className="h-9 text-sm px-2"
                  />
                </div>
                {/* 주일낮 */}
                <div className="w-10 flex justify-center shrink-0">
                  <Checkbox
                    checked={member.attend_sun_day}
                    onCheckedChange={(v) => updateMember(idx, "attend_sun_day", !!v)}
                    className="w-5 h-5"
                  />
                </div>
                {/* 순모임 */}
                <div className="w-10 flex justify-center shrink-0">
                  <Checkbox
                    checked={member.attend_sun}
                    onCheckedChange={(v) => updateMember(idx, "attend_sun", !!v)}
                    className="w-5 h-5"
                  />
                </div>
                {/* 전도 */}
                <div className="w-8 flex justify-center shrink-0">
                  <Checkbox
                    checked={member.evangelism}
                    onCheckedChange={(v) => updateMember(idx, "evangelism", !!v)}
                    className="w-5 h-5"
                  />
                </div>
                {/* 성경장수 */}
                <div className="flex-1">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={member.bible_read || ""}
                    onChange={(e) =>
                      updateMember(idx, "bible_read", parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="h-9 text-sm px-2 text-center"
                    min={0}
                  />
                </div>
                {/* 더보기 토글 */}
                <button
                  type="button"
                  className="w-6 flex justify-center"
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                >
                  {expandedIdx === idx ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>

              {/* 추가 항목 (삼일·금요·주일밤·주보·비고) */}
              {expandedIdx === idx && (
                <div className="px-4 pb-3 space-y-2 bg-muted/20">
                  <div className="grid grid-cols-4 gap-x-3 gap-y-2">
                    {[
                      { key: "attend_samil" as const, label: "삼일" },
                      { key: "attend_friday" as const, label: "금요" },
                      { key: "attend_sun_eve" as const, label: "주일밤" },
                      { key: "bulletin_recv" as const, label: "주보전달" },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                        <Checkbox
                          checked={member[key] as boolean}
                          onCheckedChange={(v) => updateMember(idx, key, !!v)}
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                  <Input
                    value={member.member_note}
                    onChange={(e) => updateMember(idx, "member_note", e.target.value)}
                    placeholder="개별 보고사항 (선택)"
                    className="h-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive/80 px-0 h-7"
                    onClick={() => removeMember(idx)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    삭제
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* 순원 추가 버튼 */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-primary hover:bg-primary/5 transition-colors"
            onClick={addMember}
          >
            <PlusCircle className="w-4 h-4" />
            순원 추가
          </button>
        </CardContent>
      </Card>

      {/* 특별 보고사항 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">특별보고사항</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={specialNote}
            onChange={(e) => setSpecialNote(e.target.value)}
            placeholder="기도제목, 특별한 사항 등을 적어주세요 (선택)"
            rows={3}
            className="resize-none"
          />
        </CardContent>
      </Card>

      <Separator />

      {/* 저장·제출 버튼 */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-12"
          onClick={() => saveReport("draft")}
          disabled={saving || submitting}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "저장 중..." : "임시저장"}
        </Button>
        <Button
          className="flex-1 h-12 bg-primary hover:bg-primary/90 font-semibold"
          onClick={() => saveReport("submitted")}
          disabled={saving || submitting}
        >
          <Send className="w-4 h-4 mr-2" />
          {submitting ? "제출 중..." : "제출하기"}
        </Button>
      </div>
    </div>
  );
}
