# Putting the new Proline website live

Everything here is free. Steps 1–4 put the site live; 5–9 switch on forms, the admin area and search. Allow about an hour in total, and do the steps in order.

**Status, 24 October 2026:** steps 1, 2, 3 and 5 are done. The site is live at https://www.prolineelectricalworks.com from the Cloudflare Pages project **proline-website**, the bare address redirects to www, and the forms write to your Sheet. Still to do: step 4 (check the settings), and steps 6–9.

The code is at **github.com/vineetsaini205-png/proline-website**. Every change pushed to the `main` branch rebuilds the live site automatically once step 1 is done.

---

## 1. Create a new Cloudflare Pages project linked to GitHub

Your current project "proline" was made with Direct Upload, and Cloudflare does not let a Direct Upload project switch to GitHub. So make a new one:

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pick GitHub, allow access to the repository **proline-website**, select it.
3. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `22`
4. **Save and Deploy**. After 1–2 minutes you get an address like `proline-website.pages.dev`. Open it and click around.

**Quick option, without GitHub.** Open your existing project **proline** → **Create deployment** and upload the contents of the `proline-website-dist.zip` file you received. This puts the new site live at once. It does not rebuild by itself, though, so admin edits won't appear until you switch to the GitHub project above.

## 2. Check the new site

On the `.pages.dev` address, check on your phone and computer:

- WhatsApp and Call buttons open WhatsApp and the dialler with +91 73038 87364.
- A form opens WhatsApp with the details filled in. This is normal until step 5.
- The calculators show results.

The `.pages.dev` copy is hidden from Google (see `public/_headers`), so it never competes with your domain.

## 3. Move your domain to the new project

Done on 24 October. What was set up, in case you need to check or undo it:

1. Old project **proline** → **Custom domains**: `www.prolineelectricalworks.com` removed.
2. New project **proline-website** → **Custom domains**: `www.prolineelectricalworks.com` (the main address) and `prolineelectricalworks.com`. Cloudflare added the two DNS records itself (CNAME to `proline-website.pages.dev`). The Zoho mail records (MX, SPF, DKIM, DMARC) were not changed.
3. **Rules → Redirect Rules → "Bare domain to www"**: any address on `prolineelectricalworks.com` goes to the same page on `https://www.prolineelectricalworks.com` (301, keeps the page path and anything after `?`). So Google sees one address.

The old project **proline** now serves only `proline-3da.pages.dev`. Keep it for a week in case you need to switch back, then delete it yourself: Workers & Pages → proline → Settings → Delete project.

## 4. Cloudflare settings to keep or check

- **Security → Bots → Block AI bots**: keep ON (you chose to block AI assistants). `robots.txt` also asks them to stay away. Google and Bing are not affected.
- **SSL/TLS**: Full; **Always Use HTTPS**: ON.
- **Web Analytics** (free, no cookies): Workers & Pages → your project → Metrics → enable Web Analytics.

## 5. Send form enquiries to a Google Sheet and your email

The enquiries Sheet already exists (you created it on 24 October).

1. Open the Sheet, then **Extensions → Apps Script**. Delete what is there, paste everything from `docs/apps-script.gs`, and click **Save**.
2. In the function list at the top, choose **setup** and click **Run**. Allow the permissions it asks for: the Sheet and sending email. If Google says "unverified app", click Advanced → Go to project; it is your own script. This adds the header row.
3. **Deploy → New deployment →** gear icon → **Web app**. Set *Execute as*: **Me** and *Who has access*: **Anyone**. Click **Deploy**.
4. Copy the **Web app URL** (it ends in `/exec`) and send it to us, or paste it yourself: `/admin` → **Site settings → Contact details** → *Form web app address* → **Save** (or `formEndpoint` in `src/data/site.json`).
5. After the rebuild (about 2 minutes), send a test enquiry. A row should appear in the Sheet and an email should arrive at Sales@prolineelectricalworks.com. Download the Sheet as Excel any time: File → Download → .xlsx.

If you change the script later: **Deploy → Manage deployments → Edit → Version: New version**, so the same URL keeps working.

Later, to stop spam bots: add Cloudflare Turnstile (free). The forms already have a hidden spam trap.

## 6. Admin area: edit blogs, FAQs, prices of fuel and tariffs, screenshots

The admin is at **www.prolineelectricalworks.com/admin**. It saves straight to GitHub, and the site rebuilds in about 2 minutes.

Each person needs a free GitHub account with access to the repository: GitHub → repository → Settings → Collaborators → Add people.

