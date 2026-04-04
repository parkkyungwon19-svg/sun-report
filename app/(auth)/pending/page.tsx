"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Church, Clock, LogOut } from "lucide-react";

export default function PendingPage() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <Church className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary">순보고</h1>
          <p className="text-sm text-muted-foreground mt-1">해운대순복음교회</p>
        </div>

        <Card className="shadow-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100">
              <Clock className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold">승인 대기 중</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                회원가입 신청이 완료되었습니다.<br />
                담임목사님의 승인 후 이용하실 수 있습니다.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
