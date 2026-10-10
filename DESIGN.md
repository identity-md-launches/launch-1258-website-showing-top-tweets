# The Pond design system

## Overview

The Pond is a reading dashboard for the Identity.md community. Its visual direction is dark green, with Pepes equipped with AI terminals. A locally bundled comic illustration supplies the personality; the working feed uses quiet surfaces, consistent edges, and clear controls. The desktop composition is a navigation sidebar, a main reading column, and a supporting context column. Mobile prioritizes navigation, the product description and action, then search and the feed.

The system is implemented in `src/styles.css`. Layout and reusable patterns are in `src/App.tsx`; icons are in `src/Icon.tsx`. This document describes the final source, not a proposed redesign.

## Colors

The source uses a green neutral ramp and a mint accent ramp in hex. Components consume semantic tokens defined at `src/styles.css:9`.

| Semantic token | Value | Role |
| --- | --- | --- |
| `--color-page` | `#0b1410` | Page canvas |
| `--color-sidebar` | `#0e1913` | Navigation canvas |
| `--color-surface` | `#111e17` | Cards, search, dialog |
| `--color-hover` | `#17271e` | Hover surfaces and topic badges |
| `--color-selected` | `#20382a` | Selected controls and toast |
| `--color-border` | `#2b4233` | Structural outlines and separators |
| `--color-control-border` | `#536e5c` | Control outlines and featured card |
| `--color-text` | `#eef2e9` | Headings and primary text |
| `--color-text-secondary` | `#c7d5c9` | Post body, secondary links |
| `--color-text-muted` | `#9bad9d` | Metadata and supporting copy |
| `--color-accent` | `#b2f1b7` | Primary action, active selection, saved icon |
| `--color-accent-hover` | `#c9f8c6` | Primary button hover |
| `--color-on-accent` | `#0b1410` | Text on filled mint action |
| `--color-focus` | `#e8dfa0` | 2px keyboard outline, 4px offset |
| `--color-warning` | `#f2ce91` | Persistent storage error text and outline |

The hero alone uses `#0a1913` and transparent fades to merge its illustration with the background. Four decorative monogram pairs are defined in `.avatar-mint`, `.avatar-sand`, `.avatar-forest`, and `.avatar-blue`; these are identity cues, not status colors. The theme is intentionally dark only. There is no unused light-theme or success/error palette.

Measured rendered pairs: card body/surface **11.29:1**, muted author handle/surface **7.25:1**, primary action **14.40:1**, selected filter **11.15:1**. Full measurements and the unmeasured image-background limitation are in `artifacts/interaction-results.json` and `artifacts/VALIDATION.md`.

## Typography

`Space Grotesk` is the interface/display face, with Arial and sans-serif fallbacks. Its local variable Latin WOFF2 supports weights 300–700; the UI uses 400, 500, and 600. Browser font loading was checked. Post paragraphs deliberately use Arial at 14px on desktop for a compact, familiar reading texture, expanding to 16px on mobile. No italic face is requested. Monospace is reserved for the decorative terminal line.

Exactly six size tokens are defined:

| Token | Default size | Uses |
| --- | --- | --- |
| `--text-caption` | 12px / `.75rem` | Dates, chips, counts, supporting captions |
| `--text-small` | 14px / `.875rem` | Navigation, buttons, desktop body |
| `--text-body` | 16px / `1rem` | Post headings, mobile inputs/body |
| `--text-title` | 20px / `1.25rem` | Feed and supporting prominent headings |
| `--text-heading` | 28px / `1.75rem` | Brand, mobile hero, dialog, statistics |
| `--text-display` | 48px / `3rem` | Wide-screen hero |

The hero uses 1.08 line height (1.15 on mobile) and −2.4px tracking (−.9px on mobile). Post headings use 1.4; desktop paragraphs use 1.7; mobile paragraphs use 1.65. Supporting paragraphs use 1.6. Headings balance wrapping; descriptions use `text-wrap: pretty`. Post text is capped at 70ch and can break long strings. Data values use tabular numbers. No headings use tracked small capitals and no meaningful content is truncated.

## Layout

The page max-width is 1600px. The base grid allocates 230px to navigation, with 36px main-column insets. The inner content grid is a flexible feed plus a 290px context column, separated by 28px. Space tokens cover 4, 8, 12, 16, 24, 32, and 48px (`--space-1` through `--space-7`). They are used in shared chrome; local component spacing also uses 10, 14, 18, 20, 22, 28, and 36px where needed for density.

