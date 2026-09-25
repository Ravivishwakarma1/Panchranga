const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

const BOILERPLATE_PATTERNS = [
  /cookie/i,
  /subscribe/i,
  /privacy policy/i,
  /terms of service/i,
  /all rights reserved/i,
  /advertisement/i,
  /sign in to continue/i,
  /follow us on/i,
  /download the app/i,
  /copyright/i,
  /newsletter/i,
];

function unescapeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '');
}

/**
 * Extracts clean, substantive article text directly from a publisher URL.
 * Has a strict 3.5s timeout and gracefully returns null on errors or paywalls.
 */
export async function extractArticleText(url: string, timeoutMs = 3500): Promise<string | null> {
  if (!url || !url.startsWith('http')) return null;

  // Skip social discourse links that don't have standard articles
  if (url.includes('reddit.com') || url.includes('twitter.com') || url.includes('x.com') || url.includes('youtube.com')) {
    return null;
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('xhtml')) {
      return null;
    }

    const html = await res.text();
    if (!html || html.length < 500) return null;

    // 1. Strip non-content elements
    let clean = html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      .replace(/<form[\s\S]*?<\/form>/gi, '')
      .replace(/<svg[\s\S]*?<\/svg>/gi, '');

    // 2. Focus on <article> or <main> if available
    const articleMatch = clean.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    const mainMatch = clean.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    const contentBlock = articleMatch?.[1] || mainMatch?.[1] || clean;

    // 3. Extract substantive paragraphs
    const pMatches = contentBlock.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    const paragraphs: string[] = [];

    for (const p of pMatches) {
      const text = unescapeHtml(p.replace(/<[^>]*>?/gm, ''))
        .replace(/\s+/g, ' ')
        .trim();

      // Filter out short snippets or boilerplate
      if (text.length < 45) continue;
      if (BOILERPLATE_PATTERNS.some((pattern) => pattern.test(text))) continue;

      paragraphs.push(text);

      // Accumulate up to ~1,500 characters of clean context
      const totalChars = paragraphs.reduce((sum, p) => sum + p.length, 0);
      if (totalChars >= 1500) break;
    }

    if (paragraphs.length === 0) return null;

    const fullText = paragraphs.join(' ').slice(0, 1800).trim();
    return fullText.length > 60 ? fullText : null;
  } catch {
    // Return null on timeout, abort, or network errors (graceful fallback)
    return null;
  }
}
