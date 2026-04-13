import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBriefingText } from "@/lib/claude";
import {
  PASTORAL_BRIEFING_SYSTEM_PROMPT,
} from "@/lib/prompts/pastoral-briefing";
import { buildBriefingUserPrompt } from "@/lib/prompts/briefing-formatter";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "pastor") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  const body = await req.json();
  const weekOf: string = body.week_of ?? new Date().toISOString().slice(0, 10);
  const dryRun: boolean = body.dry_run ?? false;

  const weekDate = new Date(weekOf);
  const year = weekDate.getFullYear();
  const month = weekDate.getMonth() + 1;
  const weekNum = Math.ceil(weekDate.getDate() / 7);

  // 이번 주 순보고 집계
  const weekEnd = new Date(weekDate.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  const { data: reports } = await supabase
    .from("sun_reports")
    .select("id, sun_number, sun_leader, mission_id, attend_total, special_note")
    .gte("report_date", weekOf)
    .lt("report_date", weekEnd)
    .eq("status", "submitted");

  const reportIds = (reports ?? []).map((r) => r.id);
  let memberRows: Array<{ bible_read: number }> = [];

  if (reportIds.length > 0) {
    const { data } = await supabase
      .from("sun_report_members")
      .select("bible_read")
      .in("report_id", reportIds);
    memberRows = data ?? [];
  }

  const rawStats = {
    week_of: weekOf,
    total_suns: 44,
    reported_suns: (reports ?? []).length,
    total_attend: (reports ?? []).reduce((s, r) => s + (r.attend_total ?? 0), 0),
    total_bible_chapters: memberRows.reduce((s, m) => s + (m.bible_read ?? 0), 0),
    special_notes: (reports ?? [])
      .filter((r) => r.special_note)
      .map((r) => ({ sun_number: r.sun_number, note: r.special_note })),
  };

  const userPrompt = buildBriefingUserPrompt(
    year,
    month,
    weekNum,
    JSON.stringify(rawStats, null, 2)
  );

  let briefingText = "";
  let error: string | null = null;

  try {
    briefingText = await generateBriefingText(
      PASTORAL_BRIEFING_SYSTEM_PROMPT,
      userPrompt
    );
  } catch (err) {
    error = String(err);
    console.error("Claude API 오류:", err);
  }

  const summaryMatch = briefingText.match(/\*\*이번 주 한 줄 요약\*\*\n+([^\n*]+)/);
  const briefingSummary = summaryMatch?.[1]?.trim() ?? "";

  if (!dryRun && briefingText) {
    await supabase.from("pastoral_briefings").upsert(
      {
        week_of: weekOf,
        raw_stats: rawStats,
        briefing_text: briefingText,
        briefing_summary: briefingSummary,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "week_of" }
    );
  }

  return NextResponse.json({
    ok: !error,
    week_of: weekOf,
    dry_run: dryRun,
    briefing_text: briefingText || null,
    briefing_summary: briefingSummary || null,
    error,
  });
}
