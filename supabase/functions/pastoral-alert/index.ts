import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 긴급 키워드 사전
const URGENT_KEYWORDS: Record<string, string[]> = {
  건강: ["수술", "입원", "응급", "암", "중환자", "사고", "골절", "투병"],
  가정: ["사망", "별세", "소천", "장례", "이혼", "가출"],
  경제: ["실직", "파산", "폐업", "퇴직"],
  신앙: ["방황", "교회 떠나", "이단", "시험"],
};

function detectUrgentKeyword(text: string): { category: string; keyword: string } | null {
  for (const [category, keywords] of Object.entries(URGENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) return { category, keyword };
    }
  }
  return null;
}

function isQuietHours(start = 22, end = 7): boolean {
  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const hour = nowKST.getUTCHours();
  return hour >= start || hour < end;
}

function getWeekLabel(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const week = Math.ceil(
    ((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${year}-W${String(week).padStart(2, "0")}`;
}

async function sendAlimtalk(
  phone: string,
  templateCode: string,
  params: Record<string, string>
): Promise<boolean> {
  const appKey = Deno.env.get("NHN_APP_KEY");
  const secretKey = Deno.env.get("NHN_SECRET_KEY");
  const senderKey = Deno.env.get("NHN_SENDER_KEY");

  if (!appKey || !secretKey || !senderKey) {
    console.warn("알림톡 환경변수 미설정 — 발송 생략");
    return false;
  }

  try {
    const res = await fetch(
      `https://api-alimtalk.cloud.toast.com/alimtalk/v2.3/appkeys/${appKey}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "X-Secret-Key": secretKey,
        },
        body: JSON.stringify({
          senderKey,
          templateCode,
          recipientList: [{ recipientNo: phone, templateParameter: params }],
        }),
      }
    );
    const data = await res.json();
    return data.header?.isSuccessful ?? false;
  } catch (err) {
    console.error("알림톡 발송 오류:", err);
    return false;
  }
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();

    // ── 보류 알림 일괄 발송 (매일 07:00 cron)
    if (body.trigger === "send_pending") {
      const { data: pending } = await supabase
        .from("pastoral_alerts")
        .select("*")
        .eq("status", "pending");

      for (const alert of pending ?? []) {
        for (const recipient of alert.recipients ?? []) {
          try {
            await sendAlimtalk(recipient.phone, "PASTORAL_URGENT_01", {
              순_이름: `${alert.sun_number}순`,
              교인_이름: alert.member_name ?? "",
              키워드: alert.triggered_by ?? "",
              소식_요약: (alert.source_text ?? "").slice(0, 50),
            });
          } catch (err) {
            console.error("보류 알림 발송 실패:", err);
          }
        }
        await supabase
          .from("pastoral_alerts")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", alert.id);
      }
      return new Response(JSON.stringify({ ok: true, processed: pending?.length ?? 0 }));
    }

    // ── 순보고 제출 이벤트 처리
    const { report_id, sun_number, sun_leader, special_note, report_date } = body;

    if (!special_note) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_special_note" }));
    }

    const detected = detectUrgentKeyword(special_note);
    if (!detected) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_keyword" }));
    }

    const weekLabel = getWeekLabel(new Date(report_date ?? Date.now()));
    const dedupKey = `keyword_critical:${sun_number}:${detected.keyword}:${weekLabel}`;

    // 중복 확인
    const { data: existing } = await supabase
      .from("pastoral_alerts")
      .select("id")
      .eq("dedup_key", dedupKey)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ ok: true, skipped: "duplicate" }));
    }

    // alert_settings 확인
    const { data: settings } = await supabase
      .from("alert_settings")
      .select("*")
      .eq("alert_type", "keyword_critical")
      .single();

    if (!settings?.is_enabled) {
      return new Response(JSON.stringify({ ok: true, skipped: "disabled" }));
    }

    // 수신자 조회
    const { data: recipients } = await supabase
      .from("alert_recipients")
      .select("role, name, phone")
      .eq("role", "pastor")
      .eq("is_active", true);

    const recipientList = recipients ?? [];
    const quietHours = isQuietHours(settings.quiet_hours_start, settings.quiet_hours_end);
    const status = quietHours && !settings.quiet_hours_bypass ? "pending" : "sent";

    // pastoral_alerts 저장
    const { data: alertRecord } = await supabase
      .from("pastoral_alerts")
      .insert({
        alert_type: "keyword_critical",
        member_name: null,
        sun_number,
        sun_leader,
        triggered_by: detected.keyword,
        source_text: special_note,
        source_report_id: report_id,
        recipients: recipientList,
        message_sent: `[해운대순복음교회 목양알림] ${sun_number}순 긴급 소식 감지: ${detected.keyword}`,
        status,
        sent_at: status === "sent" ? new Date().toISOString() : null,
        dedup_key: dedupKey,
      })
      .select("id")
      .single();

    // 즉시 발송
    if (status === "sent") {
      for (const recipient of recipientList) {
        try {
          await sendAlimtalk(recipient.phone, "PASTORAL_URGENT_01", {
            순_이름: `${sun_number}순`,
            교인_이름: sun_leader ?? "",
            키워드: detected.keyword,
            소식_요약: special_note.slice(0, 50),
          });
        } catch (err) {
          console.error("알림톡 발송 실패:", err);
          await supabase
            .from("pastoral_alerts")
            .update({ status: "failed" })
            .eq("id", alertRecord?.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, alert_id: alertRecord?.id, status }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("pastoral-alert Edge Function 오류:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
