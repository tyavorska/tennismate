---
name: figma-to-code
description: Turn Figma frames into TennisMate code that matches the design to the pixel, in every theme and at every breakpoint, using CSS variables in rem. Use this skill whenever the user shares a figma.com link, asks to build, update or "implement the design" for a page or section, says the browser looks different from the design (spacing, fonts, colours, widths, header or body), asks for dark theme, themes or responsive layout from a design, or wants a pixel check against Figma, even if they never say "skill" or "pixel perfect".
---

# Figma to code

Build or update a page from Figma frames so the browser and the design agree: sizes, spacing, type, colours, in light and dark, and across the breakpoints the prototype defines. The project rules in `CLAUDE.md` (FSD layers, CSS Modules, rem and tokens only, no `as`/`any`, comments rule) always apply. Read it before writing code.

The work goes wrong in the same few places every time: guessing the source of truth, checking only one theme at one width, finding states and transitions only after the user complains, and eyeballing differences. This skill is ordered to remove those.

## Decisions already made with the user

- **Source of truth:** Figma for looks (colours, sizes, spacing, type). The prototype for behaviour (states, transitions, responsive rules, animation). Write every conflict in the final report instead of choosing silently.
- **Verification:** automatic node-by-node comparison against Figma at the frame width, tolerance 1px, each theme on its own. Screenshots are the second level, not the first.
- **Responsive:** breakpoints come from the prototype's `@media` rules. Figma usually has desktop frames only.
- **Themes:** Figma variables with Light and Dark modes map to semantic CSS variables in `globals.css`. No hard-coded hex in components.
- **Gaps in the design:** accessibility first (slightly darker text colour to keep 4.5:1), do not build dead buttons or links to pages that do not exist, do not copy Figma artifacts (spacer frames of 100px, fixed heights that only exist because of a hug-less frame). List each one in the report.

## 0. Brief

Ask only for what is missing from this list, and nothing else:

1. Figma file and **all** frames of the page: Light, Dark, and mobile if they exist.
2. Prototype path and what it covers (for example `docs/design/prototype.html`, landing and sign-up).
3. States and transitions on the page ("Log in swaps the card in place", "bottom button scrolls to the card").
4. What is real and what is sample data.

If the user's message already answers an item, do not ask it again.

## 1. Inventory

Do this before any code. It is the step that was skipped in the past and cost the most rounds.

- Call `create_session` for the file, then `get_metadata` on each **top-level frame** (never the whole canvas: it is too large and wastes context). If a result is saved to a file, parse it with the bundled script instead of reading it.
- `get_variable_defs` on a Light frame and on a Dark frame. The values differ between themes (navy band `#0b1a3a` in light, `#0a1734` in dark), and the dark frame can also differ in content (a note present in light and absent in dark). Diff the two frames, not just the tokens.
- Re-read the frames when the user says they edited Figma. They do edit it while you work, and stale metadata gives false differences.
- Write the inventory down in the reply: pages, themes, widths, states, transitions, shared pieces, artifacts, content differences between themes.

## 2. Tokens

- Convert `px` to `rem` by dividing by 16. Line height and letter spacing become unitless / `em` ratios (`line-height: 44 / 34`, `letter-spacing: 0.01em`).
- Name tokens by role, not by colour: `--surface`, `--background`, `--muted`, `--hero-bg`, `--tag-bg`, `--line`. Components use only role names, so a theme is one block of overrides under `:root[data-theme='dark']`.
- Check every new token pair for contrast in both themes. If Figma's value fails 4.5:1, use a slightly darker or lighter value, say so in the report, and keep the original as a comment-free token name that explains the role.
- Put a token in `globals.css` only when a second place needs it; a one-off length stays local, in rem.

See [references/token-mapping.md](references/token-mapping.md) for the Figma-to-CSS mapping table.

## 3. Shared pieces first

Before pages, scan the frames for repeats. Anything used in more than two places, across more than one page or feature, belongs in `shared/ui` (or an entity), not copied per page. FSD forbids sibling slices importing each other, so a piece two features need goes down to `shared`.

## 4. Build

- Use `get_design_context` as data, not as code to paste: it returns React with Tailwind and absolute pixels. Convert to CSS Modules, rem and tokens.
- Take numbers from the frames, not from memory of the prototype. In earlier rounds the prototype's 15px body and clamp sizes looked close and were visibly off.
- Remove old behaviour that the design does not have (drawers, extra pages, features). If it is not in the frames and not in the prototype, it is not built.
- Implement transitions from the inventory exactly as listed. Hash links that must react on the same page are native anchors, because the router does not fire `hashchange`.
- Add `px`-free CSS only; stylelint enforces it.

## 5. Responsive

Take the breakpoints from the prototype's `@media` rules and convert them to rem (`900px` is `56.25rem`). Typical set: stack the hero below 940px, columns 4 to 2 to 1 at 900/520, stack fields and role cards at 520/480, tighter section padding on phones. Keep the content column and side padding in one token so the header and sections line up on wide screens.

## 6. Verify

All of these, in this order. Do not report done before they pass.

1. **Pixel diff, per theme.** `scripts/figma_metadata_to_rects.py` turns the saved metadata into absolute rectangles; `scripts/dom-diff.js` compares them with the browser. Work at the frame width (1440 for desktop frames). Anything beyond 1px is a real difference.
2. **Page and section heights** equal the frame's.
3. **Computed colours** of bands, cards, inputs, lines, text equal the variable values of each theme.
4. **Overflow check** at 320, 375, 480, 600, 768, 900, 960, 1024, 1280, 1440: `scrollWidth` must not exceed the width.
5. **Wide screen** (2000px): header content and sections share the same left and right edges.
6. `npm run lint`, `typecheck`, `format:check`, tests.

See [references/verification-notes.md](references/verification-notes.md) for pitfalls in the measuring itself.

## 7. Report

End with the table from [references/deviations-report.md](references/deviations-report.md): what matches, what differs and why (contrast, dead element, artifact, theme-content difference), and what was not verified. Say plainly what you did not open.

## Never do without asking

- Write to the Figma file. Use the `prototype-to-figma` skill's WIP-page flow for that.
- Create accounts or rows in the dev database to reach a logged-in page; if a logged-in page needs a session, ask first and tell the user afterwards what was created.
- Commit, push or merge. These need an explicit "yes" each time.
