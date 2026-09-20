# Hinsdale House — Website Operations

Updated: 2026-09-20

## Production
- Canonical site: https://hinsdalehousenc.com/
- WWW: https://www.hinsdalehousenc.com/
- Hosting: Cloudflare Workers Static Assets
- Source of truth: `public/`
- Wrangler asset directory: `./public`
- Analytics: GA4 `G-PCRNY0FLSS`
- Inquiry delivery: FormSubmit token endpoint (never place the destination Gmail address in source)

## Normal release path
1. Commit changes to `main`.
2. GitHub Actions runs dependency audit, HTML validation, local accessibility checks, Lighthouse and link checks.
3. Cloudflare deploys the repository according to the connected deployment configuration.
4. Production smoke checks verify the public domain separately from checkout QA.
5. Do not describe a change as live merely because the commit or quality workflow succeeded; verify the public URL.

## Manual deployment
From the repository root:

```sh
npm install
npx wrangler deploy
```

## Quick production checks
```sh
curl -fsSIL https://hinsdalehousenc.com/
curl -fsS https://hinsdalehousenc.com/robots.txt
curl -fsS https://hinsdalehousenc.com/sitemap.xml
curl -fsS https://hinsdalehousenc.com/ | grep -F "Hinsdale House"
```

Check representative demand pages:
```sh
for path in \
  fort-bragg-furnished-housing \
  travel-nurse-housing-fayetteville-nc \
  corporate-housing-fayetteville-nc \
  arts-higher-education-housing \
  fayetteville-relocation-guide
do
  curl -fsS "https://hinsdalehousenc.com/$path/" | grep -F "Hinsdale House" >/dev/null || exit 1
done
```

## DNS and HTTPS
Basic resolution:
```sh
dig +short hinsdalehousenc.com
dig +short www.hinsdalehousenc.com
```

Certificate dates and subject:
```sh
echo | openssl s_client -servername hinsdalehousenc.com -connect hinsdalehousenc.com:443 2>/dev/null | openssl x509 -noout -subject -issuer -dates
```

HTTP should redirect to HTTPS:
```sh
curl -sSI http://hinsdalehousenc.com/ | head
```

## Security headers
Inspect:
```sh
curl -sSI https://hinsdalehousenc.com/
```

Review Cloudflare-delivered headers periodically. Relevant controls include HSTS, X-Content-Type-Options, Referrer-Policy and an appropriate Content-Security-Policy. Do not add a restrictive CSP without testing GA4, Google Fonts and FormSubmit.

## Inquiry form
The public form submits through FormSubmit. After material form changes, make a real test inquiry and verify:
- success status appears to the guest;
- the inquiry email arrives;
- arrival/departure and stay length are present;
- suite preference and stay type are present;
- UTM/landing-page context is preserved where applicable;
- GA4 `generate_lead` fires.

Never put the destination email address directly into public source.

## Analytics
GA4 measurement ID: `G-PCRNY0FLSS`.

Important events:
- `form_start`
- `generate_lead`
- `suite_interest`
- tracked outbound links

Use organization-specific UTM parameters for referral outreach, e.g.:
`?utm_source=cfrt&utm_medium=referral_outreach&utm_campaign=professional_housing`

## SEO
After adding/removing an indexable page:
- add/remove it in `public/sitemap.xml`;
- update its `lastmod`;
- provide a unique title and meta description;
- set canonical URL;
- add useful internal links;
- avoid thin pages created only to capture keywords.

Search Console uses the domain property. Sitemap:
https://hinsdalehousenc.com/sitemap.xml

## Photos
Source photos go under `photos/`. The image-processing script is `scripts/process-images.mjs` and generates optimized assets under `public/images/`. Do not commit temporary edits or unapproved photography.

## QR codes
Generator: `scripts/generate-qr.mjs`.
Expected output: `public/qr/`.
QR destinations include home, each suite and the guest guide. Generate and visually test codes before printing.

## Incident / rollback checklist
If production is broken:
1. Confirm whether the problem is source, GitHub Actions, Cloudflare deployment, DNS, TLS or a third-party dependency.
2. Check the most recent GitHub Actions run and exact failing step.
3. Compare the current commit with the last known-good commit.
4. Fix forward when small and obvious; otherwise revert to a known-good revision.
5. Re-run quality checks.
6. Verify the public domain after deployment.

## Third-party dependencies
The site depends in part on Google Analytics, Google Fonts, FormSubmit and external links. A third-party outage should not make core informational pages unusable.

## Safety
Never commit API secrets, Cloudflare credentials, private email credentials or guest information. `.env*`, `.dev.vars`, `.wrangler/` and `node_modules/` are ignored.
