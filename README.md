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

The HTML includes a title, description, favicon, `og:title`, `og:description`, local `og:image`, and a large-image Twitter card declaration. For maximum social-crawler compatibility, set the image metadata to the absolute URL of the shipped `assets/pond-social.jpg` when the final public hosting URL is known. The current relative metadata is portable between static hosting paths; actual social-platform unfurling has not been tested.

## Update the collection

Edit `src/data.ts`. Preserve real original post IDs and author handles. Write your own clearly labeled summary and include the source URL. Use `null` for unavailable counts; never invent them. Adjust `EDITION_DATE` when publishing a new curated edition. Array order sets editorial rank; dates and like counts drive the alternative sort orders. Topic and author totals are derived automatically.

Detailed provenance and known source limitations are in [artifacts/SOURCES.md](artifacts/SOURCES.md). The monogram avatars are local UI graphics, not claimed to be the authors’ profile photographs.

## Validation performed

Final worker validation on 10 October 2026:

| Check | Actual result |
| --- | --- |
| Production Vite build | Passed, exit 0; complete export in `dist/` |
| TypeScript `tsc --noEmit` | Passed, exit 0 |
| Browser interaction validation | **27 passed, 0 failed** |
| Responsive overflow | None at 320, 390, 720, 900, 1100, and 1440 CSS pixels |
| Mobile first screen | At 390 × 844, product description and primary action are visible; action bottom ≈ 457px |
| Automated accessibility | Zero axe violations at 390px and 1440px; one non-actionable decorative-glyph contrast review item on desktop |
| Runtime console / resources | No runtime errors or failed local resources in the tested production export |
| Measured solid text contrast | Eight tested pairs passed 4.5:1; lowest measured pair 7.25:1 |

The supplied browser tool was used for production navigation, rendered inspection, filtering, the about dialog, Escape, console messages, and resource requests. A bounded Playwright script additionally tested all primary interactions and the six widths, taking the supplied screenshots. The final static export was served under `/preview/`.

The machine’s repository restrictions were respected by installing dependencies in `/tmp/pond-build`. Source and frontend configuration were copied there for typecheck and compilation. The final build wrote directly back to this repository’s `dist/`, and the validation script ran against that export from the repository working directory:

```sh
npm --prefix /tmp/pond-build run typecheck
npm --prefix /tmp/pond-build run build -- --outDir /absolute/path/to/repository/dist --emptyOutDir
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/root/.cache/ms-playwright/chromium-1247/chrome-linux64/chrome node /tmp/pond-build/scripts/validate.mjs
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

See [the complete review](artifacts/VALIDATION.md), [machine-readable interaction results](artifacts/interaction-results.json), [mobile first screen](artifacts/mobile-first-screen.jpg), [desktop rendering](artifacts/viewport-1440.jpg), and [bundle accounting](artifacts/bundle-budget.json).

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
| `scripts/` | Reproducible interaction, preview, and size checks |
| `artifacts/` | Actual screenshots, validation, provenance, attribution, and licenses |
| `DESIGN.md` | Final implemented design system |

Read [DESIGN.md](DESIGN.md) before extending the interface. Artwork generation and the full prompt are recorded in [artifacts/ARTWORK.md](artifacts/ARTWORK.md); upstream notices are in [artifacts/ATTRIBUTION.md](artifacts/ATTRIBUTION.md).
