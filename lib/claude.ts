import Anthropic from "@anthropic-ai/sdk";

// Claude API 클라이언트 싱글턴
let _client: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return _client;
}

export const CLAUDE_MODEL = "claude-sonnet-4-5-20250514";

/**
 * 목회 브리핑 생성
 */
export async function generateBriefingText(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const client = getClaudeClient();

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Claude 응답이 텍스트가 아닙니다");
  return block.text;
}

/**
 * 기쁜 소식 추출 (JSON 응답)
 */
export async function extractJoyNews(
  systemPrompt: string,
  userPrompt: string
): Promise<{ joy_items: Array<{ member_name: string; category: string; summary: string }> }> {
  const client = getClaudeClient();

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") return { joy_items: [] };

  try {
    return JSON.parse(block.text);
  } catch {
    return { joy_items: [] };
  }
}

/**
 * 특별 관심 교인 선정 (JSON 응답)
 */
export async function selectCareMembers(
  systemPrompt: string,
  userPrompt: string
): Promise<{
  care_members: Array<{
    member_name: string;
    priority: number;
    reason: string;
    suggested_action: string;
    last_news_summary: string;
  }>;
}> {
  const client = getClaudeClient();

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 800,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") return { care_members: [] };

  try {
    return JSON.parse(block.text);
  } catch {
    return { care_members: [] };
  }
}
