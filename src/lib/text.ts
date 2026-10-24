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
