# The Pond

A dark green home for the Identity.md conversation, with a custom illustration of Pepes armed with AI. Built with React, TypeScript, and Vite. The complete, ready-to-publish static site is in **`dist/`**.

The feed contains **8 real, sourced posts from 5 accounts**, assembled on 10 October 2026. Cards are explicitly labeled editorial summaries. “Top picks” is a curated reading order, not a claim to rank all of X. The app explains the selection, exposes its sources, and links every card to the original post.

## Use the site

- Search post summaries, titles, author names, handles, or topics.
- Filter by Building, Ecosystem, or Community.
- Sort by editorial picks, original post date, or available like counts. Missing counts sort last.
- Save and unsave posts; bookmarks persist in this browser’s local storage.
- Copy an original post link or open the post on X.
- Open “About the feed” for source records and the curation method.

No account, wallet, API key, backend, or third-party request is needed to read the shipped collection. It remains usable when served without internet access; outbound X and ecosystem links naturally require a connection. This is a static edition and does not refresh from X.

## Install and develop

Use Node **22.12 or newer** and npm. The lockfile pins the dependencies.

```sh
npm ci
npm run dev
```

Open the URL Vite prints. Dependencies are intentionally not included in the submission. No environment file is needed.

## Rebuild and preview

```sh
npm run typecheck
npm run build
npm run preview
```

`npm run build` recreates `dist/`, including locally bundled artwork, the favicon, and the font. Vite uses `base: './'`. There are no root-relative runtime assets in the export. Routes are `#feed` and `#saved`, so static hosts need no application-route rewrite.

For the same subpath preview used in validation:

```sh
node scripts/preview-server.mjs 4173
```

Open `http://localhost:4173/preview/`. This server serves only `dist/` and stops on Ctrl+C or after 20 minutes. The timeout is just a local inspection-session bound; there is no runtime timer in the website.

## Publish

Upload **the contents of `dist/`**, keeping `index.html`, `favicon.svg`, and `assets/` together, to a static host, gateway subdirectory, or ENS/IPFS website. The publisher can serve the supplied files directly without rebuilding. Use HTTPS for clipboard support; a useful copy-error message is provided where clipboard access is blocked.

Keep `dist/` in the submission alongside the source and lockfile. It is deliberately not ignored. To deploy a revision, rebuild and replace the complete previous export so stale hashed assets are removed.

The HTML includes a title, description, favicon, `og:title`, `og:description`, local `og:image`, and a large-image Twitter card declaration. Before publishing to a known HTTPS host, set `publicUrl` in `site.config.json` to the actual public directory URL, including any deployment subpath, and rebuild. The Vite HTML transform writes an absolute `og:image` into the served `dist/index.html`; this does not depend on JavaScript. A trailing slash is optional. Non-HTTPS URLs, credentials, queries, and fragments are rejected. Script, style, font, favicon, and artwork URLs stay relative.

The supplied `publicUrl: null` is an explicit unconfigured setting, not a guessed host. It preserves the portable relative image path while the deployment URL is unknown. That value is not independently parseable as an Open Graph URL; social-platform unfurling remains unverified until the publisher configures and deploys the real URL. The original image remains bundled in `dist/assets/pond-social.jpg`.

## Update the collection

Edit `src/data.ts`. Preserve real original post IDs and author handles. Write your own clearly labeled summary and include the source URL. Use `null` for unavailable counts; never invent them. Adjust `EDITION_DATE` when publishing a new curated edition. Array order sets editorial rank; dates and like counts drive the alternative sort orders. Topic and author totals are derived automatically.

The source URLs are recorded alongside each post in [src/data.ts](src/data.ts) and exposed in “About the feed.” This revision preserves that accepted collection; it does not re-fetch or re-certify the third-party source snapshots. The monogram avatars are local UI graphics, not claimed to be the authors’ profile photographs.

## Validation performed

Final worker validation on 10 October 2026:

| Check | Actual result |
| --- | --- |
| Production Vite build | Passed, exit 0; complete export in `dist/` |
| TypeScript `tsc --noEmit` | Passed, exit 0 |
| Browser interaction validation | **30 passed, 0 failed** |
| Responsive overflow | None at 320, 390, 720, 900, 1100, and 1440 CSS pixels |
| Mobile first screen | At 390 × 844, brand, search, filters, first post title, full summary and Read on X are visible; reading-action bottom **816.8px** |
| Automated accessibility | Zero axe violations at 390px and 1440px; one non-actionable decorative-glyph contrast review item on desktop |
| Configurable social metadata | 10 production-build cases passed, including subpaths and invalid-setting rejection; final public URL is still unconfigured |
| Runtime console / resources | No runtime errors or failed local resources in the tested production export |
| Measured solid text contrast | Eight tested pairs passed 4.5:1; lowest measured pair 7.25:1 |

The supplied browser tool could not launch because its expected Chromium executable was missing. The bounded Playwright validator used the installed Chromium **154.0.8037.0** instead, served the final `dist/` under `/preview/`, and closed its preview/browser when finished. Actual screenshots were inspected at mobile, intermediate and desktop sizes. A WebKit launch was attempted but blocked by missing system libraries, so no WebKit/Safari result is claimed.

