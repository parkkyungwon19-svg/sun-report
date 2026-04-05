"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PastorMessageDeleteButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("이 메시지를 삭제하시겠습니까?")) return;
    setLoading(true);
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-40 flex-shrink-0"
      aria-label="메시지 삭제"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
