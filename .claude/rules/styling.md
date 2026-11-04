---
paths:
  - 'src/**/*.css'
---

# Styling: CSS Modules

- Every component style is a co-located `Component.module.css` imported as `styles`. No Tailwind,
  no CSS-in-JS, no global class names, no inline styles except for genuinely dynamic values.
- `app/globals.css` holds only resets and design tokens (CSS custom properties). Components
  reference tokens, never raw values.
- No hard-coded `px` values anywhere in CSS. Use `rem` and tokens (`--space-*`, `--text-*`,
  `--radius*`, `--border-width`, `--focus-ring-width`, `--shadow-*`). Add a token in rem when none
  fits.
- Colors come from the contrast-checked tokens: `--border-strong` for control boundaries,
  `--danger` for errors, `--focus-ring` for focus. Never use raw palette values for these. Check
  new token pairs in `globals.css` for contrast in both light and dark themes before use.
