"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export function GenerateBriefingButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/briefing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        router.refresh();
      } else {
        alert("브리핑 생성 중 오류가 발생했습니다: " + (data.error ?? "알 수 없는 오류"));
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={loading}
      className="bg-[#1B3A6B] hover:bg-[#1B3A6B]/90 text-white"
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {loading ? "생성 중..." : "브리핑 생성"}
    </Button>
  );
}
