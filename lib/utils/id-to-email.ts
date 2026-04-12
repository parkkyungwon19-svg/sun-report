/**
 * 아이디 → Supabase auth 이메일 변환 (클라이언트 전용)
 * 영문/숫자/밑줄만 있으면 그대로, 한글 포함 시 base64url 인코딩
 */
export function idToEmail(id: string): string {
  const trimmed = id.trim().toLowerCase();
  if (/^[a-z0-9_]+$/.test(trimmed)) {
    return `${trimmed}@sunbogo.kr`;
  }
  // 한글/특수문자: URL인코딩 후 base64url
  const encoded = btoa(encodeURIComponent(trimmed))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${encoded}@sunbogo.kr`;
}

/**
 * 아이디 유효성 검사
 * - 한글 포함: 2자 이상
 * - 영문/숫자: 4자 이상, 영문·숫자·밑줄만 허용
 */
export function validateId(id: string): string | null {
  const trimmed = id.trim();
  if (!trimmed) return "아이디를 입력해주세요";
  const koreanCount = (trimmed.match(/[가-힣]/g) ?? []).length;
  if (koreanCount > 0) {
    if (trimmed.length < 2) return "한글 아이디는 2자 이상이어야 합니다";
    return null;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return "영문, 숫자, 밑줄(_)만 사용 가능합니다";
  }
  if (trimmed.length < 4) return "영문/숫자 아이디는 4자 이상이어야 합니다";
  return null;
}
