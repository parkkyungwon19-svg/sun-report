import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import PastorMessageDeleteButton from "@/components/dashboard/PastorMessageDeleteButton";

export default async function PastorMessageCard({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("notifications")
    .select("id, title, body, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const unreadCount = messages?.filter((m) => !m.read).length ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">목사님 메시지</CardTitle>
          </div>
          {unreadCount > 0 && (
            <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5 font-medium">
              새 메시지 {unreadCount}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!messages || messages.length === 0 ? (
          <p className="text-sm text-muted-foreground px-6 pb-4">받은 메시지가 없습니다.</p>
        ) : (
          <ul className="divide-y">
            {messages.map((msg) => (
              <li key={msg.id} className={`px-6 py-3 ${!msg.read ? "bg-amber-50" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${!msg.read ? "text-primary" : "text-foreground"}`}>
                      {msg.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">
                      {msg.body}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {!msg.read && (
                      <span className="w-2 h-2 rounded-full bg-red-500 mt-1" />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <PastorMessageDeleteButton id={msg.id} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