**Quick way to sign in (no setup), about 5 minutes:**

1. Sign in to GitHub as **vineetsaini205-png** → your photo (top right) → **Settings** → **Developer settings** (bottom of the left menu) → **Personal access tokens → Fine-grained tokens → Generate new token**.
2. Name: `Proline admin`. Expiration: 1 year. Repository access: **Only select repositories → proline-website**. Permissions → Repository permissions → **Contents: Read and write**. Click **Generate token** and copy it (it is shown once; keep it private).
3. Open **www.prolineelectricalworks.com/admin** → **Sign In Using Access Token** → paste → Sign in. The browser remembers you.

To change a picture: open the page or blog post → **Or upload your own photo** → choose the file. It is turned into a fast WebP image (max 1600 px) before it is saved. Fill in "What the uploaded photo shows".

**Smoother way, a "Sign in with GitHub" button (one-time setup, 15 minutes):**

1. Deploy the free sign-in helper: https://github.com/sveltia/sveltia-cms-auth. Click its "Deploy to Cloudflare Workers" button.
2. GitHub → Settings → Developer settings → **OAuth Apps → New**:
   - Homepage: `https://www.prolineelectricalworks.com`
   - Callback: `https://YOUR-WORKER.workers.dev/callback`
3. In the worker's settings, add these variables:
   - `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`, from the OAuth app;
   - `ALLOWED_DOMAINS` = `www.prolineelectricalworks.com`.
4. In `public/admin/config.yml`, un-comment `base_url:` and set it to the worker address.

What you can edit there:

- blog posts and Hindi posts;
- the FAQ page;
- service, charger, battery and audience pages;
- contact details and the offer strip;
- trust numbers, clients and states;
- fuel prices and state EV tariffs for the calculators;
- the CMS screenshots.

New page layouts and new tools still need a developer.

## 7. Google Search Console and Bing Webmaster Tools

1. https://search.google.com/search-console → **Add property** → **Domain** → `prolineelectricalworks.com`. Verify it with the DNS TXT record (Cloudflare → DNS → Add record).
2. **Sitemaps** → submit `https://www.prolineelectricalworks.com/sitemap-index.xml`.
3. **URL inspection** → request indexing for these pages:
   - the home page;
   - `/services/ev-charger-installation/`;
   - `/tools/ev-charging-station-earnings-calculator/`;
   - `/tools/ev-vs-petrol-savings-calculator/`;
   - `/cms/`.
4. https://www.bing.com/webmasters → **Import from Google Search Console**. This is one click.

New pages usually take days to weeks to be indexed, and longer to rank.

## 8. Google Business Profile (for "Proline" and "near me" searches)

1. https://business.google.com → add **Proline Electrical Works**.
2. Category: *Electrician*, plus the closest EV-charging category Google offers.
3. Choose **service-area business**. Google asks for your address to verify it; then **hide the address**, so customers see only Delhi.
4. Service area: Delhi NCR. Google keeps it within about 2 hours of your base.
5. Hours: when calls are answered. Phone: +91 73038 87364. Website: https://www.prolineelectricalworks.com.
6. Add photos of your real installs, post finished jobs weekly, and ask happy customers for a Google review.

Use exactly the same name, phone and "Delhi" on IndiaMART, JustDial and LinkedIn. Add those profile links in the admin (Site settings → Social and directory profiles) so Google connects them to the site.

## 9. Things only you can send, to finish the site

These go in when they arrive. Until then the site works without them.

- **Logo:** your Charge-O logo file (SVG or PNG), to replace the placeholder bolt.
- **Photos:** of your own installs, to replace the stock photos over time.
- **CMS screenshots:** real ones from the demo console (5 desktop, 6 phone), and a public PDF of the CMS deck without the commercial slide.
- **Brands:** which charger brands you sell or work with. Only then do brand names appear on charger pages.
- **Open answers:**
  - Which Tata company did you install for?
  - Do you offer AMC?
  - Do you offer electricity-connection (DISCOM/CEIG) approvals?
  - Which days are calls answered? This goes into Google's opening hours.
- **Optional:**
  - registrations (GST, Udyam, electrical contractor licence);
  - client quotes, with permission;
  - project stories (city, charger, days taken).
- **Legal pages:** the privacy policy and terms are a sensible start. Have them checked by your CA or lawyer.

## Changing the site later

Small edits: use the admin area.

Bigger changes: start a new Claude session and attach this repository. The repository's `CLAUDE.md` and `PROGRESS.md` tell it the rules, what is done and where everything lives.
