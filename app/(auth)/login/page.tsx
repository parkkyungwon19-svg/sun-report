"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleKakaoLogin() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "profile_nickname profile_image",
      },
    });
    if (error) {
      toast.error("카카오 로그인 실패: " + error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* 교회 로고 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-4">
            <Image src="/logo.png" alt="해운대순복음교회 로고" width={80} height={80} priority />
          </div>
          <h1 className="text-2xl font-bold text-primary">순보고</h1>
          <p className="text-sm text-muted-foreground mt-1">해운대순복음교회</p>
        </div>

        {/* 카카오 로그인 버튼 */}
        <button
          onClick={handleKakaoLogin}
          disabled={loading}
          className="w-full h-14 rounded-xl flex items-center justify-center gap-3 text-base font-semibold bg-[#FEE500] text-[#191919] hover:bg-[#F0D800] transition-colors disabled:opacity-60"
        >
          <KakaoIcon />
          {loading ? "로그인 중..." : "카카오로 로그인"}
        </button>

        <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
          처음 로그인하면 역할 등록 화면으로 이동합니다.<br />
          담임목사님 승인 후 앱을 이용하실 수 있습니다.
        </p>
      </div>
    </div>
  );
}

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3C6.477 3 2 6.477 2 11c0 2.897 1.573 5.45 3.957 7.03L5 21l3.34-1.74A10.5 10.5 0 0 0 12 19c5.523 0 10-3.477 10-8s-4.477-8-10-8z"
        fill="#191919"
      />
    </svg>
  );
}
