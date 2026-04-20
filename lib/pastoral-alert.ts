import { createClient as createAdmin } from "@supabase/supabase-js";

const URGENT_KEYWORDS: Record<string, string[]> = {
  건강: ["수술", "입원", "응급", "암", "중환자", "사고", "골절", "투병", "질병", "병원", "치료", "항암"],
  가정: ["사망", "별세", "소천", "장례", "이혼", "가출"],
  경제: ["실직", "파산", "폐업", "퇴직"],
  신앙: ["방황", "교회 떠나", "이단", "시험"],
};

function detectKeyword(text: string): string | null {
  for (const keywords of Object.values(URGENT_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) return kw;
    }
  }
  return null;
}

function getWeekLabel(date: Date): string {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((date.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** 순보고서 제출 시 목양알림 생성 */
export async function createSunReportAlert({
  reportId,
  sunNumber,
  sunLeader,
  specialNote,
  reportDate,
}: {
  reportId: string;
  sunNumber: number;
  sunLeader: string;
  specialNote: string;
  reportDate: string;
}) {
  if (!specialNote?.trim()) return;
  const keyword = detectKeyword(specialNote);
  if (!keyword) return;

  const admin = adminClient();
  const weekLabel = getWeekLabel(new Date(reportDate));
  const dedupKey = `keyword_critical:sun:${sunNumber}:${keyword}:${weekLabel}`;

  const { data: existing } = await admin
    .from("pastoral_alerts")
    .select("id")
    .eq("dedup_key", dedupKey)
    .maybeSingle();
  if (existing) return;

  const { data: settings } = await admin
    .from("alert_settings")
    .select("is_enabled")
    .eq("alert_type", "keyword_critical")
    .maybeSingle();
  if (settings && !settings.is_enabled) return;

  await admin.from("pastoral_alerts").insert({
    alert_type: "keyword_critical",
    sun_number: sunNumber,
    sun_leader: sunLeader,
    triggered_by: keyword,
    source_text: specialNote,
    source_report_id: reportId,
    recipients: [],
    message_sent: `[목양알림] ${sunNumber}순 긴급 소식: ${keyword}`,
    status: "sent",
    sent_at: new Date().toISOString(),
    dedup_key: dedupKey,
  });
}

/** 특별보고관리에서 항목 저장/상태변경 시 목양알림 생성 */
export async function createSpecialItemAlert({
  itemId,
  missionId,
  missionLeader,
  category,
  content,
  status,
  pastorMemo,
  reportDate,
}: {
  itemId: string;
  missionId: number;
  missionLeader: string;
  category: string;
  content: string;
  status: string;
  pastorMemo?: string | null;
  reportDate: string;
}) {
  if (!content?.trim()) return;

  const admin = adminClient();
  const weekLabel = getWeekLabel(new Date(reportDate));
  const dedupKey = `special_item:${itemId}:${status}:${weekLabel}`;

  const { data: existing } = await admin
    .from("pastoral_alerts")
    .select("id")
    .eq("dedup_key", dedupKey)
    .maybeSingle();
  if (existing) return;

  const { data: settings } = await admin
    .from("alert_settings")
    .select("is_enabled")
    .eq("alert_type", "keyword_critical")
    .maybeSingle();
  if (settings && !settings.is_enabled) return;

  const statusEmoji = status === "기도중" ? "🙏" : status === "진행중" ? "📋" : "✅";
  const memoNote = pastorMemo ? ` (메모: ${pastorMemo.slice(0, 30)})` : "";

  await admin.from("pastoral_alerts").insert({
    alert_type: "keyword_critical",
    mission_id: missionId,
    mission_leader: missionLeader,
    triggered_by: `특별보고 ${status}`,
    source_text: `[${category}] ${content}${memoNote}`,
    recipients: [],
    message_sent: `${statusEmoji} [특별보고관리] 선교회${missionId} ${category}: ${content.slice(0, 40)}`,
    status: "sent",
    sent_at: new Date().toISOString(),
    dedup_key: dedupKey,
  });
}

/** 선교회보고서 제출 시 목양알림 생성 (special_report_items 포함) */
export async function createMissionReportAlert({
  missionReportId,
  missionId,
  missionLeader,
  specialItems,
  reportDate,
}: {
  missionReportId: string;
  missionId: number;
  missionLeader: string;
  specialItems: Array<{ category: string; content: string }>;
  reportDate: string;
}) {
  if (!specialItems?.length) return;

  const admin = adminClient();
  const weekLabel = getWeekLabel(new Date(reportDate));

  for (const item of specialItems) {
    if (!item.content?.trim()) continue;
    const keyword = detectKeyword(item.content);
    if (!keyword) continue;

    const dedupKey = `keyword_critical:mission:${missionId}:${keyword}:${weekLabel}`;

    const { data: existing } = await admin
      .from("pastoral_alerts")
      .select("id")
      .eq("dedup_key", dedupKey)
      .maybeSingle();
    if (existing) continue;

    const { data: settings } = await admin
      .from("alert_settings")
      .select("is_enabled")
      .eq("alert_type", "keyword_critical")
      .maybeSingle();
    if (settings && !settings.is_enabled) continue;

    await admin.from("pastoral_alerts").insert({
      alert_type: "keyword_critical",
      mission_id: missionId,
      mission_leader: missionLeader,
      triggered_by: keyword,
      source_text: `[${item.category}] ${item.content}`,
      source_mission_report_id: missionReportId,
      recipients: [],
      message_sent: `[목양알림] 선교회${missionId} ${item.category} 소식: ${keyword}`,
      status: "sent",
      sent_at: new Date().toISOString(),
      dedup_key: dedupKey,
    });
  }
}
