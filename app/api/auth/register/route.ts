import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Role } from "@/types/database";
import { getSunEntry } from "@/lib/constants/sun-directory";

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, name, role, sun_number, mission_id, auto_approve } = body as {
    email: string;
    password: string;
    name: string;
    role: Role;
    sun_number?: number;
    mission_id?: number;
    auto_approve?: boolean; // 담임목사가 직접 생성 시 true
  };

  if (!email || !password || !name || !role) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요" }, { status: 400 });
  }
  if (role === "sun_leader" && !sun_number) {
    return NextResponse.json({ error: "순 번호를 선택해주세요" }, { status: 400 });
  }
  if (role === "mission_leader" && !mission_id) {
    return NextResponse.json({ error: "선교회를 선택해주세요" }, { status: 400 });
  }

  const admin = getAdminClient();

  // Supabase auth 계정 생성 (이메일 인증 생략)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const userId = authData.user.id;

  // 순장이면 sun_directory에서 mission_id 자동 파생
  const derivedMissionId =
    role === "sun_leader" && sun_number
      ? (getSunEntry(sun_number)?.missionId ?? null)
      : (mission_id ?? null);

  // 프로필 생성
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    name,
    role,
    sun_number: sun_number ?? null,
    mission_id: derivedMissionId,
    status: auto_approve ? "active" : "pending",
  });

  if (profileError) {
    // 롤백: auth 계정 삭제
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, userId });
}