The previous validator checked only the hero jump link on the first screen. It now checks the first post title, full summary, and actual Read on X target at 390 × 844 with an empty hash and `scrollY = 0`. Regression checks cover @handles with case/whitespace/partial queries, combined topic/saved filters, and live resize across 720px while retaining the query and matching posts. Existing hash-navigation assertions now wait for the rendered view and scheduled focus; immediate assertions raced the browser event in the initial revision run (26 passed, 4 failed). After that harness correction the final run passed all 30 checks without changing the navigation implementation.

The machine’s repository restrictions were respected by installing dependencies in `/tmp/pond-revision`. Source and frontend configuration, including `site.config.json`, were copied there for typecheck and compilation. `npm ci --prefix /tmp/pond-revision --cache /tmp/pond-npm-cache --no-audit --no-fund` completed successfully. The final build wrote directly back to this repository’s `dist/`, and the validation script ran against that export from the repository working directory:

```sh
npm --prefix /tmp/pond-revision run typecheck
npm --prefix /tmp/pond-revision run build -- --outDir /absolute/path/to/repository/dist --emptyOutDir
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/ms-playwright/chromium-1246/chrome-linux64/chrome node /tmp/pond-revision/scripts/validate.mjs
node scripts/check-bundle.mjs
```

The paths above describe this worker’s isolated build, not a requirement for normal installation. With a normal local install, reproduce the checks with:

```sh
npx playwright install chromium
npm run typecheck
npm run build
npm run test:interactions
npm run check:bundle
```

`scripts/validate.mjs` starts and closes its own preview and browser. It covers combined search/filter behavior, sorting and missing counts, load more, bookmarks across reload, empty states, hash history, copy success/failure, outbound URL selection, keyboard paths, dialog focus, blocked/corrupt storage, reduced motion, forced colors, metadata, local assets, text enlargement, axe, and measured contrast.

The 10 metadata cases were separate production builds in `/tmp/pond-revision`, exporting to `/tmp/pond-metadata-export`, with localhost-only test URLs. Static HTML was checked directly; no test hostname is included in the delivered configuration or export. See [metadata results](artifacts/metadata-results.json).

See [the complete review](artifacts/VALIDATION.md), [machine-readable interaction results](artifacts/interaction-results.json), [mobile first screen](artifacts/mobile-first-screen.jpg), [desktop first screen](artifacts/desktop-first-screen.jpg), and [bundle accounting](artifacts/bundle-budget.json).

The four reviewer findings are answered individually in [.imd-responses.json](.imd-responses.json). Three are fixed. The request to hard-code an unknown final hosting URL is disputed; the reproducible metadata-format limitation is documented and has a publisher-settable build solution.

Limitations: no physical-device or screen-reader session; no Firefox/Safari pass; 200% text enlargement and 320px reflow were tested, not browser-native zoom. Hero image/translucent-background contrast was visually inspected but not measured per pixel. X navigation was tested by capturing the destination, not by claiming X remains publicly accessible. Counts are source snapshots, not live analytics. Bookmarks do not sync across tabs or devices. Automated accessibility checks do not establish full WCAG compliance.

## Submission budget and file layout

The submission limit is **8,388,608 bytes**. `scripts/check-bundle.mjs` conservatively totals the uncompressed deliverable files, verifies required files, checks relative HTML assets and stale JS/CSS output, and records the result in `artifacts/bundle-budget.json`. Raw file bytes leave room for Git packaging overhead. Git metadata is neither read nor modified by this check.

**Explicit ignore-file path budget: `.gitignore` ≤ 512 bytes.** It excludes dependency, cache, and browser scratch directories at every nesting level; it does not exclude source or `dist/`. No submodules, vendored package registry, dependency archives, or dependency directories are delivered. Protected paths and provided `.imd/` inputs were left untouched. No Git operations were performed because this assignment prohibits touching `.git/`; the source, lockfile, export, and documentation are ready for the contributor submission mechanism.

| Path | Purpose |
| --- | --- |
| `src/App.tsx` | Layout, cards, search/filter controls, saved state, sources dialog |
| `src/data.ts` | Sourced collection and pure filtering/sorting |
| `src/Icon.tsx` | Small consistent local SVG icon set |
| `src/styles.css` | Tokens, components, and responsive rules |
| `public/` | Required local runtime images, favicon, font, font license |
| `dist/` | Finished production export |
| `site.config.json` | Publisher-set public HTTPS directory for static share-image metadata |
| `scripts/` | Reproducible interaction, preview, and size checks |
| `artifacts/` | Actual screenshots, validation, provenance, attribution, and licenses |
| `DESIGN.md` | Final implemented design system |

Read [DESIGN.md](DESIGN.md) before extending the interface. The existing artwork and local font are preserved. Design-guide attribution is in [artifacts/ATTRIBUTION.md](artifacts/ATTRIBUTION.md); the bundled font license is in `public/assets/space-grotesk-OFL.txt`.
