// NHN Cloud 알림톡 클라이언트

export const TEMPLATE_CODES = {
  KEYWORD_URGENT:  "PASTORAL_URGENT_01",
  ABSENCE_2W:      "PASTORAL_ABSENCE_2W",
  ABSENCE_4W:      "PASTORAL_ABSENCE_4W",
  ABSENCE_8W:      "PASTORAL_ABSENCE_8W",
  WEEKLY_BRIEFING: "PASTORAL_BRIEFING_01",
  JOY_NEWS:        "PASTORAL_JOY_01",
} as const;

export type TemplateCode = (typeof TEMPLATE_CODES)[keyof typeof TEMPLATE_CODES];

interface AlimtalkMessage {
  recipientNo: string;
  templateCode: TemplateCode;
  templateParameter: Record<string, string>;
}

interface AlimtalkResponse {
  header: { resultCode: number; resultMessage: string; isSuccessful: boolean };
  sendResults?: Array<{ recipientSeq: number; resultCode: string; resultMessage: string }>;
}

/**
 * NHN Cloud 알림톡 발송
 */
export async function sendAlimtalk(message: AlimtalkMessage): Promise<boolean> {
  const appKey = process.env.NHN_APP_KEY;
  const secretKey = process.env.NHN_SECRET_KEY;
  const senderKey = process.env.NHN_SENDER_KEY;

  if (!appKey || !secretKey || !senderKey) {
    console.warn("알림톡 환경변수 미설정 — 발송 생략");
    return false;
  }

  try {
    const res = await fetch(
      `https://api-alimtalk.cloud.toast.com/alimtalk/v2.3/appkeys/${appKey}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "X-Secret-Key": secretKey,
        },
        body: JSON.stringify({
          senderKey,
          templateCode: message.templateCode,
          recipientList: [
            {
              recipientNo: message.recipientNo,
              templateParameter: message.templateParameter,
            },
          ],
        }),
      }
    );

    const data: AlimtalkResponse = await res.json();

    if (!data.header.isSuccessful) {
      console.error("알림톡 발송 실패:", data.header.resultMessage);
      return false;
    }
    return true;
  } catch (err) {
    console.error("알림톡 API 오류:", err);
    return false;
  }
}

/**
 * Quiet Hours 여부 확인 (KST 기준)
 */
export function isQuietHours(
  quietStart = 22,
  quietEnd = 7,
  bypass = false
): boolean {
  if (bypass) return false;
  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const hour = nowKST.getUTCHours();
  if (quietStart > quietEnd) {
    return hour >= quietStart || hour < quietEnd;
  }
  return hour >= quietStart && hour < quietEnd;
}

/**
 * 주차 라벨 생성 (중복 방지 키 생성용)
 * 예: "2026-W15"
 */
export function getWeekLabel(date: Date): string {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(
    ((date.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7
  );
  return `${year}-W${String(week).padStart(2, "0")}`;
}
