"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  label?: string;
  apiUrl: string;
  method?: "DELETE";
  body?: Record<string, unknown>;
  confirmMessage?: string;
  onSuccess?: () => void;
  variant?: "ghost" | "outline" | "destructive";
  size?: "sm" | "icon";
}

export default function DeleteReportButton({
  label,
  apiUrl,
  body,
  confirmMessage = "정말 삭제하시겠습니까?",
  onSuccess,
  variant = "ghost",
  size = "sm",
}: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(confirmMessage)) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl, {
        method: "DELETE",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "삭제 실패");
        return;
      }
      toast.success("삭제되었습니다.");
      onSuccess?.();
      router.refresh();
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDelete}
      disabled={loading}
      className="text-red-500 hover:text-red-600 hover:bg-red-50"
    >
      <Trash2 className="w-4 h-4" />
      {label && <span className="ml-1">{label}</span>}
    </Button>
  );
}