| Breakpoint | Implemented behavior |
| --- | --- |
| ≥ 1440px | Main insets 48px; context 310px; gutter 32px; hero minimum 350px |
| ≤ 1190px | Sidebar 200px; main insets 24px; context 250px; tighter card insets |
| ≤ 1030px | Context moves below feed; hero title becomes 28px; decorative caption is hidden |
| 721–1030px | Navigation becomes an 80px icon rail; text names remain available to assistive technology |
| ≤ 720px | Sidebar becomes top navigation; no sticky mobile chrome; 20px main insets; one content column; 16px inputs and post body; 44px action targets |
| ≤ 380px | Insets become 16px; filters and card footers wrap; nonessential small caption and X glyph are omitted |

The main view uses normal document scrolling. The desktop sidebar is sticky. Text containers have natural height; grid children use `min-width: 0`. Mobile bottom spacing and toasts account for the safe area. Hash navigation keeps the site compatible with static hosting. The feed heading has a 24px scroll margin and receives focus on view changes.

Actual production rendering was tested at 320, 390, 720, 900, 1100, and 1440px without document overflow. The 390px hero action ends approximately 457px down the 844px first screen. Text enlargement to 200% was also tested at 900px. Browser-native zoom, localization, and physical devices were not tested.

## Elevation & Depth

Content uses tonal layers and 1px structural borders, with no card shadows. The editor’s pick has a stronger outline. The toast uses `0 8px 32px #0006`; the native modal uses `0 24px 80px #0008` and a `#030906d9` backdrop. Modal stacking uses the browser’s top layer; the toast is at z-index 3 and skip link at 10. The hero’s illustration sits inside an isolated clipping container, with a fade behind the text.

## Shapes

Shared radii are 6px (`--radius-small`, compact controls), 8px (`--radius-control`, inputs/buttons), and 12px (`--radius-card`, hero/cards/toast). The dialog is 16px. Monograms are circles, 40px in cards and 24px in the decorative stack. Badges have 4px corners. Focus is an explicit 2px perimeter with 4px offset; forced-colors mode uses system `Highlight`.

## Components

| Pattern / source | Reuse and behavior |
| --- | --- |
| `PostCard`, `src/App.tsx:19` | A real post with an editorial title/summary; `post`, `saved`, `onSave`, `onCopy` props. Optional featured header. Missing counts are omitted. Read link is native, save is a pressed-state button. |
| `Avatar`, `src/App.tsx:15` | Local initials with four decorative color variants; optional `small`. Hidden from assistive technology because the author name is adjacent. |
| `Icon`, `src/Icon.tsx` | `name`, optional `size` and `style`; one SVG set, currentColor, 1.6px strokes. Decorative SVGs are hidden from assistive technology. |
| `.button`, `.button-primary` | Mint filled action, minimum 44px. Prefer one primary action in each task area; other actions are neutral. |
| `.nav-item` | Native hash links with `aria-current`; active border plus color. Mobile navigation uses an underline, not color alone. |
| `.search-field`, `.filter-chip`, `.sort-control` | Persistent visible search label, native search input/select, topic button group with pressed state. Changes are immediate; the stable result count announces updates. |
| `.icon-button`, `.is-saved` | 40px desktop and 44px mobile; every action has a specific accessible name. Saved state fills the bookmark and changes its pressed state. |
| `.empty-state` | Explains no saved posts or no matching results and supplies a working recovery action. |
| `.storage-warning`, `.toast-visible` | Storage errors persist next to the feed. Informational/copy messages are explicitly dismissible; a separate stable polite live region announces them. |
| `.about-dialog` | Native modal opened with `showModal()`. Background is inert, focus starts on close, boundary Tab/Shift+Tab wrap, Escape closes, and focus returns. Native details exposes the source list. |
| `.load-more` | Reveals four more posts, using the real remaining count. End-of-feed text replaces it when complete. |

There is no network loading state because the collection ships locally. Blocked clipboard and storage paths have actionable messages and were exercised. Motion is limited to named 150ms state transitions and a .96 press scale inside `prefers-reduced-motion: no-preference`; there is no entrance sequence, blinking cursor, or autoplay.

## Do’s and Don’ts

- Reuse the semantic colors, the six type sizes, the local icons, and the shared button/card patterns.
- Keep links as links, state changes as buttons, and visible labels next to controls.
- Preserve source disclosure and distinguish a summary from a quotation. Never decorate a static collection with a false “live” indicator.
- Keep runtime assets local and use Vite’s relative base. New in-app views should use hashes unless they are exported as standalone pages.
- Keep text selectable, paragraphs readable, and the primary action near the top on mobile. Avoid adding a larger marketing section above the feed.
- To add a view, reuse `.main-content`, `.section-heading`, and the controls/cards above; assign one h1 for the page, then test 320/390/900/1440px, keyboard focus, empty states, and any new interactions. Update this document only to reflect actual implemented changes.
