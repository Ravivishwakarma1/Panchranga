import { TopicHub } from './types';

export const MANDATORY_DISCLAIMER =
  'This summary is AI-generated from public headlines and may not capture full context. Read the original sources.';

const SENSITIVE_KEYWORDS = [
  'communal violence',
  'riot',
  'riots',
  'clash',
  'clashes',
  'election result',
  'election results',
  'court order',
  'sub-judice',
  'ongoing trial',
  'hate speech',
  'mob violence',
  'curfew',
];

export interface SummaryResult {
  summary: string | null;
  isFlagged: boolean;
  flagReason?: string;
}

/**
 * Checks if a Topic Hub contains sensitive high-stakes topics that require bypassing AI summarization (Sources-Only Mode).
 */
export function checkSensitiveBypass(hub: TopicHub): boolean {
  const fullText = `${hub.title} ${(hub.items || [])
    .map((i) => `${i.title} ${i.raw_summary || ''}`)
    .join(' ')}`.toLowerCase();

  return SENSITIVE_KEYWORDS.some((keyword) => fullText.includes(keyword));
}

/**
 * Clean headline helper: strips leading/trailing quotes and source labels.
 */
export function cleanHeadline(title: string): string {
  if (!title) return '';
  let cleaned = title.replace(/^["'“‘]+|["'”’]+$/g, '').trim();
  cleaned = cleaned.replace(/\s*\|\s*.*$/, '');
  cleaned = cleaned.replace(/^Mainstream media coverage highlights\s*/i, '');
  cleaned = cleaned.replace(/\s*as reported by.*$/i, '');
  return cleaned;
}

/**
 * Generates a neutral, guardrailed 1-sentence summary describing what happened in plain neutral English (max 18 words).
 */
export async function generateNeutralSummary(hub: TopicHub): Promise<SummaryResult> {
  if (checkSensitiveBypass(hub)) {
    return {
      summary: null,
      isFlagged: true,
      flagReason:
        'AI Summary bypassed for high-stakes sensitive topic. Displaying verified source articles only.',
    };
  }

  const items = hub.items || [];
  if (items.length === 0) {
    return { summary: null, isFlagged: false };
  }

  const headlines = items.map((i) => `- ${cleanHeadline(i.title)}`);

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (apiKey) {
    try {
      const prompt = `You are a neutral Indian news editor.
Read these headlines about the same event and write ONE clear sentence (max 18 words) describing what happened.

Rules:
- Plain English only
- No source names or labels  
- No quotes
- No "as reported by"
- State the fact, not the coverage
- If event is in India, mention state/city

Headlines:
${headlines.join('\n')}

One sentence only:`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 50, temperature: 0.2 },
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          const cleanText = text
            .replace(/^["'“‘]+|["'”’]+$/g, '')
            .replace(/^Mainstream media coverage highlights\s*/i, '')
            .replace(/\s*as reported by.*$/i, '');
          return { summary: cleanText, isFlagged: false };
        }
      }
    } catch (e) {
      console.warn('⚠️ Gemini API summary call failed, using rule-based neutral synthesizer.', e);
    }
  }

  // Fallback: clean single sentence without quotes or "as reported by"
  const primaryTitle = cleanHeadline(hub.title || items[0]?.title || '');
  return {
    summary: primaryTitle,
    isFlagged: false,
  };
}
