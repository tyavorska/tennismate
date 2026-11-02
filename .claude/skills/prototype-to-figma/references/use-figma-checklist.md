# use_figma checklist (what broke in earlier runs)

- **`figma.createAutoLayout()` creates a frame with a white fill.** Set `frame.fills = []` for a transparent wrapper. Forgetting this paints white boxes behind text on a dark card.
- **Text case.** A text node can carry `textCase: 'UPPER'` even when its characters are lower case. When you change the copy to normal case, set `textCase = 'ORIGINAL'` on every node you retitle.
- **Right-aligning a child in a vertical auto-layout** with `layoutAlign = 'MAX'` did not move a tag. Wrap it in a horizontal auto-layout row with `layoutSizingHorizontal = 'FILL'` and `primaryAxisAlignItems = 'MAX'`.
- **Per-side borders:** set `strokeTopWeight`, `strokeBottomWeight`, `strokeLeftWeight`, `strokeRightWeight`; use `strokeAlign = 'INSIDE'`.
- **Fills and strokes are read-only arrays:** build a new array and assign. Paint `color` has no `a`; opacity is on the paint.
- **Fonts:** `await figma.loadFontAsync(...)` for every family and style you touch, including the existing style of text you only restyle. Check names with `listAvailableFontsAsync()`; `ExtraBold` for Manrope, `ExtraBold` for Sofia Sans Extra Condensed.
- **`lineHeight` and `letterSpacing` take `{unit, value}`** (`PIXELS` or `PERCENT`), never a bare number.
- **Moving a node** into another frame with `parent.appendChild(node)` keeps its internal layout; set `layoutSizingHorizontal = 'FILL'` after the move.
- **Icons:** `createNodeFromSvg` needs `viewBox` plus `width`/`height`; `currentColor` imports as black, so substitute the colour in the string. Insert at the placeholder's index and remove the placeholder.
- **Changing frame content shifts siblings.** Re-read heights from the return value instead of assuming them.
- **Return IDs** of everything created or changed from every call; nothing persists between calls.
- **Pages:** `await figma.setCurrentPageAsync(page)`, once per call; page context resets at the start of each call.
- **Variable scopes** must be set when creating variables.
- **Screenshots:** `get_screenshot` for one frame per call; look for white boxes, uppercase leftovers, clipped text, tags on the wrong side.
