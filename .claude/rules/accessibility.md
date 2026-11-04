---
paths:
  - 'src/**/*.tsx'
  - 'src/**/*.css'
---

# Accessibility: WCAG 2.2 AA

Every page and component must meet WCAG 2.2 level AA. Accessibility is part of "done", not a
follow-up.

- **Semantic HTML first, ARIA second.** Use the native element (`button`, `a`, `nav`, `main`,
  `h1`–`h6`, `label`, `ul`) before adding a `role`. Never put click handlers on `div` or `span`.
  No ARIA is better than wrong ARIA.
- **Interactive components come from `react-aria-components`**, wrapped in `shared/ui` (`Button`,
  `TextField`, `Drawer`, …). They provide keyboard support, focus management and ARIA wiring. Do not
  hand-roll dialogs, menus, tabs, comboboxes or switches; add a `shared/ui` wrapper instead.
- **Links navigate, buttons act.** Use `next/link` for navigation and `Button` for actions. Mark the
  current nav item with `aria-current="page"`.
- **Page structure.** Each page has exactly one `h1`, headings do not skip levels, and content sits
  in landmarks (`header`, `nav` with an `aria-label`, `main`, `aside`, `footer`). Every page sets a
  unique `metadata.title`. `<html lang>` stays set.
- **Keyboard.** Everything works with the keyboard alone, in a logical tab order, with no traps.
  Dialogs and drawers trap focus while open, close on Esc, and return focus to the trigger.
- **Visible focus.** Never remove an outline without a replacement. Style focus with
  `[data-focus-visible]` (React Aria) or `:focus-visible`, using at least 2px and 3:1 contrast.
- **Names for everything.** Every control has an accessible name: visible text, a `<Label>`, or
  `aria-label` for icon-only buttons. Decorative SVGs get `aria-hidden="true"`. Images get
  meaningful `alt`, or `alt=""` when decorative.
- **Forms.** Every input has a visible label (placeholders are not labels). Errors appear as text
  next to the field and are linked to it (`FormTextField` does this through React Aria), never by
  color alone. Set the right `type` and `autoComplete`. Form-level messages use `role="alert"`.
- **Contrast.** Text is at least 4.5:1 (3:1 for large text), and UI component borders and icons at
  least 3:1, in **both** light and dark themes.
- **Target size.** Pointer targets are at least 24×24 CSS px; aim for 44×44 on primary actions.
- **Motion.** Respect `prefers-reduced-motion: reduce` by disabling non-essential animation.
- **Resize and reflow.** Layouts work at 320px wide and at 200% zoom without horizontal scrolling or
  lost content. Size text in `rem`, never fixed `px` heights on text containers.
- **Dynamic content.** Announce async results and status changes with a live region
  (`role="status"` or `role="alert"`). Loading states are perceivable, not just a spinner.
- **Visually hidden text** uses `VisuallyHidden` from `@/shared/ui` (the clip-path technique), never
  `display: none`, which hides it from screen readers too. Responsive hiding inside a media query
  repeats the same clip-path declarations.
- **Before merging UI changes**, tab through the page and check it with a screen reader (VoiceOver
  on macOS).
