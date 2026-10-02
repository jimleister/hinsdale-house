# Professional photos, branding and local staycations

## Source libraries
- Approved photography: https://drive.google.com/drive/folders/1FVY8yb92r8H4h4vhkIwdftTEESP4W2S8
- Approved logo package: https://drive.google.com/file/d/1BZM2cEYnd6xx8R0vwnK6ol8qG6Mahv6d/view
- 57 source photographs: 12 per suite plus 9 exterior/laundry images.
- Suite 1 = Loblolly; Suite 2 = Hatteras; Suite 3 = Dogwood; Suite 4 = Magnolia.

## Photo workflow
Keep high-resolution originals in Drive. For processing, copy them to `photos/<suite>/<suite>-NN.jpg` or `photos/exterior/exterior-NN.jpg`, preserving the photographer’s sequence numbers. `photos/` is intentionally ignored by Git.

Run `npm install` and `npm run images`. The existing processor generates AVIF, WebP and progressive JPEG images at 480, 768, 1200 and 1600 pixels without enlarging originals. Smaller portrait originals generate only supported widths; gallery srcsets must list only files that exist. Existing nonempty outputs newer than their source are reused. Replacing a source regenerates older derivatives; remove a derivative first to force a rebuild. AVIF effort 2 keeps conversion practical for full photo libraries.

Every image has a descriptive caption/alt label. Galleries preserve portrait images; hero and card crops use landscape views. Home and suite social previews now use property photos. The supplied horizontal logos appear in headers and footers; the favicon uses the supplied H monogram. Colors follow the supplied green, brass, light brass and cream palette.

## Local staycations
The category is linked from the home navigation, guest categories and homepage feature. The dedicated page is `/staycation-fayetteville-nc/`. Its availability links use `/?stay_type=Local%20staycation#contact`, preselecting the new inquiry category. Existing inquiry delivery and analytics remain in place.

The page presents a weekend together, quiet reset and hometown outing. Rates, minimum stays and availability are confirmed through inquiries. There are no invented discounts, included tickets or additional package benefits.

## Release
Publish through the existing GitHub/Cloudflare path in OPERATIONS.md. Verify the production HTML and representative image/logo URLs before describing this change as live.

## Validation completed October 2, 2026
- Dependency audit: zero vulnerabilities.
- HTML validation and git whitespace checks passed.
- All 1,294 local resource/link references resolve.
- All 636 generated image derivatives decode successfully.
- Desktop/mobile checks passed on home, Dogwood and staycation pages: no broken images or horizontal overflow; mobile navigation and staycation inquiry preselection work.
- Pa11y WCAG2AA: all 18 sitemap pages passed with zero errors.
- Lighthouse: 33 runs across 11 pages; all configured assertions passed. Home and suite performance scores were 98–99, with 100 accessibility and SEO.
- Audit reports retained locally; public report upload was blocked.
- Production publishing remains pending authenticated GitHub access.
