"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, FileText, Bell } from "lucide-react";
import type { Profile } from "@/types/database";

const ROLE_LABEL: Record<string, string> = {
  sun_leader: "순장",
  mission_leader: "선교회장",
  pastor: "담임목사",
};

export default function AppNav({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    const supabase = createClient();
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("read", false);
    setUnreadCount(count ?? 0);
  }, []);

  useEffect(() => {
    fetchUnread();

    const supabase = createClient();
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => fetchUnread()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchUnread]);

  async function handleBellClick() {
    const supabase = createClient();
    // 미읽은 알림 id 조회 후 읽음 처리
    const { data } = await supabase
      .from("notifications")
      .select("id")
      .eq("read", false);
    if (data && data.length > 0) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: data.map((n: { id: string }) => n.id) }),
      });
      setUnreadCount(0);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const dashboardHref =
    profile.role === "pastor"
      ? "/dashboard/admin"
      : profile.role === "mission_leader"
        ? "/dashboard/mission-leader"
        : "/dashboard/sun-leader";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
      <div className="container mx-auto max-w-2xl px-4 h-14 flex items-center justify-between">
        <Link href={dashboardHref} className="flex items-center gap-2">
          <Image src="/logo.png" alt="로고" width={28} height={28} />
          <span className="font-bold text-base">순보고</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-sm opacity-90 hidden sm:block">
            {profile.name}{" "}
            <span className="opacity-70">({ROLE_LABEL[profile.role]})</span>
          </span>

          <nav className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link href={dashboardHref}>
                <LayoutDashboard className="w-4 h-4" />
              </Link>
            </Button>
            {profile.role === "sun_leader" && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href="/report/sun/new">
                  <FileText className="w-4 h-4" />
                </Link>
              </Button>
            )}
            {/* 알림 벨 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBellClick}
              className="relative text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
