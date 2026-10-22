# 12 · Design system, Urdu, RTL and motion

Source of truth: `reference/prototype/assets/style.css`, `v7.css`, `site.css` and the screens themselves.

## Tokens (port to `app/globals.css` `@theme`)
| Token | Value |
|---|---|
| navy | `#0b2a5b` (primary dark), `#1b4f9c` (primary), `#143c7a` |
| teal | `#14b8a6`, `#1fa6a0`, `#0f4c5c` |
| gold | `#e9b949`, `#c8963e`, light `#ffe7a3`, ink on gold `#2a1d05` |
| green / red / orange | `#1fa34a` / `#dc2626` / `#ea8a00` |
| background (light) | cream `#f8f4ea`-ish `--bg`, cards white, borders `--b` |
| radius | cards 18–24 px, buttons 12–14 px, pills 99 px |
| shadow | `0 12px 40px rgba(11,42,91,.06)`; hover `0 22px 50px rgba(11,42,91,.14)` |
| type | Plus Jakarta Sans 400–800 (Latin); Jameel Noori Nastaleeq (Urdu) |

Light and dark themes both exist in the prototype; ship both (user preference, system default).

## Urdu
- Self-host `jameel-noori.woff2` with `unicode-range: U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFF` so Latin
  text keeps Plus Jakarta Sans and Urdu automatically uses Nastaleeq — even inside mixed strings.
- Nastaleeq needs line-height ≥ 1.9; never clip vertically (no fixed heights on Urdu text).
- `ur` locale sets `dir="rtl"` on `<html>`; use logical CSS (`ms-*`, `me-*`, `start/end`).
- Member UI shows bilingual labels (English + Urdu underneath) as in the prototype, regardless of locale; the
  locale switch changes body text, emails and PDFs.

## Member UX rules (non-technical owners)
- One primary action per screen in gold; big tiles with icons; "What to do now" card on every member page.
- Plain words: "Upload", "Send reminder", "Choose a member" — no "submit payload", "entity", etc.
- Errors say what to do next, in both languages.
- Touch targets ≥ 44 px (48 px in the app); works at 360 px width with **no horizontal scroll**.
- Phones (≤ 640 px) and the Android app use the compact mobile system in `15-mobile-app.md` §5: 4-column quick
  actions, 2-column stats, card lists instead of tables, bottom tabs, bottom sheets, sticky primary action.

## Public website hero (final preview spec)
- Image: `hero-bg.jpg`, full width, `background-size: cover`, positioned `center 58%`, ken-burns 28 s.
- Header: transparent over the hero, white text; after 40 px scroll → `rgba(8,26,60,.86)` + blur, height 84 → 68 px.
- Colour layer: `--ov: .80` (20 % transparent). Desktop gradient `rgba(8,30,72,.80)` (text side) → `rgba(9,74,64,.60)`
  (building side); ≤ 900 px uniform `.80`. A 3 px blur masks the left half so words printed inside the photo don't
  compete with the headline.
- Inner pages: same image, 56 vh, breadcrumb, Urdu subtitle; wave divider into the page background.
- Motion (respect reduced motion): fade-up hero text, particle field, shine on the gold word, marquee, counters,
  scroll reveal, card tilt + cursor glow, journey progress line, QR scan line, reading progress bar.
