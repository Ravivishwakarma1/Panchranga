import { TopicHub } from './types';
import { extractArticleText } from './article-extractor';

export const MANDATORY_DISCLAIMER =
  'This summary is AI-generated from public headlines and may not capture full context. Read the original sources.';

const SENSITIVE_KEYWORDS = [
  'communal violence',
  'communal riot',
  'sectarian violence',
  'mob lynching',
  'mob violence',
  'hate speech',
  'sub-judice',
  'ongoing trial',
  'curfew imposed',
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
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  return cleaned;
}

/**
 * Clean article raw summary/description: strips HTML tags, entities, boilerplate
 */
export function cleanSummary(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.replace(/<[^>]*>?/gm, ' ');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  // Strip "read more", "continue reading", etc.
  cleaned = cleaned.replace(/(?:read more|continue reading|click here for more|full coverage)[\s\S]*$/i, '').trim();
  return cleaned;
}

/**
 * Generates a neutral, guardrailed 1-sentence summary describing what happened in plain neutral English (max 20 words).
 */
export async function generateNeutralSummary(hub: TopicHub): Promise<SummaryResult> {
  const items = hub.items || [];
  const primaryTitle = cleanHeadline(hub.title || items[0]?.title || '');

  // Extract best fallback from article description if available
  const rawDesc = items.find((i) => i.raw_summary || i.og_description);
  const bestSnippet = rawDesc ? cleanSummary(rawDesc.raw_summary || rawDesc.og_description || '') : '';
  const firstSentence = bestSnippet ? (bestSnippet.split(/(?<=[.?!])\s+/)[0] || bestSnippet).slice(0, 140) : '';
  const defaultFallback = firstSentence.length > 20 ? firstSentence : primaryTitle;

  if (checkSensitiveBypass(hub)) {
    return {
      summary: primaryTitle,
      isFlagged: true,
      flagReason:
        'AI Summary bypassed for high-stakes sensitive topic. Displaying verified headline only.',
    };
  }

  if (items.length === 0) {
    return { summary: defaultFallback, isFlagged: false };
  }

  // Build concise context for the LLM
  const headlines = items.slice(0, 5).map((i) => {
    const title = cleanHeadline(i.title);
    const snippet = i.raw_summary ? cleanSummary(i.raw_summary).slice(0, 100) : '';
    return snippet ? `- ${title} (Context: ${snippet})` : `- ${title}`;
  });

  // Extract real article text from primary source webpage
  let fullArticleText: string | null = null;
  if (items[0]?.url) {
    try {
      fullArticleText = await extractArticleText(items[0].url, 3000);
    } catch {}
  }
  const articleExcerpt = fullArticleText ? `\nKey Excerpt from Primary Report:\n${fullArticleText.slice(0, 1200)}\n` : '';

  const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const prompt = `You are a neutral news editor.
Write a concise, fact-rich 1-2 sentence neutral briefing (max 35 words) capturing the key event, concrete facts, numbers, and locations.

Rules:
- Plain English only
- No source names or media labels (no "according to", "as reported by", quotes)
- State facts and outcomes directly
- If event is in India, mention state/city if available

News reports:
${headlines.join('\n')}
${articleExcerpt}
Neutral briefing:`;

  // 1. Try Groq (Ultra-fast inference)
  if (groqKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b',
          messages: [
            {
              role: 'system',
              content: 'You are a neutral news editor. Write a concise, fact-rich 1-2 sentence neutral briefing (max 35 words) capturing the key event, concrete facts, numbers, and locations. Plain English only. No source names, no quotes.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 75,
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const text = json.choices?.[0]?.message?.content?.trim();
        if (text) {
          const cleanText = text
            .replace(/^["'“‘]+|["'”’]+$/g, '')
            .replace(/^Mainstream media coverage highlights\s*/i, '')
            .replace(/\s*as reported by.*$/i, '');
          return { summary: cleanText, isFlagged: false };
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        console.warn('⚠️ Groq API responded with error:', errJson?.error?.message || response.statusText);
      }
    } catch (e) {
      console.warn('⚠️ Groq API summary call failed, falling back...', e);
    }
  }

  // 2. Try Gemini
  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
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
  return {
    summary: defaultFallback,
    isFlagged: false,
  };
}
