# Hinsdale House

Production website for Hinsdale House, furnished one-bedroom stays at 122 Hinsdale Avenue in Fayetteville, North Carolina.

Live site: https://hinsdalehousenc.com

## Production source
All files served to visitors live under `public/`. Do not create duplicate site files at the repository root.

- `public/index.html` — homepage and inquiry form
- `public/styles.css` — primary visual design
- `public/script.js` — inquiry form, suite preselection, and analytics events
- `public/{suite}/index.html` — individual suite landing pages
- `public/suite.css` — suite-page styling
- `public/privacy/` — privacy notice
- `public/404.html` — not-found page
- `public/robots.txt` and `public/sitemap.xml` — search-engine discovery

## Deployment
Cloudflare Workers static assets deploy from `public/` using `wrangler.jsonc`. The GitHub `main` branch is the production source.

## Forms
Stay inquiries are submitted through FormSubmit using its anonymized endpoint. Do not place the destination Gmail address in public source code.

## Analytics
Google Analytics 4 measurement ID: `G-PCRNY0FLSS`. Successful inquiry submissions emit the recommended `generate_lead` event. Suite availability CTA clicks emit `suite_interest`.

## Photography
See `PHOTOGRAPHY.md` for the planned hospitality photography shot list and delivery requirements.
