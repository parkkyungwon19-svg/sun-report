import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.39.0";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `당신은 해운대순복음교회 담임목사님(유진성 목사님)의 목회 비서입니다.
매주 순보고 데이터를 분석하여 목사님께 드릴 주간 목회 브리핑을 작성합니다.

[작성 원칙]
- 따뜻하고 목회적인 언어를 사용합니다
- 숫자보다 사람 중심으로 서술합니다
- 목사님이 읽은 후 즉시 행동할 수 있도록 구체적 이름과 상황을 명시합니다
- 분량은 A4 1장 이내로 간결하게 작성합니다
- 교인 이름은 성+직분(예: 홍 집사, 김 권사, 이 성도)으로 표기합니다
- 선교회는 "1선교회", 순은 "3순"처럼 표기합니다
- 기도 제목은 항목별로 나열하지 말고 흐름 있는 문장으로 작성합니다
- 마지막 순장님 격려 메시지는 진심이 담기도록 작성합니다`;

function getThisSundayKST(): Date {
  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const day = nowKST.getUTCDay();
  const diffToSunday = day === 0 ? 0 : -(day);
  const sunday = new Date(nowKST);
  sunday.setUTCDate(sunday.getUTCDate() + diffToSunday);
  return new Date(sunday.toISOString().slice(0, 10));
}

async function collectRawStats(supabase: ReturnType<typeof createClient>, weekOf: string) {
  const weekStart = weekOf;
  const weekEnd = new Date(new Date(weekOf).getTime() + 7 * 86400000)
    .toISOString()
    .slice(0, 10);

  // 이번 주 제출된 순보고
  const { data: reports } = await supabase
    .from("sun_reports")
    .select("id, sun_number, sun_leader, mission_id, attend_total, special_note, status")
    .gte("report_date", weekStart)
    .lt("report_date", weekEnd)
    .eq("status", "submitted");

  const submittedReports = reports ?? [];
  const reportIds = submittedReports.map((r: { id: string }) => r.id);

  // 순원 출석 집계
  let memberRows: Array<{
    attend_samil: boolean; attend_friday: boolean;
    attend_sun_day: boolean; attend_sun_eve: boolean;
    attend_sun: boolean; bible_read: number;
    member_note: string | null;
  }> = [];

  if (reportIds.length > 0) {
    const { data } = await supabase
      .from("sun_report_members")
      .select("attend_samil,attend_friday,attend_sun_day,attend_sun_eve,attend_sun,bible_read,member_note")
      .in("report_id", reportIds);
    memberRows = data ?? [];
  }

  const totalAttend = submittedReports.reduce(
    (sum: number, r: { attend_total: number }) => sum + (r.attend_total ?? 0), 0
  );
  const totalBible = memberRows.reduce((sum, m) => sum + (m.bible_read ?? 0), 0);
  const bibleReaders = memberRows.filter((m) => m.bible_read > 0).length;

  // 특별보고 소식 수집
  const specialNotes = submittedReports
    .filter((r: { special_note: string | null }) => r.special_note)
    .map((r: { sun_number: number; sun_leader: string; special_note: string }) => ({
      sun_number: r.sun_number,
      sun_leader: r.sun_leader,
      note: r.special_note,
    }));

  // 선교회별 집계
  const bySociety: Record<number, { count: number; attend: number }> = {};
  for (const r of submittedReports) {
    const mid = r.mission_id as number;
    if (!bySociety[mid]) bySociety[mid] = { count: 0, attend: 0 };
    bySociety[mid].count++;
    bySociety[mid].attend += r.attend_total ?? 0;
  }

  return {
    week_of: weekOf,
    total_suns: 44,
    reported_suns: submittedReports.length,
    total_attend: totalAttend,
    total_bible_chapters: totalBible,
    bible_readers: bibleReaders,
    special_notes: specialNotes,
    by_society: Object.entries(bySociety).map(([id, v]) => ({
      mission_id: Number(id),
      reported: v.count,
      attend: v.attend,
    })),
  };
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

  try {
    const body = await req.json().catch(() => ({}));
    const weekOf: string = body.week_of ?? getThisSundayKST().toISOString().slice(0, 10);
    const dryRun: boolean = body.dry_run ?? false;
    const trigger: string = body.trigger ?? "manual";

    // ── 알림톡만 발송 (cron: send_alimtalk)
    if (trigger === "send_alimtalk") {
      const monday = new Date(Date.now() + 9 * 60 * 60 * 1000);
      monday.setUTCDate(monday.getUTCDate() - 1); // 월요일 = 일요일 다음날
      const lastSunday = monday.toISOString().slice(0, 10);

      const { data: briefing } = await supabase
        .from("pastoral_briefings")
        .select("id, briefing_summary, week_of")
        .eq("week_of", lastSunday)
        .single();

      if (!briefing?.briefing_summary) {
        return new Response(JSON.stringify({ ok: false, error: "브리핑 없음" }));
      }

      const { data: recipients } = await supabase
        .from("alert_recipients")
        .select("phone")
        .eq("role", "pastor")
        .eq("is_active", true);

      const pastorPhone = Deno.env.get("PASTOR_PHONE");
      const phones = [
        ...(recipients ?? []).map((r: { phone: string }) => r.phone),
        ...(pastorPhone ? [pastorPhone] : []),
      ];

      for (const phone of [...new Set(phones)]) {
        const appKey = Deno.env.get("NHN_APP_KEY");
        const secretKey = Deno.env.get("NHN_SECRET_KEY");
        const senderKey = Deno.env.get("NHN_SENDER_KEY");
        if (!appKey || !secretKey || !senderKey) continue;

        await fetch(
          `https://api-alimtalk.cloud.toast.com/alimtalk/v2.3/appkeys/${appKey}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Secret-Key": secretKey },
            body: JSON.stringify({
              senderKey,
              templateCode: "PASTORAL_BRIEFING_01",
              recipientList: [{
                recipientNo: phone,
                templateParameter: {
                  이번주_한줄요약: briefing.briefing_summary.slice(0, 100),
                  출석률: "",
                  전주대비: "",
                  특별관심_교인수: "",
                  기쁜소식_건수: "",
                },
              }],
            }),
          }
        ).catch(console.error);
      }

      await supabase
        .from("pastoral_briefings")
        .update({ alimtalk_sent_at: new Date().toISOString() })
        .eq("id", briefing.id);

      return new Response(JSON.stringify({ ok: true, trigger: "send_alimtalk" }));
    }

    // ── 브리핑 생성 (cron 또는 manual)
    const rawStats = await collectRawStats(supabase, weekOf);
    const weekDate = new Date(weekOf);
    const year = weekDate.getFullYear();
    const month = weekDate.getMonth() + 1;
    const weekNum = Math.ceil(weekDate.getDate() / 7);

    const userPrompt = `아래는 ${year}년 ${month}월 ${weekNum}주차 순보고 집계 데이터입니다.

[집계 데이터]
${JSON.stringify(rawStats, null, 2)}

위 데이터를 분석하여 아래 형식으로 목회 브리핑을 작성해주세요.

---
## ${year}년 ${month}월 ${weekNum}주차 목회 브리핑

**이번 주 한 줄 요약**

**출석 현황**

**이번 주 특별히 품어야 할 교인**

**기쁜 소식**

**중보기도 제목**

**성경읽기 현황**

**순장님들께 드리는 한마디**
---`;

    // Claude API 호출 (재시도 1회)
    let briefingText = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 2000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        });
        const block = response.content[0];
        if (block.type === "text") {
          briefingText = block.text;
          break;
        }
      } catch (err) {
        if (attempt === 1) console.error("Claude API 최종 실패:", err);
      }
    }

    // 3줄 요약 추출 (첫 번째 단락)
    const summaryMatch = briefingText.match(/\*\*이번 주 한 줄 요약\*\*\n+([^\n*]+)/);
    const briefingSummary = summaryMatch?.[1]?.trim() ?? "";

    if (!dryRun) {
      await supabase
        .from("pastoral_briefings")
        .upsert({
          week_of: weekOf,
          raw_stats: rawStats,
          briefing_text: briefingText || null,
          briefing_summary: briefingSummary || null,
          generated_at: briefingText ? new Date().toISOString() : null,
        }, { onConflict: "week_of" });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        week_of: weekOf,
        dry_run: dryRun,
        briefing_length: briefingText.length,
        summary: briefingSummary,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-briefing Edge Function 오류:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
