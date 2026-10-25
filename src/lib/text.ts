// Small text helpers shared by components and pages.

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

/** Escape, then allow [text](url) links and **bold** only. Used for FAQ answers and short fields. */
export function inlineMd(s: string): string {
  let out = escapeHtml(s.trim());
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) => {
    const external = /^https?:\/\//.test(url) && !url.includes('prolineelectricalworks.com');
    return `<a href="${url}"${external ? ' rel="noopener" target="_blank"' : ''}>${text}</a>`;
  });
  return out;
}

/** Splits a short Markdown text into its first sentence and the rest (heroes show only the first;
 *  the rest goes into the page body, word for word). A sentence ends at . ! or ? followed by a space
 *  and a capital, quote or bracket, outside [link](url) and (brackets). */
export function splitFirstSentence(s: string): [string, string] {
  const t = s.trim();
  let depth = 0;
  for (let i = 0; i < t.length - 2; i++) {
    const c = t[i];
    if (c === '[' || c === '(') depth++;
    else if (c === ']' || c === ')') depth = Math.max(0, depth - 1);
    else if (depth === 0 && (c === '.' || c === '!' || c === '?') && /\s/.test(t[i + 1])) {
      const rest = t.slice(i + 1).trimStart();
      if (/^[A-Z“"(\[]/.test(rest)) return [t.slice(0, i + 1), rest];
    }
  }
  return [t, ''];
}

/** Plain text (for meta tags and schema): drops the Markdown link and bold syntax. */
export function plainText(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\s+/g, ' ').trim();
}

/** Indian number format: 125000 → 1,25,000 */
export function inr(n: number, digits = 0): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

/** wa.me link with a prefilled message. */
export function waLink(number: string, text?: string): string {
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
