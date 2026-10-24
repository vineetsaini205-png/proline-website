# prolineelectricalworks.com

Website of **Proline Electrical Works**: EV charger installation and commissioning across India, chargers of any brand, batteries, solar, and Proline CMS.

- **Live:** https://www.prolineelectricalworks.com (Cloudflare Pages, rebuilt from `main`)
- **Admin:** https://www.prolineelectricalworks.com/admin (Sveltia CMS: blog, FAQs, pages, prices of fuel, tariffs, screenshots)
- **Go-live steps:** [`docs/GO-LIVE.md`](docs/GO-LIVE.md)
- **What is done / not done, owner's rules, where things live:** [`PROGRESS.md`](PROGRESS.md)
- **How to write pages:** [`docs/content-brief.md`](docs/content-brief.md)

## Run it

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
node scripts/check-content.mjs   # owner's rules + SEO checks on Markdown pages
npm run check:links              # broken internal links (after a build)
npm run check:seo                # titles, descriptions, H1s, JSON-LD (after a build)
```

Built with Astro 5. Pages are Markdown in `src/content/`, templates in `src/layouts/`, calculators in `src/lib/` and `src/pages/tools/`.
