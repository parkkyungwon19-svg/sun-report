// 목양 알림 키워드 사전

export const URGENT_KEYWORDS = {
  건강: ["수술", "입원", "응급", "암", "중환자", "사고", "골절", "투병"],
  가정: ["사망", "별세", "소천", "장례", "이혼", "가출"],
  경제: ["실직", "파산", "폐업", "퇴직"],
  신앙: ["방황", "교회 떠나", "이단", "시험"],
} as const;

export const JOY_KEYWORDS = [
  "출산", "임신", "결혼", "약혼", "취업", "합격", "졸업",
  "승진", "이사", "정착", "회복", "감사",
];

export type UrgentCategory = keyof typeof URGENT_KEYWORDS;

/**
 * 텍스트에서 긴급 키워드 감지
 * @returns 감지된 카테고리와 키워드 목록, 없으면 null
 */
export function detectUrgentKeyword(
  text: string
): { category: UrgentCategory; keyword: string } | null {
  for (const [category, keywords] of Object.entries(URGENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return { category: category as UrgentCategory, keyword };
      }
    }
  }
  return null;
}

/**
 * 텍스트에서 기쁜 소식 키워드 감지
 */
export function detectJoyKeyword(text: string): string | null {
  for (const keyword of JOY_KEYWORDS) {
    if (text.includes(keyword)) return keyword;
  }
  return null;
}
