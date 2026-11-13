// Enquiry forms: validate, then POST to the Google Apps Script web app (Sheet + email to Sales@).
// Strategy plan (13 Nov 2026), section 10: every enquiry gets a reference; success is shown only when the
// web app answers {ok: true}; otherwise the visitor is told it was not saved and gets WhatsApp and Call,
// with the details ready. Extra fields (x_*) and the reference travel in the Details column.

const LABELS: Record<string, string> = {
  name: 'Name', phone: 'Phone', company: 'Company', city: 'City', state: 'State', need: 'Need',
  site_type: 'Site', sanctioned_load: 'Sanctioned load', chargers: 'Chargers', sites_per_month: 'Sites a month',
  states_types: 'States and chargers', charger_types: 'Chargers sold', website: 'Website', experience: 'Experience',
  skills: 'Skills', message: 'Message', publish_ok: 'OK to publish', extra: 'Details',
};
const TITLES: Record<string, string> = {
  quote: 'Website enquiry', survey: 'Site survey request', station: 'Charging station enquiry', demo: 'Proline CMS demo request',
  b2b: 'Partnership enquiry', brand: 'Brand partner enquiry', technician: 'Technician application', ask: 'Question for an expert',
};

const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const newRef = () => {
  const d = new Date();
  const p2 = (n: number) => String(n).padStart(2, '0');
  const rnd = Array.from(crypto.getRandomValues(new Uint8Array(4))).map((b) => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[b % 31]).join('');
  return `PEW-${String(d.getFullYear()).slice(2)}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${rnd}`;
};
const cleanPhone = (v: string) => v.replace(/[\s\-()]/g, '').replace(/^(\+91|0091|91(?=\d{10}$)|0(?=\d{10}$))/, '');
const validPhone = (v: string) => /^[6-9]\d{9}$/.test(cleanPhone(v));

function waText(form: HTMLFormElement, data: Record<string, string>): string {
  const lines = [`Hello Proline, ${(TITLES[data.form] ?? 'Website enquiry').toLowerCase()} from your website:`];
  for (const [k, label] of Object.entries(LABELS)) {
    if (data[k]) lines.push(`${label}: ${data[k]}`);
  }
  lines.push(`Page: ${location.origin}${location.pathname}`);
  return lines.join('\n');
}

function setInvalid(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, bad: boolean) {
  el.setAttribute('aria-invalid', bad ? 'true' : 'false');
  el.closest('.field')?.classList.toggle('invalid', bad);
}

function validate(form: HTMLFormElement): boolean {
  let firstBad: HTMLElement | null = null;
  form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[required]').forEach((el) => {
    let bad = !el.value.trim();
    if (!bad && el.name === 'phone') bad = el.dataset.contact === 'phone-or-email' ? !(validPhone(el.value) || validEmail(el.value)) : !validPhone(el.value);
    setInvalid(el, bad);
    if (bad && !firstBad) firstBad = el;
  });
  if (firstBad) (firstBad as HTMLElement).focus();
  return !firstBad;
}

function done(form: HTMLFormElement, mode: 'sent' | 'whatsapp', wa: string, name: string) {
  form.classList.add('is-done');
  const t = form.querySelector('[data-done-title]');
  const p = form.querySelector('[data-done-text]');
  const a = form.querySelector<HTMLAnchorElement>('[data-done-wa]');
  if (a) a.href = wa;
  if (mode === 'sent') {
    if (t) t.textContent = `Thank you${name ? ', ' + name.split(' ')[0] : ''}. We have your enquiry.`;
    if (p) p.textContent = 'We reply on WhatsApp or by phone. Calls are answered 10 am–7 pm; WhatsApp any time. Photos of your site help: you can send them on WhatsApp.';
  } else {
    if (t) t.textContent = 'We could not save your enquiry';
    if (p) p.textContent = 'Please send it on WhatsApp instead: your details are ready in the message. Or call us, 10 am–7 pm.';
  }
  (form.querySelector('.form-done') as HTMLElement | null)?.focus();
  // Count the lead in analytics tools that listen for this event.
  window.dispatchEvent(new CustomEvent('proline:lead', { detail: { form: form.dataset.variant, mode } }));
}

document.querySelectorAll<HTMLFormElement>('form[data-enquiry]').forEach((form) => {
  form.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.getAttribute('aria-invalid') === 'true') {
      const ok = el.name === 'phone' ? (validPhone(el.value) || (el.dataset.contact === 'phone-or-email' && validEmail(el.value))) : !!el.value.trim();
      if (ok) setInvalid(el, false);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = form.querySelector('.form-status');
    const hp = form.querySelector<HTMLInputElement>('[name="company_website"]');
    if (!validate(form)) {
      if (status) status.textContent = 'Please fill in the highlighted fields.';
      return;
    }
    if (status) status.textContent = '';
    const fd = new FormData(form);
    const data: Record<string, string> = {};
    const extras: string[] = [];
    fd.forEach((v, k) => {
      if (k === 'company_website') return;
      const val = String(v).trim();
      if (k.startsWith('x_')) {
        const label = form.querySelector<HTMLElement>(`[name="${k}"]`)?.dataset.label ?? k.slice(2);
        if (val) extras.push(`${label}: ${val}`);
      } else data[k] = val;
    });
    const ref = newRef();
    data.extra = [`Ref: ${ref}`, ...extras, data.extra].filter(Boolean).join(' · ');
    if (!validEmail(data.phone || '')) data.phone = cleanPhone(data.phone || '');
    data.page = location.pathname;
    data.time = new Date().toISOString();
    const wa = `https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(waText(form, data))}`;

    if (hp && hp.value) { done(form, 'sent', wa, ''); return; } // bot: show the inline note, send nothing

    const endpoint = form.dataset.endpoint;
    if (!endpoint) { done(form, 'whatsapp', wa, data.name); return; }
    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.textContent = 'Sending…'; }
    try {
      // A simple POST (no custom headers) gets the web app's JSON reply back, so we know the row was saved.
      const res = await fetch(endpoint, { method: 'POST', body: new URLSearchParams(data) });
      const out = await res.json().catch(() => null);
      if (!res.ok || !out || out.ok !== true) throw new Error('not saved');
      window.dispatchEvent(new CustomEvent('proline:lead', { detail: { form: form.dataset.variant, mode: 'sent' } }));
      location.href = `/thank-you/?ref=${encodeURIComponent(ref)}&t=${encodeURIComponent(form.dataset.variant || 'quote')}`;
    } catch {
      if (status) status.textContent = '';
      done(form, 'whatsapp', wa, data.name);
    } finally {
      if (btn) { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
    }
  });

  form.querySelector('[data-reset]')?.addEventListener('click', () => {
    form.reset();
    form.classList.remove('is-done');
    form.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
  });
});

// Tools can pre-fill a form: <a data-fill-form="#quote-form" data-extra="..."> or window.prolineFill(...)
(window as any).prolineFill = (selector: string, extra: string, need?: string) => {
  const form = document.querySelector<HTMLFormElement>(selector);
  if (!form) return;
  const ex = form.querySelector<HTMLInputElement>('[name="extra"]');
  if (ex) ex.value = extra;
  if (need) {
    const sel = form.querySelector<HTMLSelectElement>('[name="need"]');
    if (sel) sel.value = need;
  }
};
