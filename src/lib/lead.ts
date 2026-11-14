// Shared by the enquiry forms (src/scripts/forms.ts) and the opportunity checker's phone-or-email step.
export const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const cleanPhone = (v: string) => v.replace(/[\s\-()]/g, '').replace(/^(\+91|0091|91(?=\d{10}$)|0(?=\d{10}$))/, '');
export const validPhone = (v: string) => /^[6-9]\d{9}$/.test(cleanPhone(v));
// Enquiry reference, e.g. PEW-261115-K7QX (shown to the visitor, and in the Details column of the Sheet).
export const newRef = () => {
  const d = new Date();
  const p2 = (n: number) => String(n).padStart(2, '0');
  const rnd = Array.from(crypto.getRandomValues(new Uint8Array(4))).map((b) => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[b % 31]).join('');
  return `PEW-${String(d.getFullYear()).slice(2)}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${rnd}`;
};
// POST to the Apps Script web app; true only when it answers {ok: true}, so the row is known to be saved.
export async function sendLead(endpoint: string, data: Record<string, string>): Promise<boolean> {
  try {
    const res = await fetch(endpoint, { method: 'POST', body: new URLSearchParams(data) });
    const out = await res.json().catch(() => null);
    return res.ok && !!out && out.ok === true;
  } catch { return false; }
}
