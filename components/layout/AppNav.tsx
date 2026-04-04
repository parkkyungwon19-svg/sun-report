"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Church, LogOut, LayoutDashboard, FileText } from "lucide-react";
import type { Profile } from "@/types/database";

const ROLE_LABEL: Record<string, string> = {
  sun_leader: "순장",
  mission_leader: "선교회장",
  pastor: "담임목사",
};

export default function AppNav({ profile }: { profile: Profile }) {
  const router = useRouter();

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
          <Church className="w-5 h-5" />
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
