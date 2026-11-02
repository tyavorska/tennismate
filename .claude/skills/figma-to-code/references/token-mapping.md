# Figma to CSS mapping

| Figma                                   | CSS                                                                                                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| px length                               | `px / 16` rem                                                                                                                                        |
| text `lineHeight: 44` at `fontSize: 34` | `line-height: 1.2941` (44 / 34)                                                                                                                      |
| `letterSpacing: 1` percent on 44px      | `letter-spacing: 0.01em`                                                                                                                             |
| `letterSpacing: 16` percent (eyebrow)   | `letter-spacing: 0.16em`                                                                                                                             |
| variable `brand/navy`                   | role token such as `--hero-bg` (never `--navy` in components)                                                                                        |
| variable with Light and Dark values     | one token, the dark value under `:root[data-theme='dark']`                                                                                           |
| `border/line rgba(...)`                 | `--line` (and `--border`) with the alpha kept                                                                                                        |
| frame padding `[t, r, b, l]`            | `padding` in rem; side padding via the shared `--site-pad` token                                                                                     |
| corner radius 999                       | `var(--radius-full)`                                                                                                                                 |
| auto-layout gap                         | `gap` in rem                                                                                                                                         |
| `opacity: 0.55` on a disabled card      | `opacity: 0.55`, same value                                                                                                                          |
| stroke inside a frame                   | border: the Figma frame height already includes the border, so `box-sizing: border-box` with the border on the box reproduces it; verify per element |
| text style (Manrope 14/22)              | font size token + `line-height` ratio; do not rely on the browser default                                                                            |

Fonts: Manrope for body, Sofia Sans Extra Condensed for display, loaded in `app/layout.tsx` with `next/font`.

Heading defaults in `globals.css` (`h1`-`h3`: display font, uppercase, 0.01em) must not add a global `line-height` or `text-wrap`: Figma sets line height per text node, so set it on the component class.
