import OpenAI from 'openai';

export interface Finding {
  line?: number;
  wcagCriterion: string;
  level: 'A' | 'AA' | 'AAA';
  message: string;
}

export interface AccessibilityReport {
  summary: string;
  findings: Finding[];
}

const SYSTEM_PROMPT = `You are an accessibility specialist with deep knowledge of WCAG 2.2.
Inspect the provided code for accessibility issues.
Focus on issues relevant to the changed code and the surrounding context.
Respond with structured JSON only:
{
  "summary": "string",
  "findings": [
    {
      "line": number,
      "wcagCriterion": "string (e.g., '1.1.1 Non-text Content')",
      "level": "A | AA | AAA",
      "message": "string"
    }
  ]
}
Omit "line" if the issue cannot be mapped to a specific line.`;

export async function analyzeAccessibility(
  context: string,
): Promise<AccessibilityReport> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }

  const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
  });

  const response = await client.chat.completions.create({
    model: 'openrouter/free',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `## Review context
${context}
Respond with valid JSON only. No markdown, no explanation.`,
      },
    ],
  });

  const text = response.choices[0].message.content ?? '';
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned) as AccessibilityReport;
}
