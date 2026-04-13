/**
 * 목회 브리핑 사용자 프롬프트 생성
 */
export function buildBriefingUserPrompt(
  year: number,
  month: number,
  week: number,
  rawStatsJson: string
): string {
  return `아래는 ${year}년 ${month}월 ${week}주차 순보고 집계 데이터입니다.

[집계 데이터]
${rawStatsJson}

위 데이터를 분석하여 아래 형식으로 목회 브리핑을 작성해주세요.
각 섹션의 제목은 그대로 사용하고, 내용만 채워주세요.

---
## ${year}년 ${month}월 ${week}주차 목회 브리핑

**이번 주 한 줄 요약**
(교회 전체 분위기와 핵심 사안을 한 문장으로)

**출석 현황**
(전체 출석률, 전주 대비 증감, 특이한 선교회/순 언급)

**이번 주 특별히 품어야 할 교인**
(3~5명, 각자 이름·소속·사유·목사님께 드리는 건의 포함)

**기쁜 소식**
(해당 주 기쁜 일이 있는 교인들, 없으면 "이번 주 특별한 경사 소식은 없었습니다" 작성)

**중보기도 제목**
(건강, 가정, 경제, 신앙 영역별로 통합하여 기도문 형식으로)

**성경읽기 현황**
(전체 실천률, 특별히 잘하는 순과 격려가 필요한 순 언급)

**순장님들께 드리는 한마디**
(이번 주 데이터를 바탕으로 한 진심 어린 격려, 3~4문장)
---`;
}

/**
 * 기쁜 소식 추출 프롬프트
 */
export function buildJoyExtractorPrompt(newsListJson: string): string {
  return `아래 순보고 소식 목록에서 기쁜 소식(출산, 임신, 결혼, 약혼, 취업, 합격, 졸업,
승진, 이사/정착, 회복, 감사 제목)에 해당하는 항목만 추출해주세요.

소식 목록:
${newsListJson}

응답 형식 (JSON만):
{
  "joy_items": [
    {
      "member_name": "이름",
      "category": "출산|임신|결혼|취업|합격|졸업|승진|회복|감사",
      "summary": "한 줄 요약"
    }
  ]
}

기쁜 소식이 없으면: { "joy_items": [] }`;
}

/**
 * 특별 관심 교인 선정 프롬프트
 */
export function buildCareSelectorPrompt(careCandidatesJson: string): string {
  return `아래 데이터를 참고하여 이번 주 담임목사님이 특별히 품어야 할 교인 3~5명을
선정하고 이유를 설명해주세요.

선정 기준 (우선순위 순):
1. 입원·수술 등 건강 위기
2. 가족 사망·장례
3. 4주 이상 연속 결석
4. 심각한 경제적 어려움
5. 신앙적 어려움(방황, 시험 등)

데이터:
${careCandidatesJson}

응답 형식 (JSON만):
{
  "care_members": [
    {
      "member_name": "이름",
      "priority": 1,
      "reason": "선정 이유 (목사님께 드리는 설명)",
      "suggested_action": "전화|방문|카드|기도|대화",
      "last_news_summary": "마지막 소식 한 줄 요약"
    }
  ]
}`;
}
