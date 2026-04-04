"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Send, MessageCircle, Users, User, CheckSquare, Square } from "lucide-react";

type Recipient = {
  id: string;
  name: string;
  role: "sun_leader" | "mission_leader";
  sun_number: number | null;
  mission_id: number | null;
  phone: string | null;
};

type Filter = "all" | "sun_leader" | "mission_leader" | "custom";

export default function MessageComposer({ recipients }: { recipients: Recipient[] }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [customIds, setCustomIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [showKakaoModal, setShowKakaoModal] = useState(false);

  const sunLeaders = recipients.filter((r) => r.role === "sun_leader");
  const missionLeaders = recipients.filter((r) => r.role === "mission_leader");

  const targetRecipients = useMemo(() => {
    if (filter === "all") return recipients;
    if (filter === "sun_leader") return sunLeaders;
    if (filter === "mission_leader") return missionLeaders;
    return recipients.filter((r) => customIds.has(r.id));
  }, [filter, customIds, recipients, sunLeaders, missionLeaders]);

  function toggleCustom(id: string) {
    setCustomIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectGroup(role: "sun_leader" | "mission_leader" | "all") {
    const group = role === "all" ? recipients : recipients.filter((r) => r.role === role);
    setCustomIds(new Set(group.map((r) => r.id)));
    setFilter("custom");
  }

  // ── 앱 내 발송 ──────────────────────────────────────────
  async function handleAppSend() {
    if (!title.trim() || !body.trim()) { toast.error("제목과 내용을 입력해주세요"); return; }
    if (targetRecipients.length === 0) { toast.error("수신자를 선택해주세요"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          targetIds: targetRecipients.map((r) => r.id),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`${json.sent}명에게 앱 내 메시지를 보냈습니다!`);
      setTitle("");
      setBody("");
    } catch (err) {
      toast.error("발송 실패: " + (err as Error).message);
    } finally {
      setSending(false);
    }
  }

  // ── 카카오톡 발송 ───────────────────────────────────────
  function handleKakaoSend() {
    if (!title.trim() || !body.trim()) { toast.error("제목과 내용을 입력해주세요"); return; }
    if (targetRecipients.length === 0) { toast.error("수신자를 선택해주세요"); return; }
    setShowKakaoModal(true);
  }

  const kakaoText = useMemo(() => {
    const names = targetRecipients.map((r) =>
      r.role === "sun_leader" ? `${r.sun_number}순 ${r.name}` : `${r.mission_id}선교회 ${r.name}`
    ).join(", ");
    return `[순보고 공지]\n\n${title}\n\n${body}\n\n─ 해운대순복음교회 유진성 목사\n수신: ${names}`;
  }, [title, body, targetRecipients]);

  async function copyKakaoText() {
    await navigator.clipboard.writeText(kakaoText);
    toast.success("메시지가 클립보드에 복사되었습니다!");
  }

  function openKakaoTalk() {
    const encoded = encodeURIComponent(kakaoText);
    // 모바일 카카오톡 딥링크
    window.location.href = `kakaotalk://send?text=${encoded}`;
    // 딥링크 실패 시 카카오톡 앱 다운로드 페이지 (타임아웃)
    setTimeout(() => {
      window.open("https://www.kakaocorp.com/page/service/service/KakaoTalk", "_blank");
    }, 1500);
  }

  return (
    <div className="space-y-6">
      {/* 메시지 작성 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            메시지 작성
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>제목</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="메시지 제목을 입력하세요"
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label>내용</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="메시지 내용을 입력하세요"
              className="min-h-[120px] text-base resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* 수신자 선택 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            수신자 선택
            <Badge variant="secondary" className="ml-auto">
              {targetRecipients.length}명 선택
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 빠른 선택 버튼 */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "전체", value: "all" as Filter, count: recipients.length },
              { label: "순장만", value: "sun_leader" as Filter, count: sunLeaders.length },
              { label: "선교회장만", value: "mission_leader" as Filter, count: missionLeaders.length },
              { label: "개별 선택", value: "custom" as Filter, count: null },
            ].map(({ label, value, count }) => (
              <Button
                key={value}
                variant={filter === value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilter(value);
                  if (value !== "custom") setCustomIds(new Set());
                }}
                className="h-9"
              >
                {label}
                {count !== null && (
                  <Badge variant={filter === value ? "secondary" : "outline"} className="ml-1.5 text-[10px]">
                    {count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* 개별 선택 */}
          {filter === "custom" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => selectGroup("all")}>
                  <CheckSquare className="w-3.5 h-3.5 mr-1" /> 전체 선택
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectGroup("sun_leader")}>
                  순장 전체
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectGroup("mission_leader")}>
                  선교회장 전체
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCustomIds(new Set())}>
                  <Square className="w-3.5 h-3.5 mr-1" /> 초기화
                </Button>
              </div>

              <Separator />

              {/* 선교회장 */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">선교회장</p>
                <div className="grid grid-cols-2 gap-2">
                  {missionLeaders.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-muted/50">
                      <Checkbox
                        checked={customIds.has(r.id)}
                        onCheckedChange={() => toggleCustom(r.id)}
                      />
                      <span className="text-sm">{r.mission_id}선교회 {r.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              {/* 순장 */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">순장</p>
                <div className="grid grid-cols-2 gap-2">
                  {sunLeaders.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-muted/50">
                      <Checkbox
                        checked={customIds.has(r.id)}
                        onCheckedChange={() => toggleCustom(r.id)}
                      />
                      <span className="text-sm">{r.sun_number}순 {r.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 선택된 수신자 미리보기 (custom 외) */}
          {filter !== "custom" && targetRecipients.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {targetRecipients.slice(0, 10).map((r) => (
                <Badge key={r.id} variant="secondary" className="text-xs">
                  <User className="w-2.5 h-2.5 mr-1" />
                  {r.role === "sun_leader" ? `${r.sun_number}순 ${r.name}` : `${r.mission_id}선교회 ${r.name}`}
                </Badge>
              ))}
              {targetRecipients.length > 10 && (
                <Badge variant="outline" className="text-xs">+{targetRecipients.length - 10}명</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 발송 버튼 */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          className="h-12 text-base font-semibold"
          onClick={handleAppSend}
          disabled={sending}
        >
          <Send className="w-4 h-4 mr-2" />
          {sending ? "발송 중..." : "앱 내 발송"}
        </Button>
        <Button
          variant="outline"
          className="h-12 text-base font-semibold border-yellow-400 text-yellow-700 hover:bg-yellow-50"
          onClick={handleKakaoSend}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          카카오톡 발송
        </Button>
      </div>

      {/* 카카오톡 발송 모달 */}
      {showKakaoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b">
              <h2 className="font-bold text-lg">카카오톡으로 보내기</h2>
              <p className="text-sm text-muted-foreground mt-1">
                수신자 {targetRecipients.length}명 · 메시지를 복사하거나 카카오톡을 여세요
              </p>
            </div>

            <div className="p-5 space-y-4">
              {/* 발송할 메시지 미리보기 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <pre className="text-sm whitespace-pre-wrap font-sans">{kakaoText}</pre>
              </div>

              {/* 수신자 목록 */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">수신자 목록</p>
                <div className="flex flex-wrap gap-1.5">
                  {targetRecipients.map((r) => (
                    <Badge key={r.id} variant="secondary" className="text-xs">
                      {r.role === "sun_leader" ? `${r.sun_number}순 ${r.name}` : `${r.mission_id}선교회 ${r.name}`}
                      {r.phone && <span className="ml-1 opacity-60">{r.phone}</span>}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-11" onClick={copyKakaoText}>
                  메시지 복사
                </Button>
                <Button
                  className="h-11 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
                  onClick={openKakaoTalk}
                >
                  카카오톡 열기
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                카카오톡이 열리면 메시지를 붙여넣기 후 각 수신자에게 발송해주세요
              </p>
            </div>

            <div className="p-4 border-t">
              <Button variant="ghost" className="w-full" onClick={() => setShowKakaoModal(false)}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
